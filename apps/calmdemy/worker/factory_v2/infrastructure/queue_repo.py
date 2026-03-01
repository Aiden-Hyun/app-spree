from __future__ import annotations

from datetime import datetime, timezone

from google.api_core.exceptions import AlreadyExists
from firebase_admin import firestore as fs


class FirestoreQueueRepo:
    def __init__(self, db):
        self.db = db

    @staticmethod
    def make_queue_id(run_id: str, step_name: str, shard_key: str = "root") -> str:
        return f"{run_id}__{step_name}__{shard_key}"

    def enqueue(
        self,
        job_id: str,
        run_id: str,
        step_name: str,
        step_run_id: str,
        shard_key: str = "root",
        available_at: datetime | None = None,
    ) -> str:
        queue_id = self.make_queue_id(run_id, step_name, shard_key)
        doc_ref = self.db.collection("factory_step_queue").document(queue_id)
        payload = {
            "job_id": job_id,
            "run_id": run_id,
            "step_name": step_name,
            "step_run_id": step_run_id,
            "shard_key": shard_key,
            "state": "ready",
            "available_at": available_at or datetime.now(timezone.utc),
            "retry_count": 0,
            "created_at": fs.SERVER_TIMESTAMP,
            "updated_at": fs.SERVER_TIMESTAMP,
        }
        try:
            doc_ref.create(payload)
        except AlreadyExists:
            # Enqueue is idempotent for the same run/step/shard key.
            pass
        return queue_id

    def claim_next(self, worker_id: str, lease_seconds: int = 300) -> tuple[str, dict] | None:
        now = datetime.now(timezone.utc)
        query = (
            self.db.collection("factory_step_queue")
            .where("state", "==", "ready")
            .where("available_at", "<=", now)
            .order_by("available_at")
            .limit(20)
        )

        docs = list(query.stream())
        for doc in docs:
            tx = self.db.transaction()

            @fs.transactional
            def _claim(transaction):
                snap = doc.reference.get(transaction=transaction)
                if not snap.exists:
                    return None
                data = snap.to_dict() or {}
                if data.get("state") != "ready":
                    return None
                transaction.update(
                    doc.reference,
                    {
                        "state": "leased",
                        "lease_owner": worker_id,
                        "lease_expires_at": datetime.fromtimestamp(
                            now.timestamp() + lease_seconds,
                            tz=timezone.utc,
                        ),
                        "updated_at": fs.SERVER_TIMESTAMP,
                    },
                )
                return data

            claimed = _claim(tx)
            if claimed is not None:
                return doc.id, claimed

        return None

    def recover_stale_leases(self, max_docs: int = 50) -> int:
        """Reset expired leased/running queue items back to ready."""
        now = datetime.now(timezone.utc)
        recovered = 0

        for state in ("leased", "running"):
            query = (
                self.db.collection("factory_step_queue")
                .where("state", "==", state)
                .where("lease_expires_at", "<=", now)
                .limit(max_docs)
            )
            for doc in query.stream():
                tx = self.db.transaction()

                @fs.transactional
                def _recover(transaction):
                    snap = doc.reference.get(transaction=transaction)
                    if not snap.exists:
                        return False
                    data = snap.to_dict() or {}
                    live_state = str(data.get("state") or "")
                    if live_state not in ("leased", "running"):
                        return False

                    lease_expires_at = data.get("lease_expires_at")
                    if lease_expires_at is None:
                        return False

                    lease_ts = (
                        datetime.fromtimestamp(lease_expires_at.timestamp(), tz=timezone.utc)
                        if hasattr(lease_expires_at, "timestamp")
                        else lease_expires_at
                    )
                    if isinstance(lease_ts, datetime) and lease_ts.tzinfo is None:
                        lease_ts = lease_ts.replace(tzinfo=timezone.utc)
                    if not isinstance(lease_ts, datetime) or lease_ts > now:
                        return False

                    transaction.update(
                        doc.reference,
                        {
                            "state": "ready",
                            "lease_owner": None,
                            "lease_expires_at": None,
                            "available_at": now,
                            "updated_at": fs.SERVER_TIMESTAMP,
                        },
                    )
                    return True

                if _recover(tx):
                    recovered += 1

        return recovered

    def mark_running(self, queue_id: str, worker_id: str) -> None:
        self.db.collection("factory_step_queue").document(queue_id).update(
            {
                "state": "running",
                "lease_owner": worker_id,
                "updated_at": fs.SERVER_TIMESTAMP,
            }
        )

    def mark_done(self, queue_id: str) -> None:
        self.db.collection("factory_step_queue").document(queue_id).update(
            {
                "state": "succeeded",
                "lease_owner": None,
                "lease_expires_at": None,
                "updated_at": fs.SERVER_TIMESTAMP,
            }
        )

    def mark_failed(self, queue_id: str, error_code: str, error_message: str) -> None:
        self.db.collection("factory_step_queue").document(queue_id).update(
            {
                "state": "failed",
                "error_code": error_code,
                "error_message": error_message,
                "lease_owner": None,
                "lease_expires_at": None,
                "updated_at": fs.SERVER_TIMESTAMP,
            }
        )

    def schedule_retry(
        self,
        queue_id: str,
        error_code: str,
        error_message: str,
        delay_seconds: int,
    ) -> None:
        available_at = datetime.fromtimestamp(
            datetime.now(timezone.utc).timestamp() + max(1, delay_seconds),
            tz=timezone.utc,
        )
        self.db.collection("factory_step_queue").document(queue_id).update(
            {
                "state": "ready",
                "error_code": error_code,
                "error_message": error_message,
                "retry_count": fs.Increment(1),
                "available_at": available_at,
                "lease_owner": None,
                "lease_expires_at": None,
                "updated_at": fs.SERVER_TIMESTAMP,
            }
        )
