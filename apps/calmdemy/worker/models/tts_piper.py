"""Piper TTS adapter — fast, lightweight, CPU-based TTS."""

import os
import subprocess
import wave
import struct
from .tts_base import TTSBase


class PiperAdapter(TTSBase):
    """Adapter for Piper TTS. Runs on CPU, no GPU needed."""

    def __init__(self):
        self._voice_id = None
        self._model_path = None

    def load(self, model_dir: str, voice_id: str) -> None:
        self._voice_id = voice_id
        # Piper models are stored as .onnx files
        # Expected path: /models/piper/<voice_id>.onnx
        piper_dir = os.path.join(model_dir, "piper")
        model_file = os.path.join(piper_dir, f"{voice_id}.onnx")
        config_file = os.path.join(piper_dir, f"{voice_id}.onnx.json")

        if os.path.isfile(model_file):
            self._model_path = model_file
            print(f"  [piper] Loaded voice: {voice_id}")
        else:
            # Piper can download voices automatically
            self._model_path = None
            print(f"  [piper] Voice {voice_id} not cached; will use piper CLI to download.")

    def synthesize(self, text: str, output_path: str) -> None:
        """Run Piper TTS to generate a WAV file from text."""
        print(f"  [piper] Synthesizing {len(text.split())} words...")

        cmd = ["piper", "--output_file", output_path]

        if self._model_path:
            cmd.extend(["--model", self._model_path])
        else:
            # Let piper download the model by voice name
            cmd.extend(["--model", self._voice_id])

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
