"""Delete job artifacts (local cache + remote audio) and remove content job doc."""

from firebase_admin import firestore as fs
from firebase_admin import storage

import config
from observability import get_logger

from .error_codes import classify_error
from .job_cache import cleanup as cleanup_cache

logger = get_logger(__name__)


def _safe_delete_blob(bucket, storage_path: str) -> None:
    if not storage_path:
        return
    if not (storage_path.startswith("audio/") or storage_path.startswith("images/")):
        logger.info("Delete skipped unsupported path", extra={"path": storage_path})
        return

    blob = bucket.blob(storage_path)
    try:
        if blob.exists():
            blob.delete()
            logger.info("Deleted storage object", extra={"path": storage_path})
    except Exception as exc:
        logger.warning(
            "Failed to delete storage object",
            extra={"path": storage_path, "error": str(exc)},
        )


def process_delete_job(db, job_id: str, job_data: dict) -> None:
    bucket = storage.bucket(config.STORAGE_BUCKET)

    paths: list[str] = []
    for key in ("audioPath", "imagePath"):
        value = job_data.get(key)
        if value:
            paths.append(str(value))

    preview_sessions = job_data.get("coursePreviewSessions") or []
    for session in preview_sessions:
        if not isinstance(session, dict):
            continue
        session_path = session.get("audioPath")
        if session_path:
            paths.append(str(session_path))

    audio_results = job_data.get("courseAudioResults") or {}
    if isinstance(audio_results, dict):
        for payload in audio_results.values():
            if not isinstance(payload, dict):
                continue
            storage_path = payload.get("storagePath")
            if storage_path:
                paths.append(str(storage_path))

    for path in sorted(set(paths)):
        _safe_delete_blob(bucket, path)

    cleanup_cache(job_id)
    db.collection(config.JOBS_COLLECTION).document(job_id).delete()
    logger.info("Content job deleted", extra={"job_id": job_id})


def mark_delete_failed(db, job_id: str, error_msg: str) -> None:
    db.collection(config.JOBS_COLLECTION).document(job_id).update(
        {
            "deleteError": error_msg,
            "deleteErrorCode": classify_error(error_msg),
            "deleteInProgress": False,
            "updatedAt": fs.SERVER_TIMESTAMP,
        }
    )
