"""
Model registry — maps model IDs from job config to adapter classes.

To add a new model:
  1. Write an adapter in models/llm_<name>.py or models/tts_<name>.py
  2. Add an entry to LLM_FACTORIES or TTS_FACTORIES below
  3. Add the model ID to the admin UI constants (src/features/admin/constants/models.ts)
"""

from __future__ import annotations

import importlib
from typing import Callable

from .llm_base import LLMBase
from .tts_base import TTSBase


def _load_symbol(module_name: str, symbol: str):
    module = importlib.import_module(module_name, package=__package__)
    return getattr(module, symbol)


def _factory(module_name: str, symbol: str, **kwargs):
    cls = _load_symbol(module_name, symbol)
    return cls(**kwargs) if kwargs else cls()


def _gemini_flash_factory():
    return _factory(".llm_gemini_api", "GeminiAPIAdapter", model_id="gemini-2.5-flash")


def _gemini_pro_factory():
    return _factory(".llm_gemini_api", "GeminiAPIAdapter", model_id="gemini-2.5-pro")


def _gemini_tts_flash_factory():
    return _factory(".tts_gemini", "GeminiTTSAdapter", model_id="gemini-tts-flash")


def _gemini_tts_pro_factory():
    return _factory(".tts_gemini", "GeminiTTSAdapter", model_id="gemini-tts-pro")


def _ollama_factory():
    return _factory(".llm_ollama", "OllamaAdapter")


def _lmstudio_factory():
    return _factory(".llm_lmstudio", "LMStudioAdapter")


# ==================== LLM REGISTRY ====================

LLM_FACTORIES: dict[str, Callable[[], LLMBase]] = {
    # Cloud GPU models
    "gemma-3-12b": lambda: _factory(".llm_gemma", "GemmaAdapter"),
    "llama-3.1-8b": lambda: _factory(".llm_llama", "LlamaAdapter"),
    # Gemini API models
    "gemini-2.5-flash": _gemini_flash_factory,
    "gemini-2.5-pro": _gemini_pro_factory,
    # Local
    "lmstudio-local": _lmstudio_factory,
    "ollama-local": _ollama_factory,
}

# ==================== TTS REGISTRY ====================

TTS_FACTORIES: dict[str, Callable[[], TTSBase]] = {
    # Cloud / Local
    "piper": lambda: _factory(".tts_piper", "PiperAdapter"),
    "dms": lambda: _factory(".tts_dms", "DMSTTSAdapter"),
    "styletts2": lambda: _factory(".tts_styletts2", "StyleTTS2Adapter"),
    "coqui-xtts-v2": lambda: _factory(".tts_coqui", "CoquiXTTSAdapter"),
    # Gemini API TTS
    "gemini-tts-flash": _gemini_tts_flash_factory,
    "gemini-tts-pro": _gemini_tts_pro_factory,
}

# Keep backward-compatible dict names
LLM_MODELS: dict[str, Callable[[], LLMBase]] = {
    "gemma-3-12b": LLM_FACTORIES["gemma-3-12b"],
    "llama-3.1-8b": LLM_FACTORIES["llama-3.1-8b"],
}

TTS_MODELS: dict[str, Callable[[], TTSBase]] = {
    "piper": TTS_FACTORIES["piper"],
    "dms": TTS_FACTORIES["dms"],
    "styletts2": TTS_FACTORIES["styletts2"],
    "coqui-xtts-v2": TTS_FACTORIES["coqui-xtts-v2"],
}


def get_llm(model_id: str) -> LLMBase:
    """Instantiate an LLM adapter by ID."""
    factory = LLM_FACTORIES.get(model_id)
    if factory is None:
        available = ", ".join(LLM_FACTORIES.keys())
        raise ValueError(f"Unknown LLM model '{model_id}'. Available: {available}")
    return factory()


def get_tts(model_id: str) -> TTSBase:
    """Instantiate a TTS adapter by ID."""
    factory = TTS_FACTORIES.get(model_id)
    if factory is None:
        available = ", ".join(TTS_FACTORIES.keys())
        raise ValueError(f"Unknown TTS model '{model_id}'. Available: {available}")
    return factory()
