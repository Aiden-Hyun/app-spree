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
from pipeline.runner import process_job

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
    print("[worker] No pending jobs. Shutting down VM...")
    try:
        subprocess.run(["sudo", "shutdown", "-h", "now"], check=False)
    except Exception as e:
        print(f"[worker] Shutdown command failed: {e}")
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
            print(f"[worker] API shutdown also failed: {api_err}")


# ==================== MAIN LOOP ====================


def main():
    print("=" * 60)
    print("  Calmdemy Content Factory — VM Worker (cloud backend)")
    print("=" * 60)
    print(f"  Project:    {config.PROJECT_ID}")
    print(f"  Model dir:  {config.MODEL_DIR}")
    print(f"  Idle limit: {config.IDLE_SHUTDOWN_MINUTES} min")
    print("=" * 60)

    db = init_firebase()
    idle_seconds = 0

    while True:
        job_doc = get_next_pending_job(db)

        if job_doc:
            idle_seconds = 0
            job_id = job_doc.id
            job_data = job_doc.to_dict()
            print(f"\n[worker] Processing job: {job_id}")
            print(f"         Type: {job_data.get('contentType')}")
            print(f"         Topic: {job_data.get('params', {}).get('topic')}")

            process_job(db, job_id, job_data)

            print(f"[worker] Job {job_id} finished.\n")
        else:
            idle_seconds += config.POLL_INTERVAL_SECONDS
            idle_minutes = idle_seconds / 60

            if idle_minutes >= config.IDLE_SHUTDOWN_MINUTES:
                shutdown_vm()
                break  # In case shutdown doesn't immediately kill the process

            remaining = config.IDLE_SHUTDOWN_MINUTES - idle_minutes
            print(
                f"[worker] Queue empty. "
                f"Shutdown in {remaining:.1f} min. "
                f"Polling in {config.POLL_INTERVAL_SECONDS}s..."
            )
            time.sleep(config.POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
