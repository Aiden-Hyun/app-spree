---
name: Split backend per component
overview: Replace single `backend` with separate `llmBackend` + `ttsBackend`, mark Cloud as unavailable (legacy), default to Local, and make the local worker the primary job processor.
todos:
  - id: types-split
    content: Replace `backend` with `llmBackend` + `ttsBackend` in types.ts, reorder to local-first, add AVAILABLE_BACKENDS (local + api only)
    status: completed
  - id: models-default
    content: Update default backend from 'api' to 'local' in constants/models.ts
    status: completed
  - id: create-ui
    content: Split into two backend selectors (LLM + TTS), only show Local and API, default to local
    status: completed
  - id: repo-fields
    content: Update adminRepository.ts to write llmBackend + ttsBackend
    status: completed
  - id: job-detail
    content: Show LLM Backend and TTS Backend separately in job/[id].tsx
    status: completed
  - id: cloud-fn
    content: "Update cloud-function/main.py: skip unless either backend is 'cloud'"
    status: completed
  - id: vm-worker
    content: Update main.py (no logic change needed, cloud jobs route here if ever used)
    status: completed
  - id: local-worker
    content: Update local_worker.py to be the primary worker, pick up all non-cloud jobs
    status: completed
isProject: false
---

# Split Backend Selection: LLM and TTS Independent, Cloud Disabled

## Summary

- Replace single `backend` with `llmBackend` and `ttsBackend` so you can mix providers (e.g. Gemini API for LLM + local Piper for TTS)
- Cloud is kept in the type system and worker code for legacy/future use, but **hidden from the admin UI** -- only Local and API are selectable
- Default everything to `'local'`; order is always Local, API, (Cloud hidden)
- The local worker becomes the primary processor for all jobs (local + API combos)

## Data Model -- [types.ts](apps/calmdemy/src/features/admin/types.ts)

- Remove `backend: JobBackend` from `ContentJob` and `CreateJobInput`
- Add `llmBackend: JobBackend` and `ttsBackend: JobBackend` to both
- Add `AVAILABLE_BACKENDS: JobBackend[] = ['local', 'api']` (Cloud excluded from UI)
- Keep `'cloud'` in the `JobBackend` union type for legacy compatibility
- Reorder `BACKEND_LABELS` / `BACKEND_DESCRIPTIONS` to local-first

## Models -- [constants/models.ts](apps/calmdemy/src/features/admin/constants/models.ts)

- Change default argument of `getDefaultLLMModel()` and `getDefaultTTSModel()` from `'api'` to `'local'`
- No other changes (cloud models stay in the registry but won't appear in UI since Cloud backend is hidden)

## Admin Create Screen -- [create.tsx](apps/calmdemy/app/admin/create.tsx)

- Remove the single top-level "Backend" segmented control
- In the "Model Configuration" section, add two backend selectors:
- **LLM Backend** (Local / API) above the LLM model chips
- **TTS Backend** (Local / API) above the TTS model chips
- Use `AVAILABLE_BACKENDS` for the selector options (Cloud not shown)
- State: `llmBackend` default `'local'`, `ttsBackend` default `'local'`
- Each backend change resets its respective model selection
- Submit writes `llmBackend` + `ttsBackend`

## Admin Repository -- [adminRepository.ts](apps/calmdemy/src/features/admin/data/adminRepository.ts)

- Replace `backend: input.backend` with `llmBackend: input.llmBackend, ttsBackend: input.ttsBackend`

## Job Detail Screen -- [job/\[id\].tsx](apps/calmdemy/app/admin/job/[id].tsx)

- Replace single "Backend" row with "LLM Backend" and "TTS Backend" rows

## Cloud Function -- [cloud-function/main.py](apps/calmdemy/worker/cloud-function/main.py)

- Read `llmBackend` and `ttsBackend` from the event
- Only start VM if either is `"cloud"`; otherwise skip (local worker handles it)
- In practice this means the function almost never starts the VM

## VM Worker -- [main.py](apps/calmdemy/worker/main.py)

- Stays as-is for legacy. It already picks up cloud jobs. Minimal change to read `llmBackend`/`ttsBackend` instead of `backend`

## Local Worker -- [local_worker.py](apps/calmdemy/worker/local_worker.py)

- Becomes the **primary** worker
- Polls for all pending jobs where neither backend is `"cloud"` (local + api combos)
- Query `status == "pending"`, filter out `cloud` in Python
