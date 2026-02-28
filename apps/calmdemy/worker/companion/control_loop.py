import os
import sys
import time
import random
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

logger = get_logger(__name__)

CONTROL_COLLECTION = "worker_control"
CONTROL_DOC_ID = "local"
JOBS_COLLECTION = config.JOBS_COLLECTION

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
            "desiredState": "running",
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
    for stack_def in stack_defs:
        stack_id = stack_def.get("id")
        stack_entries.append({
            "id": stack_id,
            "role": stack_def.get("role"),
            "venv": stack_def.get("venv"),
            "enabled": bool(stack_def.get("enabled", True)),
            "pid": running.get(stack_id),
            "logPath": stacks.log_path(stack_id),
            "lastUpdatedAt": firestore.SERVER_TIMESTAMP,
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
    q = jobs_ref.where("status", "in", ["pending", "tts_pending"]).limit(1)
    return any(q.stream())


def has_active_jobs(db) -> bool:
    jobs_ref = db.collection(JOBS_COLLECTION)
    q = jobs_ref.where("status", "in", ACTIVE_STATUSES).limit(1)
    return any(q.stream())


def ensure_running_wrapper(db, force_immediate_start: bool):
    stacks.ensure_running(db, lambda data: update_control(db, data), force_immediate_start)


def run_control_loop(db, poll_seconds: float, force_immediate_start: bool):
    last_activity_ts = time.time()
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
            desired_state = control.get("desiredState", "stopped")
            idle_timeout_min = int(control.get("idleTimeoutMin", 10))

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

            pending = has_pending_jobs(db)
            active = has_active_jobs(db)

            if pending or active:
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
                if pending or active:
                    missing_stack = any(
                        stack_def["id"] not in running for stack_def in enabled_stacks
                    )
                    if missing_stack:
                        update_control(db, {"currentState": "starting", "lastAction": "auto-start"})
                        for stack_def in enabled_stacks:
                            if stack_def["id"] not in running:
                                running[stack_def["id"]] = stacks.start_worker(stack_def)
                        pid = stacks.primary_pid(enabled_stacks, running)
                        update_control(
                            db,
                            {
                                "currentState": "running",
                                "workerPid": pid,
                                "lastAction": "auto-start",
                                "lastError": None,
                            },
                        )
                    else:
                        update_control(
                            db,
                            {
                                "currentState": "running",
                                "workerPid": stacks.primary_pid(enabled_stacks, running),
                            },
                        )
                elif not pending and not active and any_running:
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
