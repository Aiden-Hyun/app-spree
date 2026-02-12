"""
Pre-download the FLUX image generation model so it's cached locally
before any content factory job needs it.

Usage:
  cd apps/calmdemy/worker
  python3 predownload_flux.py
"""

import os
import sys

# Disable HuggingFace xet transfer (crashes on macOS with NULL object panic)
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"

# Load .env BEFORE importing config so MODEL_DIR is set
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

import config


def _resolve_pipeline_class(model_id: str):
    model_lower = (model_id or "").lower()
    if "flux.2" in model_lower:
        try:
            from diffusers import Flux2Pipeline
        except Exception as e:
            raise RuntimeError(
                "Flux2 pipelines are not available. Install diffusers from git main."
            ) from e
        if "klein" in model_lower:
            try:
                from diffusers import Flux2KleinPipeline
                return Flux2KleinPipeline
            except Exception:
                return Flux2Pipeline
        return Flux2Pipeline

    from diffusers import FluxPipeline
    return FluxPipeline

def main():
    model_id = config.IMAGE_MODEL_ID
    cache_dir = os.path.join(config.MODEL_DIR, "flux")
    os.makedirs(cache_dir, exist_ok=True)

    print(f"Model:     {model_id}")
    print(f"Cache dir: {cache_dir}")
    print(f"HF Token:  {'set' if config.HF_TOKEN else 'NOT SET'}")
    print()
    print("Downloading model (this may take 10-30 minutes)...")
    print()

    PipelineClass = _resolve_pipeline_class(model_id)

    kwargs = {
        "torch_dtype": None,  # Download only, don't care about dtype
        "cache_dir": cache_dir,
        # Avoid meta-tensor loading paths that can break on MPS/CPU.
        "low_cpu_mem_usage": False,
        "device_map": None,
    }
    if config.HF_TOKEN:
        kwargs["token"] = config.HF_TOKEN

    extra = {}
    if PipelineClass.__name__ == "FluxPipeline":
        # Some flux checkpoints omit optional components.
        extra = {
            "text_encoder_2": None,
            "tokenizer_2": None,
            "image_encoder": None,
            "feature_extractor": None,
        }

    PipelineClass.from_pretrained(model_id, **extra, **kwargs)

    print()
    print("Download complete! The model is now cached and ready to use.")
    print(f"Location: {cache_dir}")


if __name__ == "__main__":
    main()
