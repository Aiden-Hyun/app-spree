from __future__ import annotations

from datetime import datetime, timezone

from .scheduler import workflow_for_job_type

COURSE_AUDIO_SHARDS = ("INT", "M1L", "M1P", "M2L", "M2P", "M3L", "M3P", "M4L", "M4P")


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
        return model or "piper"

    def _required_tts_model_for_step(self, job: dict, step_name: str) -> str | None:
        if step_name in {"synthesize_audio", "synthesize_course_audio"}:
            return self._content_job_tts_model(job)
        return None

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
            self._ensure_step_enqueued(
                job,
                job_id,
                run_id,
                "synthesize_course_audio",
                shard_key=shard,
                step_input={"session_code": shard},
            )

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

    def on_step_success(
        self,
        job_id: str,
        run_id: str,
        step_name: str,
        shard_key: str = "root",
    ) -> None:
        job = self.job_repo.get(job_id)
        workflow = workflow_for_job_type(job["job_type"])

        if job["job_type"] == "course":
            if step_name == "format_course_scripts":
                self._fan_out_course_audio(job, job_id, run_id)
                return
            if step_name == "synthesize_course_audio":
                self._maybe_fan_in_course_audio(job, job_id, run_id)
                return

        next_steps = workflow.next_steps(step_name)
        is_terminal = step_name == workflow.terminal_step or not next_steps
        if is_terminal:
            self.job_repo.mark_completed(job_id, run_id)
            self.run_repo.mark_completed(run_id)
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
        self.queue_repo.cancel_ready_for_run(
            run_id,
            error_code="run_failed",
            error_message=f"Run failed at step '{step_name}' ({error_code}). Pending work cancelled.",
        )
