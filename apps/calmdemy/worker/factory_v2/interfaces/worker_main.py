from __future__ import annotations

import time

from observability import get_logger
from pipeline.error_codes import classify_error
from pipeline.worker_status import update_worker_status

from .dispatcher import dispatch_next_content_job
from ..infrastructure.firestore_repos import (
    FirestoreEventRepo,
    FirestoreJobRepo,
    FirestoreRunRepo,
    FirestoreStepRunRepo,
)
from ..infrastructure.queue_repo import FirestoreQueueRepo
from ..application.orchestrator import Orchestrator
from ..steps.base import StepContext
from ..steps.registry import get_executor

logger = get_logger(__name__)


class WorkerMain:
    """V2 worker loop with queue lease + step executor dispatch."""

    def __init__(
        self,
        db,
        worker_id: str,
        poll_seconds: float = 1.0,
        enable_dispatch: bool = True,
        max_step_retries: int = 2,
    ):
        self.db = db
        self.worker_id = worker_id
        self.poll_seconds = poll_seconds
        self.enable_dispatch = enable_dispatch
        self.max_step_retries = max(0, int(max_step_retries))

        self.job_repo = FirestoreJobRepo(db)
        self.run_repo = FirestoreRunRepo(db)
        self.step_run_repo = FirestoreStepRunRepo(db)
        self.queue_repo = FirestoreQueueRepo(db)
        self.event_repo = FirestoreEventRepo(db)
        self.orchestrator = Orchestrator(
            self.job_repo,
            self.run_repo,
            self.step_run_repo,
            self.queue_repo,
        )

    @staticmethod
    def _is_retryable(error_code: str) -> bool:
        return error_code in {
            "timeout",
            "connection_error",
            "firestore_error",
            "storage_upload_failed",
            "llm_error",
            "tts_error",
            "image_error",
        }

    @staticmethod
    def _retry_delay_seconds(retry_count: int) -> int:
        # 5s, 10s, 20s, 40s...
        return min(300, 5 * (2 ** max(0, retry_count)))

    def run_forever(self) -> None:
        while True:
            try:
                update_worker_status(self.db, self.worker_id, "local")
            except Exception as heartbeat_exc:
                logger.warning(
                    "V2 heartbeat failed",
                    extra={"worker_id": self.worker_id, "error": str(heartbeat_exc)},
                )

            if self.enable_dispatch:
                try:
                    dispatched = dispatch_next_content_job(self.db, self.worker_id)
                    if dispatched:
                        content_job_id, run_id = dispatched
                        logger.info(
                            "V2 job dispatched",
                            extra={
                                "content_job_id": content_job_id,
                                "run_id": run_id,
                                "worker_id": self.worker_id,
                            },
                        )
                except Exception as dispatch_exc:
                    logger.exception(
                        "V2 dispatcher error",
                        extra={"worker_id": self.worker_id, "error": str(dispatch_exc)},
                    )

            claimed = self.queue_repo.claim_next(self.worker_id)
            if not claimed:
                time.sleep(self.poll_seconds)
                continue

            queue_id, payload = claimed
            job_id = str(payload.get("job_id"))
            run_id = str(payload.get("run_id"))
            step_name = str(payload.get("step_name"))
            retry_count = int(payload.get("retry_count") or 0)
            attempt = retry_count + 1
            step_run_id = payload.get("step_run_id") or self.step_run_repo.make_step_run_id(
                run_id,
                step_name,
                str(payload.get("shard_key") or "root"),
            )

            self.queue_repo.mark_running(queue_id, self.worker_id)
            self.step_run_repo.mark_running(step_run_id, queue_id, self.worker_id, attempt=attempt)
            self.event_repo.emit(
                "step_started",
                job_id,
                run_id,
                {
                    "queue_id": queue_id,
                    "step_run_id": step_run_id,
                    "step_name": step_name,
                    "worker_id": self.worker_id,
                    "attempt": attempt,
                },
            )

            logger.info(
                "V2 step running",
                extra={
                    "queue_id": queue_id,
                    "step_run_id": step_run_id,
                    "job_id": job_id,
                    "run_id": run_id,
                    "step_name": step_name,
                    "worker_id": self.worker_id,
                    "attempt": attempt,
                },
            )

            try:
                job = self.job_repo.get(job_id)
                executor = get_executor(step_name)
                ctx = StepContext(
                    db=self.db,
                    job=job,
                    run_id=run_id,
                    step_name=step_name,
                    worker_id=self.worker_id,
                )
                result = executor(ctx)

                self.step_run_repo.mark_succeeded(step_run_id, result.output)
                self.queue_repo.mark_done(queue_id)
                self.event_repo.emit(
                    "step_succeeded",
                    job_id,
                    run_id,
                    {
                        "queue_id": queue_id,
                        "step_run_id": step_run_id,
                        "step_name": step_name,
                    },
                )

                self.job_repo.patch_runtime(job_id, result.runtime_patch)
                self.job_repo.patch_summary(job_id, result.summary_patch)

                request = job.get("request") or {}
                compat = request.get("compat") or {}
                content_job_id = compat.get("content_job_id")
                self.job_repo.patch_compat_content_job(content_job_id, result.compat_content_job_patch)

                self.orchestrator.on_step_success(job_id, run_id, step_name)

            except Exception as exc:
                error_msg = f"{type(exc).__name__}: {exc}"
                error_code = classify_error(exc)
                retryable = self._is_retryable(error_code)
                logger.exception(
                    "V2 step failed",
                    extra={
                        "queue_id": queue_id,
                        "step_run_id": step_run_id,
                        "job_id": job_id,
                        "run_id": run_id,
                        "step_name": step_name,
                        "worker_id": self.worker_id,
                        "error_code": error_code,
                        "retryable": retryable,
                        "attempt": attempt,
                    },
                )

                if retryable and retry_count < self.max_step_retries:
                    delay_seconds = self._retry_delay_seconds(retry_count)
                    next_attempt = retry_count + 2
                    self.step_run_repo.mark_retry_scheduled(
                        step_run_id,
                        error_code,
                        error_msg,
                        next_attempt=next_attempt,
                        delay_seconds=delay_seconds,
                    )
                    self.queue_repo.schedule_retry(
                        queue_id,
                        error_code,
                        error_msg,
                        delay_seconds=delay_seconds,
                    )
                    self.event_repo.emit(
                        "step_retry_scheduled",
                        job_id,
                        run_id,
                        {
                            "queue_id": queue_id,
                            "step_run_id": step_run_id,
                            "step_name": step_name,
                            "error_code": error_code,
                            "attempt": attempt,
                            "next_attempt": next_attempt,
                            "delay_seconds": delay_seconds,
                        },
                    )
                    continue

                self.step_run_repo.mark_failed(step_run_id, error_code, error_msg)
                self.queue_repo.mark_failed(queue_id, error_code, error_msg)
                self.event_repo.emit(
                    "step_failed",
                    job_id,
                    run_id,
                    {
                        "queue_id": queue_id,
                        "step_run_id": step_run_id,
                        "step_name": step_name,
                        "error_code": error_code,
                        "attempt": attempt,
                    },
                )
                self.orchestrator.on_step_failed(job_id, run_id, step_name, error_code)
