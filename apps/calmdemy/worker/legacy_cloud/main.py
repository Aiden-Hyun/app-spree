"""
Calmdemy Content Factory — VM Worker entry point (legacy / cloud backend).

This script runs on the GCE VM. It:
  1. Initializes Firebase Admin SDK
  2. Polls Firestore for pending jobs that need cloud GPU
  3. Processes each job through the pipeline
  4. Shuts down the VM when the queue has been empty for IDLE_SHUTDOWN_MINUTES

Note: Cloud backend is currently unavailable. The local worker handles
all local + API jobs. This VM worker only activates if a job has
llmBackend="cloud" or ttsBackend="cloud".
"""

import os
import subprocess
import time

import firebase_admin
from firebase_admin import credentials, firestore

import config
from observability import configure_logging, get_logger
from pipeline.runner import process_job
from pipeline.worker_status import update_worker_status

configure_logging()
logger = get_logger(__name__)

# ==================== INIT ====================


def init_firebase():
    """Initialize Firebase Admin SDK using application default credentials."""
    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={
            "projectId": config.PROJECT_ID,
            "storageBucket": config.STORAGE_BUCKET,
        })
    return firestore.client()


# ==================== JOB POLLING ====================


def get_next_pending_job(db):
    """Query Firestore for the oldest pending job that needs cloud GPU.

    A job needs cloud if llmBackend or ttsBackend is "cloud".
    All other jobs (local, api) are handled by local_worker.py.
    """
    jobs_ref = db.collection(config.JOBS_COLLECTION)

    # Check for jobs where llmBackend is cloud
    query = (
        jobs_ref
        .where("llmBackend", "==", "cloud")
        .where("status", "==", "pending")
        .order_by("createdAt")
        .limit(1)
    )
    docs = query.stream()
    for doc in docs:
        return doc

    # Check for jobs where ttsBackend is cloud
    query = (
        jobs_ref
        .where("ttsBackend", "==", "cloud")
        .where("status", "==", "pending")
        .order_by("createdAt")
        .limit(1)
    )
    docs = query.stream()
    for doc in docs:
        return doc

    # Also pick up legacy jobs that have the old single "backend" field
    query = (
        jobs_ref
        .where("status", "==", "pending")
        .order_by("createdAt")
        .limit(5)
    )
    docs = query.stream()
    for doc in docs:
        data = doc.to_dict()
        # Legacy job with old single backend field
        if "backend" in data and "llmBackend" not in data:
            if data.get("backend") != "local":
                return doc

    return None


# ==================== SHUTDOWN ====================


def shutdown_vm():
    """Stop this VM. The Cloud Function will restart it when needed."""
    logger.info("No pending jobs. Shutting down VM...")
    try:
        subprocess.run(["sudo", "shutdown", "-h", "now"], check=False)
    except Exception as e:
        logger.exception("Shutdown command failed", extra={"error": str(e)})
        # If we can't shutdown via command, try the API
        try:
            from google.cloud import compute_v1
            client = compute_v1.InstancesClient()
            client.stop(
                project=config.PROJECT_ID,
                zone=config.GCE_ZONE,
                instance=config.GCE_VM_NAME,
            )
        except Exception as api_err:
            logger.exception("API shutdown failed", extra={"error": str(api_err)})


# ==================== MAIN LOOP ====================


def main():
    configure_logging()
    logger.info("Calmdemy Content Factory — VM Worker (cloud backend)")
    logger.info(
        "Worker configuration",
        extra={
            "project_id": config.PROJECT_ID,
            "model_dir": config.MODEL_DIR,
            "idle_shutdown_minutes": config.IDLE_SHUTDOWN_MINUTES,
        },
    )

    db = init_firebase()
    idle_seconds = 0

    while True:
        update_worker_status(db, "cloud", "cloud")
        job_doc = get_next_pending_job(db)

        if job_doc:
            idle_seconds = 0
            job_id = job_doc.id
            job_data = job_doc.to_dict()
            logger.info(
                "Processing job",
                extra={
                    "job_id": job_id,
                    "content_type": job_data.get("contentType"),
                    "topic": job_data.get("params", {}).get("topic"),
                },
            )

            process_job(db, job_id, job_data)

            logger.info("Job finished", extra={"job_id": job_id})
        else:
            idle_seconds += config.POLL_INTERVAL_SECONDS
            idle_minutes = idle_seconds / 60

            if idle_minutes >= config.IDLE_SHUTDOWN_MINUTES:
                shutdown_vm()
                break  # In case shutdown doesn't immediately kill the process

            remaining = config.IDLE_SHUTDOWN_MINUTES - idle_minutes
            logger.info(
                "Queue empty",
                extra={
                    "shutdown_in_minutes": round(remaining, 1),
                    "poll_interval_sec": config.POLL_INTERVAL_SECONDS,
                },
            )
            time.sleep(config.POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
