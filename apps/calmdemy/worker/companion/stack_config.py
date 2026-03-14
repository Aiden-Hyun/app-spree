from __future__ import annotations

import json
import os
from typing import Any

from observability import get_logger

logger = get_logger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKER_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DEFAULT_STACKS_FILE = os.path.join(WORKER_DIR, "worker_stacks.json")

_NON_DMS_TTS_MODELS = ["gemini-tts-flash", "gemini-tts-pro"]

_DEFAULT_STACKS = [
    {
        "id": "local-primary",
        "role": "v2",
        "venv": ".venv",
        "enabled": True,
        "dispatch": True,
        "acceptNonTtsSteps": True,
        "ttsModels": list(_NON_DMS_TTS_MODELS),
    },
    {
        "id": "local-tts-dms-1",
        "role": "tts",
        "venv": ".venv-dms",
        "enabled": True,
        "dispatch": False,
        "acceptNonTtsSteps": False,
        "ttsModels": ["dms"],
    },
    {
        "id": "local-tts-dms-2",
        "role": "tts",
        "venv": ".venv-dms",
        "enabled": True,
        "dispatch": False,
        "acceptNonTtsSteps": False,
        "ttsModels": ["dms"],
    },
    {
        "id": "local-tts-dms-3",
        "role": "tts",
        "venv": ".venv-dms",
        "enabled": True,
        "dispatch": False,
        "acceptNonTtsSteps": False,
        "ttsModels": ["dms"],
    },
    {
        "id": "local-tts-qwen",
        "role": "tts",
        "venv": ".venv-qwen",
        "enabled": True,
        "dispatch": False,
        "acceptNonTtsSteps": False,
        "ttsModels": ["qwen3-base"],
    },
]


def _as_bool(value: Any, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "true", "yes", "on"}:
            return True
        if lowered in {"0", "false", "no", "off"}:
            return False
    if isinstance(value, (int, float)):
        return bool(value)
    return default


def _normalize_tts_models(raw: Any) -> list[str]:
    if raw is None:
        return []
    values: list[str] = []
    if isinstance(raw, str):
        values = [part.strip() for part in raw.split(",")]
    elif isinstance(raw, (list, tuple, set)):
        values = [str(item).strip() for item in raw]
    normalized: list[str] = []
    for value in values:
        if not value:
            continue
        lowered = value.lower()
        if lowered not in normalized:
            normalized.append(lowered)
    return normalized


def _legacy_single_stack() -> list[dict]:
    return [
        {
            "id": os.getenv("V2_STACK_ID", "local-v2"),
            "role": "v2",
            "venv": os.getenv("V2_VENV", ".venv"),
            "enabled": True,
            "dispatch": True,
            "acceptNonTtsSteps": True,
            "ttsModels": ["*"],
        }
    ]


def _normalize_stack(raw: dict, index: int) -> dict:
    stack_id = str(raw.get("id") or f"stack-{index + 1}").strip()
    role = str(raw.get("role") or "v2").strip()
    venv = str(raw.get("venv") or ".venv").strip()
    enabled = _as_bool(raw.get("enabled"), True)

    dispatch_raw = raw.get("dispatch")
    dispatch = _as_bool(dispatch_raw, role in {"pre", "dispatcher"})

    accept_non_tts_raw = raw.get("acceptNonTtsSteps")
    accept_non_tts = _as_bool(accept_non_tts_raw, role not in {"tts"})

    tts_models = _normalize_tts_models(raw.get("ttsModels"))
    if not tts_models and accept_non_tts:
        # Backward-compatible wildcard for old single-stack setups.
        tts_models = ["*"]

    return {
        "id": stack_id,
        "role": role or "v2",
        "venv": venv or ".venv",
        "enabled": enabled,
        "dispatch": dispatch,
        "acceptNonTtsSteps": accept_non_tts,
        "ttsModels": tts_models,
    }


def _enforce_dispatcher(stacks: list[dict]) -> list[dict]:
    enabled_indices = [idx for idx, stack in enumerate(stacks) if stack.get("enabled", True)]
    if not enabled_indices:
        return stacks

    dispatch_indices = [
        idx for idx in enabled_indices if bool(stacks[idx].get("dispatch", False))
    ]
    if not dispatch_indices:
        first = enabled_indices[0]
        stacks[first]["dispatch"] = True
        logger.warning(
            "No dispatcher stack defined; defaulting first enabled stack as dispatcher",
            extra={"stack_id": stacks[first].get("id")},
        )
        return stacks

    primary = dispatch_indices[0]
    for idx in dispatch_indices[1:]:
        stacks[idx]["dispatch"] = False
    if len(dispatch_indices) > 1:
        logger.warning(
            "Multiple dispatcher stacks configured; keeping only the first",
            extra={
                "primary": stacks[primary].get("id"),
                "disabled": [stacks[idx].get("id") for idx in dispatch_indices[1:]],
            },
        )
    return stacks


def load_stack_config(config_path: str | None = None) -> list[dict]:
    path = config_path or os.getenv("WORKER_STACKS_FILE", DEFAULT_STACKS_FILE)
    raw_stacks: list[dict]

    if os.path.isfile(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            if isinstance(payload, list):
                raw_stacks = [item for item in payload if isinstance(item, dict)]
            else:
                raw_stacks = []
        except Exception as exc:
            logger.warning(
                "Failed to parse worker stack config; using fallback",
                extra={"path": path, "error": str(exc)},
            )
            raw_stacks = []
    else:
        raw_stacks = []

    if not raw_stacks:
        if os.getenv("V2_STACK_ID") or os.getenv("V2_VENV"):
            raw_stacks = _legacy_single_stack()
        else:
            raw_stacks = list(_DEFAULT_STACKS)

    normalized = [_normalize_stack(stack, idx) for idx, stack in enumerate(raw_stacks)]
    return _enforce_dispatcher(normalized)


def stack_supports_tts_model(stack: dict, tts_model: str) -> bool:
    model = (tts_model or "").strip().lower()
    if not model:
        return True
    models = [str(value).strip().lower() for value in (stack.get("ttsModels") or []) if str(value).strip()]
    if not models:
        return bool(stack.get("acceptNonTtsSteps", True))
    if "*" in models:
        return True
    return model in models


def any_enabled_stack_supports_tts_model(stacks: list[dict], tts_model: str) -> bool:
    for stack in stacks:
        if not stack.get("enabled", True):
            continue
        if stack_supports_tts_model(stack, tts_model):
            return True
    return False
