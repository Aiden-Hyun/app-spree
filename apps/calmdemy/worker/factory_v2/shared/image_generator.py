"""
Step 3: Generate a thumbnail image using a local diffusion model.
"""

import gc
import os
import re
import tempfile

import torch
from PIL import Image

import config
from observability import get_logger

logger = get_logger(__name__)

_cached_pipe = None
_cached_pipeline_class = None
_cached_model_id = None
_cached_device = None
_cached_dtype = None

DEFAULT_FALLBACK_URL = (
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
)


def _normalize_model_id(model_id: str | None = None) -> str:
    return str(model_id or config.IMAGE_MODEL_ID or "").strip()


def _model_cache_dir(model_id: str | None = None) -> str:
    normalized = _normalize_model_id(model_id)
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "--", normalized).strip("-") or "default"
    return os.path.join(config.MODEL_DIR, "image_models", safe_name)


def _model_generation_defaults(model_id: str | None = None) -> dict[str, object]:
    model_lower = _normalize_model_id(model_id).lower()
    if "sd-turbo" in model_lower or "sdxl-turbo" in model_lower:
        return {
            "preferred_width": 512,
            "preferred_height": 512,
            "num_inference_steps": 1,
            "guidance_scale": 0.0,
            "supports_negative_prompt": False,
        }
    return {
        "preferred_width": None,
        "preferred_height": None,
        "num_inference_steps": None,
        "guidance_scale": None,
        "supports_negative_prompt": True,
    }


def _pipeline_pretrained_kwargs(model_id: str, dtype) -> dict[str, object]:
    model_lower = _normalize_model_id(model_id).lower()
    kwargs: dict[str, object] = {
        "torch_dtype": dtype,
        "cache_dir": _model_cache_dir(model_id),
        # Avoid meta-tensor loading paths that can break on MPS/CPU.
        "low_cpu_mem_usage": False,
        "device_map": None,
    }
    if config.HF_TOKEN:
        kwargs["token"] = config.HF_TOKEN
    if ("sd-turbo" in model_lower or "sdxl-turbo" in model_lower) and dtype == torch.float16:
        kwargs["variant"] = "fp16"
    return kwargs


def _load_pretrained_pipeline(PipelineClass, model_id: str, kwargs: dict[str, object]):
    model_lower = _normalize_model_id(model_id).lower()
    try:
        return PipelineClass.from_pretrained(model_id, **kwargs)
    except ValueError as e:
        # Some Flux checkpoints omit optional components; retry with explicit None for FluxPipeline.
        if PipelineClass.__name__ != "FluxPipeline":
            raise
        msg = str(e)
        missing = ("feature_extractor", "image_encoder", "text_encoder_2", "tokenizer_2")
        if not any(part in msg for part in missing):
            raise
        return PipelineClass.from_pretrained(
            model_id,
            text_encoder_2=None,
            tokenizer_2=None,
            image_encoder=None,
            feature_extractor=None,
            **kwargs,
        )
    except OSError:
        if "variant" not in kwargs or not ("sd-turbo" in model_lower or "sdxl-turbo" in model_lower):
            raise
        fallback_kwargs = dict(kwargs)
        fallback_kwargs.pop("variant", None)
        return PipelineClass.from_pretrained(model_id, **fallback_kwargs)


def _get_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def _get_dtype(device: str):
    if device == "mps":
        return torch.float16
    return torch.float32


def _load_pipe():
    global _cached_pipe, _cached_pipeline_class, _cached_model_id, _cached_device, _cached_dtype

    model_id = _normalize_model_id()
    device = _get_device()
    dtype = _get_dtype(device)
    PipelineClass = _resolve_pipeline_class(model_id)
    cache_enabled = bool(config.IMAGE_PIPELINE_CACHE_ENABLED)

    if not cache_enabled and _cached_pipe is not None:
        _release_cached_pipe()

    if (
        not cache_enabled
        or _cached_pipe is None
        or _cached_pipeline_class != PipelineClass
        or _cached_model_id != model_id
        or _cached_device != device
        or _cached_dtype != dtype
    ):
        kwargs = _pipeline_pretrained_kwargs(model_id, dtype)
        pipe = _load_pretrained_pipeline(PipelineClass, model_id, kwargs)
        pipe.to(device)
        pipe.set_progress_bar_config(disable=True)

        # Memory optimizations
        if hasattr(pipe, "enable_attention_slicing"):
            pipe.enable_attention_slicing()
        if hasattr(pipe, "enable_vae_slicing"):
            pipe.enable_vae_slicing()
        if hasattr(pipe, "enable_vae_tiling"):
            pipe.enable_vae_tiling()

        if cache_enabled:
            _cached_pipe = pipe
            _cached_pipeline_class = PipelineClass
            _cached_model_id = model_id
            _cached_device = device
            _cached_dtype = dtype
        else:
            _clear_cached_pipe_state()
            return pipe

    return _cached_pipe


def _clear_cached_pipe_state() -> None:
    global _cached_pipe, _cached_pipeline_class, _cached_model_id, _cached_device, _cached_dtype
    _cached_pipe = None
    _cached_pipeline_class = None
    _cached_model_id = None
    _cached_device = None
    _cached_dtype = None


def _release_cached_pipe() -> None:
    pipe = _cached_pipe
    _clear_cached_pipe_state()
    if pipe is not None:
        del pipe
    _empty_runtime_cache()


def _empty_runtime_cache() -> None:
    try:
        gc.collect()
    except Exception:
        pass

    cuda = getattr(torch, "cuda", None)
    if cuda is not None and hasattr(cuda, "empty_cache"):
        try:
            cuda.empty_cache()
        except Exception:
            pass

    mps = getattr(torch, "mps", None)
    if mps is not None and hasattr(mps, "empty_cache"):
        try:
            mps.empty_cache()
        except Exception:
            pass


def _resolve_pipeline_class(model_id: str):
    model_lower = (model_id or "").lower()
    if "flux.2" in model_lower:
        try:
            from diffusers import Flux2Pipeline
        except Exception as e:
            raise RuntimeError(
                "Flux2 pipelines are not available. Install diffusers from git main."
            ) from e
        # Flux2KleinPipeline may not exist in some diffusers builds.
        if "klein" in model_lower:
            try:
                from diffusers import Flux2KleinPipeline
                return Flux2KleinPipeline
            except Exception:
                return Flux2Pipeline
        return Flux2Pipeline

    if "flux" in model_lower:
        from diffusers import FluxPipeline
        return FluxPipeline

    from diffusers import AutoPipelineForText2Image
    return AutoPipelineForText2Image


def generate_image(
    prompt: str,
    negative_prompt: str | None = None,
    width: int | None = None,
    height: int | None = None,
    num_inference_steps: int | None = None,
    guidance_scale: float | None = None,
) -> str:
    """Generate an image from a prompt and return local file path."""
    pipe = _load_pipe()
    model_defaults = _model_generation_defaults()
    cache_enabled = bool(config.IMAGE_PIPELINE_CACHE_ENABLED)
    result = None
    image = None

    width = width or int(model_defaults.get("preferred_width") or config.IMAGE_WIDTH)
    height = height or int(model_defaults.get("preferred_height") or config.IMAGE_HEIGHT)
    num_inference_steps = int(
        num_inference_steps
        or model_defaults.get("num_inference_steps")
        or config.IMAGE_STEPS
    )
    guidance_scale = (
        guidance_scale
        if guidance_scale is not None
        else model_defaults.get("guidance_scale")
        if model_defaults.get("guidance_scale") is not None
        else config.IMAGE_GUIDANCE
    )

    kwargs = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": guidance_scale,
    }
    if negative_prompt and bool(model_defaults.get("supports_negative_prompt", True)):
        kwargs["negative_prompt"] = negative_prompt

    try:
        result = pipe(**kwargs)
        image = result.images[0]

        if not isinstance(image, Image.Image):
            raise RuntimeError("Image generation did not return a PIL image")

        tmp_dir = tempfile.mkdtemp(prefix="calmdemy_img_")
        output_path = os.path.join(tmp_dir, "thumbnail.png")
        image.save(output_path, format="PNG", optimize=True)
        return output_path
    finally:
        if result is not None:
            del result
        if image is not None:
            del image
        if not cache_enabled:
            del pipe
            _empty_runtime_cache()


def build_image_prompt(job_data: dict, title: str, topic: str, content_type: str, plan: dict | None = None) -> str:
    """Generate or return an image prompt for a job."""
    image_prompt = (job_data.get("imagePrompt") or "").strip()
    if image_prompt:
        return image_prompt

    from .llm_generator import _get_llm_adapter

    base_context = [
        f"Content type: {content_type}",
        f"Title: {title}",
        f"Topic: {topic}",
    ]
    if plan:
        goal = plan.get("courseGoal") or ""
        subject = job_data.get("params", {}).get("subjectLabel", "")
        if goal:
            base_context.append(f"Course goal: {goal}")
        if subject:
            base_context.append(f"Subject: {subject}")

    prompt = (
        "You write concise, photoreal image prompts for app thumbnails. "
        "Output a single sentence only. "
        "Rules: calming, soft light, minimalist, no text, no logos, no people. "
        "Include natural scenery or abstract gradients if helpful.\n\n"
        + "\n".join(base_context)
    )

    try:
        adapter = _get_llm_adapter(job_data)
        raw = adapter.generate(prompt, max_tokens=120).strip()
        raw = raw.split("\n")[0].strip().strip('"\'')
        if raw:
            return raw
    except Exception as e:
        logger.warning("Prompt generation failed", extra={"error": str(e)})

    return "Calming minimalist nature scene, soft light, gentle colors, no text, no people, high quality."
