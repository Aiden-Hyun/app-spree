"""
Stale job watchdog — detects and resets jobs stuck in intermediate statuses.

When the worker crashes mid-pipeline, jobs remain in an intermediate status
(e.g. llm_generating, tts_converting) forever.  This module queries Firestore
for jobs whose `updatedAt` is older than a configurable threshold and either
resets them to a retryable status or marks them as failed.
"""

import time
from datetime import datetime, timedelta, timezone

from firebase_admin import firestore as fs_module

import config

# Statuses that are "in-flight" and can go stale if the worker crashes.
PRE_STAGE_STATUSES = ["llm_generating", "qa_formatting", "image_generating"]
TTS_STAGE_STATUSES = ["tts_converting", "post_processing", "uploading"]
HANDOFF_STATUS = "tts_pending"
PUBLISH_STATUS = "publishing"

ALL_STALE_STATUSES = (
    PRE_STAGE_STATUSES + TTS_STAGE_STATUSES + [HANDOFF_STATUS, PUBLISH_STATUS]
)

# Module-level throttle state
_last_check_time: float = 0.0


def should_run_check() -> bool:
    """Return True if enough time has elapsed since the last watchdog check."""
    global _last_check_time
    now = time.time()
    if now - _last_check_time < config.WATCHDOG_CHECK_INTERVAL_SECONDS:
        return False
    _last_check_time = now
    return True


def check_stale_jobs(db) -> int:
    """
    Query Firestore for jobs stuck in intermediate statuses longer than the
    configured threshold and reset or fail them.

    Returns the number of jobs reset/failed.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(
        minutes=config.STALE_JOB_TIMEOUT_MINUTES
    )
    reset_count = 0

    for status in ALL_STALE_STATUSES:
        docs = (
            db.collection(config.JOBS_COLLECTION)
            .where("status", "==", status)
            .where("updatedAt", "<", cutoff)
            .limit(10)
            .stream()
        )
        for doc_snapshot in docs:
            job_id = doc_snapshot.id
            job_data = doc_snapshot.to_dict()
            if _reset_stale_job(db, doc_snapshot.reference, job_id, job_data, status):
                reset_count += 1

    return reset_count


def _determine_reset_action(status: str) -> tuple[str, str]:
    """
    Determine what to do with a stale job.

    Returns (new_status, reason).
    """
    if status in PRE_STAGE_STATUSES:
        return "pending", f"Reset from stale '{status}' back to pending"

    if status in TTS_STAGE_STATUSES:
        return "tts_pending", f"Reset from stale '{status}' back to tts_pending"

    if status == HANDOFF_STATUS:
        return "pending", f"Reset from stale '{status}' back to pending (no TTS worker picked up)"

    if status == PUBLISH_STATUS:
        return "failed", f"Marked as failed from stale '{status}' (duplicate publish risk)"

    return "failed", f"Marked as failed from unknown stale status '{status}'"


def _reset_stale_job(
    db, doc_ref, job_id: str, job_data: dict, status: str
) -> bool:
    """
    Atomically reset a stale job using a Firestore transaction.
    Returns True if the job was actually reset.
    """
    from firebase_admin import firestore

    new_status, reason = _determine_reset_action(status)
    current_reset_count = job_data.get("watchdogResetCount", 0)

    transaction = db.transaction()

    @firestore.transactional
    def _tx_reset(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            return False
        live_data = snapshot.to_dict()

        # Safety: status may have changed between query and transaction.
        if live_data.get("status") != status:
            return False

        # Safety: updatedAt may have advanced (job became active again).
        cutoff = datetime.now(timezone.utc) - timedelta(
            minutes=config.STALE_JOB_TIMEOUT_MINUTES
        )
        live_updated = live_data.get("updatedAt")
        if live_updated is not None:
            # Firestore Timestamp → datetime
            if hasattr(live_updated, "timestamp"):
                live_dt = datetime.fromtimestamp(
                    live_updated.timestamp(), tz=timezone.utc
                )
            elif hasattr(live_updated, "replace"):
                live_dt = (
                    live_updated
                    if live_updated.tzinfo
                    else live_updated.replace(tzinfo=timezone.utc)
                )
            else:
                live_dt = cutoff  # Unknown type — treat as stale
            if live_dt >= cutoff:
                return False

        update_data = {
            "status": new_status,
            "updatedAt": fs_module.SERVER_TIMESTAMP,
            "watchdogResetCount": current_reset_count + 1,
            "lastWatchdogResetAt": fs_module.SERVER_TIMESTAMP,
            "lastWatchdogReason": reason,
        }

        if new_status == "failed":
            update_data["error"] = f"Watchdog: {reason}"
            update_data["failedStage"] = status

        if new_status == "pending":
            update_data["startedAt"] = None

        transaction.update(doc_ref, update_data)
        return True

    try:
        did_reset = _tx_reset(transaction)
        if did_reset:
            print(
                f"  [watchdog] Job {job_id}: {reason} "
                f"(reset #{current_reset_count + 1})"
            )
        return did_reset
    except Exception as e:
        print(f"  [watchdog] Failed to reset job {job_id}: {e}")
        return False
