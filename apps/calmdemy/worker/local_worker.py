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
