from __future__ import annotations

from datetime import datetime, timezone

from .scheduler import workflow_for_job_type
from ..shared.lineage_timing import finalize_job_timing
from ..shared.metrics import record_job_metric
from ..shared.course_tts_chunks import make_chunk_shard_key, parse_chunk_shard_key, split_course_tts_chunks

COURSE_AUDIO_SHARDS = ("INT", "M1L", "M1P", "M2L", "M2P", "M3L", "M3P", "M4L", "M4P")
COURSE_AUDIO_CHUNK_STEP = "synthesize_course_audio_chunk"


class Orchestrator:
    """Coordinates run creation and downstream step enqueueing."""

    def __init__(self, job_repo, run_repo, step_run_repo, queue_repo):
        self.job_repo = job_repo
        self.run_repo = run_repo
        self.step_run_repo = step_run_repo
        self.queue_repo = queue_repo

    @staticmethod
    def _content_job_tts_model(job: dict) -> str:
        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        model = str(payload.get("ttsModel") or "").strip().lower()
        return model or "dms"

    def _required_tts_model_for_step(self, job: dict, step_name: str) -> str | None:
        if step_name in {"synthesize_audio", "synthesize_course_audio", COURSE_AUDIO_CHUNK_STEP}:
            return self._content_job_tts_model(job)
        return None

    @staticmethod
    def _course_thumbnail_url(job: dict) -> str:
        runtime = dict(job.get("runtime") or {})
        thumbnail_url = str(runtime.get("thumbnail_url") or "").strip()
        if thumbnail_url:
            return thumbnail_url

        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        return str(payload.get("thumbnailUrl") or "").strip()

    @staticmethod
    def _course_generates_thumbnail_during_run(job: dict) -> bool:
        runtime = dict(job.get("runtime") or {})
        if isinstance(runtime.get("generate_thumbnail_during_run"), bool):
            return bool(runtime.get("generate_thumbnail_during_run"))

        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        value = payload.get("generateThumbnailDuringRun")
        if isinstance(value, bool):
            return value
        return True

    @staticmethod
    def _course_thumbnail_generation_requested(job: dict) -> bool:
        runtime = dict(job.get("runtime") or {})
        if isinstance(runtime.get("thumbnail_generation_requested"), bool):
            return bool(runtime.get("thumbnail_generation_requested"))

        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        return bool(payload.get("thumbnailGenerationRequested"))

    @staticmethod
    def _course_regeneration(job: dict) -> dict:
        runtime = dict(job.get("runtime") or {})
        regeneration = runtime.get("course_regeneration")
        if isinstance(regeneration, dict):
            return dict(regeneration)

        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        regeneration = payload.get("courseRegeneration")
        if isinstance(regeneration, dict):
            return dict(regeneration)
        return {}

    def _course_regeneration_awaiting_script_approval(self, job: dict) -> bool:
        regeneration = self._course_regeneration(job)
        return (
            bool(regeneration.get("active"))
            and str(regeneration.get("mode") or "").strip().lower() == "script_and_audio"
            and bool(regeneration.get("awaitingScriptApproval"))
        )

    @staticmethod
    def _course_script_approval(job: dict) -> dict:
        runtime = dict(job.get("runtime") or {})
        script_approval = runtime.get("course_script_approval")
        if isinstance(script_approval, dict):
            return dict(script_approval)

        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        script_approval = payload.get("courseScriptApproval")
        if isinstance(script_approval, dict):
            return dict(script_approval)
        return {}

    def _course_initial_script_approval_awaiting(self, job: dict) -> bool:
        script_approval = self._course_script_approval(job)
        return bool(script_approval.get("enabled") and script_approval.get("awaitingApproval"))

    @staticmethod
    def _single_script_approval(job: dict) -> dict:
        runtime = dict(job.get("runtime") or {})
        script_approval = runtime.get("script_approval")
        if isinstance(script_approval, dict):
            return dict(script_approval)

        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        script_approval = payload.get("scriptApproval")
        if isinstance(script_approval, dict):
            return dict(script_approval)
        return {}

    def _single_script_approval_awaiting(self, job: dict) -> bool:
        script_approval = self._single_script_approval(job)
        return bool(script_approval.get("enabled") and script_approval.get("awaitingApproval"))

    @staticmethod
    def _subject_plan_approval(job: dict) -> dict:
        runtime = dict(job.get("runtime") or {})
        plan_approval = runtime.get("subject_plan_approval")
        if isinstance(plan_approval, dict):
            return dict(plan_approval)

        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        plan_approval = payload.get("subjectPlanApproval")
        if isinstance(plan_approval, dict):
            return dict(plan_approval)
        return {}

    def _subject_plan_approval_awaiting(self, job: dict) -> bool:
        plan_approval = self._subject_plan_approval(job)
        return bool(plan_approval.get("enabled") and plan_approval.get("awaitingApproval"))

    @staticmethod
    def _subject_state(job: dict) -> str:
        runtime = dict(job.get("runtime") or {})
        state = str(runtime.get("subject_state") or "").strip().lower()
        if state:
            return state
        summary = dict(job.get("summary") or {})
        state = str(summary.get("subjectState") or "").strip().lower()
        return state or "watching"

    def _seed_course_checkpoint_steps(
        self,
        job: dict,
        job_id: str,
        run_id: str,
        first_step: str,
    ) -> None:
        """
        Mark reusable course prerequisites as completed when a run starts mid-pipeline.

        Regeneration and deferred-thumbnail runs can begin after parts of the
        course have already completed in earlier runs. Surfacing those prior
        results in the new run keeps publish gating and the UI in sync.
        """
        if job.get("job_type") != "course":
            return

        if first_step not in {
            "generate_course_thumbnail",
            "generate_course_scripts",
            "format_course_scripts",
            "synthesize_course_audio",
            "upload_course_audio",
            "publish_course",
        }:
            return

        thumbnail_url = self._course_thumbnail_url(job)
        if thumbnail_url and not (
            first_step == "generate_course_thumbnail"
            and self._course_thumbnail_generation_requested(job)
        ):
            step_run_id = self.step_run_repo.ensure_ready(
                job_id,
                run_id,
                "generate_course_thumbnail",
            )
            self.step_run_repo.mark_succeeded_from_checkpoint(
                step_run_id,
                {
                    "reused_from_checkpoint": True,
                    "thumbnail_url": thumbnail_url,
                },
            )

        if self._course_has_uploaded_audio(job):
            upload_step_run_id = self.step_run_repo.ensure_ready(
                job_id,
                run_id,
                "upload_course_audio",
            )
            self.step_run_repo.mark_succeeded_from_checkpoint(
                upload_step_run_id,
                {
                    "reused_from_checkpoint": True,
                    "audio_reused": True,
                },
            )

    @staticmethod
    def _completed_course_audio_shards(job: dict) -> set[str]:
        runtime = dict(job.get("runtime") or {})
        audio_results = dict(runtime.get("course_audio_results") or {})
        completed: set[str] = set()
        for session_code, payload in audio_results.items():
            if not isinstance(payload, dict) or not payload.get("storagePath"):
                continue
            key = str(session_code).strip()
            if not key:
                continue
            for shard in COURSE_AUDIO_SHARDS:
                if key.endswith(shard):
                    completed.add(shard)
                    break
        return completed

    @staticmethod
    def _course_has_uploaded_audio(job: dict) -> bool:
        return len(Orchestrator._completed_course_audio_shards(job)) == len(COURSE_AUDIO_SHARDS)

    @staticmethod
    def _formatted_course_scripts(job: dict) -> dict[str, str]:
        runtime = dict(job.get("runtime") or {})
        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        return dict(runtime.get("course_formatted_scripts") or payload.get("courseFormattedScripts") or {})

    @staticmethod
    def _course_code(job: dict) -> str:
        request = job.get("request") or {}
        payload = request.get("content_job") or request.get("job_data") or {}
        params = payload.get("params") or {}
        return str(params.get("courseCode") or "COURSE101").strip() or "COURSE101"

    def _course_audio_chunk_shards(
        self,
        job: dict,
        session_shard: str,
    ) -> list[str]:
        formatted_scripts = self._formatted_course_scripts(job)
        course_code = self._course_code(job)
        session_key = str(session_shard or "").strip().upper()
        session_code = f"{course_code}{session_key}"
        script = str(formatted_scripts.get(session_code) or "").strip()
        if not script:
            raise ValueError(f"Missing formatted script for course audio shard '{session_key}'")
        chunks = split_course_tts_chunks(script)
        if not chunks:
            raise ValueError(f"Unable to derive TTS chunks for course audio shard '{session_key}'")
        return [make_chunk_shard_key(session_key, index) for index, _ in enumerate(chunks)]

    def _ensure_step_enqueued(
        self,
        job: dict,
        job_id: str,
        run_id: str,
        step_name: str,
        shard_key: str = "root",
        step_input: dict | None = None,
    ) -> None:
        step_run_id = self.step_run_repo.ensure_ready(job_id, run_id, step_name, shard_key=shard_key)
        self.queue_repo.enqueue(
            job_id=job_id,
            run_id=run_id,
            step_name=step_name,
            step_run_id=step_run_id,
            shard_key=shard_key,
            step_input=step_input,
            required_tts_model=self._required_tts_model_for_step(job, step_name),
        )

    @staticmethod
    def _content_job_id(job: dict) -> str:
        request = job.get("request") or {}
        compat = request.get("compat") or {}
        return str(compat.get("content_job_id") or "").strip()

    def _finalize_completed_job(self, job_id: str, run_id: str) -> None:
        if not hasattr(self.job_repo, "db"):
            return
        job = self.job_repo.get(job_id)
        content_job_id = self._content_job_id(job)
        if not content_job_id:
            return
        finalized = finalize_job_timing(
            self.job_repo.db,
            job_id=job_id,
            run_id=run_id,
            content_job_id=content_job_id,
        )
        if finalized:
            content_job = self.job_repo.db.collection("content_jobs").document(content_job_id).get().to_dict() or {}
            record_job_metric(
                self.job_repo.db,
                content_job_id,
                content_job,
                outcome="completed",
            )

    def start_new_run(
        self,
        job_id: str,
        trigger: str = "new",
        first_step: str | None = None,
    ) -> str:
        job = self.job_repo.get(job_id)
        run_number = self.run_repo.next_run_number(job_id)
        run_id = f"{job_id}-r{run_number}"

        self.run_repo.create(
            run_id=run_id,
            job_id=job_id,
            run_number=run_number,
            trigger=trigger,
            started_at=datetime.now(timezone.utc),
        )
        self.job_repo.mark_running(job_id, run_id)

        workflow = workflow_for_job_type(job["job_type"])
        first = first_step or workflow.steps[0]
        self._seed_course_checkpoint_steps(job, job_id, run_id, first)
        self._ensure_step_enqueued(job, job_id, run_id, first)
        return run_id

    def _fan_out_course_audio(self, job: dict, job_id: str, run_id: str) -> None:
        completed_shards = self._completed_course_audio_shards(job)
        if completed_shards:
            # Surface checkpoint-reused shards in this run's timeline so UI does not
            # show them as "waiting" when they are already completed.
            for shard in COURSE_AUDIO_SHARDS:
                if shard not in completed_shards:
                    continue
                step_run_id = self.step_run_repo.ensure_ready(
                    job_id,
                    run_id,
                    "synthesize_course_audio",
                    shard_key=shard,
                )
                self.step_run_repo.mark_succeeded_from_checkpoint(
                    step_run_id,
                    {
                        "reused_from_checkpoint": True,
                        "session_code": shard,
                    },
                )

        missing_shards = [shard for shard in COURSE_AUDIO_SHARDS if shard not in completed_shards]

        if not missing_shards:
            self._ensure_step_enqueued(job, job_id, run_id, "upload_course_audio")
            return

        for shard in missing_shards:
            for chunk_index, chunk_shard in enumerate(self._course_audio_chunk_shards(job, shard)):
                self._ensure_step_enqueued(
                    job,
                    job_id,
                    run_id,
                    COURSE_AUDIO_CHUNK_STEP,
                    shard_key=chunk_shard,
                    step_input={
                        "session_shard": shard,
                        "chunk_index": chunk_index,
                    },
                )

    def recover_course_audio_fan_out_if_ready(self, job_id: str, run_id: str) -> int:
        """
        Heal course runs where format succeeded but some expected chunk queue items
        were never created before the worker stopped.
        """
        job = self.job_repo.get(job_id)
        if job.get("job_type") != "course":
            return 0
        if not self.step_run_repo.has_succeeded(job_id, run_id, "format_course_scripts"):
            return 0
        if self.step_run_repo.has_succeeded(job_id, run_id, "upload_course_audio"):
            return 0

        completed_shards = self._completed_course_audio_shards(job)
        recovered = 0
        for shard in COURSE_AUDIO_SHARDS:
            if shard in completed_shards:
                continue

            parent_state = self.step_run_repo.state(run_id, "synthesize_course_audio", shard)
            if parent_state:
                continue

            try:
                expected_chunk_shards = self._course_audio_chunk_shards(job, shard)
            except ValueError:
                continue

            for chunk_index, chunk_shard in enumerate(expected_chunk_shards):
                if self.step_run_repo.state(run_id, COURSE_AUDIO_CHUNK_STEP, chunk_shard):
                    continue
                if self.queue_repo.state(run_id, COURSE_AUDIO_CHUNK_STEP, chunk_shard):
                    continue

                self._ensure_step_enqueued(
                    job,
                    job_id,
                    run_id,
                    COURSE_AUDIO_CHUNK_STEP,
                    shard_key=chunk_shard,
                    step_input={
                        "session_shard": shard,
                        "chunk_index": chunk_index,
                    },
                )
                recovered += 1

        return recovered

    def _maybe_enqueue_ready_course_audio_session(
        self,
        job: dict,
        job_id: str,
        run_id: str,
        session_shard: str,
    ) -> bool:
        shard = str(session_shard or "").strip().upper()
        if shard not in COURSE_AUDIO_SHARDS:
            return False

        runtime_shards = self._completed_course_audio_shards(job)
        if shard in runtime_shards:
            return False

        succeeded_session_shards = self.step_run_repo.succeeded_shard_keys(
            job_id,
            run_id,
            "synthesize_course_audio",
        )
        if shard in succeeded_session_shards:
            return False

        failed_session_shards = self.step_run_repo.failed_shard_keys(
            job_id,
            run_id,
            "synthesize_course_audio",
        )
        if shard in failed_session_shards:
            return False

        try:
            expected_chunk_shards = set(self._course_audio_chunk_shards(job, shard))
        except ValueError:
            return False

        failed_chunk_shards = self.step_run_repo.failed_shard_keys(
            job_id,
            run_id,
            COURSE_AUDIO_CHUNK_STEP,
        )
        if expected_chunk_shards & failed_chunk_shards:
            return False

        succeeded_chunk_shards = self.step_run_repo.succeeded_shard_keys(
            job_id,
            run_id,
            COURSE_AUDIO_CHUNK_STEP,
        )
        if not expected_chunk_shards.issubset(succeeded_chunk_shards):
            return False

        self._ensure_step_enqueued(
            job,
            job_id,
            run_id,
            "synthesize_course_audio",
            shard_key=shard,
            step_input={"session_shard": shard},
        )
        return True

    def _maybe_fan_in_course_audio(self, job: dict, job_id: str, run_id: str) -> bool:
        runtime_shards = self._completed_course_audio_shards(job)
        succeeded_shards = self.step_run_repo.succeeded_shard_keys(
            job_id,
            run_id,
            "synthesize_course_audio",
        )
        failed_shards = self.step_run_repo.failed_shard_keys(
            job_id,
            run_id,
            "synthesize_course_audio",
        )
        if failed_shards:
            return False
        completed = runtime_shards | succeeded_shards
        if all(shard in completed for shard in COURSE_AUDIO_SHARDS):
            self._ensure_step_enqueued(job, job_id, run_id, "upload_course_audio")
            return True
        return False

    def recover_course_audio_fan_in_if_ready(self, job_id: str, run_id: str) -> int:
        """
        Heal course runs where all chunk shards for a session succeeded but the
        session-level synthesize_course_audio step was never enqueued.
        """
        job = self.job_repo.get(job_id)
        if job.get("job_type") != "course":
            return 0

        recovered = 0
        for session_shard in COURSE_AUDIO_SHARDS:
            if self._maybe_enqueue_ready_course_audio_session(job, job_id, run_id, session_shard):
                recovered += 1

        return recovered

    def recover_course_upload_if_ready(self, job_id: str, run_id: str) -> bool:
        """
        Heal course runs that completed all synth shards but never enqueued upload.

        This protects against rare interruptions after the last synth shard succeeds
        but before orchestration fans in to upload_course_audio.
        """
        job = self.job_repo.get(job_id)
        if job.get("job_type") != "course":
            return False

        if self.step_run_repo.has_succeeded(job_id, run_id, "upload_course_audio"):
            return False

        failed_shards = self.step_run_repo.failed_shard_keys(
            job_id,
            run_id,
            "synthesize_course_audio",
        )
        if failed_shards:
            return False

        runtime_shards = self._completed_course_audio_shards(job)
        succeeded_shards = self.step_run_repo.succeeded_shard_keys(
            job_id,
            run_id,
            "synthesize_course_audio",
        )
        completed = runtime_shards | succeeded_shards
        if not all(shard in completed for shard in COURSE_AUDIO_SHARDS):
            return False

        self._ensure_step_enqueued(job, job_id, run_id, "upload_course_audio")
        return True

    def recover_course_publish_if_ready(self, job_id: str, run_id: str) -> bool:
        """
        Heal course runs that already uploaded audio but never enqueued publish.

        This can happen when a regeneration run reuses existing prerequisites or
        when a deferred-thumbnail course only requires audio upload before publish.
        """
        job = self.job_repo.get(job_id)
        if job.get("job_type") != "course":
            return False

        self._seed_course_checkpoint_steps(job, job_id, run_id, "upload_course_audio")

        if not self.step_run_repo.has_succeeded(job_id, run_id, "upload_course_audio"):
            return False
        if self.step_run_repo.has_succeeded(job_id, run_id, "publish_course"):
            return False

        requires_thumbnail = (
            self._course_generates_thumbnail_during_run(job)
            or self._course_thumbnail_generation_requested(job)
        )
        if requires_thumbnail and not self.step_run_repo.has_succeeded(
            job_id,
            run_id,
            "generate_course_thumbnail",
        ):
            if not self._course_thumbnail_url(job):
                return False

        self._ensure_step_enqueued(job, job_id, run_id, "publish_course")
        return True

    def on_step_success(
        self,
        job_id: str,
        run_id: str,
        step_name: str,
        shard_key: str = "root",
    ) -> None:
        job = self.job_repo.get(job_id)
        workflow = workflow_for_job_type(job["job_type"])

        if job["job_type"] == "subject":
            if step_name == "generate_subject_plan":
                if self._subject_plan_approval_awaiting(job):
                    self.job_repo.mark_completed(job_id, run_id)
                    self.run_repo.mark_completed(run_id)
                    self._finalize_completed_job(job_id, run_id)
                    return
                self._ensure_step_enqueued(job, job_id, run_id, "launch_subject_children")
                return

            if step_name == "launch_subject_children":
                subject_state = self._subject_state(job)
                if subject_state == "failed":
                    self.job_repo.mark_failed(job_id, run_id, step_name, "child_job_failed")
                    self.run_repo.mark_failed(run_id, step_name, "child_job_failed")
                    return
                if subject_state in {"completed", "paused"}:
                    self.job_repo.mark_completed(job_id, run_id)
                    self.run_repo.mark_completed(run_id)
                    self._finalize_completed_job(job_id, run_id)
                    return
                self._ensure_step_enqueued(job, job_id, run_id, "watch_subject_children")
                return

            if step_name == "watch_subject_children":
                subject_state = self._subject_state(job)
                if subject_state == "failed":
                    self.job_repo.mark_failed(job_id, run_id, step_name, "child_job_failed")
                    self.run_repo.mark_failed(run_id, step_name, "child_job_failed")
                    return
                if subject_state in {"completed", "paused"}:
                    self.job_repo.mark_completed(job_id, run_id)
                    self.run_repo.mark_completed(run_id)
                    self._finalize_completed_job(job_id, run_id)
                    return
                return

        if job["job_type"] == "course":
            if step_name == "generate_course_plan" and self._course_generates_thumbnail_during_run(job):
                self._ensure_step_enqueued(job, job_id, run_id, "generate_course_thumbnail")
            if step_name == "generate_course_thumbnail":
                if self.step_run_repo.has_succeeded(job_id, run_id, "upload_course_audio"):
                    self._ensure_step_enqueued(job, job_id, run_id, "publish_course")
                    return
                if self._course_thumbnail_generation_requested(job):
                    self.job_repo.mark_completed(job_id, run_id)
                    self.run_repo.mark_completed(run_id)
                    return
                return
            if step_name == "generate_course_scripts":
                if (
                    self._course_regeneration_awaiting_script_approval(job)
                    or self._course_initial_script_approval_awaiting(job)
                ):
                    self.job_repo.mark_completed(job_id, run_id)
                    self.run_repo.mark_completed(run_id)
                    self._finalize_completed_job(job_id, run_id)
                    return
            if step_name == "format_course_scripts":
                self._fan_out_course_audio(job, job_id, run_id)
                return
            if step_name == COURSE_AUDIO_CHUNK_STEP:
                parsed_chunk = parse_chunk_shard_key(shard_key)
                session_shard = str((parsed_chunk[0] if parsed_chunk else "") or "").strip().upper()
                if not session_shard:
                    return
                self._maybe_enqueue_ready_course_audio_session(
                    job,
                    job_id,
                    run_id,
                    session_shard,
                )
                return
            if step_name == "synthesize_course_audio":
                self._maybe_fan_in_course_audio(job, job_id, run_id)
                return
            if step_name == "upload_course_audio":
                requires_thumbnail = (
                    self._course_generates_thumbnail_during_run(job)
                    or self._course_thumbnail_generation_requested(job)
                )
                if requires_thumbnail and not self.step_run_repo.has_succeeded(
                    job_id,
                    run_id,
                    "generate_course_thumbnail",
                ):
                    if not self._course_thumbnail_url(job):
                        return
                self._ensure_step_enqueued(job, job_id, run_id, "publish_course")
                return
            if step_name == "publish_course" and self._course_thumbnail_generation_requested(job):
                self.job_repo.mark_completed(job_id, run_id)
                self.run_repo.mark_completed(run_id)
                return
        elif step_name == "generate_script" and self._single_script_approval_awaiting(job):
            self.job_repo.mark_completed(job_id, run_id)
            self.run_repo.mark_completed(run_id)
            self._finalize_completed_job(job_id, run_id)
            return

        next_steps = workflow.next_steps(step_name)
        is_terminal = step_name == workflow.terminal_step or not next_steps
        if is_terminal:
            self.job_repo.mark_completed(job_id, run_id)
            self.run_repo.mark_completed(run_id)
            self._finalize_completed_job(job_id, run_id)
            return

        for next_step in next_steps:
            prerequisites = workflow.prerequisites(next_step)
            if not all(
                self.step_run_repo.has_succeeded(job_id, run_id, prereq)
                for prereq in prerequisites
            ):
                continue
            self._ensure_step_enqueued(job, job_id, run_id, next_step)

    def on_step_failed(self, job_id: str, run_id: str, step_name: str, error_code: str) -> None:
        self.job_repo.mark_failed(job_id, run_id, step_name, error_code)
        self.run_repo.mark_failed(run_id, step_name, error_code)
        if not hasattr(self.job_repo, "db"):
            self.queue_repo.cancel_ready_for_run(
                run_id,
                error_code="run_failed",
                error_message=f"Run failed at step '{step_name}' ({error_code}). Pending work cancelled.",
            )
            return
        job = self.job_repo.get(job_id)
        content_job_id = self._content_job_id(job)
        if content_job_id:
            content_job = self.job_repo.db.collection("content_jobs").document(content_job_id).get().to_dict() or {}
            record_job_metric(
                self.job_repo.db,
                content_job_id,
                content_job,
                outcome="failed",
                stage=step_name,
                error=error_code,
            )
        self.queue_repo.cancel_ready_for_run(
            run_id,
            error_code="run_failed",
            error_message=f"Run failed at step '{step_name}' ({error_code}). Pending work cancelled.",
        )
