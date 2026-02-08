"""
Pipeline runner — orchestrates all steps for a single content job.
"""

import traceback

from firebase_admin import firestore as fs

from .llm_generator import generate_script
from .qa_formatter import format_script
from .tts_converter import convert_to_audio
from .audio_processor import post_process_audio
from .storage_uploader import upload_audio
from .content_publisher import publish_content


def _update_status(db, job_id: str, status: str, extra: dict | None = None):
    """Update job status and timestamp in Firestore."""
    data = {
        "status": status,
        "updatedAt": fs.SERVER_TIMESTAMP,
    }
    if status == "llm_generating" and not extra:
        data["startedAt"] = fs.SERVER_TIMESTAMP
    if extra:
        data.update(extra)
    db.collection("content_jobs").document(job_id).update(data)


def process_job(db, job_id: str, job_data: dict):
    """Run the full pipeline for one content job."""
    try:
        # Step 1: LLM — generate script
        _update_status(db, job_id, "llm_generating")
        script = generate_script(job_data)
        _update_status(db, job_id, "qa_formatting", {
            "generatedScript": script,
        })

        # Step 2: QA — validate and format
        formatted_script = format_script(script, job_data)

        # Step 3: TTS — convert to audio
        _update_status(db, job_id, "tts_converting")
        wav_path = convert_to_audio(formatted_script, job_data)

        # Step 4: Post-process — normalize and encode
        _update_status(db, job_id, "post_processing")
        mp3_path = post_process_audio(wav_path)

        # Step 5: Upload — push to Firebase Storage
        _update_status(db, job_id, "uploading")
        storage_path, duration_sec = upload_audio(mp3_path, job_data)

        # Step 6: Publish — create content document
        _update_status(db, job_id, "publishing")
        content_id = publish_content(
            db, storage_path, duration_sec, formatted_script, job_data
        )

        # Done
        _update_status(db, job_id, "completed", {
            "audioPath": storage_path,
            "audioDurationSec": duration_sec,
            "publishedContentId": content_id,
            "completedAt": fs.SERVER_TIMESTAMP,
        })
        print(f"  [pipeline] Job {job_id} completed. Content ID: {content_id}")

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        print(f"  [pipeline] Job {job_id} FAILED: {error_msg}")
        traceback.print_exc()
        _update_status(db, job_id, "failed", {"error": error_msg})
