from __future__ import annotations

from .base import StepContext, StepResult


def _compat_content_job_id(ctx: StepContext) -> str:
    request = ctx.job.get("request") or {}
    compat = request.get("compat") or {}
    content_job_id = compat.get("content_job_id")
    if not content_job_id:
        raise ValueError("request.compat.content_job_id is required")
    return str(content_job_id)


def execute_run_course_pipeline(ctx: StepContext) -> StepResult:
    from pipeline.course_runner import process_course_job

    content_job_id = _compat_content_job_id(ctx)
    snap = ctx.db.collection("content_jobs").document(content_job_id).get()
    if not snap.exists:
        raise KeyError(f"content_jobs/{content_job_id} not found")

    content_job = snap.to_dict() or {}
    process_course_job(ctx.db, content_job_id, {**content_job, "jobRunId": ctx.run_id})

    final_snap = ctx.db.collection("content_jobs").document(content_job_id).get()
    final_data = final_snap.to_dict() or {}

    return StepResult(
        output={
            "status": final_data.get("status"),
            "course_id": final_data.get("courseId"),
            "session_ids": final_data.get("courseSessionIds") or [],
        },
        summary_patch={
            "currentStep": "run_course_pipeline",
            "courseId": final_data.get("courseId"),
        },
        compat_content_job_patch={
            "jobRunId": ctx.run_id,
            "engine": "v2",
        },
    )


def execute_publish_course_manual(ctx: StepContext) -> StepResult:
    from worker_publish import handle_publish_job

    content_job_id = _compat_content_job_id(ctx)
    snap = ctx.db.collection("content_jobs").document(content_job_id).get()
    if not snap.exists:
        raise KeyError(f"content_jobs/{content_job_id} not found")

    content_job = snap.to_dict() or {}
    handle_publish_job(ctx.db, content_job_id, {**content_job, "jobRunId": ctx.run_id})

    final_snap = ctx.db.collection("content_jobs").document(content_job_id).get()
    final_data = final_snap.to_dict() or {}

    return StepResult(
        output={
            "status": final_data.get("status"),
            "course_id": final_data.get("courseId"),
            "session_ids": final_data.get("courseSessionIds") or [],
        },
        summary_patch={
            "currentStep": "publish_course_manual",
            "courseId": final_data.get("courseId"),
        },
        compat_content_job_patch={
            "jobRunId": ctx.run_id,
            "engine": "v2",
        },
    )
