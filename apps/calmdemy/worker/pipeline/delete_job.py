"""
Delete job artifacts (local cache + remote audio) and remove job doc.
"""

from firebase_admin import storage, firestore as fs

import config
from .job_cache import cleanup as cleanup_cache


def _safe_delete_blob(bucket, storage_path: str) -> None:
    if not storage_path:
        return
    if not storage_path.startswith("audio/"):
        print(f"  [delete] Skipping non-audio path: {storage_path}")
        return
    blob = bucket.blob(storage_path)
    try:
        if blob.exists():
            blob.delete()
            print(f"  [delete] Removed storage object: {storage_path}")
    except Exception as e:
        print(f"  [delete] Failed to delete {storage_path}: {e}")


def process_delete_job(db, job_id: str, job_data: dict) -> None:
    """Delete artifacts and remove the job document."""
    bucket = storage.bucket(config.STORAGE_BUCKET)

    # Collect storage paths
    paths: list[str] = []
    audio_path = job_data.get("audioPath")
    if audio_path:
        paths.append(audio_path)

    preview_sessions = job_data.get("coursePreviewSessions") or []
    for session in preview_sessions:
        session_path = session.get("audioPath")
        if session_path:
            paths.append(session_path)

    # Delete remote storage objects
    for path in paths:
        _safe_delete_blob(bucket, path)

    # Remove local cache
    cleanup_cache(job_id)

    # Remove job doc
    db.collection(config.JOBS_COLLECTION).document(job_id).delete()
    print(f"  [delete] Job {job_id} deleted.")


def mark_delete_failed(db, job_id: str, error_msg: str) -> None:
    db.collection(config.JOBS_COLLECTION).document(job_id).update({
        "deleteError": error_msg,
        "deleteInProgress": False,
        "updatedAt": fs.SERVER_TIMESTAMP,
    })
