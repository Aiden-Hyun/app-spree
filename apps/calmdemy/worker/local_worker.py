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

import firebase_admin
from firebase_admin import credentials, firestore

import config
from pipeline.runner import process_job
from pipeline.content_publisher import publish_content

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


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


def get_next_job(db):
    """Query Firestore for the oldest pending non-cloud job.

    Picks up any job where neither llmBackend nor ttsBackend is "cloud",
    including any combination of "local" and "api".
    """
    jobs_ref = db.collection(config.JOBS_COLLECTION)

    # Firestore can't do "NOT EQUAL" across two fields in a compound query,
    # so we fetch pending jobs and filter out cloud ones in Python.
    query = (
        jobs_ref
        .where("status", "==", "pending")
        .order_by("createdAt")
        .limit(10)
    )
    docs = query.stream()
    for doc in docs:
        data = doc.to_dict()
        if not _is_cloud_job(data):
            return doc

    return None


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


def handle_publish_job(db, job_id: str, job_data: dict):
    """Publish a completed job that was awaiting approval."""
    from firebase_admin import firestore as fs

    content_type = job_data.get("contentType", "")

    # Course jobs have a dedicated publish flow
    if content_type == "course":
        _handle_course_publish(db, job_id, job_data)
        return

    storage_path = job_data.get("audioPath", "")
    duration_sec = job_data.get("audioDurationSec", 0)
    script = job_data.get("generatedScript", "")

    if not storage_path:
        print(f"  [publish] Job {job_id} has no audio path, cannot publish.")
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
    print(f"  [publish] Job {job_id} published. Content ID: {content_id}")


def _handle_course_publish(db, job_id: str, job_data: dict):
    """Publish a course job that was awaiting approval."""
    from firebase_admin import firestore as fs
    from pipeline.course_runner import _publish_course

    plan = job_data.get("coursePlan")
    if not plan:
        db.collection(config.JOBS_COLLECTION).document(job_id).update({
            "status": "failed",
            "error": "No course plan found for publishing",
            "updatedAt": fs.SERVER_TIMESTAMP,
        })
        return

    # The course runner already uploaded audio; audio paths are stored in job_data
    # But we need the audio_results dict. For manual publish, the audio paths are
    # in the course session data. We'll re-read them.
    # For simplicity, we mark this as not yet supported for manual course publish.
    db.collection(config.JOBS_COLLECTION).document(job_id).update({
        "status": "failed",
        "error": "Manual course publishing not yet supported. Use auto-publish for courses.",
        "updatedAt": fs.SERVER_TIMESTAMP,
    })
    print(f"  [publish] Course manual publish not yet supported for job {job_id}")


# ==================== MAIN LOOP ====================


def main():
    print("=" * 60)
    print("  Calmdemy Content Factory — Local Worker (primary)")
    print("=" * 60)
    print(f"  Project:       {config.PROJECT_ID}")
    print(f"  Handles:       all non-cloud jobs (local + api)")
    print(f"  Poll interval: {config.POLL_INTERVAL_SECONDS}s")
    print("=" * 60)
    print()
    print("Press Ctrl+C to stop.")
    print()

    db = init_firebase()

    while True:
        try:
            # Check for jobs awaiting manual publish approval first
            publish_doc = get_next_publish_job(db)
            if publish_doc:
                pub_id = publish_doc.id
                pub_data = publish_doc.to_dict()
                print(f"\n[local-worker] Publishing approved job: {pub_id}")
                handle_publish_job(db, pub_id, pub_data)
                continue

            # Check for new pending jobs
            job_doc = get_next_job(db)

            if job_doc:
                job_id = job_doc.id
                job_data = job_doc.to_dict()
                print(f"\n[local-worker] Processing job: {job_id}")
                print(f"               Type:     {job_data.get('contentType')}")
                print(f"               Topic:    {job_data.get('params', {}).get('topic')}")
                print(f"               LLM:      {job_data.get('llmModel')} ({job_data.get('llmBackend', 'local')})")
                print(f"               TTS:      {job_data.get('ttsModel')} ({job_data.get('ttsBackend', 'local')})")

                process_job(db, job_id, job_data)

                print(f"[local-worker] Job {job_id} finished.\n")
            else:
                print(
                    f"[local-worker] No pending jobs. "
                    f"Polling in {config.POLL_INTERVAL_SECONDS}s..."
                )
                time.sleep(config.POLL_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            print("\n[local-worker] Stopped by user.")
            sys.exit(0)
        except Exception as e:
            print(f"[local-worker] Error: {e}")
            print(f"[local-worker] Retrying in {config.POLL_INTERVAL_SECONDS}s...")
            time.sleep(config.POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
