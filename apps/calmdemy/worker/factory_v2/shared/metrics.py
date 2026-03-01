from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from firebase_admin import firestore as fs

from observability import get_logger

logger = get_logger(__name__)


def _coerce_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if hasattr(value, "to_datetime"):
        return value.to_datetime()
    if hasattr(value, "toDate"):
        return value.toDate()
    return None


def record_job_metric(
    db,
    job_id: str,
    job_data: dict,
    outcome: str,
    stage: str | None = None,
    error: str | None = None,
) -> None:
    try:
        content_type = job_data.get("contentType", "unknown")
        date_key = datetime.now(timezone.utc).date().isoformat()
        doc_ref = db.collection("factory_metrics").document(date_key)

        updates: dict[str, Any] = {
            "lastUpdatedAt": fs.SERVER_TIMESTAMP,
        }

        if outcome == "completed":
            updates["completed_total"] = fs.Increment(1)
            updates[f"completed_by_type.{content_type}"] = fs.Increment(1)
        else:
            updates["failed_total"] = fs.Increment(1)
            updates[f"failed_by_type.{content_type}"] = fs.Increment(1)
            if stage:
                updates[f"failed_by_stage.{stage}"] = fs.Increment(1)
            if error:
                updates["last_error"] = error

        started_at = _coerce_datetime(
            job_data.get("startedAt")
            or job_data.get("ttsPendingAt")
            or job_data.get("createdAt")
        )
        completed_at = _coerce_datetime(job_data.get("completedAt"))
        if completed_at is None:
            completed_at = datetime.now(timezone.utc)

        if started_at and completed_at:
            duration_sec = max(0.0, (completed_at - started_at).total_seconds())
            updates["duration_sec_sum"] = fs.Increment(duration_sec)
            updates["duration_sec_count"] = fs.Increment(1)

        created_at = _coerce_datetime(job_data.get("createdAt"))
        if created_at and started_at:
            queue_latency_sec = max(0.0, (started_at - created_at).total_seconds())
            updates["queue_latency_sec_sum"] = fs.Increment(queue_latency_sec)
            updates["queue_latency_sec_count"] = fs.Increment(1)

        doc_ref.set(updates, merge=True)

    except Exception as exc:
        logger.exception(
            "Failed to record job metrics",
            extra={"job_id": job_id, "outcome": outcome, "error": str(exc)},
        )
