from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class RetryJobCommand:
    job_id: str


@dataclass(slots=True)
class CancelJobCommand:
    job_id: str


@dataclass(slots=True)
class ApprovePublishCommand:
    job_id: str


class CommandService:
    def __init__(self, orchestrator, job_repo):
        self.orchestrator = orchestrator
        self.job_repo = job_repo

    def retry_job(self, command: RetryJobCommand) -> str:
        self.job_repo.mark_retry_requested(command.job_id)
        return self.orchestrator.start_new_run(command.job_id, trigger="retry")

    def cancel_job(self, command: CancelJobCommand) -> None:
        self.job_repo.mark_cancelled(command.job_id)

    def approve_publish(self, command: ApprovePublishCommand) -> str:
        self.job_repo.mark_running(command.job_id, run_id=None)
        job = self.job_repo.get(command.job_id)
        first_step = "publish_content"
        if (job.get("job_type") or "").strip().lower() == "course":
            first_step = "publish_course"
        return self.orchestrator.start_new_run(
            command.job_id,
            trigger="manual_publish",
            first_step=first_step,
        )
