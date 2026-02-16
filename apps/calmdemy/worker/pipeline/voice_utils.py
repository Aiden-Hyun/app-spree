"""Helpers for mapping TTS voice IDs to display names."""

import json
import os
import re


DEFAULT_VOICE_NAME_OVERRIDES = {
    # Piper voices
    "en_US-amy-medium": "Amy",
    "en_US-danny-low": "Danny",
    "en_GB-alba-medium": "Alba",
    # Use a friendlier narrator name for Lessac by default
    "en_US-lessac-medium": "Rachel",
    # StyleTTS2
    "styletts2-default": "Ava",
    # Coqui XTTS
    "xtts-female-calm": "Emma",
    "xtts-male-soothing": "James",
    # Gemini
    "gemini-default": "Kore",
    "gemini-default-pro": "Kore",
    # DMS voices (Kyutai delayed-streams modeling)
    "expresso/ex03-ex01_happy_001_channel1_334s.wav": "Britney",
    "vctk/p226_023.wav": "Delilah",
    "vctk/p225_023.wav": "Milo",
}


def _load_env_overrides() -> dict[str, str]:
    raw = os.getenv("TTS_VOICE_NAME_OVERRIDES", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return {str(k): str(v) for k, v in data.items()}
    except Exception:
        pass
    return {}


def get_voice_display_name(voice_id: str | None) -> str:
    """Return a human-friendly narrator name for a TTS voice id."""
    if not voice_id:
        return "Guide"

    overrides = {**DEFAULT_VOICE_NAME_OVERRIDES, **_load_env_overrides()}
    if voice_id in overrides:
        return overrides[voice_id]

    # Try to extract a name from common patterns like en_US-amy-medium
    match = re.match(r"^[a-z]{2}_[A-Z]{2}-([a-zA-Z]+)-", voice_id)
    if match:
        return match.group(1).capitalize()

    # Fallback: use the first segment, title-cased
    name = re.split(r"[-_]", voice_id)[0]
    return name.capitalize() if name else "Guide"
