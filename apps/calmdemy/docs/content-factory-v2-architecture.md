# Content Factory V2 Architecture Proposal

This proposal replaces the current status-driven monolith with an explicit workflow engine that is idempotent, observable, and easy to debug.

## Why redesign (from current scan)

Current architecture pain points observed in code:

1. State model is ambiguous and inconsistent.
- `status: "publishing"` is used as both a stage and a manual publish queue marker ([worker/pipeline/stages.py](/Users/aidenhyun/app-spree/apps/calmdemy/worker/pipeline/stages.py:112), [src/features/admin/data/adminRepository.ts](/Users/aidenhyun/app-spree/apps/calmdemy/src/features/admin/data/adminRepository.ts:365)).
- A hidden status `publishing_in_progress` is written but not represented in UI typing/state model ([worker/worker_publish.py](/Users/aidenhyun/app-spree/apps/calmdemy/worker/worker_publish.py:45), [src/features/admin/types.ts](/Users/aidenhyun/app-spree/apps/calmdemy/src/features/admin/types.ts:5)).

2. Orchestration logic is duplicated and spread.
- Single-content flow split across runner + stages + publish worker.
- Course flow is a 600+ line specialized orchestration with custom resume logic ([worker/pipeline/course_runner.py](/Users/aidenhyun/app-spree/apps/calmdemy/worker/pipeline/course_runner.py:314)).

3. Workflow state is implicit and mutation-heavy.
- Job document doubles as command input, orchestration state, artifacts index, and UI projection.
- Recovery depends on local disk cache paths and mutable `lastCompletedStage` instead of durable step execution records ([worker/pipeline/runner.py](/Users/aidenhyun/app-spree/apps/calmdemy/worker/pipeline/runner.py:59)).

4. No strict contract boundary.
- Runtime `dict` everywhere; no schema validation for job payloads or step outputs.
- Private helper `_get_llm_adapter` used across modules, coupling internals ([worker/pipeline/llm_generator.py](/Users/aidenhyun/app-spree/apps/calmdemy/worker/pipeline/llm_generator.py:68)).

5. Debugging is log-first, not model-first.
- You can read logs, but you cannot inspect a complete per-step execution timeline and inputs/outputs from Firestore without parsing many fields.

## Target architecture (V2)

### 1) Split control plane from execution plane

Control plane (Firestore docs):
- `factory_jobs/{jobId}`: immutable request + high-level status summary.
- `factory_job_runs/{runId}`: one run per attempt.
- `factory_step_runs/{stepRunId}`: one record per executed step (durable timeline).
- `factory_artifacts/{artifactId}`: typed artifact registry (script, image, audio, publish IDs).
- `factory_events/{eventId}`: append-only domain events.

Execution plane (workers):
- Stateless step executors with a lease-based task queue.
- Workers only execute one step, produce typed outputs, emit events.

### 2) Replace ad hoc statuses with explicit state machine

Job-level states:
- `queued`
- `running`
- `awaiting_approval`
- `completed`
- `failed`
- `cancelled`

Step-level states:
- `ready`
- `leased`
- `running`
- `succeeded`
- `failed`
- `retry_scheduled`
- `dead_letter`

Important: publish approval becomes a distinct gate (`awaiting_approval`) instead of overloading `publishing`.

### 3) Workflow definition as DAG

Define each content type as a DAG spec, not hand-coded orchestration.
- Single content DAG:
  - `generate_script -> format_script -> generate_image -> synthesize_audio -> post_process_audio -> upload_audio -> publish_content`
- Course DAG:
  - `generate_course_plan`
  - fan-out `generate_session_script[N] -> format_session_script[N] -> synthesize_session_audio[N] -> upload_session_audio[N]`
  - fan-in `publish_course`

All retries/resume come from step state in `factory_step_runs`, not from inferred status fields.

### 4) Typed contracts at each boundary

Introduce typed models (Pydantic):
- `JobRequest`
- `WorkflowInput`
- `StepInput` / `StepOutput`
- `ArtifactRef`

Each step:
- validates inputs
- is idempotent with `idempotency_key`
- writes deterministic output payload + artifact refs

### 5) Idempotency and exactly-once effects

For external side effects (Storage upload, Firestore publish):
- Generate deterministic keys from `(job_id, run_id, step_name, shard_key)`.
- Write side-effect receipts in `factory_artifacts`.
- On retry, return existing receipt instead of re-executing side effect.

### 6) Observability-first design

For every step run, persist:
- `step_name`, `attempt`, `worker_id`, `lease_id`
- start/end timestamps, duration
- normalized error code + message + stack hash
- input fingerprint + output fingerprint
- links to logs/artifacts

Admin UI should read `factory_step_runs` to show a real timeline (not inferred from one status field).

### 7) Queue + leasing model

Use a dedicated `factory_step_queue` collection (or Pub/Sub/Cloud Tasks later) with:
- `available_at`
- `lease_expires_at`
- `lease_owner`
- `retry_count`

Worker loop:
1. Claim next ready step transactionally with lease.
2. Mark `running`.
3. Execute with timeout + cancellation token.
4. Emit `succeeded` or `retry_scheduled`/`dead_letter`.
5. Trigger scheduler to enqueue downstream steps when dependencies complete.

This replaces broad polling by job status and removes hidden coupling between pre/tts/course workers.

## Code organization proposal

Create a new package under `worker/factory_v2/`:

- `domain/`
  - `entities.py` (Job, Run, StepRun, Artifact)
  - `events.py`
  - `errors.py`
  - `state_machine.py`
- `application/`
  - `scheduler.py` (DAG + dependency resolution)
  - `orchestrator.py` (run lifecycle)
  - `commands.py` (enqueue, retry, cancel, approve)
- `steps/`
  - `generate_script.py`
  - `format_script.py`
  - `generate_image.py`
  - `synthesize_audio.py`
  - `post_process_audio.py`
  - `upload_audio.py`
  - `publish_content.py`
  - `course/*.py`
- `infrastructure/`
  - `firestore_repos.py`
  - `storage_gateway.py`
  - `model_gateways.py`
  - `queue_repo.py`
  - `lease_manager.py`
- `interfaces/`
  - `worker_main.py`
  - `admin_handlers.py`

Legacy modules remain until migration completes.

## Firestore schema (V2)

`factory_jobs/{jobId}`
- `job_type`
- `request` (immutable)
- `current_state`
- `current_run_id`
- `created_at`, `updated_at`
- `summary` (progress %, failed step, published ids)

`factory_job_runs/{runId}`
- `job_id`
- `run_number`
- `state`
- `started_at`, `ended_at`
- `trigger` (`new`, `retry`, `manual_publish`)

`factory_step_runs/{stepRunId}`
- `job_id`, `run_id`, `step_name`, `shard_key`
- `state`, `attempt`
- `lease_owner`, `lease_expires_at`
- `input_ref`, `output_ref`
- `error_code`, `error_message`, `error_fingerprint`
- `started_at`, `ended_at`, `duration_ms`

`factory_artifacts/{artifactId}`
- `kind` (`script`, `image`, `audio`, `publish_receipt`)
- `storage_path` or inline payload pointer
- `producer_step_run_id`
- `checksum`

## Failure handling policy

- Step-level retries with per-step policy (max attempts, backoff).
- Fatal validation errors go directly to `dead_letter` with root cause.
- Job fails only when a required step reaches `dead_letter`.
- Manual retry creates a new run (`run_number + 1`) and reuses successful artifacts when compatible.

## Admin UI contract changes

Keep `content_jobs` temporarily as compatibility projection, but source of truth is V2 tables.

New UI capabilities:
- Timeline view from `factory_step_runs`.
- Explicit approval state (`awaiting_approval`).
- Retry only failed step vs retry whole run.
- Error taxonomy (`provider_timeout`, `invalid_output_json`, `storage_upload_failed`, etc.).

## Migration plan

### Phase 0 (1 week): Stabilization in current system
- Add strict status enum sync across worker + app.
- Remove/replace `publishing_in_progress` mismatch.
- Add structured error codes.

### Phase 1 (2 weeks): Introduce V2 scaffolding in parallel
- Add V2 collections and repositories.
- Implement DAG scheduler + queue + lease manager.
- Implement 2-3 steps end-to-end (`generate_script`, `format_script`, `generate_image`).

### Phase 2 (2-3 weeks): Full step port
- Port audio/upload/publish steps.
- Port course fan-out/fan-in as DAG shards.
- Build compatibility projection back to existing `content_jobs` fields.

### Phase 3 (1-2 weeks): UI timeline + operations
- Admin timeline from `factory_step_runs`.
- Add run-level and step-level retry controls.
- Add dead-letter inspection panel.

### Phase 4: Cutover
- Route new jobs to V2 only.
- Keep legacy runner read-only for old jobs.
- Remove legacy orchestration after burn-in.

## Test strategy (required for V2)

1. State machine unit tests:
- valid/invalid transitions
- cancellation and approval gates

2. Step contract tests:
- input validation
- idempotency behavior
- retry classification

3. Integration tests with Firestore emulator:
- lease contention
- duplicate worker claims
- crash + resume semantics

4. Golden tests for course DAG:
- fan-out count, fan-in publish preconditions
- partial completion + resume

## Immediate fixes worth doing now (before V2)

1. Normalize publishing states now (single enum set) to remove hidden stuck paths.
2. Add `job_run_id` and `step_name` to every log line.
3. Move per-step output fields into a `jobArtifacts` map to reduce top-level mutation.
4. Add one Firestore-backed `step_runs` audit record per stage in existing runner as an interim bridge.

## Implemented progress (current)

- Added run tracing fields in current pipeline (`jobRunId`, `runAttempt`, `lastRunStatus`).
- Added structured `errorCode` classification in current pipeline failures.
- Replaced undocumented publish state with publish lease fields (`publishInProgress`, `publishLeaseOwner`, `publishLeaseExpiresAt`).
- Added interim Firestore step audit records to `factory_step_runs`.
- Added `worker/factory_v2/` executable scaffold:
  - queue claim + lease worker loop,
  - auto-dispatcher from `content_jobs` to V2 jobs,
  - orchestrator with dependency-aware enqueue,
  - step-level retry/backoff (`retry_scheduled`) for transient failures,
  - single-content step executors,
  - course legacy-wrapper executors (`run_course_pipeline`, `publish_course_manual`),
  - bootstrap utility from existing `content_jobs`.
- Added engine switch for companion stacks via `FACTORY_ENGINE=v2`.
