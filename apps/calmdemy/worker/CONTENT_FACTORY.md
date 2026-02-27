# Calmdemy Content Factory — Technical Documentation

## Overview

The Content Factory is an automated pipeline that generates audio content for the Calmdemy app. An admin creates a "job" from a private screen inside the app, specifying what to generate (meditation, story, course, etc.), and a backend worker picks up the job and runs a multi-step pipeline: LLM writes a script, TTS converts it to audio, the audio is post-processed and uploaded, and a Firestore document is created so the content appears in the app.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Firestore Data Model](#2-firestore-data-model)
3. [Admin UI (Mobile)](#3-admin-ui-mobile)
4. [Worker (Python Backend)](#4-worker-python-backend)
5. [Pipeline Steps (Single Item)](#5-pipeline-steps-single-item)
6. [Pipeline Steps (Full Course)](#6-pipeline-steps-full-course)
7. [LLM Backends & Models](#7-llm-backends--models)
8. [TTS Backends & Models](#8-tts-backends--models)
9. [Prompt Templates](#9-prompt-templates)
10. [Storage Conventions](#10-storage-conventions)
11. [Publishing (Firestore Documents)](#11-publishing-firestore-documents)
12. [Running the Worker](#12-running-the-worker)
13. [Extending the System](#13-extending-the-system)

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Calmdemy Mobile App                     │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ Admin Create  │───>│  Firestore   │                   │
│  │   Screen      │    │ content_jobs │                   │
│  └──────────────┘    └──────┬───────┘                   │
│                             │                           │
│  ┌──────────────┐           │  real-time listener       │
│  │ Admin Detail  │<──────────┘                           │
│  │   Screen      │   (status updates)                   │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
                              │
                    polls every ~2s (jittered)
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Local Worker (Mac)                      │
│                  python3 local_worker.py                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Pipeline Runner (per job)                        │   │
│  │                                                    │   │
│  │  1. LLM generates script                          │   │
│  │  2. QA formats script                             │   │
│  │  3. Image generates thumbnail                     │   │
│  │  4. TTS converts to WAV                           │   │
│  │  5. ffmpeg post-processes to MP3                   │   │
│  │  6. Uploads MP3 to Firebase Storage               │   │
│  │  7. Creates Firestore content document            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  LLM adapters:  Ollama | LM Studio | Gemini API        │
│  TTS adapters:  Piper  | DMS  | StyleTTS2 | Gemini TTS API │
└─────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- LLM and TTS backends are selected **independently** per job (e.g. Gemini API for LLM + local Piper for TTS).
- The worker runs on your Mac and polls Firestore. It does not run 24/7 in the cloud.
- All job state lives in Firestore. The mobile app uses real-time listeners so the admin UI updates live as the pipeline progresses.
- Cloud GPU backends (Gemma, Llama, Coqui XTTS) exist in code but are hidden from the UI and effectively decommissioned.

---

## 2. Firestore Data Model

### `content_jobs` collection

Every job is a document in `content_jobs`. The admin UI creates it with `status: "pending"` and the worker picks it up.

| Field | Type | Description |
|---|---|---|
| `status` | string | `pending` → `llm_generating` → `qa_formatting` → `image_generating` → `tts_pending` → `tts_converting` → `post_processing` → `uploading` → `publishing` → `completed` (or `failed`) |
| `llmBackend` | string | `"local"` or `"api"` |
| `ttsBackend` | string | `"local"` or `"api"` |
| `contentType` | string | `guided_meditation`, `sleep_meditation`, `bedtime_story`, `emergency_meditation`, `course_session`, or `course` |
| `params` | map | Job parameters (topic, duration, style, technique, difficulty, etc.) |
| `llmModel` | string | Model ID (e.g. `"ollama-local"`, `"gemini-2.5-flash"`) |
| `ttsModel` | string | Model ID (e.g. `"piper"`, `"gemini-tts-flash"`) |
| `ttsVoice` | string | Voice ID (e.g. `"en_US-amy-medium"`) |
| `title` | string? | Admin-provided title (optional) |
| `autoPublish` | boolean | If true, content is published automatically. If false, awaits manual approval. |
| `generatedScript` | string? | The LLM-generated script text |
| `formattedScript` | string? | QA-formatted script stored for TTS handoff |
| `generatedTitle` | string? | LLM-generated title (if admin didn't provide one) |
| `audioPath` | string? | Firebase Storage path of the final MP3 |
| `audioDurationSec` | number? | Audio duration in seconds |
| `publishedContentId` | string? | Firestore document ID of the published content |
| `imagePrompt` | string? | Optional image prompt (admin-provided or auto-generated) |
| `imagePath` | string? | Firebase Storage path for the thumbnail image |
| `thumbnailUrl` | string? | Public URL for the thumbnail image |
| `imageModel` | string? | Image model ID used for generation |
| `courseProgress` | string? | Course jobs only — e.g. `"Script 3/9"`, `"Audio 5/9"` |
| `coursePlan` | map? | Course jobs only — the structured course plan JSON |
| `courseRawScripts` | map? | Course jobs only — raw scripts by session code (resume support) |
| `courseFormattedScripts` | map? | Course jobs only — formatted scripts by session code (resume support) |
| `courseAudioResults` | map? | Course jobs only — uploaded audio paths by session code (resume support) |
| `courseId` | string? | Course jobs only — published course document ID |
| `courseSessionIds` | array? | Course jobs only — published session document IDs |
| `error` | string? | Error message if `status === "failed"` |
| `createdAt` | timestamp | When the job was created |
| `updatedAt` | timestamp | Last status update |
| `startedAt` | timestamp? | When processing began |
| `ttsPendingAt` | timestamp? | When the job entered `tts_pending` |
| `completedAt` | timestamp? | When processing finished |
| `createdBy` | string | Firebase Auth UID of the admin who created it |

### `subjects` collection

Therapy subjects used for course creation and the "Browse by Therapies" screen.

| Field | Type | Description |
|---|---|---|
| `label` | string | Short label (e.g. `"CBT"`) |
| `fullName` | string | Full name (e.g. `"Cognitive Behavioral Therapy"`) |
| `icon` | string | Ionicons icon name (e.g. `"bulb-outline"`) |
| `color` | string | Hex color (e.g. `"#2DD4BF"`) |
| `description` | string | One-sentence description |

Document IDs are lowercase slugs (e.g. `cbt`, `act`, `dbt`).

### Content collections

Published content lives in these collections (one per content type):

| Collection | Content Type | Key Fields |
|---|---|---|
| `guided_meditations` | Guided Meditation | title, description, audioPath, thumbnailUrl, themes, techniques, difficulty_level, instructor |
| `sleep_meditations` | Sleep Meditation | title, description, audioPath, thumbnailUrl, instructor |
| `bedtime_stories` | Bedtime Story | title, description, audio_url, thumbnail_url, narrator, category |
| `emergency_meditations` | Emergency Meditation | title, description, audioPath, thumbnailUrl, narrator, isFree=true |
| `course_sessions` | Course Session | title, description, audioPath, courseId, code, order, thumbnailUrl |
| `courses` | Full Course | code, title, description, color, icon, subjectId, sessionCount, thumbnailUrl |

---

## 3. Admin UI (Mobile)

The admin UI is an Expo Router stack at `/admin`, gated by an admin role check.

### Authentication

- The `useAdminAuth` hook checks `users/{uid}.role === "admin"` in Firestore.
- If the user is not an admin, the layout redirects to `/`.
- Anonymous users are never admins.

### Screens

**Dashboard** (`/admin/index`)
- Shows stats: Queued / Processing / Done counts.
- Filter chips: All, Pending, Active, Completed, Failed.
- Real-time job list via Firestore `onSnapshot`.
- FAB button (+) to create a new job.

**Create Content** (`/admin/create`, modal)
- **Content Type** dropdown: Guided Meditation, Sleep Meditation, Bedtime Story, Emergency Meditation, Course Session, Full Course.
- For **single items**: Title (optional), Topic, Duration, Difficulty, Style, Technique, Custom Instructions.
- For **courses**: Subject (from Firestore), Course Code (with real-time uniqueness validation), Course Title, Description, Target Audience, Tone, Custom Instructions.
- **Model Configuration**: LLM Backend (segmented control: Local / Gemini API), LLM Model (dropdown), TTS Backend, TTS Model, Voice.
- **Auto-Publish** toggle: ON by default. When OFF, completed jobs wait for manual approval.
- Backends are selected independently — you can use Gemini API for LLM and local Piper for TTS.

**Job Detail** (`/admin/job/[id]`)
- Real-time status with colored label.
- Pipeline stepper visualization (checkmark for done, spinner for active, circle for pending).
- For courses: progress indicator (e.g. "Script 3/9"), course plan display with module/lesson/practice titles.
- Actions: Retry (failed jobs), Cancel (active jobs), Publish (completed jobs with autoPublish=false).

---

## 4. Worker (Python Backend)

### File Structure

```
apps/calmdemy/worker/
├── local_worker.py          # Main entry point — polls Firestore
├── config.py                # Environment-based configuration
├── .env                     # Local env vars (LMSTUDIO_HOST, etc.)
├── service-account-key.json # Firebase credentials (gitignored)
├── requirements.txt         # Python dependencies
├── course_system_prompt.txt # System prompt for course LLM generation
├── prompts/                 # Prompt templates per content type
│   ├── guided_meditation.txt
│   ├── sleep_meditation.txt
│   ├── bedtime_story.txt
│   ├── emergency_meditation.txt
│   └── course_session.txt
├── pipeline/                # Pipeline step modules
│   ├── runner.py            # Main orchestrator (single-item jobs)
│   ├── course_runner.py     # Course orchestrator (9-audio jobs)
│   ├── llm_generator.py     # Step 1: LLM script generation
│   ├── qa_formatter.py      # Step 2: QA and formatting
│   ├── image_generator.py   # Step 3: Image generation (thumbnails)
│   ├── tts_converter.py     # Step 4: TTS conversion (handles pauses)
│   ├── audio_processor.py   # Step 5: ffmpeg normalize + encode MP3
│   ├── storage_uploader.py  # Step 6: Upload to Firebase Storage
│   └── content_publisher.py # Step 7: Create Firestore document
└── models/                  # Model adapters
    ├── registry.py          # Factory for LLM/TTS adapters
    ├── llm_base.py          # Abstract LLM interface
    ├── llm_ollama.py        # Ollama adapter
    ├── llm_lmstudio.py      # LM Studio adapter
    ├── llm_gemini_api.py    # Gemini API adapter
    ├── llm_gemma.py         # Gemma (cloud, legacy)
    ├── llm_llama.py         # Llama (cloud, legacy)
    ├── tts_base.py          # Abstract TTS interface
    ├── tts_piper.py         # Piper TTS adapter
    ├── tts_dms.py           # Kyutai DMS TTS adapter (moshi)
    ├── tts_styletts2.py     # StyleTTS2 adapter (local, high quality)
    ├── tts_gemini.py        # Gemini TTS API adapter
    └── tts_coqui.py         # Coqui XTTS (cloud, legacy)
```

### Main Loop (`local_worker.py`)

1. Initialize Firebase Admin SDK (using `service-account-key.json`).
2. Poll Firestore every 15 seconds for:
   - Jobs with `status: "publishing"` (manual publish approvals) — handled first.
   - Jobs with `status: "pending"` — filtered to exclude cloud-backend jobs.
3. When a pending job is found, the worker **claims it atomically** (transaction) and updates status to `llm_generating` to prevent duplicate processing.
4. When a job is claimed, call `process_job(db, job_id, job_data)`.
5. If `contentType === "course"`, routes to `process_course_job()` automatically.
6. On failure, the job is marked `failed` with the error message.
7. Runs indefinitely until Ctrl+C.

### Configuration (`config.py`)

| Variable | Default | Description |
|---|---|---|
| `PROJECT_ID` | `calmnest-e910e` | Firebase project ID |
| `STORAGE_BUCKET` | `calmnest-e910e.firebasestorage.app` | Firebase Storage bucket |
| `POLL_INTERVAL_SECONDS` | `15` | How often to check for new jobs |
| `GEMINI_API_KEY` | (empty) | Google Gemini API key (required for API backend) |
| `LMSTUDIO_HOST` | `http://localhost:1234` | LM Studio server URL |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `MODEL_DIR` | `/models` | Base directory for model weights |
| `JOBS_COLLECTION` | `content_jobs` | Firestore collection name |
| `IMAGE_MODEL_ID` | `black-forest-labs/FLUX.2-klein-4B` | Image model for thumbnails |
| `IMAGE_WIDTH` | `1024` | Image width (px) |
| `IMAGE_HEIGHT` | `1024` | Image height (px) |
| `IMAGE_STEPS` | `24` | Diffusion steps |
| `IMAGE_GUIDANCE` | `3.5` | Guidance scale |
| `HF_TOKEN` | (empty) | Optional Hugging Face token |

---

## 5. Pipeline Steps (Single Item)

For content types: `guided_meditation`, `sleep_meditation`, `bedtime_story`, `emergency_meditation`, `course_session`.

When running multi-stack local workers, the pipeline is split into **pre** (LLM + QA + image)
and **TTS** stages. After image generation, jobs enter `tts_pending` and are picked up
by a TTS worker with the appropriate dependency stack.

### Step 1 — LLM Script Generation (`llm_generator.py`)

1. Load the prompt template from `prompts/{contentType}.txt`.
2. Fill in placeholders: `{topic}`, `{duration_minutes}`, `{word_count}`, `{difficulty}`, `{style}`, `{technique}`, `{category}`, `{custom_instructions}`.
3. Word count target = `duration_minutes * 130` (130 words per minute for narration).
4. Call the LLM adapter with `max_tokens = max(2048, duration * 130 * 2)`.
5. Strip end markers (`---END---`, `<end_of_script>`).

If no title was provided by the admin, the LLM is called a second time with a short prompt to generate a title from the script.

LLM adapters are cached globally — the model is only reloaded if the model ID changes between jobs.

### Step 2 — QA Formatting (`qa_formatter.py`)

1. Normalize pause markers to `[PAUSE Xs]` format.
2. Remove markdown formatting (headers, bold, italic, code blocks).
3. Remove `Title:`, `Script:`, etc. prefix lines.
4. Collapse excessive blank lines.
5. Validate: script must have at least 50 words, otherwise error.

### Step 3 — Image Generation (`image_generator.py`)

1. Build a thumbnail prompt (admin prompt > LLM prompt > fallback template).
2. Generate a 1024×1024 image using FLUX.2‑klein‑4B (MPS on M‑series Mac).
3. Upload to Firebase Storage and store `thumbnailUrl`.

At this point, the pre worker stores `formattedScript` and sets status to `tts_pending`.

### Step 4 — TTS Conversion (`tts_converter.py`)

1. Split the script on `[PAUSE Xs]` markers into segments.
2. For each text segment: call TTS adapter to synthesize a WAV file.
3. For each pause segment: generate a silent WAV of the specified duration **using the same WAV params** (sample rate, channels, sample width) as the TTS output.
4. Concatenate all WAV parts into a single file (with param validation).

The TTS adapter is cached similarly to the LLM adapter.

### Step 5 — Audio Post-Processing (`audio_processor.py`)

1. Measure loudness (LUFS) using ffmpeg.
2. If loudness deviates more than 3 LUFS from -16 target, normalize.
3. Encode as 192kbps MP3, 44.1kHz, mono.
4. Delete the intermediate WAV file.

### Step 6 — Upload to Firebase Storage (`storage_uploader.py`)

1. Determine storage path based on content type (see [Storage Conventions](#10-storage-conventions)).
2. Generate filename: `{topic-slug}-{8-char-uuid}.mp3`.
3. Upload to Firebase Storage with `content_type: audio/mpeg` and 1-year cache header.
4. Read MP3 duration using mutagen.
5. Delete local file after upload.

### Step 7 — Publish to Firestore (`content_publisher.py`)

1. Create a document in the appropriate collection (see [Publishing](#11-publishing-firestore-documents)).
2. If `autoPublish` is false, skip this step — the job is marked `completed` but no content document is created until the admin manually approves.
3. On manual approval, the admin taps "Publish Now" on the job detail screen, which sets `status: "publishing"` and the worker picks it up on its next poll.

---

## 6. Pipeline Steps (Full Course)

For content type `course`. Handled by `course_runner.py`.

A course generates **9 audio files** in a single job:

| Order | Code Suffix | Type | Target Duration |
|---|---|---|---|
| 0 | `INT` | Course Intro | ~2 min |
| 1 | `M1L` | Module 1 Lesson | ~5 min |
| 2 | `M1P` | Module 1 Practice | ~8 min |
| 3 | `M2L` | Module 2 Lesson | ~5 min |
| 4 | `M2P` | Module 2 Practice | ~8 min |
| 5 | `M3L` | Module 3 Lesson | ~5 min |
| 6 | `M3P` | Module 3 Practice | ~8 min |
| 7 | `M4L` | Module 4 Lesson | ~5 min |
| 8 | `M4P` | Module 4 Practice | ~8 min |

Session codes are `{COURSE_CODE}{SUFFIX}`, e.g. `CBT101INT`, `CBT101M1L`, `CBT101M1P`.

### Step 1 — Generate Course Plan

The LLM is given the full `course_system_prompt.txt` plus the job params (code, title, description, therapy approach, audience, tone) and asked to return a structured JSON plan:
 - The parser tolerates markdown fences and extra text by extracting the first JSON object if needed.

### Step 1b — Generate Course Thumbnail

1. Build an image prompt from course title/goal/subject (or use admin prompt).
2. Generate a single 1024×1024 image and upload to Firebase Storage.
3. Store `thumbnailUrl` on the course document and reuse it for sessions.

```json
{
  "courseTitle": "...",
  "courseGoal": "...",
  "intro": { "title": "...", "outline": "..." },
  "modules": [
    {
      "moduleNumber": 1,
      "moduleTitle": "...",
      "lessonTitle": "...",
      "practiceTitle": "...",
      "objective": "...",
      "lessonSummary": "...",
      "practiceType": "...",
      "reflectionPrompts": ["...", "...", "..."],
      "keyTakeaway": "..."
    }
    // ... 4 modules total
  ]
}
```

The plan is saved to the job document so the admin can see it in the detail screen.

### Step 2 — Generate 9 Scripts

For each of the 9 sessions, the LLM is prompted individually with context from the plan (module title, lesson summary, objectives, reflection prompts, etc.). Progress is updated in Firestore after each script (e.g. `"Script 3/9"`).

### Step 3 — QA Format Each Script

Same QA formatter as single items, applied to each script. If a script is too short (<50 words), the raw script is used as fallback.

### Step 4 & 5 — TTS + Post-Process + Upload (per session)

Each script goes through TTS conversion → ffmpeg post-processing → Firebase Storage upload. Progress updates after each (e.g. `"Audio 5/9"`). Audio is uploaded under `audio/meditate/courses/`.

### Step 6 — Publish Course

If `autoPublish` is true:
1. Create **1 document** in `courses` collection (code, title, description, subject, color, icon, sessionCount=9).
2. Create **9 documents** in `course_sessions` collection (courseId, code, title, audioPath, order, duration).
3. Course Intro (`order: 0`) is marked `isFree: true`.

> **Note:** Manual publishing is supported. The worker uses an idempotent `publishToken` to guard against double-publish.

---

## 7. LLM Backends & Models

### Backends

| Backend | Where it runs | Selectable in UI |
|---|---|---|
| **Local** | Your Mac (Ollama or LM Studio) | Yes |
| **API** | Google Gemini API (free tier) | Yes |
| **Cloud** | GCE VM with GPU | No (legacy, hidden) |

### Models

| Model ID | Backend | Adapter | Description |
|---|---|---|---|
| `lmstudio-local` | Local | LM Studio (OpenAI-compatible API at `:1234`) | Uses whatever model is loaded in LM Studio |
| `ollama-local` | Local | Ollama REST API at `:11434` | Uses Ollama's model library (default: `gemma3`) |
| `gemini-2.5-flash` | API | Google GenAI SDK | Fast, free tier |
| `gemini-2.5-pro` | API | Google GenAI SDK | Higher quality, free tier |
| `gemma-3-12b` | Cloud | HuggingFace Transformers | Legacy — requires GPU VM |
| `llama-3.1-8b` | Cloud | vLLM | Legacy — requires GPU VM |

### Adapter Interface

All LLM adapters implement:
- `load(model_dir: str)` — Initialize / connect to the model.
- `generate(prompt: str, max_tokens: int) -> str` — Generate text.
- `unload()` — Free resources (optional).

Adapters are cached globally: the model is only reloaded if the model ID changes.

---

## 8. TTS Backends & Models

### Models

| Model ID | Backend | Adapter | Voices |
|---|---|---|---|
| `piper` | Local / Cloud | Piper CLI (ONNX) | Amy, Danny, Alba, Lessac |
| `dms` | Local | Kyutai DMS TTS 1.6B (moshi) | Britney, Delilah, Milo |
| `styletts2` | Local | StyleTTS2 (bundled) | Default StyleTTS2 voice |
| `gemini-tts-flash` | API | Gemini 2.5 Flash TTS | Default Gemini voice |
| `gemini-tts-pro` | API | Gemini 2.5 Pro TTS | Default Gemini Pro voice |
| `coqui-xtts-v2` | Cloud | Coqui TTS (GPU) | Legacy — voice cloning |

StyleTTS2 code is bundled under `apps/calmdemy/worker/tts_models/styletts2`.

### Piper Voices

| Voice ID | Name | Description |
|---|---|---|
| `en_US-amy-medium` | Amy (US Female) | Calm, clear American female |
| `en_US-danny-low` | Danny (US Male) | Deep, soothing American male |
| `en_GB-alba-medium` | Alba (UK Female) | Warm British female |
| `en_US-lessac-medium` | Lessac (US Female) | Natural, expressive American female |

### DMS Voices

| Voice ID | Name | Description |
|---|---|---|
| `expresso/ex03-ex01_happy_001_channel1_334s.wav` | Britney | Kyutai DMS voice (Expresso, happy) |
| `vctk/p226_023.wav` | Delilah | Kyutai DMS voice (VCTK) |
| `vctk/p225_023.wav` | Milo | Kyutai DMS voice (VCTK) |

### StyleTTS2 Voices

| Voice ID | Name | Description |
|---|---|---|
| `styletts2-default` | StyleTTS2 Default | Default StyleTTS2 English voice |

Note: StyleTTS2 pre-trained checkpoints may carry usage requirements. Verify the checkpoint license and voice permissions before production use.

Piper voices are auto-downloaded from HuggingFace (`rhasspy/piper-voices`) on first use and cached in `.piper_voices/`.

### Adapter Interface

All TTS adapters implement:
- `load(model_dir: str, voice_id: str)` — Load model and voice.
- `synthesize(text: str, output_path: str)` — Convert text to WAV.
- `unload()` — Free resources (optional).

### Pause Handling

The TTS converter splits scripts on `[PAUSE Xs]` markers. Each text segment is synthesized separately, silence WAVs are generated for pauses, and all parts are concatenated into a single WAV file before post-processing.

---

## 9. Prompt Templates

Located in `worker/prompts/`. Each content type has its own template with placeholders.

### Available Placeholders

| Placeholder | Source |
|---|---|
| `{topic}` | `params.topic` |
| `{duration_minutes}` | `params.duration_minutes` |
| `{word_count}` | `duration_minutes * 130` |
| `{difficulty}` | `params.difficulty` |
| `{style}` | `params.style` |
| `{technique}` | `params.technique` |
| `{category}` | `params.category` |
| `{custom_instructions}` | `params.customInstructions` |

### Template Summaries

- **`guided_meditation.txt`** — Second person, includes body scan/main practice section, warm/calm tone, [PAUSE] markers.
- **`sleep_meditation.txt`** — Assumes listener is in bed, pace gradually slows, longer pauses toward end, never says "open your eyes."
- **`bedtime_story.txt`** — Third person narrative, calming/peaceful, rich sensory descriptions, character falls asleep at end.
- **`emergency_meditation.txt`** — Direct/grounding, starts immediately (no long intro), 5-4-3-2-1 technique, short sentences.
- **`course_session.txt`** — Therapy-informed, teaching + guided practice, connects to course theme, evidence-based language.

All templates end with: `Write ONLY the narration script. Do not include titles, stage directions, or metadata. End your script with ---END---`

### Course System Prompt

The course system prompt (`course_system_prompt.txt`) is a comprehensive instruction set for generating structured therapy courses. It defines:
- The mandatory workflow (plan first, then scripts one at a time).
- Script types: Course Intro (~30-60s), Lesson (~3-5 min), Practice (~6-10 min).
- Tone rules (warm, calm, human — not robotic or textbook-like).
- TTS formatting rules (paragraph structure, break tags, no blanks/underscores).
- Multi-modality support (CBT, ACT, DBT, MBSR, self-compassion, schema, grounding).

---

## 10. Storage Conventions

Audio files are uploaded to Firebase Storage with paths matching the app's audio file resolver.

| Content Type | Storage Path |
|---|---|
| `guided_meditation` | `audio/meditate/meditations/` |
| `sleep_meditation` | `audio/sleep/meditations/` |
| `bedtime_story` | `audio/sleep/stories/` |
| `emergency_meditation` | `audio/meditate/emergency/` |
| `course_session` | `audio/meditate/courses/` |
| `course` | `audio/meditate/courses/` |

File naming: `{topic-slug}-{8-char-uuid}.mp3`

All files are uploaded with:
- Content type: `audio/mpeg`
- Cache control: `public, max-age=31536000` (1 year)
- Encoding: 192kbps MP3, 44.1kHz, mono

---

## 11. Publishing (Firestore Documents)

When a job completes with `autoPublish: true`, a Firestore document is created in the appropriate collection.

### Single-item content

| Content Type | Collection | Notable Fields |
|---|---|---|
| Guided Meditation | `guided_meditations` | themes, techniques, difficulty_level, instructor |
| Sleep Meditation | `sleep_meditations` | instructor |
| Bedtime Story | `bedtime_stories` | narrator, category, audio_url (not audioPath), is_premium |
| Emergency Meditation | `emergency_meditations` | narrator, isFree=true |
| Course Session | `course_sessions` | courseId, code, order |

All documents include: `title`, `description` (auto-extracted from script), `duration_minutes`, `generatedBy: "content-factory"`, `createdAt`.

The **title** is either the admin-provided title or an LLM-generated title.
The **description** is the first ~200 characters of the script with pause markers removed.

### Course content

A course creates:
- **1 `courses` document**: code, title, description (from courseGoal), color, icon, subjectId, subjectLabel, difficulty, tone, sessionCount=9, instructor.
- **9 `course_sessions` documents**: courseId, code (e.g. `CBT101M1L`), title (from plan), description, audioPath, order (0-8), duration_minutes. The intro session (`order: 0`) is `isFree: true`.

---

## 12. Running the Worker

### Admin auth (custom claims)

- Run `node scripts/setAdminClaims.js <uid or email>` to seed `admin=true` custom claims and mirror `role: "admin"` to the user doc (display-only).
- The admin UI now gates on the custom claim; Firestore rules block client writes to `users.role`.

### Prerequisites

- Python 3.11+
- ffmpeg (`brew install ffmpeg`)
- `service-account-key.json` in the `worker/` directory (gitignored)
- At least one LLM backend running:
  - **Ollama**: `ollama serve` (then pull a model, e.g. `ollama pull gemma3`)
  - **LM Studio**: Open LM Studio, load a model, start the server
  - **Gemini API**: Set `GEMINI_API_KEY` in `worker/.env`
- For local TTS (Piper): `pip install piper-tts` (voices auto-download on first use)
- For local TTS (StyleTTS2): `brew install espeak-ng libsndfile`
- For local TTS (StyleTTS2): `python -m nltk.downloader punkt`
- For local TTS (StyleTTS2): download a checkpoint into `MODEL_DIR/styletts2/checkpoints/<checkpoint_name>/`
- For local TTS (DMS): `pip install moshi==0.2.11 sphn` (voice embeddings auto-download)

### Venv Strategy (Required for Multi-Stack)

See `VENV_STRATEGY.md` for the per-stack venv setup and dependency conflict resolution.

### Setup

```bash
cd apps/calmdemy/worker
python3 -m venv .venv
./.venv/bin/pip install -r requirements.base.txt

python3 -m venv .venv-dms
./.venv-dms/bin/pip install -r requirements.dms.txt
```

### Stack Configuration

Multi-stack local workers are defined in `worker_stacks.json`. The companion uses this
file to start all enabled stacks with the correct role and venv.

### StyleTTS2 Checkpoints (Local)

StyleTTS2 looks for checkpoints at `MODEL_DIR/styletts2/checkpoints/<checkpoint_name>/`.

Required files:
1. `checkpoint.pth` (or any `.pth` file)
2. `config.yml`

Helper script:
`./scripts/setup_styletts2_checkpoint.sh <checkpoint_name> <checkpoint_url> [config_path]`

Optional environment variables:
- `STYLETTS2_DEFAULT_CHECKPOINT` (default: `ljspeech`)
- `STYLETTS2_CHECKPOINT_FILE` (override specific `.pth` filename)
- `STYLETTS2_DIFFUSION_STEPS` (default: `5`)
- `STYLETTS2_EMBEDDING_SCALE` (default: `1`)

### Run

**launchd (recommended):**

- Companion plist: `/Users/aidenhyun/Library/LaunchAgents/com.calmdemy.local-companion.plist`
- Logs: `worker/logs/companion.log` and per-stack `worker/logs/local_worker_<stack>.log`
- Start/stop: `launchctl load ~/Library/LaunchAgents/com.calmdemy.local-companion.plist` /
  `launchctl unload ~/Library/LaunchAgents/com.calmdemy.local-companion.plist`

**Manual run (foreground):**

```bash
cd apps/calmdemy/worker
python3 local_companion.py
```

The companion prints stack status and keeps desired state at `running` by default. Workers poll every **2s** with ±300ms jitter.
Press Ctrl+C to stop.

The admin UI displays stack PIDs, status, and log paths from `worker_stacks_status/local`.

### Option B — Firestore listeners (no tunnel) + optional wake endpoint

- Companion listens to Firestore `content_jobs` (statuses: `pending`, `tts_pending`, `publishing`) and triggers a start as soon as a matching job appears (non-cloud backends). This removes the poll delay without any inbound tunnel.
- Enable with `ENABLE_JOB_LISTENER=true` (default).
- When triggered, companion sets `worker_control.desiredState=running` and can start stacks immediately (`FORCE_IMMEDIATE_START=true`).
- Dedupe window: `WAKE_DEDUP_WINDOW_SEC=300` (applies to listeners and optional wake endpoint).
- Optional wake server remains available if you want a cloud dispatcher later:
  - `ENABLE_WAKE_SERVER=true`
  - `WAKE_SHARED_SECRET=<strong_random>`
  - `WAKE_SERVER_PORT=8787`
  - Cloud Function dispatcher (in `functions/dispatchWake`) can be used if you do expose a tunnel; otherwise leave disabled.

### Latency SLO (Option A)

- Warm path: P95 ≤ 5s, P99 ≤ 10s from job enqueue to worker start (cold model loads excluded).
- Achieved via always-on stacks (launchd), 2s polls with jitter, restart waits on state not sleep.

### Seeding Subjects

To populate the `subjects` collection in Firestore (required for course creation):

```bash
cd apps/calmdemy
node scripts/seedSubjects.js
```

This creates 6 subject documents: CBT, ACT, DBT, MBCT, IFS, Somatic.

---

## 13. Extending the System

### Adding a new content type

1. Add the type to `FactoryContentType` in `src/features/admin/types.ts`.
2. Add a label in `CONTENT_TYPE_LABELS`.
3. Create a prompt template in `worker/prompts/{type}.txt`.
4. Add a storage path in `worker/pipeline/storage_uploader.py`.
5. Add a publishing case in `worker/pipeline/content_publisher.py`.
6. Update the create screen if the type needs unique form fields.

### Adding a new LLM model

1. Create an adapter in `worker/models/` implementing `LLMBase`.
2. Register it in `worker/models/registry.py` (`LLM_FACTORIES`).
3. Add it to the frontend constants in `src/features/admin/constants/models.ts`.

### Adding a new TTS model

1. Create an adapter in `worker/models/` implementing `TTSBase`.
2. Register it in `worker/models/registry.py` (`TTS_FACTORIES`).
3. Add it + its voices to `src/features/admin/constants/models.ts`.

### Adding a new TTS voice

1. Add the voice to `VOICES` in `src/features/admin/constants/models.ts` with the correct `ttsModelId`.
2. For Piper voices, the adapter auto-downloads from HuggingFace — just use the voice ID.

---

*Last updated: February 2026*
