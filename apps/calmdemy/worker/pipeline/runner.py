"""
Pipeline runner — orchestrates all steps for a single content job.
"""

import os

from firebase_admin import firestore as fs

from .qa_formatter import format_script
from .storage_uploader import upload_image
from .stages import update_job_status as _update_status, run_tts_through_publish
from .metrics import record_job_metric
from .error_codes import classify_error
import config
from observability import get_logger
from .job_cache import (
    ensure_cache_dir,
    load_state,
    save_state,
    write_text,
    read_text,
    cleanup,
    has_cache,
)

logger = get_logger(__name__)


def _with_run(extra: dict | None, job_run_id: str | None) -> dict | None:
    if not job_run_id:
        return extra
    payload = dict(extra or {})
    payload.setdefault("jobRunId", job_run_id)
    return payload


def _set_status(
    db,
    job_id: str,
    status: str,
    job_run_id: str | None,
    extra: dict | None = None,
    last_completed: str | None = None,
):
    _update_status(
        db,
        job_id,
        status,
        _with_run(extra, job_run_id),
        last_completed=last_completed,
    )


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


def _prepare_cache(job_id: str, job_data: dict):
    cache_state = load_state(job_id) or {}
    if cache_state and not _cache_matches_job(job_data, cache_state):
        logger.info("Cache model/voice mismatch; clearing cached artifacts.")
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

    return cache_state, _cache_update, _cache_file


def _run_pre_stage(
    db,
    job_id: str,
    job_data: dict,
    cache_state: dict,
    cache_update,
    cache_file,
    stage_tracker: dict,
    job_run_id: str | None,
):
    from .llm_generator import generate_script
    from .image_generator import build_image_prompt, generate_image

    # Step 1: LLM — generate script (or reuse cached)
    stage_tracker["current"] = "llm_generating"
    _set_status(db, job_id, "llm_generating", job_run_id)

    script = job_data.get("generatedScript") or read_text(job_id, "generated_script.txt")
    if not script:
        script = generate_script(job_data)

    # Persist script to cache if missing
    script_path = cache_file("generatedScriptPath")
    if not script_path:
        script_path = write_text(job_id, "generated_script.txt", script)

    # Step 1b: Resolve title
    admin_title = job_data.get("title", "").strip()
    if admin_title:
        generated_title = admin_title
        logger.info(
            "Using admin-provided title",
            extra={"job_id": job_id, "generated_title": generated_title},
        )
    else:
        generated_title = job_data.get("generatedTitle") or cache_state.get("generatedTitle")
        if not generated_title:
            logger.info("No title provided, generating from LLM...", extra={"job_id": job_id})
            generated_title = _generate_title_from_llm(job_data, script)
            logger.info(
                "Generated title",
                extra={"job_id": job_id, "generated_title": generated_title},
            )

    cache_update(
        generatedScriptPath=script_path,
        generatedTitle=generated_title,
        lastCompletedStage="llm_generating",
    )

    _set_status(
        db,
        job_id,
        "qa_formatting",
        job_run_id,
        {
            "generatedScript": script,
            "generatedTitle": generated_title,
        },
        last_completed="llm_generating",
    )

    # Step 2: QA — validate and format
    stage_tracker["current"] = "qa_formatting"
    formatted_script = format_script(script, job_data)
    cache_update(lastCompletedStage="qa_formatting")
    _set_status(db, job_id, "image_generating", job_run_id, last_completed="qa_formatting")

    # Step 2b: Image generation — thumbnail (or reuse cached)
    stage_tracker["current"] = "image_generating"
    thumbnail_url = job_data.get("thumbnailUrl") or cache_state.get("thumbnailUrl")
    image_path = job_data.get("imagePath") or cache_state.get("imagePath")
    image_prompt = job_data.get("imagePrompt") or cache_state.get("imagePrompt")

    if thumbnail_url:
        logger.info("Reusing cached thumbnail URL.", extra={"job_id": job_id})
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
    cache_update(
        imagePrompt=image_prompt,
        imagePath=image_path,
        thumbnailUrl=thumbnail_url,
        imageModel=config.IMAGE_MODEL_ID,
        lastCompletedStage="image_generating",
    )

    return formatted_script, generated_title, job_data


def _resolve_formatted_script(job_id: str, job_data: dict) -> str:
    formatted = job_data.get("formattedScript")
    if formatted:
        return formatted
    script = job_data.get("generatedScript") or read_text(job_id, "generated_script.txt")
    if not script:
        raise RuntimeError("Missing generatedScript; re-run the pre stage first.")
    return format_script(script, job_data)


def process_job_pre(db, job_id: str, job_data: dict):
    """Run the pre (LLM+QA+image) stages, then hand off to TTS."""
    # Route course jobs to the dedicated course runner
    if job_data.get("contentType") == "course":
        from .course_runner import process_course_job
        process_course_job(db, job_id, job_data)
        return

    job_run_id = job_data.get("jobRunId")

    # If a previous attempt already produced the pre-stage outputs, resume at TTS.
    if job_data.get("formattedScript") and job_data.get("thumbnailUrl"):
        _set_status(
            db,
            job_id,
            "tts_pending",
            job_run_id,
            {
                "formattedScript": job_data.get("formattedScript"),
                "imagePrompt": job_data.get("imagePrompt"),
                "imagePath": job_data.get("imagePath"),
                "thumbnailUrl": job_data.get("thumbnailUrl"),
                "imageModel": job_data.get("imageModel"),
                "generatedTitle": job_data.get("generatedTitle") or job_data.get("title"),
                "ttsPendingAt": fs.SERVER_TIMESTAMP,
            },
            last_completed=job_data.get("lastCompletedStage") or "image_generating",
        )
        logger.info("Job resumed at tts_pending", extra={"job_id": job_id})
        return

    cache_state, cache_update, cache_file = _prepare_cache(job_id, job_data)
    stage_tracker = {"current": "llm_generating"}

    try:
        formatted_script, generated_title, job_data = _run_pre_stage(
            db,
            job_id,
            job_data,
            cache_state,
            cache_update,
            cache_file,
            stage_tracker,
            job_run_id,
        )

        _set_status(
            db,
            job_id,
            "tts_pending",
            job_run_id,
            {
                "formattedScript": formatted_script,
                "imagePrompt": job_data.get("imagePrompt"),
                "imagePath": job_data.get("imagePath"),
                "thumbnailUrl": job_data.get("thumbnailUrl"),
                "imageModel": job_data.get("imageModel"),
                "generatedTitle": generated_title,
                "ttsPendingAt": fs.SERVER_TIMESTAMP,
            },
            last_completed="image_generating",
        )

        logger.info("Job ready for TTS", extra={"job_id": job_id})

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        error_code = classify_error(e)
        logger.exception(
            "Job failed",
            extra={
                "job_id": job_id,
                "job_run_id": job_run_id,
                "stage": stage_tracker["current"],
                "error": error_msg,
                "error_code": error_code,
            },
        )
        _set_status(
            db,
            job_id,
            "failed",
            job_run_id,
            {
                "error": error_msg,
                "errorCode": error_code,
                "failedStage": stage_tracker["current"],
                "resumeAvailable": has_cache(job_id),
            },
        )
        record_job_metric(db, job_id, job_data, "failed", stage_tracker["current"], error_msg)


def process_job_tts(db, job_id: str, job_data: dict):
    """Run the TTS + post-processing + upload + publish stages."""
    if job_data.get("contentType") == "course":
        raise RuntimeError("Course jobs are not supported in the TTS-only stage.")
    job_run_id = job_data.get("jobRunId")
    cache_state, cache_update, cache_file = _prepare_cache(job_id, job_data)
    stage_tracker = {"current": "tts_converting"}

    try:
        formatted_script = _resolve_formatted_script(job_id, job_data)

        _set_status(
            db,
            job_id,
            "tts_converting",
            job_run_id,
            {
                "formattedScript": formatted_script,
            },
            last_completed=job_data.get("lastCompletedStage") or "image_generating",
        )

        resolved_title = job_data.get("generatedTitle") or job_data.get("title", "")
        run_tts_through_publish(
            db, job_id, job_data, formatted_script, resolved_title,
            cache_state, cache_update, cache_file, stage_tracker, job_run_id=job_run_id,
        )

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        error_code = classify_error(e)
        logger.exception(
            "Job failed",
            extra={
                "job_id": job_id,
                "job_run_id": job_run_id,
                "stage": stage_tracker["current"],
                "error": error_msg,
                "error_code": error_code,
            },
        )
        _set_status(
            db,
            job_id,
            "failed",
            job_run_id,
            {
                "error": error_msg,
                "errorCode": error_code,
                "failedStage": stage_tracker["current"],
                "resumeAvailable": has_cache(job_id),
            },
        )
        record_job_metric(db, job_id, job_data, "failed", stage_tracker["current"], error_msg)


def process_job(db, job_id: str, job_data: dict):
    """Run the full pipeline for one content job."""
    # Route course jobs to the dedicated course runner
    if job_data.get("contentType") == "course":
        from .course_runner import process_course_job
        process_course_job(db, job_id, job_data)
        return

    job_run_id = job_data.get("jobRunId")
    cache_state, cache_update, cache_file = _prepare_cache(job_id, job_data)
    stage_tracker = {"current": "llm_generating"}

    try:
        formatted_script, generated_title, job_data = _run_pre_stage(
            db,
            job_id,
            job_data,
            cache_state,
            cache_update,
            cache_file,
            stage_tracker,
            job_run_id,
        )

        _set_status(
            db,
            job_id,
            "tts_converting",
            job_run_id,
            {
                "formattedScript": formatted_script,
                "imagePrompt": job_data.get("imagePrompt"),
                "imagePath": job_data.get("imagePath"),
                "thumbnailUrl": job_data.get("thumbnailUrl"),
                "imageModel": job_data.get("imageModel"),
                "generatedTitle": generated_title,
            },
            last_completed="image_generating",
        )

        run_tts_through_publish(
            db, job_id, job_data, formatted_script, generated_title,
            cache_state, cache_update, cache_file, stage_tracker, job_run_id=job_run_id,
        )

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        error_code = classify_error(e)
        logger.exception(
            "Job failed",
            extra={
                "job_id": job_id,
                "job_run_id": job_run_id,
                "stage": stage_tracker["current"],
                "error": error_msg,
                "error_code": error_code,
            },
        )
        _set_status(
            db,
            job_id,
            "failed",
            job_run_id,
            {
                "error": error_msg,
                "errorCode": error_code,
                "failedStage": stage_tracker["current"],
                "resumeAvailable": has_cache(job_id),
            },
        )
        record_job_metric(db, job_id, job_data, "failed", stage_tracker["current"], error_msg)
