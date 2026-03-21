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

    def state(self, run_id: str, step_name: str, shard_key: str = "root") -> str | None:
        snap = self.db.collection("factory_step_queue").document(
            self.make_queue_id(run_id, step_name, shard_key)
        ).get()
        if not snap.exists:
            return None
        data = snap.to_dict() or {}
        state = str(data.get("state") or "").strip()
        return state or None

    def enqueue(
        self,
        job_id: str,
        run_id: str,
        step_name: str,
        step_run_id: str,
        shard_key: str = "root",
        step_input: dict | None = None,
        available_at: datetime | None = None,
        required_tts_model: str | None = None,
    ) -> str:
        queue_id = self.make_queue_id(run_id, step_name, shard_key)
        doc_ref = self.db.collection("factory_step_queue").document(queue_id)
        payload = {
            "job_id": job_id,
            "run_id": run_id,
            "step_name": step_name,
            "step_run_id": step_run_id,
            "shard_key": shard_key,
            "step_input": dict(step_input or {}),
            "state": "ready",
            "available_at": available_at or datetime.now(timezone.utc),
            "retry_count": 0,
            "created_at": fs.SERVER_TIMESTAMP,
            "updated_at": fs.SERVER_TIMESTAMP,
        }
        if required_tts_model:
            payload["required_tts_model"] = str(required_tts_model).strip().lower()
        try:
            doc_ref.create(payload)
        except AlreadyExists:
            # Enqueue is idempotent for the same run/step/shard key.
            pass
        return queue_id

    @staticmethod
    def _supports_payload(
        payload: dict,
        accept_non_tts_steps: bool,
        supported_tts_models: set[str] | None,
    ) -> bool:
        step_name = str(payload.get("step_name") or "")
        is_tts_step = step_name in {
            "synthesize_audio",
            "synthesize_course_audio",
            "synthesize_course_audio_chunk",
        }
        if not is_tts_step:
            return accept_non_tts_steps

        required_tts_model = str(payload.get("required_tts_model") or "").strip().lower()
        if not required_tts_model:
            return True
        if supported_tts_models is None:
            return True
        return required_tts_model in supported_tts_models

    def claim_next(
        self,
        worker_id: str,
        lease_seconds: int = 300,
        accept_non_tts_steps: bool = True,
        supported_tts_models: set[str] | None = None,
    ) -> tuple[str, dict] | None:
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
            doc_payload = doc.to_dict() or {}
            if not self._supports_payload(
                doc_payload,
                accept_non_tts_steps=accept_non_tts_steps,
                supported_tts_models=supported_tts_models,
            ):
                continue
            tx = self.db.transaction()

            @fs.transactional
            def _claim(transaction):
                snap = doc.reference.get(transaction=transaction)
                if not snap.exists:
                    return None
                data = snap.to_dict() or {}
                if data.get("state") != "ready":
                    return None
                if not self._supports_payload(
                    data,
                    accept_non_tts_steps=accept_non_tts_steps,
                    supported_tts_models=supported_tts_models,
                ):
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
                "error_code": None,
                "error_message": None,
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

    def cancel_ready_for_run(
        self,
        run_id: str,
        step_name: str | None = None,
        error_code: str = "run_failed",
        error_message: str = "Run failed; pending work cancelled.",
    ) -> int:
        """
        Cancel queued work for a run that should no longer continue.

        Only READY/LEASED items are cancelled; RUNNING items are handled by run-state guards.
        """
        query = self.db.collection("factory_step_queue").where("run_id", "==", run_id)
        if step_name:
            query = query.where("step_name", "==", step_name)
        docs = list(query.stream())

        cancelled = 0
        for doc in docs:
            tx = self.db.transaction()

            @fs.transactional
            def _cancel(transaction):
                snap = doc.reference.get(transaction=transaction)
                if not snap.exists:
                    return False
                data = snap.to_dict() or {}
                state = str(data.get("state") or "")
                if state not in {"ready", "leased"}:
                    return False
                if str(data.get("run_id") or "") != run_id:
                    return False
                if step_name and str(data.get("step_name") or "") != step_name:
                    return False

                transaction.update(
                    doc.reference,
                    {
                        "state": "failed",
                        "error_code": error_code,
                        "error_message": error_message,
                        "lease_owner": None,
                        "lease_expires_at": None,
                        "updated_at": fs.SERVER_TIMESTAMP,
                    },
                )
                return True

            if _cancel(tx):
                cancelled += 1

        return cancelled
