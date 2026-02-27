from typing import Optional, Tuple

from firebase_admin import firestore

import config
from observability import get_logger
from pipeline.content_publisher import publish_content

logger = get_logger(__name__)


def get_next_publish_job(db) -> Optional[object]:
    """Query Firestore for completed jobs awaiting manual publish approval."""
    jobs_ref = db.collection(config.JOBS_COLLECTION)
    query = (
        jobs_ref
        .where("status", "==", "publishing")
        .order_by("createdAt")
        .limit(5)
    )
    docs = query.stream()
    for doc in docs:
        return doc
    return None


def claim_publish_job(db, doc_ref) -> Optional[dict]:
    """Atomically claim a publishing job to avoid duplicate publishes."""
    from firebase_admin import firestore as fs

    transaction = db.transaction()

    @firestore.transactional
    def _tx_claim(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data.get("status") != "publishing":
            return None
        if data.get("publishedContentId") or data.get("courseId"):
            return None
        publish_token = data.get("publishToken") or snapshot.id
        transaction.update(doc_ref, {
            "status": "publishing_in_progress",
            "publishToken": publish_token,
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        data["publishToken"] = publish_token
        return data

    return _tx_claim(transaction)


def _handle_course_publish(db, job_id: str, job_data: dict):
    from firebase_admin import firestore as fs
    from pipeline.course_runner import _publish_course

    if job_data.get("courseId") and job_data.get("courseSessionIds"):
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "completed",
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        logger.info(
            "Course publish skipped (already published)",
            extra={"job_id": job_id, "course_id": job_data.get("courseId")},
        )
        return

    plan = job_data.get("coursePlan")
    audio_results = job_data.get("courseAudioResults") or {}
    if not plan:
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "failed",
            "error": "No course plan found for publishing",
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        return
    if not audio_results:
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "failed",
            "error": "No audio results found for publishing",
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        return

    course_id, session_ids = _publish_course(db, job_id, plan, audio_results, job_data)
    db.collection(config.JOBS_COLLECTION).document(job_id).update({
        "status": "completed",
        "courseId": course_id,
        "courseSessionIds": session_ids,
        "updatedAt": fs.SERVER_TIMESTAMP,
    })
    logger.info(
        "Course publish completed",
        extra={"job_id": job_id, "course_id": course_id},
    )


def handle_publish_job(db, job_id: str, job_data: dict):
    """Publish a completed job that was awaiting approval."""
    from firebase_admin import firestore as fs

    content_type = job_data.get("contentType", "")

    # Fast path: already published
    if job_data.get("publishedContentId") or job_data.get("courseId"):
        logger.info("Publish skipped (already published)", extra={"job_id": job_id})
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "completed",
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
        logger.warning(
            "Publish skipped: job has no audio path",
            extra={"job_id": job_id},
        )
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "failed",
            "error": "No audio path found for publishing",
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
        "updatedAt": fs.SERVER_TIMESTAMP,
    })
    logger.info(
        "Publish completed",
        extra={"job_id": job_id, "content_id": content_id},
    )
