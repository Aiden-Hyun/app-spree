# Content Factory V2 Scaffold

This package is a migration scaffold for the workflow-engine architecture.

Current status:
- Domain state models and transitions are defined.
- Firestore repositories and step queue primitives exist.
- Worker loop can claim, execute, and complete queue items.
- Single-content step executors are wired (`generate_script` through `publish_content`).
- Compatibility projection updates the legacy `content_jobs` document when `request.compat.content_job_id` is provided.
- Existing production pipeline is still the source of truth.

Planned next steps:
1. Add course fan-out/fan-in executors.
2. Add per-step retry policies (`retry_scheduled` and backoff).
3. Add admin timeline UI sourced from `factory_step_runs`.

## Running From Admin UI (V2 engine)

1. Set `FACTORY_ENGINE=v2` in `worker/.env`.
   - Optional: set `V2_MAX_STEP_RETRIES=2` (default `2`).
2. Start companion as usual (`python local_companion.py`).
3. Use the existing Admin UI to create/publish jobs.

How it works:
- V2 dispatcher claims eligible `content_jobs` (`pending`, `publishing`) and marks them with `engine: "v2"`.
- V2 worker bootstraps a `factory_jobs/{jobId}` document and starts a `factory_job_runs` run.
- Step execution updates both V2 tables and legacy `content_jobs` (compat projection), so current UI continues to function.

Current coverage:
- Single-content types run as decomposed V2 steps.
- Course jobs are currently executed through a legacy wrapped step (`run_course_pipeline` / `publish_course_manual`) while migration continues.
