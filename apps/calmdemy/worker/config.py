"""Worker configuration — reads from environment variables."""

import os

# GCP / Firebase
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "calmnest-e910e")
STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "calmnest-e910e.firebasestorage.app")

# GCE (for self-shutdown)
GCE_ZONE = os.getenv("GCE_ZONE", "us-central1-a")
GCE_VM_NAME = os.getenv("GCE_VM_NAME", "calmdemy-worker")

# Model paths (persistent disk mounted at /models)
MODEL_DIR = os.getenv("MODEL_DIR", "/models")

# Worker behavior
IDLE_SHUTDOWN_MINUTES = int(os.getenv("IDLE_SHUTDOWN_MINUTES", "5"))
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "15"))

# Firestore collection
JOBS_COLLECTION = "content_jobs"

# Gemini API (for 'api' backend)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Ollama (for 'local' backend)
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
