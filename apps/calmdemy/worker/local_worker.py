"""
Calmdemy Content Factory — Local Worker (Mac).

This is the PRIMARY worker. It handles all jobs where neither
llmBackend nor ttsBackend is "cloud" — i.e. any combination of
"local" and "api" backends.

It runs on your Mac and:
  1. Initializes Firebase Admin SDK using a service account key
  2. Polls Firestore for pending non-cloud jobs
  3. Processes each job through the same pipeline
  4. Does NOT shut down — it runs as long as you keep it open

Prerequisites:
  - Python 3.11+
  - ffmpeg installed (brew install ffmpeg)
  - Ollama running (ollama serve) if using Ollama LLM models
  - Piper installed (pip install piper-tts) if using Piper TTS
  - GOOGLE_APPLICATION_CREDENTIALS or a service-account-key.json file
  - GEMINI_API_KEY in .env if using Gemini API models

Usage:
  cd apps/calmdemy/worker
  python3 local_worker.py
"""

import os
import sys
import time
import random

import firebase_admin
from firebase_admin import credentials, firestore

import config
from observability import configure_logging, get_logger
from pipeline.runner import process_job, process_job_pre, process_job_tts
from pipeline.delete_job import process_delete_job, mark_delete_failed
from pipeline.worker_status import update_worker_status
from pipeline.content_publisher import publish_content
from pipeline.watchdog import should_run_check, check_stale_jobs

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

configure_logging()
logger = get_logger(__name__)


# ==================== INIT ====================


def init_firebase():
    """Initialize Firebase Admin SDK.

    Uses GOOGLE_APPLICATION_CREDENTIALS env var or falls back to
    a service-account-key.json file in the worker directory.
    """
    if not firebase_admin._apps:
        # Try explicit credentials file
        key_path = os.getenv(
            "GOOGLE_APPLICATION_CREDENTIALS",
            os.path.join(os.path.dirname(__file__), "service-account-key.json"),
        )

        if os.path.isfile(key_path):
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred, options={
                "projectId": config.PROJECT_ID,
                "storageBucket": config.STORAGE_BUCKET,
            })
        else:
            # Fall back to application default credentials
            firebase_admin.initialize_app(options={
                "projectId": config.PROJECT_ID,
                "storageBucket": config.STORAGE_BUCKET,
            })

    return firestore.client()


# ==================== JOB POLLING ====================


def _is_cloud_job(job_data: dict) -> bool:
    """Return True if either backend requires cloud GPU."""
    return (
        job_data.get("llmBackend") == "cloud"
        or job_data.get("ttsBackend") == "cloud"
    )


def _is_cloud_tts(job_data: dict) -> bool:
    """Return True if TTS backend requires cloud GPU."""
    return job_data.get("ttsBackend") == "cloud"


def _parse_tts_models(value: str | None) -> set[str]:
    if not value:
        return set()
    return {item.strip() for item in value.split(",") if item.strip()}


def _claim_job(db, doc_ref, role: str, tts_allowlist: set[str]) -> dict | None:
    """Atomically claim a pending job to avoid duplicate processing."""
    from firebase_admin import firestore as fs

    transaction = db.transaction()

    @firestore.transactional
    def _tx_claim(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        status = data.get("status")
        if role in ("pre", "full", "course"):
            if status != "pending":
                return None
            if _is_cloud_job(data):
                return None
            if role == "course" and data.get("contentType") != "course":
                return None
            if role == "pre" and data.get("contentType") == "course":
                return None
            if role == "course" and tts_allowlist and data.get("ttsModel") not in tts_allowlist:
                return None
            transaction.update(doc_ref, {
                "status": "llm_generating",
                "startedAt": fs.SERVER_TIMESTAMP,
                "updatedAt": fs.SERVER_TIMESTAMP,
            })
        else:
            if status != "tts_pending":
                return None
            if _is_cloud_tts(data):
                return None
            if tts_allowlist and data.get("ttsModel") not in tts_allowlist:
                return None
            transaction.update(doc_ref, {
                "status": "tts_converting",
                "updatedAt": fs.SERVER_TIMESTAMP,
            })
        return data

    return _tx_claim(transaction)


def get_next_job(db, role: str, tts_allowlist: set[str]):
    """Query Firestore for the next job this worker role should handle."""
    jobs_ref = db.collection(config.JOBS_COLLECTION)

    status_filter = "pending" if role in ("pre", "full") else "tts_pending"
    if role == "course":
        status_filter = "pending"

    # Firestore can't do "NOT EQUAL" across two fields in a compound query,
    # so we fetch jobs in batches and filter in Python.
    base_query = (
        jobs_ref
        .where("status", "==", status_filter)
        .order_by("createdAt")
        .limit(25)
    )

    last_doc = None
    while True:
        query = base_query
        if last_doc is not None:
            query = query.start_after(last_doc)

        docs = list(query.stream())
        if not docs:
            return None

        for doc in docs:
            data = doc.to_dict()
            if role in ("pre", "full", "course"):
                if _is_cloud_job(data):
                    continue
                if role == "course":
                    if data.get("contentType") != "course":
                        continue
                    if tts_allowlist and data.get("ttsModel") not in tts_allowlist:
                        continue
                if role == "pre" and data.get("contentType") == "course":
                    continue
            else:
                if _is_cloud_tts(data):
                    continue
                if tts_allowlist and data.get("ttsModel") not in tts_allowlist:
                    continue

            claimed = _claim_job(db, doc.reference, role, tts_allowlist)
            if claimed is not None:
                return doc.id, claimed

        last_doc = docs[-1]


def get_next_publish_job(db):
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


def _claim_publish_job(db, doc_ref) -> dict | None:
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


def _claim_delete_job(db, doc_ref) -> dict | None:
    """Atomically claim a delete request to avoid duplicate processing."""
    from firebase_admin import firestore as fs

    transaction = db.transaction()

    @firestore.transactional
    def _tx_claim(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if not data.get("deleteRequested"):
            return None
        if data.get("deleteInProgress"):
            return None
        transaction.update(doc_ref, {
            "deleteInProgress": True,
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        return data

    return _tx_claim(transaction)


def get_next_delete_job(db):
    """Query Firestore for jobs marked for deletion and claim one."""
    jobs_ref = db.collection(config.JOBS_COLLECTION)
    query = (
        jobs_ref
        .where("deleteRequested", "==", True)
        .limit(10)
    )
    docs = query.stream()
    for doc in docs:
        claimed = _claim_delete_job(db, doc.reference)
        if claimed is not None:
            return doc.id, claimed
    return None


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


def _handle_course_publish(db, job_id: str, job_data: dict):
    """Publish a course job that was awaiting approval."""
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


# ==================== MAIN LOOP ====================


def main():
    worker_id = os.getenv("WORKER_ID", "local")
    worker_role = os.getenv("WORKER_ROLE", "full").strip().lower()
    if worker_role not in ("pre", "tts", "full", "course"):
        logger.warning(
            "Unknown WORKER_ROLE; defaulting to full",
            extra={"worker_role": worker_role},
        )
        worker_role = "full"
    tts_allowlist = _parse_tts_models(os.getenv("WORKER_TTS_MODELS"))

    logger.info("Calmdemy Content Factory — Local Worker (primary)")
    logger.info("Project", extra={"project_id": config.PROJECT_ID})
    if worker_role == "pre":
        logger.info("Handles pre stage (LLM + QA + image)")
    elif worker_role == "course":
        allowlist_text = ", ".join(sorted(tts_allowlist)) if tts_allowlist else "all"
        logger.info(
            "Handles course jobs",
            extra={"tts_models": allowlist_text},
        )
    elif worker_role == "tts":
        allowlist_text = ", ".join(sorted(tts_allowlist)) if tts_allowlist else "all"
        logger.info(
            "Handles TTS stage",
            extra={"tts_models": allowlist_text},
        )
    else:
        logger.info("Handles full pipeline (legacy)")
    logger.info("Poll interval", extra={"poll_interval_sec": config.POLL_INTERVAL_SECONDS})
    logger.info("Press Ctrl+C to stop.")

    db = init_firebase()

    while True:
        try:
            update_worker_status(db, worker_id, "local")

            # Watchdog: detect and reset jobs stuck in intermediate statuses.
            # Only pre/full/course roles run this to avoid duplicate checks.
            if worker_role in ("pre", "full", "course") and should_run_check():
                try:
                    reset_count = check_stale_jobs(db)
                    if reset_count > 0:
                        logger.info(
                            "Watchdog reset stale jobs",
                            extra={"reset_count": reset_count},
                        )
                except Exception as e:
                    logger.exception("Watchdog error", extra={"error": str(e)})

            if worker_role in ("pre", "full"):
                # Handle delete requests first
                delete_job = get_next_delete_job(db)
                if delete_job:
                    del_id, del_data = delete_job
                    logger.info("Deleting job", extra={"job_id": del_id})
                    try:
                        process_delete_job(db, del_id, del_data)
                    except Exception as e:
                        mark_delete_failed(db, del_id, f"{type(e).__name__}: {e}")
                    continue

                # Check for jobs awaiting manual publish approval first
                publish_doc = get_next_publish_job(db)
                if publish_doc:
                    pub_id = publish_doc.id
                    claimed = _claim_publish_job(db, publish_doc.reference)
                    if not claimed:
                        continue
                    logger.info("Publishing approved job", extra={"job_id": pub_id})
                    handle_publish_job(db, pub_id, claimed)
                    continue

            # Check for new pending jobs
            next_job = get_next_job(db, worker_role, tts_allowlist)

            if next_job:
                job_id, job_data = next_job
                logger.info(
                    "Processing job",
                    extra={
                        "job_id": job_id,
                        "content_type": job_data.get("contentType"),
                        "topic": job_data.get("params", {}).get("topic"),
                        "llm_model": job_data.get("llmModel"),
                        "llm_backend": job_data.get("llmBackend", "local"),
                        "tts_model": job_data.get("ttsModel"),
                        "tts_backend": job_data.get("ttsBackend", "local"),
                    },
                )

                if worker_role == "pre":
                    process_job_pre(db, job_id, job_data)
                elif worker_role == "tts":
                    process_job_tts(db, job_id, job_data)
                elif worker_role == "course":
                    process_job(db, job_id, job_data)
                else:
                    process_job(db, job_id, job_data)

                logger.info("Job finished", extra={"job_id": job_id})
            else:
                if worker_role == "tts":
                    idle_label = "No TTS pending jobs"
                elif worker_role == "pre":
                    idle_label = "No pending jobs"
                else:
                    idle_label = "No pending jobs"
                logger.info(
                    "Idle",
                    extra={
                        "state": idle_label,
                        "poll_interval_sec": config.POLL_INTERVAL_SECONDS,
                    },
                )
                jitter = random.uniform(-0.3, 0.3)
                time.sleep(max(0.5, config.POLL_INTERVAL_SECONDS + jitter))

        except KeyboardInterrupt:
            logger.info("Stopped by user")
            sys.exit(0)
        except Exception as e:
            logger.exception("Worker error", extra={"error": str(e)})
            logger.info(
                "Retrying after error",
                extra={"poll_interval_sec": config.POLL_INTERVAL_SECONDS},
            )
            time.sleep(config.POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
