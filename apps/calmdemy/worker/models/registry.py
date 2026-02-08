"""
Model registry — maps model IDs from job config to adapter classes.

To add a new model:
  1. Write an adapter in models/llm_<name>.py or models/tts_<name>.py
  2. Add an entry to LLM_MODELS or TTS_MODELS below
  3. Add the model ID to the admin UI constants (src/features/admin/constants/models.ts)
"""

from .llm_base import LLMBase
from .tts_base import TTSBase
from .llm_gemma import GemmaAdapter
from .llm_llama import LlamaAdapter
from .llm_gemini_api import GeminiAPIAdapter
from .llm_ollama import OllamaAdapter
from .llm_lmstudio import LMStudioAdapter
from .tts_piper import PiperAdapter
from .tts_coqui import CoquiXTTSAdapter
from .tts_gemini import GeminiTTSAdapter


def _gemini_flash_factory():
    return GeminiAPIAdapter(model_id="gemini-2.5-flash")


def _gemini_pro_factory():
    return GeminiAPIAdapter(model_id="gemini-2.5-pro")


def _gemini_tts_flash_factory():
    return GeminiTTSAdapter(model_id="gemini-tts-flash")


def _gemini_tts_pro_factory():
    return GeminiTTSAdapter(model_id="gemini-tts-pro")


def _ollama_factory():
    return OllamaAdapter()


def _lmstudio_factory():
    return LMStudioAdapter()


# ==================== LLM REGISTRY ====================

LLM_FACTORIES: dict[str, callable] = {
    # Cloud GPU models
    "gemma-3-12b": GemmaAdapter,
    "llama-3.1-8b": LlamaAdapter,
    # Gemini API models
    "gemini-2.5-flash": _gemini_flash_factory,
    "gemini-2.5-pro": _gemini_pro_factory,
    # Local
    "lmstudio-local": _lmstudio_factory,
    "ollama-local": _ollama_factory,
}

# ==================== TTS REGISTRY ====================

TTS_FACTORIES: dict[str, callable] = {
    # Cloud / Local
    "piper": PiperAdapter,
    "coqui-xtts-v2": CoquiXTTSAdapter,
    # Gemini API TTS
    "gemini-tts-flash": _gemini_tts_flash_factory,
    "gemini-tts-pro": _gemini_tts_pro_factory,
}

# Keep backward-compatible dict names
LLM_MODELS: dict[str, type[LLMBase]] = {
    "gemma-3-12b": GemmaAdapter,
    "llama-3.1-8b": LlamaAdapter,
}

TTS_MODELS: dict[str, type[TTSBase]] = {
    "piper": PiperAdapter,
    "coqui-xtts-v2": CoquiXTTSAdapter,
}


def get_llm(model_id: str) -> LLMBase:
    """Instantiate an LLM adapter by ID."""
    factory = LLM_FACTORIES.get(model_id)
    if factory is None:
        available = ", ".join(LLM_FACTORIES.keys())
        raise ValueError(f"Unknown LLM model '{model_id}'. Available: {available}")
    # Factory functions return an instance; classes need to be called
    result = factory()
    if isinstance(result, LLMBase):
        return result
    # It was a class, not a factory function — result is already the instance
    return result


def get_tts(model_id: str) -> TTSBase:
    """Instantiate a TTS adapter by ID."""
    factory = TTS_FACTORIES.get(model_id)
    if factory is None:
        available = ", ".join(TTS_FACTORIES.keys())
        raise ValueError(f"Unknown TTS model '{model_id}'. Available: {available}")
    result = factory()
    if isinstance(result, TTSBase):
        return result
    return result
