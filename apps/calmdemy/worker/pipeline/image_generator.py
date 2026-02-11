"""
Step 3: Generate a thumbnail image using a local diffusion model.
"""

import os
import tempfile

import torch
from diffusers import FluxPipeline
from PIL import Image

import config

_cached_pipe = None
_cached_model_id = None
_cached_device = None
_cached_dtype = None

DEFAULT_FALLBACK_URL = (
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
)


def _get_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def _get_dtype(device: str):
    if device == "mps":
        return torch.float16
    return torch.float32


def _load_pipe() -> FluxPipeline:
    global _cached_pipe, _cached_model_id, _cached_device, _cached_dtype

    model_id = config.IMAGE_MODEL_ID
    device = _get_device()
    dtype = _get_dtype(device)

    if (_cached_pipe is None
            or _cached_model_id != model_id
            or _cached_device != device
            or _cached_dtype != dtype):
        cache_dir = os.path.join(config.MODEL_DIR, "flux")
        kwargs = {
            "torch_dtype": dtype,
            "cache_dir": cache_dir,
        }
        if config.HF_TOKEN:
            kwargs["token"] = config.HF_TOKEN

        pipe = FluxPipeline.from_pretrained(model_id, **kwargs)
        pipe.to(device)
        pipe.set_progress_bar_config(disable=True)

        # Memory optimizations
        if hasattr(pipe, "enable_attention_slicing"):
            pipe.enable_attention_slicing()
        if hasattr(pipe, "enable_vae_slicing"):
            pipe.enable_vae_slicing()
        if hasattr(pipe, "enable_vae_tiling"):
            pipe.enable_vae_tiling()

        _cached_pipe = pipe
        _cached_model_id = model_id
        _cached_device = device
        _cached_dtype = dtype

    return _cached_pipe


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

    width = width or config.IMAGE_WIDTH
    height = height or config.IMAGE_HEIGHT
    num_inference_steps = num_inference_steps or config.IMAGE_STEPS
    guidance_scale = guidance_scale if guidance_scale is not None else config.IMAGE_GUIDANCE

    kwargs = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": guidance_scale,
    }
    if negative_prompt:
        kwargs["negative_prompt"] = negative_prompt

    result = pipe(**kwargs)
    image = result.images[0]

    if not isinstance(image, Image.Image):
        raise RuntimeError("Image generation did not return a PIL image")

    tmp_dir = tempfile.mkdtemp(prefix="calmdemy_img_")
    output_path = os.path.join(tmp_dir, "thumbnail.png")
    image.save(output_path, format="PNG", optimize=True)

    return output_path


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
        print(f"  [image] Prompt generation failed: {e}")

    return "Calming minimalist nature scene, soft light, gentle colors, no text, no people, high quality."
