# Multi-Venv Worker Convention (Normative)

This document is a required architecture convention for the content factory runtime.

## Why This Convention Exists

Some model families require incompatible Python dependency trees. A known example:

- `diffusers`/Flux stack prefers newer `huggingface_hub`.
- Kyutai DMS (`moshi` + `sphn`) requires a different range.

Because of this, a single venv runtime is not a safe default.

## Hard Rules (Must Follow)

1. Do not collapse worker runtime to a single venv if incompatible model sets exist.
2. Keep stack definitions in `worker_stacks.json` as the source of truth.
3. Preserve capability-based routing:
   - only compatible stacks claim synth steps for their `ttsModels`.
   - exactly one enabled stack acts as dispatcher.
4. Keep per-stack venv isolation (`venv` path per stack).
5. During refactors, retain backward-compatible normalization for legacy stack manifests.

## Stack Manifest Contract

`worker_stacks.json` entries use:

- `id`: worker/stack identifier (used in status + logs)
- `role`: operator label (`v2`, `tts`, etc.)
- `venv`: venv path (relative to `worker/` or absolute)
- `enabled`: stack participates in runtime
- `dispatch`: this stack may dispatch `content_jobs` into V2 runs
- `acceptNonTtsSteps`: stack can claim non-synth queue steps
- `ttsModels`: allowed TTS model IDs for synth steps (supports `"*"`)

## Default Production Shape

Two-stack default:

1. `local-primary`
   - `venv: .venv`
   - `dispatch: true`
   - `acceptNonTtsSteps: true`
   - `ttsModels: [piper, styletts2, gemini-tts-flash, gemini-tts-pro]`
2. `local-tts-dms`
   - `venv: .venv-dms`
   - `dispatch: false`
   - `acceptNonTtsSteps: false`
   - `ttsModels: [dms]`

## When to Add a New Venv

Create a new venv + stack if:

- pip resolver conflicts (`ResolutionImpossible`)
- model requires conflicting core libs (`torch`, `transformers`, `huggingface_hub`)
- model requires a distinct native/system dependency surface

## Refactor Checklist (Required)

Any content-factory runtime refactor must include:

1. Dependency conflict review across all registered models.
2. Confirmation that `worker_stacks.json` + capability routing still function.
3. Validation that synth steps route to compatible stack/venv.
4. Smoke run for at least one model from each isolated venv.

## Operations

- Restart companion after stack config changes.
- Validate stack health in admin (`worker_stacks_status` + per-stack logs).
- If a model has no capable enabled stack, runtime should fail fast with clear error.
