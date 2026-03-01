from __future__ import annotations

import time

from firebase_admin import firestore
from firebase_admin import firestore as fs

import config
from observability import get_logger
from factory_v2.shared.delete_job import mark_delete_failed, process_delete_job
from factory_v2.shared.error_codes import classify_error
from factory_v2.shared.worker_status import update_worker_status

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
        self._last_recovery_at = 0.0

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

    @staticmethod
    def _compat_failed_stage(step_name: str) -> str:
        mapping = {
            "generate_script": "llm_generating",
            "format_script": "qa_formatting",
            "generate_image": "image_generating",
            "synthesize_audio": "tts_converting",
            "post_process_audio": "post_processing",
            "upload_audio": "uploading",
            "publish_content": "publishing",
            "generate_course_plan": "llm_generating",
            "generate_course_scripts": "llm_generating",
            "format_course_scripts": "qa_formatting",
            "generate_course_thumbnail": "image_generating",
            "synthesize_course_audio": "tts_converting",
            "upload_course_audio": "uploading",
            "publish_course": "publishing",
        }
        return mapping.get(step_name, "pending")

    def _claim_delete_job(self, doc_ref) -> dict | None:
        transaction = self.db.transaction()

        @firestore.transactional
        def _tx_claim(tx):
            snapshot = doc_ref.get(transaction=tx)
            if not snapshot.exists:
                return None
            data = snapshot.to_dict() or {}
            if not data.get("deleteRequested"):
                return None
            if data.get("deleteInProgress"):
                return None

            tx.update(
                doc_ref,
                {
                    "deleteInProgress": True,
                    "updatedAt": fs.SERVER_TIMESTAMP,
                },
            )
            return data

        return _tx_claim(transaction)

    def _next_delete_job(self) -> tuple[str, dict] | None:
        query = self.db.collection(config.JOBS_COLLECTION).where("deleteRequested", "==", True).limit(10)
        for doc in query.stream():
            claimed = self._claim_delete_job(doc.reference)
            if claimed is not None:
                return doc.id, claimed
        return None

    def _cleanup_factory_records(self, job_id: str) -> None:
        self.db.collection("factory_jobs").document(job_id).delete()

        for collection_name in ("factory_job_runs", "factory_step_runs", "factory_step_queue", "factory_events"):
            query = self.db.collection(collection_name).where("job_id", "==", job_id).limit(500)
            for snapshot in query.stream():
                snapshot.reference.delete()

    def _handle_delete_requests(self) -> bool:
        delete_job = self._next_delete_job()
        if not delete_job:
            return False

        job_id, job_data = delete_job
        logger.info("V2 deleting job", extra={"job_id": job_id, "worker_id": self.worker_id})
        try:
            process_delete_job(self.db, job_id, job_data)
            self._cleanup_factory_records(job_id)
        except Exception as exc:
            mark_delete_failed(self.db, job_id, f"{type(exc).__name__}: {exc}")
        return True

    def run_forever(self) -> None:
        while True:
            try:
                update_worker_status(self.db, self.worker_id, "local")
            except Exception as heartbeat_exc:
                logger.warning(
                    "V2 heartbeat failed",
                    extra={"worker_id": self.worker_id, "error": str(heartbeat_exc)},
                )

            if self._handle_delete_requests():
                continue

            now = time.time()
            if now - self._last_recovery_at >= 15:
                self._last_recovery_at = now
                try:
                    recovered = self.queue_repo.recover_stale_leases()
                    if recovered:
                        logger.info(
                            "V2 queue stale leases recovered",
                            extra={"worker_id": self.worker_id, "recovered": recovered},
                        )
                except Exception as recovery_exc:
                    logger.warning(
                        "V2 queue lease recovery failed",
                        extra={"worker_id": self.worker_id, "error": str(recovery_exc)},
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

            job: dict | None = None
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

                request = (job or {}).get("request") or {}
                compat = request.get("compat") or {}
                content_job_id = compat.get("content_job_id")
                self.job_repo.patch_compat_content_job(
                    content_job_id,
                    {
                        "status": "failed",
                        "error": error_msg,
                        "errorCode": error_code,
                        "failedStage": self._compat_failed_stage(step_name),
                        "jobRunId": run_id,
                        "lastRunStatus": "failed",
                        "runEndedAt": fs.SERVER_TIMESTAMP,
                    },
                )
                self.orchestrator.on_step_failed(job_id, run_id, step_name, error_code)
