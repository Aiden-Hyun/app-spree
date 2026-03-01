# Content Factory V2

Content Factory now runs on a V2-only workflow engine.

## Overview

- `content_jobs` remains the external/admin contract.
- Execution state is tracked in `factory_jobs`, `factory_job_runs`, `factory_step_runs`, `factory_step_queue`, and `factory_events`.
- The worker projects compatibility fields back to `content_jobs` so existing admin screens keep working.

## Workflows

### Single content

1. `generate_script`
2. `format_script`
3. `generate_image`
4. `synthesize_audio`
5. `post_process_audio`
6. `upload_audio`
7. `publish_content`

### Course

1. `generate_course_plan`
2. `generate_course_thumbnail`
3. `generate_course_scripts`
4. `format_course_scripts`
5. `synthesize_course_audio`
6. `upload_course_audio`
7. `publish_course`

## Running locally

1. Start companion as usual: `python local_companion.py`
2. Ensure worker control desired state is `running` or `auto`.
3. Create jobs from Admin UI.

Companion starts `local_worker.py` (V2 runtime) only.

## Runtime flags

- `V2_ENABLE_DISPATCH` (default: `true`)
- `V2_POLL_INTERVAL_SECONDS` (default: `1.0`)
- `V2_MAX_STEP_RETRIES` (default: `2`)
- `V2_STACK_ID` (default: `local-v2`)
- `V2_VENV` (default: `.venv`)
