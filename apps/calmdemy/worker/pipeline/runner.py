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
from .course_runner import process_course_job


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

    try:
        # Step 1: LLM — generate script
        _update_status(db, job_id, "llm_generating")
        script = generate_script(job_data)

        # Step 1b: Generate title if not provided by admin
        generated_title = None
        admin_title = job_data.get("title", "").strip()
        if admin_title:
            generated_title = admin_title
            print(f"  [pipeline] Using admin-provided title: {generated_title}")
        else:
            print("  [pipeline] No title provided, generating from LLM...")
            generated_title = _generate_title_from_llm(job_data, script)
            print(f"  [pipeline] Generated title: {generated_title}")

        _update_status(db, job_id, "qa_formatting", {
            "generatedScript": script,
            "generatedTitle": generated_title,
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

        # Step 6: Publish (or skip if auto-publish is off)
        auto_publish = job_data.get("autoPublish", True)
        job_data_with_title = {**job_data, "_resolvedTitle": generated_title}

        if auto_publish:
            _update_status(db, job_id, "publishing")
            content_id = publish_content(
                db, storage_path, duration_sec, formatted_script, job_data_with_title
            )
            _update_status(db, job_id, "completed", {
                "audioPath": storage_path,
                "audioDurationSec": duration_sec,
                "publishedContentId": content_id,
                "completedAt": fs.SERVER_TIMESTAMP,
            })
            print(f"  [pipeline] Job {job_id} completed. Content ID: {content_id}")
        else:
            # Mark as completed but without publishing
            _update_status(db, job_id, "completed", {
                "audioPath": storage_path,
                "audioDurationSec": duration_sec,
                "completedAt": fs.SERVER_TIMESTAMP,
            })
            print(f"  [pipeline] Job {job_id} completed (awaiting approval, not published).")

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        print(f"  [pipeline] Job {job_id} FAILED: {error_msg}")
        traceback.print_exc()
        _update_status(db, job_id, "failed", {"error": error_msg})
