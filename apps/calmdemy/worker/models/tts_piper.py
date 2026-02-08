"""Piper TTS adapter — fast, lightweight, CPU-based TTS."""

import os
import subprocess
import wave
import struct
import urllib.request
from pathlib import Path
from .tts_base import TTSBase


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
                print(f"  [piper] Loaded voice: {voice_id} from {d}")
                return

        # Not cached — download from Hugging Face
        print(f"  [piper] Voice {voice_id} not cached. Downloading from HuggingFace...")
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
            print(f"  [piper] Downloading {label}: {url}")
            try:
                urllib.request.urlretrieve(url, dest)
            except Exception as e:
                raise RuntimeError(
                    f"Failed to download Piper voice {voice_id} ({label}): {e}"
                ) from e

        self._model_path = onnx_dest
        print(f"  [piper] Voice {voice_id} ready.")

    def synthesize(self, text: str, output_path: str) -> None:
        """Run Piper TTS to generate a WAV file from text."""
        print(f"  [piper] Synthesizing {len(text.split())} words...")

        cmd = ["piper", "--output_file", output_path]

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
                print(f"  [piper] Audio generated: {duration:.1f}s")
        except Exception:
            print("  [piper] Audio generated (duration unknown).")
