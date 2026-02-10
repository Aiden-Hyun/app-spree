"""StyleTTS2 adapter — local single-voice TTS (Apple Silicon MPS preferred)."""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf
import torch
import yaml
import nltk
from munch import Munch

from .tts_base import TTSBase

_STYLE_MODULE_CACHE: dict[str, object] = {}


def _load_styletts2_module(module_name: str, file_path: Path, root_path: Path):
    if module_name in _STYLE_MODULE_CACHE:
        return _STYLE_MODULE_CACHE[module_name]

    root_str = str(root_path)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)

    spec = importlib.util.spec_from_file_location(module_name, str(file_path))
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Failed to load module spec for {file_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    _STYLE_MODULE_CACHE[module_name] = module
    return module


def _length_to_mask(lengths: torch.Tensor) -> torch.Tensor:
    mask = torch.arange(lengths.max(), device=lengths.device).unsqueeze(0)
    mask = mask.expand(lengths.shape[0], -1)
    return mask + 1 > lengths.unsqueeze(1)


def _recursive_munch(value):
    if isinstance(value, dict):
        return Munch((k, _recursive_munch(v)) for k, v in value.items())
    if isinstance(value, list):
        return [_recursive_munch(v) for v in value]
    return value


class StyleTTS2Adapter(TTSBase):
    def __init__(self):
        self._loaded = False
        self._device: Optional[torch.device] = None
        self._model = None
        self._sampler = None
        self._text_cleaner = None
        self._phonemizer = None
        self._sample_rate = 24000
        self._checkpoint_name: Optional[str] = None
        self._styletts2_root: Optional[Path] = None

    def _resolve_path(self, base_dir: Path, style_root: Path, value: str) -> Path:
        if os.path.isabs(value):
            return Path(value)
        candidate = base_dir / value
        if candidate.exists():
            return candidate
        candidate = style_root / value
        return candidate

    def _select_checkpoint(self, checkpoint_dir: Path) -> Path:
        override = os.getenv("STYLETTS2_CHECKPOINT_FILE")
        if override:
            path = Path(override)
            if not path.is_absolute():
                path = checkpoint_dir / override
            return path

        preferred = checkpoint_dir / "checkpoint.pth"
        if preferred.exists():
            return preferred

        candidates = sorted(checkpoint_dir.glob("*.pth"))
        if not candidates:
            raise FileNotFoundError(
                f"No .pth checkpoint found in {checkpoint_dir}."
            )
        return candidates[-1]

    def load(self, model_dir: str, voice_id: str) -> None:
        if not voice_id:
            voice_id = "styletts2-default"
        # Map voice ID to a checkpoint name (single-voice default)
        default_checkpoint = os.getenv("STYLETTS2_DEFAULT_CHECKPOINT", "ljspeech")
        checkpoint_name = default_checkpoint if voice_id == "styletts2-default" else voice_id

        if self._loaded and self._checkpoint_name == checkpoint_name:
            return

        style_root = Path(__file__).resolve().parent.parent / "tts_models" / "styletts2"
        if not style_root.is_dir():
            raise RuntimeError(
                f"StyleTTS2 repo not found at {style_root}. "
                "Expected it under worker/tts_models/styletts2."
            )
        self._styletts2_root = style_root

        checkpoint_dir = Path(model_dir) / "styletts2" / "checkpoints" / checkpoint_name
        if not checkpoint_dir.is_dir():
            raise RuntimeError(
                f"StyleTTS2 checkpoint directory not found: {checkpoint_dir}. "
                "Download a checkpoint first."
            )

        config_path = checkpoint_dir / "config.yml"
        if not config_path.is_file():
            raise RuntimeError(
                f"Missing config.yml in {checkpoint_dir}. "
                "Download the full checkpoint bundle including config.yml."
            )

        # Load StyleTTS2 modules
        models_mod = _load_styletts2_module(
            "styletts2_models",
            style_root / "models.py",
            style_root,
        )
        text_utils_mod = _load_styletts2_module(
            "styletts2_text_utils",
            style_root / "text_utils.py",
            style_root,
        )

        from Utils.PLBERT.util import load_plbert
        from Modules.diffusion.sampler import DiffusionSampler, ADPM2Sampler, KarrasSchedule

        config = yaml.safe_load(config_path.read_text())

        asr_config = self._resolve_path(checkpoint_dir, style_root, config.get("ASR_config", ""))
        asr_path = self._resolve_path(checkpoint_dir, style_root, config.get("ASR_path", ""))
        f0_path = self._resolve_path(checkpoint_dir, style_root, config.get("F0_path", ""))
        plbert_dir = self._resolve_path(checkpoint_dir, style_root, config.get("PLBERT_dir", ""))

        text_aligner = models_mod.load_ASR_models(str(asr_path), str(asr_config))
        pitch_extractor = models_mod.load_F0_models(str(f0_path))
        plbert = load_plbert(str(plbert_dir))

        model_params = _recursive_munch(config["model_params"])
        model = models_mod.build_model(model_params, text_aligner, pitch_extractor, plbert)

        # Load checkpoint weights
        ckpt_path = self._select_checkpoint(checkpoint_dir)
        params_whole = torch.load(ckpt_path, map_location="cpu", weights_only=False)
        params = params_whole.get("net", {})

        for key in model:
            if key not in params:
                continue
            try:
                model[key].load_state_dict(params[key])
            except Exception:
                state_dict = params[key]
                new_state_dict = {}
                for k, v in state_dict.items():
                    name = k[7:] if k.startswith("module.") else k
                    new_state_dict[name] = v
                model[key].load_state_dict(new_state_dict, strict=False)

        # Device selection
        if torch.backends.mps.is_available() and torch.backends.mps.is_built():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")
            print("  [styletts2] MPS not available; falling back to CPU.")

        for key in model:
            model[key].eval()
            model[key].to(device)

        sampler = DiffusionSampler(
            model.diffusion.diffusion,
            sampler=ADPM2Sampler(),
            sigma_schedule=KarrasSchedule(sigma_min=0.0001, sigma_max=3.0, rho=9.0),
            clamp=False,
        )
        sampler.to(device)

        try:
            if "PHONEMIZER_ESPEAK_LIBRARY" not in os.environ:
                candidate = Path("/opt/homebrew/opt/espeak-ng/lib/libespeak-ng.dylib")
                if candidate.is_file():
                    os.environ["PHONEMIZER_ESPEAK_LIBRARY"] = str(candidate)
            import phonemizer
        except Exception as exc:
            raise RuntimeError(
                "phonemizer is required for StyleTTS2. Install it and ensure espeak-ng is available."
            ) from exc

        self._phonemizer = phonemizer.backend.EspeakBackend(
            language="en-us",
            preserve_punctuation=True,
            with_stress=True,
        )

        self._text_cleaner = text_utils_mod.TextCleaner()
        self._sample_rate = int(config.get("preprocess_params", {}).get("sr", 24000))
        self._device = device
        self._model = model
        self._sampler = sampler
        self._checkpoint_name = checkpoint_name
        self._loaded = True

    def synthesize(self, text: str, output_path: str) -> None:
        if not self._loaded or self._model is None or self._sampler is None:
            raise RuntimeError("StyleTTS2 model not loaded. Call load() first.")

        text = text.strip().replace('"', "")
        if not text:
            raise ValueError("Empty text passed to StyleTTS2")

        ps = self._phonemizer.phonemize([text])[0]
        try:
            tokens = nltk.word_tokenize(ps)
        except LookupError:
            tokens = ps.split()
        tokens = " ".join(tokens)

        ids = self._text_cleaner(tokens)
        ids.insert(0, 0)
        tokens_tensor = torch.LongTensor(ids).to(self._device).unsqueeze(0)

        diffusion_steps = int(os.getenv("STYLETTS2_DIFFUSION_STEPS", "5"))
        embedding_scale = float(os.getenv("STYLETTS2_EMBEDDING_SCALE", "1"))

        with torch.no_grad():
            input_lengths = torch.LongTensor([tokens_tensor.shape[-1]]).to(tokens_tensor.device)
            text_mask = _length_to_mask(input_lengths).to(tokens_tensor.device)

            t_en = self._model.text_encoder(tokens_tensor, input_lengths, text_mask)
            bert_dur = self._model.bert(tokens_tensor, attention_mask=(~text_mask).int())
            d_en = self._model.bert_encoder(bert_dur).transpose(-1, -2)

            noise = torch.randn(1, 1, 256, device=self._device)
            s_pred = self._sampler(
                noise,
                embedding=bert_dur[0].unsqueeze(0),
                num_steps=diffusion_steps,
                embedding_scale=embedding_scale,
            ).squeeze(0)

            s = s_pred[:, 128:]
            ref = s_pred[:, :128]

            d = self._model.predictor.text_encoder(d_en, s, input_lengths, text_mask)
            x, _ = self._model.predictor.lstm(d)
            duration = self._model.predictor.duration_proj(x)
            duration = torch.sigmoid(duration).sum(axis=-1)
            pred_dur = torch.round(duration.squeeze()).clamp(min=1)
            pred_dur[-1] += 5

            pred_aln_trg = torch.zeros(input_lengths, int(pred_dur.sum().data))
            c_frame = 0
            for i in range(pred_aln_trg.size(0)):
                pred_aln_trg[i, c_frame:c_frame + int(pred_dur[i].data)] = 1
                c_frame += int(pred_dur[i].data)

            en = (d.transpose(-1, -2) @ pred_aln_trg.unsqueeze(0).to(self._device))
            f0_pred, n_pred = self._model.predictor.F0Ntrain(en, s)
            out = self._model.decoder(
                (t_en @ pred_aln_trg.unsqueeze(0).to(self._device)),
                f0_pred,
                n_pred,
                ref.squeeze().unsqueeze(0),
            )

        wav = out.squeeze().detach().cpu().numpy()
        wav = np.clip(wav, -1.0, 1.0)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        sf.write(output_path, wav, self._sample_rate, subtype="PCM_16")

    def unload(self) -> None:
        self._model = None
        self._sampler = None
        self._text_cleaner = None
        self._phonemizer = None
        self._loaded = False
        try:
            if torch.backends.mps.is_available():
                torch.mps.empty_cache()
        except Exception:
            pass
