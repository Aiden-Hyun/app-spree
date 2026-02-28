"""
Calmdemy Content Factory — Local Worker (modular)

Handles non-cloud jobs (local + API backends) on the Mac:
  - Claims jobs (pre, tts, course, full roles)
  - Runs pipeline stages
  - Processes delete and manual publish requests
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
from pipeline.watchdog import should_run_check, check_stale_jobs
from pipeline.job_run import start_job_run

from worker_claims import get_next_job, parse_tts_models
from worker_publish import get_next_publish_job, claim_publish_job, handle_publish_job
from worker_delete import get_next_delete_job

# Load .env file if present
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

configure_logging()
logger = get_logger(__name__)


def init_firebase():
    """Initialize Firebase Admin SDK."""
    if not firebase_admin._apps:
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
            firebase_admin.initialize_app(options={
                "projectId": config.PROJECT_ID,
                "storageBucket": config.STORAGE_BUCKET,
            })

    return firestore.client()


def main():
    worker_id = os.getenv("WORKER_ID", "local")
    worker_role = os.getenv("WORKER_ROLE", "full").strip().lower()
    if worker_role not in ("pre", "tts", "full", "course"):
        logger.warning(
            "Unknown WORKER_ROLE; defaulting to full",
            extra={"worker_role": worker_role},
        )
        worker_role = "full"
    tts_allowlist = parse_tts_models(os.getenv("WORKER_TTS_MODELS"))

    logger.info("Calmdemy Content Factory — Local Worker (primary)")
    logger.info("Project", extra={"project_id": config.PROJECT_ID})
    if worker_role == "pre":
        logger.info("Handles pre stage (LLM + QA + image)")
    elif worker_role == "course":
        allowlist_text = ", ".join(sorted(tts_allowlist)) if tts_allowlist else "all"
        logger.info("Handles course jobs", extra={"tts_models": allowlist_text})
    elif worker_role == "tts":
        allowlist_text = ", ".join(sorted(tts_allowlist)) if tts_allowlist else "all"
        logger.info("Handles TTS stage", extra={"tts_models": allowlist_text})
    else:
        logger.info("Handles full pipeline (legacy)")
    logger.info("Poll interval", extra={"poll_interval_sec": config.POLL_INTERVAL_SECONDS})
    logger.info("Press Ctrl+C to stop.")

    db = init_firebase()

    while True:
        try:
            update_worker_status(db, worker_id, "local")

            # Watchdog: detect and reset jobs stuck in intermediate statuses.
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
                    claimed = claim_publish_job(db, publish_doc.reference, worker_id)
                    if not claimed:
                        continue
                    run_id = start_job_run(db, pub_id, claimed, worker_id, "publish")
                    claimed = {**claimed, "jobRunId": run_id}
                    logger.info("Publishing approved job", extra={"job_id": pub_id})
                    handle_publish_job(db, pub_id, claimed)
                    continue

            next_job = get_next_job(db, worker_role, tts_allowlist)

            if next_job:
                job_id, job_data = next_job
                run_id = start_job_run(db, job_id, job_data, worker_id, worker_role)
                job_data = {**job_data, "jobRunId": run_id}
                logger.info(
                    "Processing job",
                    extra={
                        "job_id": job_id,
                        "job_run_id": run_id,
                        "worker_role": worker_role,
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

                logger.info("Job finished", extra={"job_id": job_id, "job_run_id": run_id})
            else:
                idle_label = "No pending jobs" if worker_role != "tts" else "No TTS pending jobs"
                logger.debug(
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
