import os
from typing import Tuple, Optional

from firebase_admin import firestore

import config


def is_cloud_job(job_data: dict) -> bool:
    return job_data.get("llmBackend") == "cloud" or job_data.get("ttsBackend") == "cloud"


def is_cloud_tts(job_data: dict) -> bool:
    return job_data.get("ttsBackend") == "cloud"


def parse_tts_models(value: str | None) -> set[str]:
    if not value:
        return set()
    return {item.strip() for item in value.split(",") if item.strip()}


def claim_job(db, doc_ref, role: str, tts_allowlist: set[str]) -> Optional[dict]:
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
        if data.get("engine") == "v2":
            return None
        if role in ("pre", "full", "course"):
            if status != "pending":
                return None
            if is_cloud_job(data):
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
            if is_cloud_tts(data):
                return None
            if tts_allowlist and data.get("ttsModel") not in tts_allowlist:
                return None
            transaction.update(doc_ref, {
                "status": "tts_converting",
                "updatedAt": fs.SERVER_TIMESTAMP,
            })
        return data

    return _tx_claim(transaction)


def get_next_job(db, role: str, tts_allowlist: set[str]) -> Optional[Tuple[str, dict]]:
    """Query Firestore for the next job this worker role should handle."""
    jobs_ref = db.collection(config.JOBS_COLLECTION)

    status_filter = "pending" if role in ("pre", "full") else "tts_pending"
    if role == "course":
        status_filter = "pending"

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
            if data.get("engine") == "v2":
                continue
            if role in ("pre", "full", "course"):
                if is_cloud_job(data):
                    continue
                if role == "course":
                    if data.get("contentType") != "course":
                        continue
                    if tts_allowlist and data.get("ttsModel") not in tts_allowlist:
                        continue
                if role == "pre" and data.get("contentType") == "course":
                    continue
            else:
                if is_cloud_tts(data):
                    continue
                if tts_allowlist and data.get("ttsModel") not in tts_allowlist:
                    continue

            claimed = claim_job(db, doc.reference, role, tts_allowlist)
            if claimed is not None:
                return doc.id, claimed

        last_doc = docs[-1]

    return None
