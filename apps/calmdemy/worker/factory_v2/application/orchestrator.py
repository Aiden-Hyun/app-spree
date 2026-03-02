from __future__ import annotations

from datetime import datetime, timezone

from .scheduler import workflow_for_job_type


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
        step_run_id = self.step_run_repo.ensure_ready(job_id, run_id, first)
        self.queue_repo.enqueue(
            job_id=job_id,
            run_id=run_id,
            step_name=first,
            step_run_id=step_run_id,
            required_tts_model=self._required_tts_model_for_step(job, first),
        )
        return run_id

    def on_step_success(self, job_id: str, run_id: str, step_name: str) -> None:
        job = self.job_repo.get(job_id)
        workflow = workflow_for_job_type(job["job_type"])

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
            step_run_id = self.step_run_repo.ensure_ready(job_id, run_id, next_step)
            self.queue_repo.enqueue(
                job_id=job_id,
                run_id=run_id,
                step_name=next_step,
                step_run_id=step_run_id,
                required_tts_model=self._required_tts_model_for_step(job, next_step),
            )

    def on_step_failed(self, job_id: str, run_id: str, step_name: str, error_code: str) -> None:
        self.job_repo.mark_failed(job_id, run_id, step_name, error_code)
        self.run_repo.mark_failed(run_id, step_name, error_code)
