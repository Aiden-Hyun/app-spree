"""
Best-effort step transition audit records for debugging.
"""

from __future__ import annotations

from firebase_admin import firestore as fs

from observability import get_logger

logger = get_logger(__name__)

STEP_RUNS_COLLECTION = "factory_step_runs"


def record_step_transition(db, job_id: str, update_data: dict) -> None:
    """Append a transition event for a job status update."""
    try:
        status = str(update_data.get("status", "unknown"))
        job_run_id = update_data.get("jobRunId")
        if not job_run_id:
            snapshot = db.collection("content_jobs").document(job_id).get()
            if snapshot.exists:
                job_run_id = (snapshot.to_dict() or {}).get("jobRunId")

        step_name = status
        if status == "failed" and update_data.get("failedStage"):
            step_name = str(update_data.get("failedStage"))

        payload = {
            "jobId": job_id,
            "jobRunId": job_run_id,
            "stepName": step_name,
            "status": status,
            "eventType": "status_update",
            "lastCompletedStage": update_data.get("lastCompletedStage"),
            "errorCode": update_data.get("errorCode"),
            "error": update_data.get("error"),
            "recordedAt": fs.SERVER_TIMESTAMP,
        }

        db.collection(STEP_RUNS_COLLECTION).add(payload)
    except Exception as exc:
        logger.warning(
            "Failed to record step transition",
            extra={"job_id": job_id, "error": str(exc)},
        )
