from typing import Optional, Tuple

from firebase_admin import firestore

import config


def _claim_delete_job(db, doc_ref) -> Optional[dict]:
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


def get_next_delete_job(db) -> Optional[Tuple[str, dict]]:
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

