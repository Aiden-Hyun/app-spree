"""Coqui XTTS v2 adapter — high-quality GPU-based TTS with voice cloning."""

import os
from .tts_base import TTSBase


class CoquiXTTSAdapter(TTSBase):
    """Adapter for Coqui XTTS v2. Requires GPU for reasonable speed."""

    def __init__(self):
        self._model = None
        self._voice_id = None
        self._speaker_wav = None

    def load(self, model_dir: str, voice_id: str) -> None:
        from TTS.api import TTS

        self._voice_id = voice_id
        xtts_dir = os.path.join(model_dir, "coqui-xtts-v2")

        # Check for reference speaker wav for voice cloning
        speaker_dir = os.path.join(xtts_dir, "speakers")
        speaker_wav = os.path.join(speaker_dir, f"{voice_id}.wav")
        if os.path.isfile(speaker_wav):
            self._speaker_wav = speaker_wav
            print(f"  [xtts] Using speaker reference: {speaker_wav}")

        # Load XTTS v2 model
        if os.path.isdir(xtts_dir):
            self._model = TTS(model_path=xtts_dir, gpu=True)
        else:
            self._model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)

        print(f"  [xtts] Model loaded with voice: {voice_id}")

    def synthesize(self, text: str, output_path: str) -> None:
        if self._model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        print(f"  [xtts] Synthesizing {len(text.split())} words...")

        if self._speaker_wav:
            self._model.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=self._speaker_wav,
                language="en",
            )
        else:
            # Use default speaker
            self._model.tts_to_file(
                text=text,
                file_path=output_path,
                language="en",
            )

        print(f"  [xtts] Audio generated: {output_path}")

    def unload(self) -> None:
        del self._model
        self._model = None
        try:
            import torch
            torch.cuda.empty_cache()
        except Exception:
            pass
