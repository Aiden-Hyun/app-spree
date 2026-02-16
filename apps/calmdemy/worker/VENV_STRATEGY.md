# Local Worker Venv Strategy (Multi-Stack)

## Why This Exists
Some model stacks have **conflicting Python dependencies**. For example:
- `diffusers` (Flux2) requires `huggingface_hub >= 0.34`.
- `moshi` (Kyutai DMS) requires `huggingface_hub < 0.34`.

A single venv cannot satisfy both, so we run **multiple local worker processes**,
**each with its own venv** and a specific role.

## How Stacks Work
Stacks are defined in `worker_stacks.json`. Each stack has:
- `id`: Worker ID (used for `worker_status/<id>`)
- `role`: `pre`, `tts`, or `full`
- `venv`: Path to the venv for this stack
- `ttsModels`: Allowlist for TTS models (only used for `role: tts`)

The companion (`local_companion.py`) starts all enabled stacks and passes these
values via environment variables.

## When to Create a New Venv
Use an existing venv if:
- The model dependencies are compatible with the current stack.
- Adding the model does not require downgrading a shared dependency.

Create a new venv (new stack) if:
- You hit `ResolutionImpossible` in pip.
- The model requires a conflicting version of a shared library
  (example: `huggingface_hub`, `torch`, `transformers`).
- The model requires a different GPU/CUDA setup.

## Adding a New TTS Model Stack
1. Add the model adapter in `worker/models/` and register it in
   `worker/models/registry.py`.
2. Decide whether it fits an existing stack or needs its own venv.
3. If it needs its own venv:
   - Add a new requirements file (or extend `requirements.dms.txt`).
   - Create the venv:
     ```bash
     cd apps/calmdemy/worker
     python3 -m venv .venv-yourmodel
     ./.venv-yourmodel/bin/pip install -r requirements.yourmodel.txt
     ```
4. Add a new stack entry to `worker_stacks.json`:
   ```json
   {"id": "local-tts-yourmodel", "role": "tts", "venv": ".venv-yourmodel", "ttsModels": ["yourmodel"], "enabled": true}
   ```
5. Restart the companion to pick it up.

## Conflict Troubleshooting
### Pip ResolutionImpossible
- Split the dependencies into separate venvs.
- Pin versions explicitly in a dedicated requirements file.
- Avoid installing both `diffusers` and `moshi` in the same venv.

### Missing Binaries
- `ffmpeg`: install via `brew install ffmpeg` or set `FFMPEG_BIN`.
- `piper`: install via `pip install piper-tts` in the base venv.

### Model Loads But Errors at Runtime
- Ensure the stack’s venv includes the model’s **exact** dependency range.
- Confirm `WORKER_TTS_MODELS` includes the model ID.
- Check stack logs: `worker/logs/local_worker_<id>.log`.

## Recommended Defaults
- **Base venv** (`.venv`): LLM + image + common TTS (`piper`, `styletts2`, Gemini TTS).
- **DMS venv** (`.venv-dms`): Kyutai DMS only (`moshi`, `sphn`, `huggingface_hub < 0.34`).

