"""
Worker heartbeat helpers.
"""

from firebase_admin import firestore as fs

import config


def update_worker_status(db, worker_id: str, worker_type: str) -> None:
    """Write a heartbeat document for this worker."""
    db.collection("worker_status").document(worker_id).set({
        "workerId": worker_id,
        "workerType": worker_type,
        "lastHeartbeat": fs.SERVER_TIMESTAMP,
        "updatedAt": fs.SERVER_TIMESTAMP,
        "pollIntervalSec": config.POLL_INTERVAL_SECONDS,
    }, merge=True)
