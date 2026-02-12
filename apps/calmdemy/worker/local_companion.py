"""
Calmdemy Content Factory — Local Companion.

Watches Firestore for admin control commands and starts/stops
local_worker.py accordingly. Run this manually when you want
admin jobs to be processed locally.
"""

import os
import sys
import time
import signal
import subprocess
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore

# Ensure local imports work even when launched outside this folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config  # noqa: E402

# Load .env file if present
try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except ImportError:
    pass

CONTROL_COLLECTION = "worker_control"
CONTROL_DOC_ID = "local"
JOBS_COLLECTION = config.JOBS_COLLECTION
POLL_SECONDS = int(os.getenv("COMPANION_POLL_SECONDS", "8"))
PID_PATH = os.path.join(BASE_DIR, ".local_worker.pid")
LOG_DIR = os.path.join(BASE_DIR, "logs")
LOG_PATH = os.path.join(LOG_DIR, "local_worker.log")

ACTIVE_STATUSES = [
    "llm_generating",
    "qa_formatting",
    "image_generating",
    "tts_converting",
    "post_processing",
    "uploading",
    "publishing",
]


# ==================== FIREBASE INIT ====================


def init_firebase():
    """Initialize Firebase Admin SDK using service account or default creds."""
    if not firebase_admin._apps:
        key_path = os.getenv(
            "GOOGLE_APPLICATION_CREDENTIALS",
            os.path.join(BASE_DIR, "service-account-key.json"),
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


# ==================== PROCESS CONTROL ====================


def _read_pid() -> Optional[int]:
    if not os.path.isfile(PID_PATH):
        return None
    try:
        with open(PID_PATH, "r", encoding="utf-8") as f:
            return int(f.read().strip())
    except Exception:
        return None


def _write_pid(pid: int) -> None:
    with open(PID_PATH, "w", encoding="utf-8") as f:
        f.write(str(pid))


def _clear_pid() -> None:
    if os.path.isfile(PID_PATH):
        try:
            os.remove(PID_PATH)
        except Exception:
            pass


def _pid_is_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def is_worker_running() -> bool:
    pid = _read_pid()
    if not pid:
        return False
    if _pid_is_running(pid):
        return True
    _clear_pid()
    return False


def start_worker() -> int:
    os.makedirs(LOG_DIR, exist_ok=True)
    log_file = open(LOG_PATH, "a", encoding="utf-8")

    worker_path = os.path.join(BASE_DIR, "local_worker.py")
    venv_python = os.path.join(BASE_DIR, ".venv", "bin", "python")
    python_exec = venv_python if os.path.isfile(venv_python) else sys.executable
    process = subprocess.Popen(
        [python_exec, worker_path],
        cwd=BASE_DIR,
        stdout=log_file,
        stderr=subprocess.STDOUT,
    )
    _write_pid(process.pid)
    return process.pid


def stop_worker() -> None:
    pid = _read_pid()
    if not pid:
        return
    try:
        os.kill(pid, signal.SIGTERM)
    except Exception:
        _clear_pid()
        return

    deadline = time.time() + 15
    while time.time() < deadline:
        if not _pid_is_running(pid):
            _clear_pid()
            return
        time.sleep(0.5)

    try:
        os.kill(pid, signal.SIGKILL)
    except Exception:
        pass

    _clear_pid()


# ==================== FIRESTORE HELPERS ====================


def ensure_control_doc(db):
    doc_ref = db.collection(CONTROL_COLLECTION).document(CONTROL_DOC_ID)
    snapshot = doc_ref.get()
    if snapshot.exists:
        return

    doc_ref.set(
        {
            "desiredState": "stopped",
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


def has_pending_jobs(db) -> bool:
    jobs_ref = db.collection(JOBS_COLLECTION)
    q = jobs_ref.where("status", "==", "pending").limit(1)
    return any(q.stream())


def has_active_jobs(db) -> bool:
    jobs_ref = db.collection(JOBS_COLLECTION)
    q = jobs_ref.where("status", "in", ACTIVE_STATUSES).limit(1)
    return any(q.stream())


# ==================== MAIN LOOP ====================


def main() -> None:
    print("=" * 60)
    print("  Calmdemy Content Factory — Local Companion")
    print("=" * 60)
    print(f"  Project:       {config.PROJECT_ID}")
    print(f"  Poll interval: {POLL_SECONDS}s")
    print("=" * 60)
    print()
    print("Press Ctrl+C to stop.")
    print()

    db = init_firebase()
    ensure_control_doc(db)

    last_activity_ts = time.time()

    while True:
        try:
            control = get_control(db)
            desired_state = control.get("desiredState", "stopped")
            idle_timeout_min = int(control.get("idleTimeoutMin", 10))

            pending = has_pending_jobs(db)
            active = has_active_jobs(db)

            if pending or active:
                last_activity_ts = time.time()

            running = is_worker_running()

            if desired_state == "running":
                if not running:
                    update_control(db, {"currentState": "starting", "lastAction": "start"})
                    pid = start_worker()
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
                    update_control(db, {"currentState": "running", "workerPid": _read_pid()})

            elif desired_state == "stopped":
                if running:
                    update_control(db, {"currentState": "stopping", "lastAction": "stop"})
                    stop_worker()
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
                if pending and not running:
                    update_control(db, {"currentState": "starting", "lastAction": "auto-start"})
                    pid = start_worker()
                    update_control(
                        db,
                        {
                            "currentState": "running",
                            "workerPid": pid,
                            "lastAction": "auto-start",
                            "lastError": None,
                        },
                    )
                elif not pending and not active and running:
                    idle_sec = time.time() - last_activity_ts
                    if idle_sec >= idle_timeout_min * 60:
                        update_control(
                            db,
                            {"currentState": "stopping", "lastAction": "auto-stop"},
                        )
                        stop_worker()
                        update_control(
                            db,
                            {
                                "currentState": "stopped",
                                "workerPid": None,
                                "lastAction": "auto-stop",
                                "lastError": None,
                            },
                        )
                elif running:
                    update_control(db, {"currentState": "running", "workerPid": _read_pid()})
                else:
                    update_control(db, {"currentState": "stopped", "workerPid": None})

            time.sleep(POLL_SECONDS)

        except KeyboardInterrupt:
            print("\n[companion] Stopped by user.")
            sys.exit(0)
        except Exception as e:
            update_control(db, {"lastError": f"{type(e).__name__}: {e}"})
            print(f"[companion] Error: {e}")
            time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
