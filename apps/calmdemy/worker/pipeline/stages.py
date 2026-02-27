"""
Shared pipeline stage helpers — used by both runner.py and course_runner.py.
"""

from firebase_admin import firestore as fs

from .tts_converter import convert_to_audio
from .audio_processor import post_process_audio
from .storage_uploader import upload_audio
from .content_publisher import publish_content
from .job_cache import save_artifact, cleanup
from .metrics import record_job_metric
import config
from observability import get_logger

logger = get_logger(__name__)


# ==================== STATUS HELPERS ====================


def update_job_status(
    db,
    job_id: str,
    status: str,
    extra: dict | None = None,
    last_completed: str | None = None,
):
    """Update job status and timestamp in Firestore."""
    data = {
        "status": status,
        "updatedAt": fs.SERVER_TIMESTAMP,
    }
    if status == "llm_generating" and not extra:
        data["startedAt"] = fs.SERVER_TIMESTAMP
    if last_completed:
        data["lastCompletedStage"] = last_completed
    if extra:
        data.update(extra)
    db.collection(config.JOBS_COLLECTION).document(job_id).update(data)


def update_job_progress(db, job_id: str, progress: str):
    """Update course progress indicator."""
    db.collection(config.JOBS_COLLECTION).document(job_id).update({
        "courseProgress": progress,
        "updatedAt": fs.SERVER_TIMESTAMP,
    })


# ==================== TTS → PUBLISH PIPELINE ====================


def run_tts_through_publish(
    db,
    job_id: str,
    job_data: dict,
    formatted_script: str,
    generated_title: str,
    cache_state: dict,
    cache_update,
    cache_file,
    stage_tracker: dict,
):
    """Execute TTS → post-process → upload → publish for a single content job.

    On success, cleans up the local cache directory.
    Callers are responsible for the try/except around this function.
    """
    _update_status = update_job_status  # local alias for brevity

    # Step 3: TTS — convert to audio (or reuse cached)
    stage_tracker["current"] = "tts_converting"
    wav_path = cache_file("wavPath")
    if wav_path:
        logger.info("Reusing cached WAV.", extra={"job_id": job_id})
    else:
        wav_path = convert_to_audio(formatted_script, job_data)
        wav_path = save_artifact(job_id, wav_path, "tts_output.wav")
        cache_update(wavPath=wav_path)
    cache_update(lastCompletedStage="tts_converting")
    _update_status(db, job_id, "post_processing", last_completed="tts_converting")

    # Step 4: Post-process — normalize and encode (or reuse cached)
    stage_tracker["current"] = "post_processing"
    mp3_path = cache_file("mp3Path")
    if mp3_path:
        logger.info("Reusing cached MP3.", extra={"job_id": job_id})
    else:
        mp3_path = post_process_audio(wav_path)
        mp3_path = save_artifact(job_id, mp3_path, "tts_output.mp3")
        cache_update(mp3Path=mp3_path)
    cache_update(lastCompletedStage="post_processing")
    _update_status(db, job_id, "uploading", last_completed="post_processing")

    # Step 5: Upload — push to Firebase Storage (or reuse cached)
    stage_tracker["current"] = "uploading"
    storage_path = job_data.get("audioPath") or cache_state.get("storagePath")
    duration_sec = job_data.get("audioDurationSec") or cache_state.get("durationSec")
    if storage_path:
        logger.info("Reusing uploaded audio path.", extra={"job_id": job_id})
    else:
        storage_path, duration_sec = upload_audio(mp3_path, job_data)
        cache_update(storagePath=storage_path, durationSec=duration_sec)

    # Write audioPath even before publish so a failed publish can resume
    auto_publish = job_data.get("autoPublish", True)
    cache_update(lastCompletedStage="uploading")
    _update_status(
        db,
        job_id,
        "publishing" if auto_publish else "completed",
        {
            "audioPath": storage_path,
            "audioDurationSec": duration_sec,
        },
        last_completed="uploading",
    )

    # Step 6: Publish (or skip if auto-publish is off)
    job_data_with_title = {**job_data, "_resolvedTitle": generated_title}

    if auto_publish:
        stage_tracker["current"] = "publishing"
        content_id = publish_content(
            db, storage_path, duration_sec, formatted_script, job_data_with_title
        )
        _update_status(db, job_id, "completed", {
            "audioPath": storage_path,
            "audioDurationSec": duration_sec,
            "publishedContentId": content_id,
            "completedAt": fs.SERVER_TIMESTAMP,
            "resumeAvailable": False,
            "failedStage": None,
        }, last_completed="publishing")
        logger.info(
            "Job completed (published)",
            extra={"job_id": job_id, "content_id": content_id},
        )
        record_job_metric(db, job_id, job_data, "completed")
    else:
        # Mark as completed but without publishing
        _update_status(db, job_id, "completed", {
            "audioPath": storage_path,
            "audioDurationSec": duration_sec,
            "completedAt": fs.SERVER_TIMESTAMP,
            "resumeAvailable": False,
            "failedStage": None,
        }, last_completed="uploading")
        logger.info(
            "Job completed (awaiting approval)",
            extra={"job_id": job_id},
        )
        record_job_metric(db, job_id, job_data, "completed")

    cleanup(job_id)
