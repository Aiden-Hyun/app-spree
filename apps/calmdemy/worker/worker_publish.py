from datetime import datetime, timedelta, timezone
from typing import Optional

from firebase_admin import firestore

import config
from observability import get_logger
from pipeline.content_publisher import publish_content
from pipeline.error_codes import classify_error

logger = get_logger(__name__)
PUBLISH_LEASE_SECONDS = 300


def get_next_publish_job(db) -> Optional[object]:
    """Query Firestore for completed jobs awaiting manual publish approval."""
    jobs_ref = db.collection(config.JOBS_COLLECTION)
    queries = [
        jobs_ref.where("status", "==", "publishing").order_by("createdAt").limit(25),
        jobs_ref.where("status", "==", "publishing_in_progress").order_by("createdAt").limit(25),
    ]

    now = datetime.now(timezone.utc)
    for query in queries:
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict() or {}
            if not data.get("publishInProgress"):
                return doc

            lease_until = data.get("publishLeaseExpiresAt")
            if lease_until is None:
                return doc

            if hasattr(lease_until, "timestamp"):
                lease_dt = datetime.fromtimestamp(lease_until.timestamp(), tz=timezone.utc)
            elif isinstance(lease_until, datetime):
                lease_dt = lease_until if lease_until.tzinfo else lease_until.replace(tzinfo=timezone.utc)
            else:
                return doc

            if lease_dt <= now:
                return doc
    return None


def claim_publish_job(db, doc_ref, worker_id: str) -> Optional[dict]:
    """Atomically claim a publishing job to avoid duplicate publishes."""
    from firebase_admin import firestore as fs

    transaction = db.transaction()

    @firestore.transactional
    def _tx_claim(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data.get("status") not in ("publishing", "publishing_in_progress"):
            return None
        if data.get("publishedContentId") or data.get("courseId"):
            return None

        now = datetime.now(timezone.utc)
        lease_until = data.get("publishLeaseExpiresAt")
        if data.get("publishInProgress"):
            if lease_until is None:
                return None
            if hasattr(lease_until, "timestamp"):
                lease_dt = datetime.fromtimestamp(lease_until.timestamp(), tz=timezone.utc)
            elif isinstance(lease_until, datetime):
                lease_dt = lease_until if lease_until.tzinfo else lease_until.replace(tzinfo=timezone.utc)
            else:
                return None
            if lease_dt > now:
                return None

        publish_token = data.get("publishToken") or snapshot.id
        transaction.update(doc_ref, {
            "status": "publishing",
            "publishToken": publish_token,
            "publishInProgress": True,
            "publishLeaseOwner": worker_id,
            "publishLeaseExpiresAt": now + timedelta(seconds=PUBLISH_LEASE_SECONDS),
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        data["publishToken"] = publish_token
        data["publishInProgress"] = True
        data["publishLeaseOwner"] = worker_id
        return data

    return _tx_claim(transaction)


def _handle_course_publish(db, job_id: str, job_data: dict):
    from firebase_admin import firestore as fs
    from pipeline.course_runner import _publish_course
    job_run_id = job_data.get("jobRunId")

    if job_data.get("courseId") and job_data.get("courseSessionIds"):
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "completed",
            "lastRunStatus": "completed",
            "runEndedAt": fs.SERVER_TIMESTAMP,
            "publishInProgress": False,
            "publishLeaseOwner": None,
            "publishLeaseExpiresAt": None,
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        logger.info(
            "Course publish skipped (already published)",
            extra={
                "job_id": job_id,
                "job_run_id": job_run_id,
                "course_id": job_data.get("courseId"),
            },
        )
        return

    plan = job_data.get("coursePlan")
    audio_results = job_data.get("courseAudioResults") or {}
    if not plan:
        error_msg = "No course plan found for publishing"
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "failed",
            "error": error_msg,
            "errorCode": classify_error(error_msg),
            "failedStage": "publishing",
            "lastRunStatus": "failed",
            "runEndedAt": fs.SERVER_TIMESTAMP,
            "publishInProgress": False,
            "publishLeaseOwner": None,
            "publishLeaseExpiresAt": None,
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        return
    if not audio_results:
        error_msg = "No audio results found for publishing"
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "failed",
            "error": error_msg,
            "errorCode": classify_error(error_msg),
            "failedStage": "publishing",
            "lastRunStatus": "failed",
            "runEndedAt": fs.SERVER_TIMESTAMP,
            "publishInProgress": False,
            "publishLeaseOwner": None,
            "publishLeaseExpiresAt": None,
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        return

    course_id, session_ids = _publish_course(db, job_id, plan, audio_results, job_data)
    db.collection(config.JOBS_COLLECTION).document(job_id).update({
        "status": "completed",
        "courseId": course_id,
        "courseSessionIds": session_ids,
        "lastRunStatus": "completed",
        "runEndedAt": fs.SERVER_TIMESTAMP,
        "publishInProgress": False,
        "publishLeaseOwner": None,
        "publishLeaseExpiresAt": None,
        "updatedAt": fs.SERVER_TIMESTAMP,
    })
    logger.info(
        "Course publish completed",
        extra={"job_id": job_id, "job_run_id": job_run_id, "course_id": course_id},
    )


def handle_publish_job(db, job_id: str, job_data: dict):
    """Publish a completed job that was awaiting approval."""
    from firebase_admin import firestore as fs

    content_type = job_data.get("contentType", "")
    job_run_id = job_data.get("jobRunId")
    try:
        # Fast path: already published
        if job_data.get("publishedContentId") or job_data.get("courseId"):
            logger.info(
                "Publish skipped (already published)",
                extra={"job_id": job_id, "job_run_id": job_run_id},
            )
            db.collection(config.JOBS_COLLECTION).document(job_id).update({
                "status": "completed",
                "lastRunStatus": "completed",
                "runEndedAt": fs.SERVER_TIMESTAMP,
                "publishInProgress": False,
                "publishLeaseOwner": None,
                "publishLeaseExpiresAt": None,
                "updatedAt": fs.SERVER_TIMESTAMP,
            })
            return

        # Course jobs have a dedicated publish flow
        if content_type == "course":
            _handle_course_publish(db, job_id, job_data)
            return

        storage_path = job_data.get("audioPath", "")
        duration_sec = job_data.get("audioDurationSec", 0)
        script = job_data.get("formattedScript") or job_data.get("generatedScript", "")

        if not storage_path:
            error_msg = "No audio path found for publishing"
            logger.warning(
                "Publish skipped: job has no audio path",
                extra={"job_id": job_id, "job_run_id": job_run_id},
            )
            db.collection(config.JOBS_COLLECTION).document(job_id).update({
                "status": "failed",
                "error": error_msg,
                "errorCode": classify_error(error_msg),
                "lastRunStatus": "failed",
                "runEndedAt": fs.SERVER_TIMESTAMP,
                "publishInProgress": False,
                "publishLeaseOwner": None,
                "publishLeaseExpiresAt": None,
                "updatedAt": fs.SERVER_TIMESTAMP,
            })
            return

        # Add the resolved title
        resolved_title = job_data.get("generatedTitle") or job_data.get("title", "")
        job_data_with_title = {**job_data, "_resolvedTitle": resolved_title}

        content_id = publish_content(db, storage_path, duration_sec, script, job_data_with_title)

        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "completed",
            "publishedContentId": content_id,
            "lastRunStatus": "completed",
            "runEndedAt": fs.SERVER_TIMESTAMP,
            "publishInProgress": False,
            "publishLeaseOwner": None,
            "publishLeaseExpiresAt": None,
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        logger.info(
            "Publish completed",
            extra={"job_id": job_id, "job_run_id": job_run_id, "content_id": content_id},
        )
    except Exception as exc:
        error_msg = f"{type(exc).__name__}: {exc}"
        error_code = classify_error(exc)
        logger.exception(
            "Publish failed",
            extra={"job_id": job_id, "job_run_id": job_run_id, "error_code": error_code},
        )
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "failed",
            "error": error_msg,
            "errorCode": error_code,
            "failedStage": "publishing",
            "lastRunStatus": "failed",
            "runEndedAt": fs.SERVER_TIMESTAMP,
            "publishInProgress": False,
            "publishLeaseOwner": None,
            "publishLeaseExpiresAt": None,
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
