import os
import sys
import time
import random
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
for path in (BASE_DIR, PARENT_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)

import config
from observability import get_logger
from . import stacks
from .log_tailer import LogTailPublisher
from .stack_config import stack_supports_tts_model

logger = get_logger(__name__)

CONTROL_COLLECTION = "worker_control"
CONTROL_DOC_ID = "local"
JOBS_COLLECTION = config.JOBS_COLLECTION
QUEUE_COLLECTION = "factory_step_queue"
SYNTH_STEP_NAMES = {
    "synthesize_audio",
    "synthesize_course_audio",
    "synthesize_course_audio_chunk",
}
AUTO_STACK_QUEUE_SCAN_LIMIT = int(os.getenv("AUTO_STACK_QUEUE_SCAN_LIMIT", "200"))
COMPANION_FACTORY_RECOVERY_INTERVAL_SEC = float(
    os.getenv("COMPANION_FACTORY_RECOVERY_INTERVAL_SEC", "10")
)

ACTIVE_STATUSES = [
    "llm_generating",
    "qa_formatting",
    "image_generating",
    "tts_converting",
    "post_processing",
    "uploading",
    "publishing",
]


def init_firebase():
    """Initialize Firebase Admin SDK using service account or default creds."""
    if not firebase_admin._apps:
        key_path = os.getenv(
            "GOOGLE_APPLICATION_CREDENTIALS",
            os.path.join(os.path.dirname(__file__), "..", "service-account-key.json"),
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


def ensure_control_doc(db):
    doc_ref = db.collection(CONTROL_COLLECTION).document(CONTROL_DOC_ID)
    snapshot = doc_ref.get()
    if snapshot.exists:
        return

    doc_ref.set(
        {
            "desiredState": "auto",
            "idleTimeoutMin": 10,
            "currentState": "stopped",
            "workerPid": None,
            "lastAction": "init",
            "lastError": None,
            "lastChangeAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


def update_control(db, data: dict) -> None:
    db.collection(CONTROL_COLLECTION).document(CONTROL_DOC_ID).set(
        {**data, "lastChangeAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )


def get_control(db) -> dict:
    doc_ref = db.collection(CONTROL_COLLECTION).document(CONTROL_DOC_ID)
    snapshot = doc_ref.get()
    if not snapshot.exists:
        return {}
    return snapshot.to_dict() or {}


def update_stacks_status(db, stack_defs: list[dict], running: dict[str, int]) -> None:
    """Write aggregate status for all stacks (for admin UI)."""
    doc_ref = db.collection("worker_stacks_status").document("local")
    stack_entries = []
    now = datetime.now(timezone.utc)
    for stack_def in stack_defs:
        stack_id = stack_def.get("id")
        stack_entries.append({
            "id": stack_id,
            "role": stack_def.get("role"),
            "venv": stack_def.get("venv"),
            "enabled": bool(stack_def.get("enabled", True)),
            "dispatch": bool(stack_def.get("dispatch", False)),
            "acceptNonTtsSteps": bool(stack_def.get("acceptNonTtsSteps", True)),
            "ttsModels": list(stack_def.get("ttsModels") or []),
            "pid": running.get(stack_id),
            "logPath": stacks.log_path(stack_id),
            "lastUpdatedAt": now,
        })
    doc_ref.set(
        {
            "stacks": stack_entries,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


def has_pending_jobs(db) -> bool:
    jobs_ref = db.collection(JOBS_COLLECTION)
    q = jobs_ref.where("status", "in", ["pending", "publishing"]).limit(1)
    return any(q.stream())


def has_delete_requested_jobs(db) -> bool:
    jobs_ref = db.collection(JOBS_COLLECTION)
    q = jobs_ref.where("deleteRequested", "==", True).limit(1)
    return any(q.stream())


def _load_queue_payloads(db, limit: int = AUTO_STACK_QUEUE_SCAN_LIMIT) -> list[dict]:
    now = datetime.now(timezone.utc)
    payloads: list[dict] = []

    ready_query = (
        db.collection(QUEUE_COLLECTION)
        .where("state", "==", "ready")
        .where("available_at", "<=", now)
        .order_by("available_at")
        .limit(limit)
    )
    leased_query = db.collection(QUEUE_COLLECTION).where("state", "==", "leased").limit(limit)
    running_query = db.collection(QUEUE_COLLECTION).where("state", "==", "running").limit(limit)

    for query in (ready_query, leased_query, running_query):
        for doc in query.stream():
            payload = doc.to_dict() or {}
            if payload:
                payloads.append(payload)

    return payloads


def _collect_auto_workload(db) -> dict:
    queue_payloads = _load_queue_payloads(db)
    tts_outstanding: dict[str, int] = defaultdict(int)
    wildcard_tts_outstanding = 0
    non_tts_outstanding = 0
    active_owners: set[str] = set()

    for payload in queue_payloads:
        state = str(payload.get("state") or "").strip().lower()
        lease_owner = str(payload.get("lease_owner") or "").strip()
        if state in {"leased", "running"} and lease_owner:
            active_owners.add(lease_owner)

        step_name = str(payload.get("step_name") or "").strip()
        if step_name not in SYNTH_STEP_NAMES:
            non_tts_outstanding += 1
            continue

        model = str(payload.get("required_tts_model") or "").strip().lower()
        if model:
            tts_outstanding[model] += 1
        else:
            wildcard_tts_outstanding += 1

    pending_jobs = has_pending_jobs(db)
    delete_jobs = has_delete_requested_jobs(db)

    return {
        "pending_jobs": pending_jobs,
        "delete_jobs": delete_jobs,
        "non_tts_outstanding": non_tts_outstanding,
        "tts_outstanding": dict(tts_outstanding),
        "wildcard_tts_outstanding": wildcard_tts_outstanding,
        "active_owners": active_owners,
        "has_any_work": (
            pending_jobs
            or delete_jobs
            or non_tts_outstanding > 0
            or wildcard_tts_outstanding > 0
            or any(tts_outstanding.values())
        ),
    }


def _ordered_candidate_ids(
    candidate_stacks: list[dict],
    running_ids: set[str],
    active_owners: set[str],
) -> list[str]:
    active = [stack["id"] for stack in candidate_stacks if stack["id"] in active_owners]
    warm = [
        stack["id"]
        for stack in candidate_stacks
        if stack["id"] in running_ids and stack["id"] not in active_owners
    ]
    cold = [stack["id"] for stack in candidate_stacks if stack["id"] not in running_ids]
    return active + warm + cold


def _pick_stack_ids(
    candidate_stacks: list[dict],
    needed_count: int,
    running_ids: set[str],
    active_owners: set[str],
    selected_ids: set[str],
) -> list[str]:
    if needed_count <= 0 or not candidate_stacks:
        return []

    ordered_ids = _ordered_candidate_ids(candidate_stacks, running_ids, active_owners)
    fresh = [stack_id for stack_id in ordered_ids if stack_id not in selected_ids]
    reused = [stack_id for stack_id in ordered_ids if stack_id in selected_ids]
    return (fresh + reused)[:needed_count]


def _desired_auto_stack_ids(
    db,
    enabled_stacks: list[dict],
    running: dict[str, int],
) -> tuple[set[str], dict]:
    workload = _collect_auto_workload(db)
    running_ids = set(running.keys())
    active_owners = workload["active_owners"]
    desired_ids: set[str] = set()

    if (
        workload["pending_jobs"]
        or workload["delete_jobs"]
        or workload["non_tts_outstanding"] > 0
    ):
        non_tts_candidates = [stack for stack in enabled_stacks if stack.get("acceptNonTtsSteps", True)]
        desired_ids.update(
            _pick_stack_ids(
                non_tts_candidates,
                needed_count=min(1, len(non_tts_candidates)),
                running_ids=running_ids,
                active_owners=active_owners,
                selected_ids=desired_ids,
            )
        )

    for model_id, outstanding_count in sorted(workload["tts_outstanding"].items()):
        tts_candidates = [
            stack for stack in enabled_stacks if stack_supports_tts_model(stack, model_id)
        ]
        desired_ids.update(
            _pick_stack_ids(
                tts_candidates,
                needed_count=min(outstanding_count, len(tts_candidates)),
                running_ids=running_ids,
                active_owners=active_owners,
                selected_ids=desired_ids,
            )
        )

    wildcard_tts_outstanding = workload["wildcard_tts_outstanding"]
    if wildcard_tts_outstanding > 0:
        wildcard_candidates = [
            stack
            for stack in enabled_stacks
            if stack.get("ttsModels") or stack.get("acceptNonTtsSteps", True)
        ]
        desired_ids.update(
            _pick_stack_ids(
                wildcard_candidates,
                needed_count=min(wildcard_tts_outstanding, len(wildcard_candidates)),
                running_ids=running_ids,
                active_owners=active_owners,
                selected_ids=desired_ids,
            )
        )

    return desired_ids, workload


def _normalize_desired_state(db, control: dict) -> str:
    desired_state = str(control.get("desiredState") or "stopped").strip().lower() or "stopped"
    requested_by = str(control.get("requestedBy") or "").strip().lower()

    if desired_state == "running" and requested_by == "wake-dispatcher":
        update_control(
            db,
            {
                "desiredState": "auto",
                "lastAction": "wake-dispatcher",
                "requestedBy": "wake-dispatcher",
            },
        )
        return "auto"

    return desired_state


def _recover_running_course_pipeline_gaps(db) -> dict[str, int]:
    from factory_v2.application.orchestrator import Orchestrator
    from factory_v2.infrastructure.firestore_repos import (
        FirestoreJobRepo,
        FirestoreRunRepo,
        FirestoreStepRunRepo,
    )
    from factory_v2.infrastructure.queue_repo import FirestoreQueueRepo

    run_repo = FirestoreRunRepo(db)
    orchestrator = Orchestrator(
        FirestoreJobRepo(db),
        run_repo,
        FirestoreStepRunRepo(db),
        FirestoreQueueRepo(db),
    )

    recovered = {
        "fan_out": 0,
        "fan_in": 0,
        "upload": 0,
        "publish": 0,
    }
    query = db.collection("factory_jobs").where("current_state", "==", "running").limit(50)
    for doc in query.stream():
        data = doc.to_dict() or {}
        if str(data.get("job_type") or "").strip().lower() != "course":
            continue

        run_id = str(data.get("current_run_id") or "").strip()
        if not run_id:
            continue
        if run_repo.run_state(run_id) != "running":
            continue

        recovered["fan_out"] += orchestrator.recover_course_audio_fan_out_if_ready(doc.id, run_id)
        recovered["fan_in"] += orchestrator.recover_course_audio_fan_in_if_ready(doc.id, run_id)
        if orchestrator.recover_course_upload_if_ready(doc.id, run_id):
            recovered["upload"] += 1
        if orchestrator.recover_course_publish_if_ready(doc.id, run_id):
            recovered["publish"] += 1

    return recovered


def ensure_running_wrapper(db, force_immediate_start: bool):
    control = get_control(db)
    current_desired = _normalize_desired_state(db, control)
    next_desired = "running" if current_desired == "running" else "auto"

    update_control(
        db,
        {
            "desiredState": next_desired,
            "lastAction": "wake-dispatcher",
            "requestedBy": "wake-dispatcher",
        },
    )

    if not force_immediate_start:
        return

    stack_defs = stacks.load_worker_stacks()
    enabled_stacks = [stack for stack in stack_defs if stack.get("enabled", True)]
    running = stacks.running_stack_pids(stack_defs)

    if next_desired == "running":
        desired_ids = {stack["id"] for stack in enabled_stacks}
    else:
        desired_ids, _ = _desired_auto_stack_ids(db, enabled_stacks, running)

    for stack in enabled_stacks:
        stack_id = stack["id"]
        if stack_id in desired_ids and stack_id not in running:
            running[stack_id] = stacks.start_worker(stack)

    running_after = {stack_id: pid for stack_id, pid in running.items() if stack_id in desired_ids}
    update_control(
        db,
        {
            "currentState": "running" if running_after else "stopped",
            "workerPid": stacks.primary_pid(enabled_stacks, running_after) if running_after else None,
            "lastAction": "wake-dispatcher",
            "lastError": None,
        },
    )
    logger.info(
        "Wake ensure_running applied",
        extra={
            "desired_state": next_desired,
            "desired_stacks": sorted(desired_ids),
            "running": sorted(running_after.keys()),
        },
    )


def run_control_loop(db, poll_seconds: float, force_immediate_start: bool):
    last_activity_ts = time.time()
    last_factory_recovery_ts = 0.0
    log_tail_enabled = os.getenv("ENABLE_ADMIN_LOG_TAIL", "true").lower() == "true"
    log_tailer = None
    if log_tail_enabled:
        log_tailer = LogTailPublisher(
            db,
            max_lines=int(os.getenv("ADMIN_LOG_TAIL_MAX_LINES", "120")),
            max_line_chars=int(os.getenv("ADMIN_LOG_TAIL_MAX_LINE_CHARS", "500")),
            min_level=os.getenv("ADMIN_LOG_MIN_LEVEL", "INFO"),
            interval_sec=float(os.getenv("ADMIN_LOG_TAIL_INTERVAL_SEC", "2")),
        )

    while True:
        try:
            control = get_control(db)
            desired_state = _normalize_desired_state(db, control)
            idle_timeout_min = int(control.get("idleTimeoutMin", 10))

            now_ts = time.time()
            if (
                desired_state != "stopped"
                and now_ts - last_factory_recovery_ts >= COMPANION_FACTORY_RECOVERY_INTERVAL_SEC
            ):
                last_factory_recovery_ts = now_ts
                recovered = _recover_running_course_pipeline_gaps(db)
                if any(recovered.values()):
                    logger.info(
                        "Companion recovered factory pipeline gaps",
                        extra=recovered,
                    )

            stack_defs = stacks.load_worker_stacks()
            enabled_stacks = [s for s in stack_defs if s.get("enabled", True)]
            running = stacks.running_stack_pids(stack_defs)
            try:
                update_stacks_status(db, stack_defs, running)
            except Exception as e:
                logger.warning("Failed to update stacks status", extra={"error": str(e)})
            if log_tailer:
                try:
                    stack_logs = [
                        {**stack_def, "logPath": stacks.log_path(stack_def["id"])}
                        for stack_def in stack_defs
                    ]
                    log_tailer.publish(stack_logs, running)
                except Exception as e:
                    logger.warning("Failed to publish log tails", extra={"error": str(e)})

            # Stop any disabled stacks that are still running
            for stack_def in stack_defs:
                if not stack_def.get("enabled", True) and stack_def["id"] in running:
                    stacks.stop_worker(stack_def["id"])
                    running.pop(stack_def["id"], None)

            auto_desired_ids: set[str] = set()
            workload: dict | None = None
            if desired_state == "auto":
                auto_desired_ids, workload = _desired_auto_stack_ids(db, enabled_stacks, running)

            if workload and workload.get("has_any_work"):
                last_activity_ts = time.time()

            any_running = any(stack_def["id"] in running for stack_def in enabled_stacks)

            if desired_state == "running":
                if not any_running:
                    update_control(db, {"currentState": "starting", "lastAction": "start"})
                    for stack_def in enabled_stacks:
                        if stack_def["id"] not in running:
                            running[stack_def["id"]] = stacks.start_worker(stack_def)
                    pid = stacks.primary_pid(enabled_stacks, running)
                    update_control(
                        db,
                        {
                            "currentState": "running",
                            "workerPid": pid,
                            "lastAction": "start",
                            "lastError": None,
                        },
                    )
                else:
                    for stack_def in enabled_stacks:
                        if stack_def["id"] not in running:
                            running[stack_def["id"]] = stacks.start_worker(stack_def)
                    update_control(
                        db,
                        {
                            "currentState": "running",
                            "workerPid": stacks.primary_pid(enabled_stacks, running),
                        },
                    )

            elif desired_state == "stopped":
                if any_running:
                    update_control(db, {"currentState": "stopping", "lastAction": "stop"})
                    for stack_id in list(running.keys()):
                        stacks.stop_worker(stack_id)
                    running.clear()
                    update_control(
                        db,
                        {
                            "currentState": "stopped",
                            "workerPid": None,
                            "lastAction": "stop",
                            "lastError": None,
                        },
                    )
                else:
                    update_control(db, {"currentState": "stopped", "workerPid": None})

            else:
                # Auto mode
                if auto_desired_ids:
                    missing_auto_stacks = [
                        stack_def
                        for stack_def in enabled_stacks
                        if stack_def["id"] in auto_desired_ids and stack_def["id"] not in running
                    ]
                    if missing_auto_stacks:
                        update_control(
                            db,
                            {"currentState": "starting", "lastAction": "auto-start"},
                        )
                        for stack_def in missing_auto_stacks:
                            running[stack_def["id"]] = stacks.start_worker(stack_def)

                    stopped_auto_stacks = False
                    for stack_id in list(running.keys()):
                        if stack_id in auto_desired_ids:
                            continue
                        stacks.stop_worker(stack_id)
                        running.pop(stack_id, None)
                        stopped_auto_stacks = True

                    update_payload = {
                        "currentState": "running" if running else "stopped",
                        "workerPid": stacks.primary_pid(enabled_stacks, running) if running else None,
                        "lastError": None,
                    }
                    if missing_auto_stacks:
                        update_payload["lastAction"] = "auto-start"
                    elif stopped_auto_stacks:
                        update_payload["lastAction"] = "auto-scale-down"

                    update_control(db, update_payload)
                elif any_running:
                    idle_sec = time.time() - last_activity_ts
                    if idle_sec >= idle_timeout_min * 60:
                        update_control(
                            db,
                            {"currentState": "stopping", "lastAction": "auto-stop"},
                        )
                        for stack_id in list(running.keys()):
                            stacks.stop_worker(stack_id)
                        running.clear()
                        update_control(
                            db,
                            {
                                "currentState": "stopped",
                                "workerPid": None,
                                "lastAction": "auto-stop",
                                "lastError": None,
                            },
                        )
                elif any_running:
                    update_control(
                        db,
                        {
                            "currentState": "running",
                            "workerPid": stacks.primary_pid(enabled_stacks, running),
                        },
                    )
                else:
                    update_control(db, {"currentState": "stopped", "workerPid": None})

            jitter = random.uniform(-0.3, 0.3)
            time.sleep(max(0.5, poll_seconds + jitter))

        except KeyboardInterrupt:
            logger.info("Stopped by user")
            raise
        except Exception as e:
            update_control(db, {"lastError": f"{type(e).__name__}: {e}"})
            logger.exception("Companion error", extra={"error": str(e)})
            jitter = random.uniform(-0.3, 0.3)
            time.sleep(max(0.5, poll_seconds + jitter))
