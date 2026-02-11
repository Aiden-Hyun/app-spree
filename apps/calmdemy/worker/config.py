"""Worker configuration — reads from environment variables."""

import os

# Load .env early so config defaults can pick it up.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# GCP / Firebase
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "calmnest-e910e")
STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "calmnest-e910e.firebasestorage.app")

# GCE (for self-shutdown)
GCE_ZONE = os.getenv("GCE_ZONE", "us-central1-a")
GCE_VM_NAME = os.getenv("GCE_VM_NAME", "calmdemy-worker")

# Model paths (persistent disk mounted at /models)
MODEL_DIR = os.getenv("MODEL_DIR", "/models")
JOB_CACHE_DIR = os.getenv("JOB_CACHE_DIR", os.path.join(MODEL_DIR, "job_cache"))

# Worker behavior
IDLE_SHUTDOWN_MINUTES = int(os.getenv("IDLE_SHUTDOWN_MINUTES", "5"))
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "15"))

# Firestore collection
JOBS_COLLECTION = "content_jobs"

# Gemini API (for 'api' backend)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Local LLM servers (for 'local' backend)
LMSTUDIO_HOST = os.getenv("LMSTUDIO_HOST", "http://localhost:1234")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Image generation
IMAGE_MODEL_ID = os.getenv("IMAGE_MODEL_ID", "black-forest-labs/FLUX.2-klein-4B")
IMAGE_WIDTH = int(os.getenv("IMAGE_WIDTH", "1024"))
IMAGE_HEIGHT = int(os.getenv("IMAGE_HEIGHT", "1024"))
IMAGE_STEPS = int(os.getenv("IMAGE_STEPS", "24"))
IMAGE_GUIDANCE = float(os.getenv("IMAGE_GUIDANCE", "3.5"))
HF_TOKEN = os.getenv("HF_TOKEN", "")
