"""
Calmdemy Content Factory — Local Worker (V2 only).

This is the primary worker entrypoint used by the companion.
"""

from __future__ import annotations

import os

import firebase_admin
from firebase_admin import credentials, firestore

import config
from observability import configure_logging, get_logger
from factory_v2.interfaces.worker_main import WorkerMain

logger = get_logger(__name__)


# Load .env file if present
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


def init_firebase():
    if not firebase_admin._apps:
        key_path = os.getenv(
            "GOOGLE_APPLICATION_CREDENTIALS",
            os.path.join(os.path.dirname(__file__), "service-account-key.json"),
        )

        if os.path.isfile(key_path):
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(
                cred,
                options={
                    "projectId": config.PROJECT_ID,
                    "storageBucket": config.STORAGE_BUCKET,
                },
            )
        else:
            firebase_admin.initialize_app(
                options={
                    "projectId": config.PROJECT_ID,
                    "storageBucket": config.STORAGE_BUCKET,
                }
            )

    return firestore.client()


def main() -> None:
    configure_logging()
    worker_id = os.getenv("WORKER_ID", "local-v2")
    poll_seconds = float(os.getenv("V2_POLL_INTERVAL_SECONDS", "1.0"))
    enable_dispatch = os.getenv("V2_ENABLE_DISPATCH", "true").lower() == "true"
    max_step_retries = int(os.getenv("V2_MAX_STEP_RETRIES", "2"))

    db = init_firebase()
    logger.info(
        "Starting Content Factory V2 worker",
        extra={
            "worker_id": worker_id,
            "poll_seconds": poll_seconds,
            "enable_dispatch": enable_dispatch,
            "max_step_retries": max_step_retries,
        },
    )

    runner = WorkerMain(
        db=db,
        worker_id=worker_id,
        poll_seconds=poll_seconds,
        enable_dispatch=enable_dispatch,
        max_step_retries=max_step_retries,
    )
    runner.run_forever()


if __name__ == "__main__":
    main()
