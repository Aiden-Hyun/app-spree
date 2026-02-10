#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <checkpoint-name> <checkpoint-url> [config-path]" >&2
  echo "Example:" >&2
  echo "  $0 ljspeech https://.../epoch_2nd_00100.pth" >&2
  exit 1
fi

CHECKPOINT_NAME="$1"
CHECKPOINT_URL="$2"
CONFIG_SRC="${3:-}" 

MODEL_DIR="${MODEL_DIR:-/models}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STYLE_REPO="$ROOT_DIR/tts_models/styletts2"

DEST_DIR="$MODEL_DIR/styletts2/checkpoints/$CHECKPOINT_NAME"
mkdir -p "$DEST_DIR"

if [ -z "$CONFIG_SRC" ]; then
  CONFIG_SRC="$STYLE_REPO/Configs/config.yml"
fi

if [ ! -f "$CONFIG_SRC" ]; then
  echo "config.yml not found at: $CONFIG_SRC" >&2
  echo "Provide a config path as the 3rd argument." >&2
  exit 1
fi

if command -v curl >/dev/null 2>&1; then
  curl -L "$CHECKPOINT_URL" -o "$DEST_DIR/checkpoint.pth"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$DEST_DIR/checkpoint.pth" "$CHECKPOINT_URL"
else
  echo "Neither curl nor wget found. Please install one." >&2
  exit 1
fi

cp "$CONFIG_SRC" "$DEST_DIR/config.yml"

echo "StyleTTS2 checkpoint installed at: $DEST_DIR"
