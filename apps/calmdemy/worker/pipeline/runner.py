"""
Pipeline runner — orchestrates all steps for a single content job.
"""

import os
import traceback

from firebase_admin import firestore as fs

from .llm_generator import generate_script
from .qa_formatter import format_script
from .tts_converter import convert_to_audio
from .audio_processor import post_process_audio
from .storage_uploader import upload_audio, upload_image
from .content_publisher import publish_content
from .course_runner import process_course_job
from .image_generator import (
    build_image_prompt,
    generate_image,
    DEFAULT_FALLBACK_URL,
)
import config
from .job_cache import (
    ensure_cache_dir,
    load_state,
    save_state,
    write_text,
    read_text,
    save_artifact,
    cleanup,
    has_cache,
)


def _update_status(
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
    db.collection("content_jobs").document(job_id).update(data)


def _cache_matches_job(job_data: dict, cache_state: dict) -> bool:
    """Return False if cache model/voice metadata conflicts with current job."""
    if not cache_state:
        return True
    for key in ("llmModel", "ttsModel", "ttsVoice"):
        cached = cache_state.get(key)
        current = job_data.get(key)
        if cached and current and cached != current:
            return False
    return True


def _generate_title_from_llm(job_data: dict, script: str) -> str:
    """Ask the LLM to generate a short, catchy title for the content."""
    from .llm_generator import _get_llm_adapter
    adapter = _get_llm_adapter(job_data)
    prompt = (
        "You are a content title writer. Given the following meditation/audio script, "
        "generate a short, catchy, and descriptive title (max 8 words). "
        "Return ONLY the title text, nothing else. No quotes, no punctuation at the end.\n\n"
        f"Content type: {job_data.get('contentType', 'guided_meditation')}\n"
        f"Topic: {job_data.get('params', {}).get('topic', '')}\n\n"
        f"Script excerpt:\n{script[:500]}"
    )
    title = adapter.generate(prompt, max_tokens=50).strip().strip('"\'')
    # Clean up: take first line only, cap length
    title = title.split('\n')[0].strip()
    if len(title) > 80:
        title = title[:77] + "..."
    return title


def process_job(db, job_id: str, job_data: dict):
    """Run the full pipeline for one content job."""
    # Route course jobs to the dedicated course runner
    if job_data.get("contentType") == "course":
        process_course_job(db, job_id, job_data)
        return

    cache_state = load_state(job_id) or {}
    if cache_state and not _cache_matches_job(job_data, cache_state):
        print("  [cache] Model/voice mismatch; clearing cached artifacts.")
        cleanup(job_id)
        cache_state = {}

    ensure_cache_dir(job_id)

    def _cache_update(**kwargs):
        cache_state.update(kwargs)
        cache_state.setdefault("llmModel", job_data.get("llmModel"))
        cache_state.setdefault("ttsModel", job_data.get("ttsModel"))
        cache_state.setdefault("ttsVoice", job_data.get("ttsVoice"))
        save_state(job_id, cache_state)

    def _cache_file(path_key: str) -> str | None:
        path = cache_state.get(path_key)
        if path and os.path.isfile(path):
            return path
        return None

    current_stage = "llm_generating"
    try:
        # Step 1: LLM — generate script (or reuse cached)
        _update_status(db, job_id, "llm_generating")

        script = job_data.get("generatedScript") or read_text(job_id, "generated_script.txt")
        if not script:
            script = generate_script(job_data)

        # Persist script to cache if missing
        script_path = _cache_file("generatedScriptPath")
        if not script_path:
            script_path = write_text(job_id, "generated_script.txt", script)

        # Step 1b: Resolve title
        admin_title = job_data.get("title", "").strip()
        if admin_title:
            generated_title = admin_title
            print(f"  [pipeline] Using admin-provided title: {generated_title}")
        else:
            generated_title = job_data.get("generatedTitle") or cache_state.get("generatedTitle")
            if not generated_title:
                print("  [pipeline] No title provided, generating from LLM...")
                generated_title = _generate_title_from_llm(job_data, script)
                print(f"  [pipeline] Generated title: {generated_title}")

        _cache_update(
            generatedScriptPath=script_path,
            generatedTitle=generated_title,
            lastCompletedStage="llm_generating",
        )

        _update_status(
            db,
            job_id,
            "qa_formatting",
            {
                "generatedScript": script,
                "generatedTitle": generated_title,
            },
            last_completed="llm_generating",
        )

        # Step 2: QA — validate and format
        current_stage = "qa_formatting"
        formatted_script = format_script(script, job_data)
        _cache_update(lastCompletedStage="qa_formatting")
        _update_status(db, job_id, "image_generating", last_completed="qa_formatting")

        # Step 2b: Image generation — thumbnail (or reuse cached)
        current_stage = "image_generating"
        thumbnail_url = job_data.get("thumbnailUrl") or cache_state.get("thumbnailUrl")
        image_path = job_data.get("imagePath") or cache_state.get("imagePath")
        image_prompt = job_data.get("imagePrompt") or cache_state.get("imagePrompt")

        if thumbnail_url:
            print("  [image] Reusing cached thumbnail URL.")
        else:
            if not image_prompt:
                image_prompt = build_image_prompt(
                    job_data,
                    generated_title,
                    job_data.get("params", {}).get("topic", ""),
                    job_data.get("contentType", "guided_meditation"),
                )
            local_image_path = generate_image(image_prompt)
            image_path, thumbnail_url = upload_image(local_image_path, job_data)

        job_data = {
            **job_data,
            "imagePrompt": image_prompt,
            "imagePath": image_path,
            "thumbnailUrl": thumbnail_url,
            "imageModel": config.IMAGE_MODEL_ID,
        }
        _cache_update(
            imagePrompt=image_prompt,
            imagePath=image_path,
            thumbnailUrl=thumbnail_url,
            imageModel=config.IMAGE_MODEL_ID,
            lastCompletedStage="image_generating",
        )
        _update_status(
            db,
            job_id,
            "image_generating",
            {
                "imagePrompt": image_prompt,
                "imagePath": image_path,
                "thumbnailUrl": thumbnail_url,
                "imageModel": config.IMAGE_MODEL_ID,
            },
            last_completed="qa_formatting",
        )
        _update_status(db, job_id, "tts_converting", last_completed="image_generating")

        # Step 3: TTS — convert to audio (or reuse cached)
        current_stage = "tts_converting"
        wav_path = _cache_file("wavPath")
        if wav_path:
            print("  [cache] Reusing cached WAV.")
        else:
            wav_path = convert_to_audio(formatted_script, job_data)
            wav_path = save_artifact(job_id, wav_path, "tts_output.wav")
            _cache_update(wavPath=wav_path)
        _cache_update(lastCompletedStage="tts_converting")
        _update_status(db, job_id, "post_processing", last_completed="tts_converting")

        # Step 4: Post-process — normalize and encode (or reuse cached)
        current_stage = "post_processing"
        mp3_path = _cache_file("mp3Path")
        if mp3_path:
            print("  [cache] Reusing cached MP3.")
        else:
            mp3_path = post_process_audio(wav_path)
            mp3_path = save_artifact(job_id, mp3_path, "tts_output.mp3")
            _cache_update(mp3Path=mp3_path)
        _cache_update(lastCompletedStage="post_processing")
        _update_status(db, job_id, "uploading", last_completed="post_processing")

        # Step 5: Upload — push to Firebase Storage (or reuse cached)
        current_stage = "uploading"
        storage_path = job_data.get("audioPath") or cache_state.get("storagePath")
        duration_sec = job_data.get("audioDurationSec") or cache_state.get("durationSec")
        if storage_path:
            print("  [cache] Reusing uploaded audio path.")
        else:
            storage_path, duration_sec = upload_audio(mp3_path, job_data)
            _cache_update(storagePath=storage_path, durationSec=duration_sec)

        # Write audioPath even before publish so a failed publish can resume
        auto_publish = job_data.get("autoPublish", True)
        _cache_update(lastCompletedStage="uploading")
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
            current_stage = "publishing"
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
            print(f"  [pipeline] Job {job_id} completed. Content ID: {content_id}")
        else:
            # Mark as completed but without publishing
            _update_status(db, job_id, "completed", {
                "audioPath": storage_path,
                "audioDurationSec": duration_sec,
                "completedAt": fs.SERVER_TIMESTAMP,
                "resumeAvailable": False,
                "failedStage": None,
            }, last_completed="uploading")
            print(f"  [pipeline] Job {job_id} completed (awaiting approval, not published).")

        cleanup(job_id)

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        print(f"  [pipeline] Job {job_id} FAILED: {error_msg}")
        traceback.print_exc()
        _update_status(db, job_id, "failed", {
            "error": error_msg,
            "failedStage": current_stage,
            "resumeAvailable": has_cache(job_id),
        })
