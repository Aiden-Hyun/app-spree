"""Piper TTS adapter — fast, lightweight, CPU-based TTS."""

import os
import subprocess
import shutil
import sys
import wave
import struct
import urllib.request
from pathlib import Path
from .tts_base import TTSBase
from observability import get_logger


logger = get_logger(__name__)


# Default directory where Piper voices are cached locally
_DEFAULT_VOICE_DIR = os.path.join(
    os.path.dirname(__file__), "..", ".piper_voices"
)

# Piper voice model download base URL (Hugging Face)
_HF_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"


def _voice_id_to_hf_path(voice_id: str) -> str:
    """Convert a voice id like 'en_GB-alba-medium' to HF subpath.

    Format: <lang>/<lang_REGION>/<name>/<quality>/<voice_id>.onnx
    Example: en/en_GB/alba/medium/en_GB-alba-medium.onnx
    """
    # voice_id = "en_GB-alba-medium"
    parts = voice_id.split("-")
    if len(parts) < 3:
        raise ValueError(f"Invalid voice id format: {voice_id}")
    lang_region = parts[0]          # en_GB
    name = parts[1]                 # alba
    quality = parts[2]              # medium
    lang = lang_region.split("_")[0]  # en
    return f"{lang}/{lang_region}/{name}/{quality}/{voice_id}"


class PiperAdapter(TTSBase):
    """Adapter for Piper TTS. Runs on CPU, no GPU needed."""

    def __init__(self):
        self._voice_id = None
        self._model_path = None
        self._voice_dir = os.environ.get("PIPER_VOICE_DIR", _DEFAULT_VOICE_DIR)

    def load(self, model_dir: str, voice_id: str) -> None:
        self._voice_id = voice_id

        # Check several possible locations for the .onnx file
        search_dirs = [
            os.path.join(model_dir, "piper"),       # /models/piper/
            self._voice_dir,                         # .piper_voices/
        ]
        for d in search_dirs:
            model_file = os.path.join(d, f"{voice_id}.onnx")
            if os.path.isfile(model_file):
                self._model_path = model_file
                logger.info("Piper voice loaded", extra={"voice_id": voice_id, "path": d})
                return

        # Not cached — download from Hugging Face
        logger.info("Piper voice not cached; downloading", extra={"voice_id": voice_id})
        self._download_voice(voice_id)

    def _download_voice(self, voice_id: str) -> None:
        """Download .onnx and .onnx.json for a Piper voice from HuggingFace."""
        os.makedirs(self._voice_dir, exist_ok=True)

        hf_subpath = _voice_id_to_hf_path(voice_id)
        onnx_url = f"{_HF_BASE}/{hf_subpath}.onnx"
        json_url = f"{_HF_BASE}/{hf_subpath}.onnx.json"

        onnx_dest = os.path.join(self._voice_dir, f"{voice_id}.onnx")
        json_dest = os.path.join(self._voice_dir, f"{voice_id}.onnx.json")

        for url, dest, label in [
            (onnx_url, onnx_dest, "model"),
            (json_url, json_dest, "config"),
        ]:
            if os.path.isfile(dest):
                continue
            logger.info("Downloading Piper voice asset", extra={"voice_id": voice_id, "label": label, "url": url})
            try:
                urllib.request.urlretrieve(url, dest)
            except Exception as e:
                raise RuntimeError(
                    f"Failed to download Piper voice {voice_id} ({label}): {e}"
                ) from e

        self._model_path = onnx_dest
        logger.info("Piper voice ready", extra={"voice_id": voice_id})

    def synthesize(self, text: str, output_path: str) -> None:
        """Run Piper TTS to generate a WAV file from text."""
        logger.info("Piper synthesizing", extra={"voice_id": self._voice_id, "words": len(text.split())})

        piper_bin = _resolve_piper_bin()
        cmd = [piper_bin, "--output_file", output_path]

        if self._model_path:
            cmd.extend(["--model", self._model_path])
        else:
            # Shouldn't reach here, but fallback to data-dir lookup
            cmd.extend(["--model", self._voice_id,
                         "--data-dir", self._voice_dir])

        # Pipe text to piper via stdin
        result = subprocess.run(
            cmd,
            input=text,
            capture_output=True,
            text=True,
            timeout=600,  # 10-minute timeout
        )

        if result.returncode != 0:
            raise RuntimeError(f"Piper TTS failed: {result.stderr}")

        if not os.path.isfile(output_path):
            raise RuntimeError(f"Piper did not produce output file: {output_path}")

        # Get duration
        try:
            with wave.open(output_path, 'r') as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                duration = frames / rate
                logger.info("Piper audio generated", extra={"voice_id": self._voice_id, "duration_sec": duration})
        except Exception:
            logger.info("Piper audio generated (duration unknown)", extra={"voice_id": self._voice_id})


def _resolve_piper_bin() -> str:
    """Find the piper binary even when PATH doesn't include the venv."""
    env_override = os.environ.get("PIPER_BIN", "").strip()
    if env_override:
        return env_override

    found = shutil.which("piper")
    if found:
        return found

    # Fall back to venv/bin/piper next to the running interpreter
    venv_bin = os.path.join(os.path.dirname(sys.executable), "piper")
    if os.path.isfile(venv_bin) and os.access(venv_bin, os.X_OK):
        return venv_bin

    raise RuntimeError(
        "Piper binary not found. Install piper-tts in the worker venv or set PIPER_BIN."
    )
