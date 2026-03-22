from __future__ import annotations

from firebase_admin import firestore as fs


_COMPAT_STAGE_BY_STEP = {
    "generate_script": "llm_generating",
    "format_script": "qa_formatting",
    "generate_image": "image_generating",
    "synthesize_audio": "tts_converting",
    "post_process_audio": "post_processing",
    "upload_audio": "uploading",
    "publish_content": "publishing",
    "generate_course_plan": "llm_generating",
    "generate_course_scripts": "llm_generating",
    "format_course_scripts": "qa_formatting",
    "generate_course_thumbnail": "image_generating",
    "synthesize_course_audio_chunk": "tts_converting",
    "synthesize_course_audio": "tts_converting",
    "upload_course_audio": "uploading",
    "publish_course": "publishing",
}


def compat_failed_stage(step_name: str) -> str:
    return _COMPAT_STAGE_BY_STEP.get(step_name, "pending")


def patch_running_status(job_repo, content_job_id: str, run_id: str, step_name: str) -> None:
    job_repo.patch_compat_content_job_for_run(
        content_job_id,
        run_id,
        {
            "status": compat_failed_stage(step_name),
            "jobRunId": run_id,
            "lastRunStatus": "running",
            "runEndedAt": None,
        },
    )


def patch_failed_status(
    job_repo,
    content_job_id: str,
    run_id: str,
    step_name: str,
    *,
    error_msg: str,
    error_code: str,
) -> None:
    job_repo.patch_compat_content_job_for_run(
        content_job_id,
        run_id,
        {
            "status": "failed",
            "error": error_msg,
            "errorCode": error_code,
            "failedStage": compat_failed_stage(step_name),
            "jobRunId": run_id,
            "lastRunStatus": "failed",
            "runEndedAt": fs.SERVER_TIMESTAMP,
        },
    )
