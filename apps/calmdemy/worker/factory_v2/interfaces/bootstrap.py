from __future__ import annotations

from firebase_admin import firestore as fs

from ..application.orchestrator import Orchestrator
from ..infrastructure.firestore_repos import (
    FirestoreJobRepo,
    FirestoreRunRepo,
    FirestoreStepRunRepo,
)
from ..infrastructure.queue_repo import FirestoreQueueRepo


def _extract_runtime(content_job: dict) -> dict:
    return {
        "generated_script": content_job.get("generatedScript"),
        "formatted_script": content_job.get("formattedScript"),
        "generated_title": content_job.get("generatedTitle") or content_job.get("title"),
        "image_prompt": content_job.get("imagePrompt"),
        "image_path": content_job.get("imagePath"),
        "thumbnail_url": content_job.get("thumbnailUrl"),
        "image_model": content_job.get("imageModel"),
        "storage_path": content_job.get("audioPath"),
        "duration_sec": content_job.get("audioDurationSec"),
        "published_content_id": content_job.get("publishedContentId"),
    }


def bootstrap_from_content_job(db, content_job_id: str, content_job: dict | None = None) -> str:
    """
    Create/merge a factory_v2 job from an existing content_jobs doc and start a run.

    Returns the V2 run id.
    """
    source_ref = db.collection("content_jobs").document(content_job_id)

    if content_job is None:
        source_snap = source_ref.get()
        if not source_snap.exists:
            raise KeyError(f"content_jobs/{content_job_id} not found")
        content_job = source_snap.to_dict() or {}

    content_type = content_job.get("contentType", "guided_meditation")
    status = content_job.get("status", "pending")
    is_course = content_type == "course"

    trigger = "bootstrap"
    first_step = "run_course_pipeline" if is_course else None
    if status == "publishing":
        trigger = "manual_publish"
        first_step = "publish_course_manual" if is_course else "publish_content"

    v2_job_id = content_job_id
    db.collection("factory_jobs").document(v2_job_id).set(
        {
            "job_type": "course" if is_course else "single_content",
            "request": {
                "content_job": content_job,
                "compat": {
                    "content_job_id": content_job_id,
                },
            },
            "runtime": _extract_runtime(content_job),
            "current_state": "queued",
            "updated_at": fs.SERVER_TIMESTAMP,
            "created_at": fs.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    job_repo = FirestoreJobRepo(db)
    run_repo = FirestoreRunRepo(db)
    step_run_repo = FirestoreStepRunRepo(db)
    queue_repo = FirestoreQueueRepo(db)
    orchestrator = Orchestrator(job_repo, run_repo, step_run_repo, queue_repo)

    run_id = orchestrator.start_new_run(
        v2_job_id,
        trigger=trigger,
        first_step=first_step,
    )

    source_ref.set(
        {
            "engine": "v2",
            "v2JobId": v2_job_id,
            "v2RunId": run_id,
            "updatedAt": fs.SERVER_TIMESTAMP,
        },
        merge=True,
    )
    return run_id
