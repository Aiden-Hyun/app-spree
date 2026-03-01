"""
Helpers for assigning a run identifier to each processing attempt.
"""

from __future__ import annotations

from firebase_admin import firestore as fs

import config


def start_job_run(
    db,
    job_id: str,
    job_data: dict,
    worker_id: str,
    worker_role: str,
) -> str:
    """
    Ensure the job has a run id for the current execution.

    TTS handoff keeps the pre-stage run id so one content generation attempt
    can be traced across workers.
    """
    current_status = (job_data or {}).get("status")
    current_run_id = (job_data or {}).get("jobRunId")
    current_attempt = int((job_data or {}).get("runAttempt") or 0)

    keep_existing = bool(current_run_id) and current_status == "tts_pending"
    if keep_existing:
        run_id = str(current_run_id)
        attempt = current_attempt if current_attempt > 0 else 1
    else:
        attempt = current_attempt + 1
        run_id = f"{job_id}-r{attempt}"

    payload = {
        "jobRunId": run_id,
        "runAttempt": attempt,
        "runWorkerId": worker_id,
        "runWorkerRole": worker_role,
        "lastRunStatus": "running",
        "updatedAt": fs.SERVER_TIMESTAMP,
    }
    if keep_existing:
        payload["runContinuedAt"] = fs.SERVER_TIMESTAMP
    else:
        payload["runStartedAt"] = fs.SERVER_TIMESTAMP

    db.collection(config.JOBS_COLLECTION).document(job_id).update(payload)
    return run_id
