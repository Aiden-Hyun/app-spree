#!/usr/bin/env bash
set -euo pipefail

WORKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$WORKER_DIR/.venv"
PY="$VENV_DIR/bin/python"
REQ="$WORKER_DIR/requirements.txt"
MARKER="$VENV_DIR/.deps_installed"

if [ ! -x "$PY" ]; then
  echo "[companion] Creating virtual environment at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

"$PY" -m pip install --upgrade pip >/dev/null

if [ ! -f "$MARKER" ] || [ "$REQ" -nt "$MARKER" ]; then
  echo "[companion] Installing worker dependencies..."
  "$PY" -m pip install -r "$REQ"
  touch "$MARKER"
fi

echo "[companion] Starting local companion..."
exec "$PY" "$WORKER_DIR/local_companion.py"
