"""
Calmdemy Content Factory — Local Companion.

Watches Firestore for admin control commands and starts/stops
local_worker.py accordingly. Run this manually when you want
admin jobs to be processed locally.
"""

import json
import os
import sys
import time
import random
import signal
import subprocess
import hmac
import hashlib
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore

# Ensure local imports work even when launched outside this folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config  # noqa: E402
from observability import configure_logging, get_logger  # noqa: E402

# Load .env file if present
try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except ImportError:
    pass

configure_logging()
logger = get_logger(__name__)

CONTROL_COLLECTION = "worker_control"
CONTROL_DOC_ID = "local"
JOBS_COLLECTION = config.JOBS_COLLECTION
POLL_SECONDS = int(os.getenv("COMPANION_POLL_SECONDS", "2"))
LOG_DIR = os.path.join(BASE_DIR, "logs")
STACKS_PATH = os.path.join(BASE_DIR, "worker_stacks.json")
ENABLE_WAKE_SERVER = os.getenv("ENABLE_WAKE_SERVER", "false").lower() == "true"
WAKE_SHARED_SECRET = os.getenv("WAKE_SHARED_SECRET", "")
WAKE_SERVER_PORT = int(os.getenv("WAKE_SERVER_PORT", "8787"))
FORCE_IMMEDIATE_START = os.getenv("FORCE_IMMEDIATE_START", "true").lower() == "true"
WAKE_DEDUP_WINDOW_SEC = int(os.getenv("WAKE_DEDUP_WINDOW_SEC", "300"))

ACTIVE_STATUSES = [
    "llm_generating",
    "qa_formatting",
    "image_generating",
    "tts_converting",
    "post_processing",
    "uploading",
    "publishing",
]

RECENT_WAKES: dict[str, float] = {}
RECENT_WAKES_LOCK = threading.Lock()


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


def load_worker_stacks() -> list[dict]:
    """Load worker stack definitions from JSON (or fall back to defaults)."""
    if not os.path.isfile(STACKS_PATH):
        return [
            {"id": "local", "role": "pre", "venv": ".venv", "enabled": True},
            {
                "id": "local-tts-default",
                "role": "tts",
                "venv": ".venv",
                "ttsModels": [
                    "piper",
                    "styletts2",
                    "gemini-tts-flash",
                    "gemini-tts-pro",
                ],
                "enabled": True,
            },
            {
                "id": "local-tts-dms",
                "role": "tts",
                "venv": ".venv-dms",
                "ttsModels": ["dms"],
                "enabled": True,
            },
            {
                "id": "local-course-default",
                "role": "course",
                "venv": ".venv",
                "ttsModels": [
                    "piper",
                    "styletts2",
                    "gemini-tts-flash",
                    "gemini-tts-pro",
                ],
                "enabled": True,
            },
            {
                "id": "local-course-dms",
                "role": "course",
                "venv": ".venv-dms",
                "ttsModels": ["dms"],
                "enabled": True,
            },
        ]

    with open(STACKS_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)

    stacks = raw if isinstance(raw, list) else []
    normalized = []
    for idx, stack in enumerate(stacks):
        if not isinstance(stack, dict):
            continue
        stack_id = stack.get("id") or f"local-stack-{idx}"
        tts_models = stack.get("ttsModels", [])
        if isinstance(tts_models, str):
            tts_models = [tts_models]
        normalized.append({
            "id": stack_id,
            "role": str(stack.get("role", "full")).lower(),
            "venv": stack.get("venv", ".venv"),
            "ttsModels": tts_models,
            "enabled": stack.get("enabled", True),
        })
    return normalized


def _sanitize_stack_id(stack_id: str) -> str:
    return "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in stack_id)


def _pid_path(stack_id: str) -> str:
    safe_id = _sanitize_stack_id(stack_id)
    return os.path.join(BASE_DIR, f".local_worker_{safe_id}.pid")


def _log_path(stack_id: str) -> str:
    safe_id = _sanitize_stack_id(stack_id)
    return os.path.join(LOG_DIR, f"local_worker_{safe_id}.log")


def _read_pid(stack_id: str) -> Optional[int]:
    pid_path = _pid_path(stack_id)
    if not os.path.isfile(pid_path):
        return None
    try:
        with open(pid_path, "r", encoding="utf-8") as f:
            return int(f.read().strip())
    except Exception:
        return None


def _write_pid(stack_id: str, pid: int) -> None:
    pid_path = _pid_path(stack_id)
    with open(pid_path, "w", encoding="utf-8") as f:
        f.write(str(pid))


def _clear_pid(stack_id: str) -> None:
    pid_path = _pid_path(stack_id)
    if os.path.isfile(pid_path):
        try:
            os.remove(pid_path)
        except Exception:
            pass


def _pid_is_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def is_worker_running(stack_id: str) -> bool:
    pid = _read_pid(stack_id)
    if not pid:
        return False
    if _pid_is_running(pid):
        return True
    _clear_pid(stack_id)
    return False


def start_worker(stack: dict) -> int:
    os.makedirs(LOG_DIR, exist_ok=True)
    stack_id = stack["id"]
    log_file = open(_log_path(stack_id), "a", encoding="utf-8")

    worker_path = os.path.join(BASE_DIR, "local_worker.py")
    venv_path = stack.get("venv", ".venv")
    if not os.path.isabs(venv_path):
        venv_path = os.path.join(BASE_DIR, venv_path)
    venv_python = os.path.join(venv_path, "bin", "python")
    python_exec = venv_python if os.path.isfile(venv_python) else sys.executable

    env = os.environ.copy()
    env["WORKER_ID"] = stack_id
    env["WORKER_ROLE"] = str(stack.get("role", "full")).lower()
    tts_models = stack.get("ttsModels") or []
    if tts_models:
        env["WORKER_TTS_MODELS"] = ",".join(tts_models)
    env.setdefault("PYTHONUNBUFFERED", "1")

    process = subprocess.Popen(
        [python_exec, worker_path],
        cwd=BASE_DIR,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        env=env,
    )
    _write_pid(stack_id, process.pid)
    return process.pid


def stop_worker(stack_id: str) -> None:
    pid = _read_pid(stack_id)
    if not pid:
        return
    try:
        os.kill(pid, signal.SIGTERM)
    except Exception:
        _clear_pid(stack_id)
        return

    deadline = time.time() + 15
    while time.time() < deadline:
        if not _pid_is_running(pid):
            _clear_pid(stack_id)
            return
        time.sleep(0.5)

    try:
        os.kill(pid, signal.SIGKILL)
    except Exception:
        pass

    _clear_pid(stack_id)


def _running_stack_pids(stacks: list[dict]) -> dict[str, int]:
    running = {}
    for stack in stacks:
        stack_id = stack["id"]
        pid = _read_pid(stack_id)
        if pid and _pid_is_running(pid):
            running[stack_id] = pid
        elif pid:
            _clear_pid(stack_id)
    return running


def _primary_pid(stacks: list[dict], running: dict[str, int]) -> Optional[int]:
    for stack in stacks:
        if stack.get("role") == "pre" and stack["id"] in running:
            return running[stack["id"]]
    if "local" in running:
        return running["local"]
    for pid in running.values():
        return pid
    return None


# ==================== FIRESTORE HELPERS ====================


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


def update_stacks_status(db, stacks: list[dict], running: dict[str, int]) -> None:
    """Write aggregate status for all stacks (for admin UI)."""
    doc_ref = db.collection("worker_stacks_status").document("local")
    stack_entries = []
    for stack in stacks:
        stack_id = stack.get("id")
        stack_entries.append({
            "id": stack_id,
            "role": stack.get("role"),
            "venv": stack.get("venv"),
            "enabled": bool(stack.get("enabled", True)),
            "pid": running.get(stack_id),
            "logPath": _log_path(stack_id),
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


def _is_duplicate_wake(job_id: str) -> bool:
    now = time.time()
    with RECENT_WAKES_LOCK:
        # prune old
        expired = [jid for jid, ts in RECENT_WAKES.items() if now - ts > WAKE_DEDUP_WINDOW_SEC]
        for jid in expired:
            RECENT_WAKES.pop(jid, None)
        last = RECENT_WAKES.get(job_id)
        if last and now - last < WAKE_DEDUP_WINDOW_SEC:
            return True
        RECENT_WAKES[job_id] = now
    return False


def _make_wake_handler(db):
    class WakeHandler(BaseHTTPRequestHandler):
        server_version = "CalmdemyWake/1.0"

        def _send(self, code: int, payload: dict):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):
            # Suppress default noisy logging; we use structured logger instead.
            return

        def do_GET(self):
            if self.path.startswith("/wake/health"):
                self._send(200, {"ok": True})
            else:
                self._send(404, {"error": "not found"})

        def do_POST(self):
            if self.path != "/wake":
                self._send(404, {"error": "not found"})
                return

            if not WAKE_SHARED_SECRET:
                logger.warning("Wake server missing secret; rejecting request")
                self._send(503, {"error": "wake secret not configured"})
                return

            sig = self.headers.get("X-Wake-Signature", "")
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)

            expected = hmac.new(
                WAKE_SHARED_SECRET.encode("utf-8"),
                raw,
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, sig):
                logger.warning("Wake request signature mismatch")
                self._send(401, {"error": "invalid signature"})
                return

            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self._send(400, {"error": "invalid json"})
                return

            job_id = payload.get("jobId")
            if not job_id:
                self._send(400, {"error": "jobId required"})
                return

            if _is_duplicate_wake(job_id):
                logger.info("Wake ignored (duplicate)", extra={"job_id": job_id})
                self._send(200, {"ok": True, "duplicate": True})
                return

            try:
                _process_wake(db, payload)
                self._send(200, {"ok": True})
            except Exception as exc:
                logger.exception("Wake handling failed", extra={"error": str(exc)})
                self._send(500, {"error": "wake handling failed"})

    return WakeHandler


def start_wake_server(db):
    handler_cls = _make_wake_handler(db)
    server = ThreadingHTTPServer(("0.0.0.0", WAKE_SERVER_PORT), handler_cls)

    def _serve():
        logger.info(
            "Wake server listening",
            extra={"port": WAKE_SERVER_PORT, "enable_immediate_start": FORCE_IMMEDIATE_START},
        )
        try:
            server.serve_forever()
        except Exception as exc:
            logger.exception("Wake server stopped", extra={"error": str(exc)})

    thread = threading.Thread(target=_serve, daemon=True)
    thread.start()
    return thread


def _process_wake(db, payload: dict) -> None:
    """Handle a wake request: set desired state and optionally start stacks."""
    job_id = payload.get("jobId")
    status = payload.get("status")
    logger.info(
        "Wake received",
        extra={"job_id": job_id, "status": status, "force_immediate_start": FORCE_IMMEDIATE_START},
    )

    # Always set desired state to running to ensure worker starts quickly.
    update_control(
        db,
        {
            "desiredState": "running",
            "lastAction": "wake-dispatcher",
            "requestedBy": "wake-dispatcher",
            "requestedAt": firestore.SERVER_TIMESTAMP,
        },
    )

    if not FORCE_IMMEDIATE_START:
        return

    stacks = load_worker_stacks()
    enabled_stacks = [s for s in stacks if s.get("enabled", True)]
    running = _running_stack_pids(stacks)

    for stack in enabled_stacks:
        if stack["id"] not in running:
            running[stack["id"]] = start_worker(stack)

    pid = _primary_pid(enabled_stacks, running)
    update_control(
        db,
        {
            "currentState": "running",
            "workerPid": pid,
            "lastAction": "wake-dispatcher",
            "lastError": None,
        },
    )
    logger.info("Wake started stacks", extra={"pid": pid, "running": list(running.keys())})


# ==================== MAIN LOOP ====================


def main() -> None:
    logger.info("Calmdemy Content Factory — Local Companion")
    logger.info("Project", extra={"project_id": config.PROJECT_ID})
    logger.info("Poll interval", extra={"poll_interval_sec": POLL_SECONDS})
    logger.info("Press Ctrl+C to stop.")

    db = init_firebase()
    ensure_control_doc(db)
    if ENABLE_WAKE_SERVER:
        start_wake_server(db)

    last_activity_ts = time.time()

    while True:
        try:
            control = get_control(db)
            desired_state = control.get("desiredState", "stopped")
            idle_timeout_min = int(control.get("idleTimeoutMin", 10))

            stacks = load_worker_stacks()
            enabled_stacks = [s for s in stacks if s.get("enabled", True)]
            running = _running_stack_pids(stacks)
            try:
                update_stacks_status(db, stacks, running)
            except Exception as e:
                logger.warning("Failed to update stacks status", extra={"error": str(e)})

            # Stop any disabled stacks that are still running
            for stack in stacks:
                if not stack.get("enabled", True) and stack["id"] in running:
                    stop_worker(stack["id"])
                    running.pop(stack["id"], None)

            pending = has_pending_jobs(db)
            active = has_active_jobs(db)

            if pending or active:
                last_activity_ts = time.time()

            any_running = any(stack["id"] in running for stack in enabled_stacks)

            if desired_state == "running":
                if not any_running:
                    update_control(db, {"currentState": "starting", "lastAction": "start"})
                    for stack in enabled_stacks:
                        if stack["id"] not in running:
                            running[stack["id"]] = start_worker(stack)
                    pid = _primary_pid(enabled_stacks, running)
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
                    for stack in enabled_stacks:
                        if stack["id"] not in running:
                            running[stack["id"]] = start_worker(stack)
                    update_control(
                        db,
                        {
                            "currentState": "running",
                            "workerPid": _primary_pid(enabled_stacks, running),
                        },
                    )

            elif desired_state == "stopped":
                if any_running:
                    update_control(db, {"currentState": "stopping", "lastAction": "stop"})
                    for stack_id in list(running.keys()):
                        stop_worker(stack_id)
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
                        stack["id"] not in running for stack in enabled_stacks
                    )
                    if missing_stack:
                        update_control(db, {"currentState": "starting", "lastAction": "auto-start"})
                        for stack in enabled_stacks:
                            if stack["id"] not in running:
                                running[stack["id"]] = start_worker(stack)
                        pid = _primary_pid(enabled_stacks, running)
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
                                "workerPid": _primary_pid(enabled_stacks, running),
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
                            stop_worker(stack_id)
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
                            "workerPid": _primary_pid(enabled_stacks, running),
                        },
                    )
                else:
                    update_control(db, {"currentState": "stopped", "workerPid": None})

            time.sleep(POLL_SECONDS)

        except KeyboardInterrupt:
            logger.info("Stopped by user")
            sys.exit(0)
        except Exception as e:
            update_control(db, {"lastError": f"{type(e).__name__}: {e}"})
            logger.exception("Companion error", extra={"error": str(e)})
            jitter = random.uniform(-0.3, 0.3)
            time.sleep(max(0.5, POLL_SECONDS + jitter))


if __name__ == "__main__":
    main()
