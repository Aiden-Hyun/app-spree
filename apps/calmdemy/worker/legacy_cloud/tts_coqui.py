"""Coqui XTTS v2 adapter — high-quality GPU-based TTS with voice cloning."""

import os
from .tts_base import TTSBase
from observability import get_logger

logger = get_logger(__name__)


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
            logger.info("XTTS using speaker reference", extra={"speaker_wav": speaker_wav})

        # Load XTTS v2 model
        if os.path.isdir(xtts_dir):
            self._model = TTS(model_path=xtts_dir, gpu=True)
        else:
            self._model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)

        logger.info("XTTS model loaded", extra={"voice_id": voice_id})

    def synthesize(self, text: str, output_path: str) -> None:
        if self._model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        logger.info("XTTS synthesizing", extra={"words": len(text.split()), "voice_id": self._voice_id})

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

        logger.info("XTTS audio generated", extra={"path": output_path, "voice_id": self._voice_id})

    def unload(self) -> None:
        del self._model
        self._model = None
        try:
            import torch
            torch.cuda.empty_cache()
        except Exception:
            pass
