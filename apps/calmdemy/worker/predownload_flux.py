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

    from diffusers import FluxPipeline

    kwargs = {
        "torch_dtype": None,  # Download only, don't care about dtype
        "cache_dir": cache_dir,
    }
    if config.HF_TOKEN:
        kwargs["token"] = config.HF_TOKEN

    # FLUX.2-klein models are distilled — missing components must be passed as None
    FluxPipeline.from_pretrained(
        model_id,
        text_encoder_2=None,
        tokenizer_2=None,
        image_encoder=None,
        feature_extractor=None,
        **kwargs,
    )

    print()
    print("Download complete! The model is now cached and ready to use.")
    print(f"Location: {cache_dir}")


if __name__ == "__main__":
    main()
