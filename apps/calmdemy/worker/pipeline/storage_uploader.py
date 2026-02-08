"""
Step 5: Upload the MP3 file to Firebase Storage.
"""

import os
import uuid
from mutagen.mp3 import MP3

from firebase_admin import storage

import config

# Storage path conventions (must match the app's audioFiles.ts)
STORAGE_PATHS = {
    "guided_meditation": "audio/meditate/meditations",
    "sleep_meditation": "audio/sleep/meditations",
    "bedtime_story": "audio/sleep/stories",
    "emergency_meditation": "audio/meditate/emergency",
    "course_session": "audio/meditate/courses",
    "course": "audio/meditate/courses",
}


def _get_audio_duration(mp3_path: str) -> float:
    """Get audio duration in seconds from an MP3 file."""
    try:
        audio = MP3(mp3_path)
        return audio.info.length
    except Exception:
        # Fallback: estimate from file size (192kbps = 24 KB/s)
        size = os.path.getsize(mp3_path)
        return size / 24000


def _slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    import re
    slug = text.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug[:60]


def upload_audio(mp3_path: str, job_data: dict) -> tuple[str, float]:
    """
    Upload MP3 to Firebase Storage.

    Returns (storage_path, duration_seconds).
    """
    content_type = job_data.get("contentType", "guided_meditation")
    topic = job_data.get("params", {}).get("topic", "untitled")

    # Build storage path
    base_path = STORAGE_PATHS.get(content_type, "audio/generated")
    slug = _slugify(topic)
    unique_id = uuid.uuid4().hex[:8]
    filename = f"{slug}-{unique_id}.mp3"
    storage_path = f"{base_path}/{filename}"

    print(f"  [upload] Uploading to: {storage_path}")

    # Get duration before upload
    duration_sec = _get_audio_duration(mp3_path)

    # Upload to Firebase Storage
    bucket = storage.bucket(config.STORAGE_BUCKET)
    blob = bucket.blob(storage_path)
    blob.upload_from_filename(
        mp3_path,
        content_type="audio/mpeg",
    )
    blob.cache_control = "public, max-age=31536000"
    blob.patch()

    size_mb = os.path.getsize(mp3_path) / (1024 * 1024)
    print(f"  [upload] Uploaded: {size_mb:.1f} MB, {duration_sec:.1f}s")

    # Clean up local file
    try:
        os.remove(mp3_path)
    except OSError:
        pass

    return storage_path, duration_sec
