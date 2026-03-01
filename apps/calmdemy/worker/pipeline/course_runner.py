"""
Course pipeline runner — orchestrates all steps for a full course job.

A course job generates 9 audio files:
  - 1 Course Intro
  - 4 Modules, each with a Lesson + Practice

Session code convention:
  INT  = Course Intro   (order 0)
  M1L  = Module 1 Lesson (order 1)
  M1P  = Module 1 Practice (order 2)
  M2L  = Module 2 Lesson (order 3)
  M2P  = Module 2 Practice (order 4)
  M3L  = Module 3 Lesson (order 5)
  M3P  = Module 3 Practice (order 6)
  M4L  = Module 4 Lesson (order 7)
  M4P  = Module 4 Practice (order 8)
"""

import json
import ast
import re
import os

from firebase_admin import firestore as fs

from .llm_generator import _get_llm_adapter
from .qa_formatter import format_script
from .tts_converter import convert_to_audio
from .audio_processor import post_process_audio
from .storage_uploader import upload_audio, upload_image
from .voice_utils import get_voice_display_name
from .stages import update_job_status as _update_status
from .stages import update_job_progress as _update_progress
from .metrics import record_job_metric
from .error_codes import classify_error
import config
from observability import get_logger

logger = get_logger(__name__)

DEFAULT_FALLBACK_URL = (
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
)

# Session definitions in order
SESSION_DEFS = [
    {"suffix": "INT",  "type": "intro",    "label": "Course Intro",        "order": 0, "duration_min": 2},
    {"suffix": "M1L",  "type": "lesson",   "label": "Module 1 — Lesson",   "order": 1, "duration_min": 5},
    {"suffix": "M1P",  "type": "practice", "label": "Module 1 — Practice", "order": 2, "duration_min": 8},
    {"suffix": "M2L",  "type": "lesson",   "label": "Module 2 — Lesson",   "order": 3, "duration_min": 5},
    {"suffix": "M2P",  "type": "practice", "label": "Module 2 — Practice", "order": 4, "duration_min": 8},
    {"suffix": "M3L",  "type": "lesson",   "label": "Module 3 — Lesson",   "order": 5, "duration_min": 5},
    {"suffix": "M3P",  "type": "practice", "label": "Module 3 — Practice", "order": 6, "duration_min": 8},
    {"suffix": "M4L",  "type": "lesson",   "label": "Module 4 — Lesson",   "order": 7, "duration_min": 5},
    {"suffix": "M4P",  "type": "practice", "label": "Module 4 — Practice", "order": 8, "duration_min": 8},
]

TOTAL_SESSIONS = len(SESSION_DEFS)


def _load_system_prompt() -> str:
    """Load the course system prompt."""
    prompt_path = os.path.join(
        os.path.dirname(__file__), "..", "system_prompts", "course_system_prompt.txt"
    )
    with open(prompt_path, "r") as f:
        return f.read()


def _build_course_plan_prompt(job_data: dict) -> str:
    """Build the prompt that asks the LLM to create a course plan."""
    params = job_data.get("params", {})
    system_prompt = _load_system_prompt()

    return f"""{system_prompt}

---

Now create a course plan for the following:

Course code: {params.get("courseCode", "COURSE101")}
Course title: {params.get("courseTitle", "Untitled Course")}
Course description: {params.get("topic", "A therapy-based course")}
Therapy approach: {params.get("subjectLabel", "CBT")}
Target audience: {params.get("targetAudience", "beginner")}
Tone: {params.get("tone", "gentle")}

Output the plan as JSON only, in this exact format (no markdown, no extra text):
Rules:
- Use plain text only (no SSML, no XML/HTML tags).
- Do NOT include double quotes inside string values.
- If you need quotation marks, use single quotes instead.
 
{{
  "courseTitle": "...",
  "courseGoal": "...",
  "intro": {{
    "title": "Course Intro",
    "outline": "..."
  }},
  "modules": [
    {{
      "moduleNumber": 1,
      "moduleTitle": "...",
      "lessonTitle": "...",
      "practiceTitle": "...",
      "objective": "...",
      "lessonSummary": "...",
      "practiceType": "...",
      "reflectionPrompts": ["...", "...", "..."],
      "keyTakeaway": "..."
    }},
    {{
      "moduleNumber": 2,
      "moduleTitle": "...",
      "lessonTitle": "...",
      "practiceTitle": "...",
      "objective": "...",
      "lessonSummary": "...",
      "practiceType": "...",
      "reflectionPrompts": ["...", "...", "..."],
      "keyTakeaway": "..."
    }},
    {{
      "moduleNumber": 3,
      "moduleTitle": "...",
      "lessonTitle": "...",
      "practiceTitle": "...",
      "objective": "...",
      "lessonSummary": "...",
      "practiceType": "...",
      "reflectionPrompts": ["...", "...", "..."],
      "keyTakeaway": "..."
    }},
    {{
      "moduleNumber": 4,
      "moduleTitle": "...",
      "lessonTitle": "...",
      "practiceTitle": "...",
      "objective": "...",
      "lessonSummary": "...",
      "practiceType": "...",
      "reflectionPrompts": ["...", "...", "..."],
      "keyTakeaway": "..."
    }}
  ]
}}"""


def _extract_json_object(text: str) -> str:
    """Extract the first JSON object found in a string."""
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object start found")
    depth = 0
    for idx in range(start, len(text)):
        char = text[idx]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start:idx + 1]
    raise ValueError("JSON object not balanced")


def _clean_json_text(text: str) -> str:
    """Best-effort cleanup for common LLM JSON mistakes."""
    cleaned = text
    # Normalize smart quotes
    cleaned = cleaned.replace("“", "\"").replace("”", "\"")
    cleaned = cleaned.replace("‘", "'").replace("’", "'")
    # Convert double-quoted attribute values inside tags to single quotes
    cleaned = re.sub(r'(<[^>]*?)="([^"]*?)"', r"\\1='\\2'", cleaned)
    # Replace SSML break tags with pause markers
    cleaned = re.sub(r"<break\\s+time='(\\d+)s'\\s*/?>", r"[PAUSE \\1s]", cleaned, flags=re.IGNORECASE)
    # Remove trailing commas before } or ]
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
    return cleaned


def _parse_plan(raw: str) -> dict:
    """Parse the LLM plan output as JSON. Tolerates markdown fences and extra text."""
    text = raw.strip()
    # Strip markdown code fence if present
    if text.startswith("```"):
        first_newline = text.index("\n")
        last_fence = text.rfind("```")
        if last_fence > first_newline:
            text = text[first_newline + 1:last_fence].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        extracted = _extract_json_object(text)
        cleaned = _clean_json_text(extracted)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            py_text = cleaned
            py_text = re.sub(r"\bnull\b", "None", py_text)
            py_text = re.sub(r"\btrue\b", "True", py_text)
            py_text = re.sub(r"\bfalse\b", "False", py_text)
            data = ast.literal_eval(py_text)
            if isinstance(data, dict):
                return data
            raise


def _build_session_script_prompt(
    session_def: dict,
    plan: dict,
    job_data: dict,
) -> str:
    """Build the prompt for generating one session script."""
    params = job_data.get("params", {})
    course_code = params.get("courseCode", "COURSE101")
    course_title = params.get("courseTitle", plan.get("courseTitle", "Untitled"))
    approach = params.get("subjectLabel", "CBT")
    tone = params.get("tone", "gentle")
    audience = params.get("targetAudience", "beginner")

    session_type = session_def["type"]
    duration_min = session_def["duration_min"]
    words = duration_min * 130  # Approximate words for duration

    if session_type == "intro":
        intro_outline = plan.get("intro", {}).get("outline", "Welcome to the course.")
        return (
            f"You are CalmNest Course Scriptwriter. Write a Course Intro script "
            f"for the course '{course_title}' (code: {course_code}).\n\n"
            f"Therapy approach: {approach}\n"
            f"Tone: {tone}\n"
            f"Target audience: {audience}\n"
            f"Duration: about {duration_min} minutes (~{words} words)\n\n"
            f"Intro outline from the course plan:\n{intro_outline}\n\n"
            f"Course goal: {plan.get('courseGoal', '')}\n\n"
            f"Rules:\n"
            f"- Narrator is Britney Irvine.\n"
            f"- Include a short educational disclaimer (not treatment).\n"
            f"- Use [PAUSE Xs] markers for pauses (e.g. [PAUSE 3s]).\n"
            f"- Write ONLY the narration script. No titles or metadata at the top.\n"
            f"- End with ---END---"
        )

    # Lesson or Practice
    module_idx = int(session_def["suffix"][1]) - 1  # M1L -> index 0
    module = plan.get("modules", [{}])[module_idx] if module_idx < len(plan.get("modules", [])) else {}

    if session_type == "lesson":
        title = module.get("lessonTitle", "Lesson")
        summary = module.get("lessonSummary", "")
        objective = module.get("objective", "")
        return (
            f"You are CalmNest Course Scriptwriter. Write a Lesson script "
            f"for Module {module_idx + 1} of '{course_title}' ({course_code}).\n\n"
            f"Module title: {module.get('moduleTitle', '')}\n"
            f"Lesson title: {title}\n"
            f"Learning objective: {objective}\n"
            f"Lesson summary: {summary}\n"
            f"Therapy approach: {approach}\n"
            f"Tone: {tone}\n"
            f"Target audience: {audience}\n"
            f"Duration: about {duration_min} minutes (~{words} words)\n\n"
            f"Rules:\n"
            f"- Clear teaching with one example and one tool.\n"
            f"- Use [PAUSE Xs] markers for pauses.\n"
            f"- Include a gentle closing and takeaway line.\n"
            f"- Start with a brief intro connecting to the course theme.\n"
            f"- Write ONLY the narration script. No titles or metadata at the top.\n"
            f"- End with ---END---"
        )
    else:  # practice
        title = module.get("practiceTitle", "Practice")
        practice_type = module.get("practiceType", "guided exercise")
        prompts = module.get("reflectionPrompts", [])
        takeaway = module.get("keyTakeaway", "")
        return (
            f"You are CalmNest Course Scriptwriter. Write a Practice script "
            f"for Module {module_idx + 1} of '{course_title}' ({course_code}).\n\n"
            f"Module title: {module.get('moduleTitle', '')}\n"
            f"Practice title: {title}\n"
            f"Practice type: {practice_type}\n"
            f"Reflection prompts to include: {', '.join(prompts)}\n"
            f"Key takeaway: {takeaway}\n"
            f"Therapy approach: {approach}\n"
            f"Tone: {tone}\n"
            f"Target audience: {audience}\n"
            f"Duration: about {duration_min} minutes (~{words} words)\n\n"
            f"Rules:\n"
            f"- Guided exercise with varied prompts and intentional pauses.\n"
            f"- Use [PAUSE Xs] markers for pauses (3s-10s).\n"
            f"- Include re-centering language and reflection.\n"
            f"- Clear start and end.\n"
            f"- Write ONLY the narration script. No titles or metadata at the top.\n"
            f"- End with ---END---"
        )


def _get_session_title(session_def: dict, plan: dict) -> str:
    """Get the title for a session from the plan."""
    if session_def["type"] == "intro":
        return plan.get("intro", {}).get("title", "Course Intro")

    module_idx = int(session_def["suffix"][1]) - 1
    modules = plan.get("modules", [])
    module = modules[module_idx] if module_idx < len(modules) else {}

    if session_def["type"] == "lesson":
        return module.get("lessonTitle", session_def["label"])
    else:
        return module.get("practiceTitle", session_def["label"])


def process_course_job(db, job_id: str, job_data: dict):
    """Run the full course pipeline: plan -> 9 scripts -> 9 audio -> publish."""
    params = job_data.get("params", {})
    course_code = params.get("courseCode", "COURSE101")
    job_run_id = job_data.get("jobRunId")

    def _set_status(status: str, extra: dict | None = None):
        payload = dict(extra or {})
        if job_run_id:
            payload.setdefault("jobRunId", job_run_id)
        _update_status(db, job_id, status, payload or None)

    plan = job_data.get("coursePlan")
    raw_scripts: dict[str, str] = job_data.get("courseRawScripts") or {}
    formatted_scripts: dict[str, str] = job_data.get("courseFormattedScripts") or {}
    audio_results: dict[str, dict] = job_data.get("courseAudioResults") or {}
    current_stage = "llm_generating"

    try:
        # ========== STEP 1: Generate course plan ==========
        adapter = _get_llm_adapter(job_data)
        if not plan:
            _set_status("llm_generating")
            _update_progress(db, job_id, "Generating course plan...")

            logger.info("Generating course plan", extra={"course_code": course_code, "job_id": job_id})
            plan_prompt = _build_course_plan_prompt(job_data)
            plan_raw = adapter.generate(plan_prompt, max_tokens=4096)

            plan = _parse_plan(plan_raw)
            logger.info(
                "Course plan parsed",
                extra={"course_title": plan.get("courseTitle", "unknown"), "job_id": job_id},
            )

            # Save plan to job
            _set_status("llm_generating", {
                "coursePlan": plan,
                "lastCompletedStage": "llm_generating",
            })

        # ========== STEP 1b: Generate course thumbnail ==========
        _set_status("image_generating")
        current_stage = "image_generating"
        course_title = params.get("courseTitle", plan.get("courseTitle", "Untitled Course"))
        image_prompt = ""
        has_thumbnail = bool(job_data.get("thumbnailUrl"))
        thumbnail_url = job_data.get("thumbnailUrl") or DEFAULT_FALLBACK_URL
        image_path = job_data.get("imagePath", "") or ""
        if not has_thumbnail:
            try:
                from .image_generator import build_image_prompt, generate_image
                image_prompt = build_image_prompt(
                    job_data,
                    course_title,
                    params.get("topic", ""),
                    "course",
                    plan=plan,
                )
                local_image_path = generate_image(image_prompt)
                image_path, thumbnail_url = upload_image(
                    local_image_path,
                    {**job_data, "contentType": "course"},
                )
            except Exception as e:
                logger.warning(
                    "Image generation skipped",
                    extra={"job_id": job_id, "error": str(e)},
                )
                if not image_prompt:
                    image_prompt = f"Course thumbnail for {course_title}"

        job_data = {
            **job_data,
            "imagePrompt": image_prompt,
            "imagePath": image_path,
            "thumbnailUrl": thumbnail_url,
            "imageModel": config.IMAGE_MODEL_ID,
        }
        _set_status("image_generating", {
            "imagePrompt": image_prompt,
            "imagePath": image_path,
            "thumbnailUrl": thumbnail_url,
            "imageModel": config.IMAGE_MODEL_ID,
            "lastCompletedStage": "image_generating",
        })

        # ========== STEP 2: Generate scripts for all 9 sessions ==========
        if len(formatted_scripts) < TOTAL_SESSIONS:
            current_stage = "llm_generating"
            scripts: dict[str, str] = dict(raw_scripts)

            for i, session_def in enumerate(SESSION_DEFS):
                session_code = f"{course_code}{session_def['suffix']}"
                if session_code in formatted_scripts:
                    continue
                if scripts.get(session_code, "").strip():
                    continue

                progress = f"Script {i + 1}/{TOTAL_SESSIONS} ({session_code})"
                _update_progress(db, job_id, progress)
                logger.info("Course progress", extra={"job_id": job_id, "progress": progress})

                prompt = _build_session_script_prompt(session_def, plan, job_data)
                raw_script = adapter.generate(
                    prompt,
                    max_tokens=max(2048, session_def["duration_min"] * 130 * 2),
                )

                # Clean up end markers
                for marker in ["---END---", "<end_of_script>"]:
                    if marker in raw_script:
                        raw_script = raw_script[:raw_script.index(marker)].strip()

                scripts[session_code] = raw_script

                # Persist progress so retries don't regenerate scripts
                _set_status("llm_generating", {
                    "generatedScript": json.dumps(
                        {k: v[:200] + "..." for k, v in scripts.items()},
                        indent=2,
                    ),
                    "courseRawScripts": scripts,
                    "courseProgress": progress,
                })

            raw_scripts = scripts

            # ========== STEP 3: QA format each script ==========
            current_stage = "qa_formatting"
            if not formatted_scripts:
                formatted_scripts = {}

            for session_def in SESSION_DEFS:
                session_code = f"{course_code}{session_def['suffix']}"
                if session_code in formatted_scripts:
                    continue
                script = scripts.get(session_code, "").strip()
                if not script:
                    raise RuntimeError(f"Missing raw script for {session_code}")
                try:
                    formatted = format_script(script, job_data)
                except ValueError:
                    # If QA fails (too short), use raw script
                    formatted = script.strip()
                formatted_scripts[session_code] = formatted

            _set_status("qa_formatting", {
                "courseFormattedScripts": formatted_scripts,
                "lastCompletedStage": "qa_formatting",
            })

        # ========== STEP 4 & 5: TTS + post-process each session ==========
        _set_status("tts_converting")
        current_stage = "tts_converting"
        if audio_results is None:
            audio_results = {}

        for i, session_def in enumerate(SESSION_DEFS):
            session_code = f"{course_code}{session_def['suffix']}"
            if session_code in audio_results and audio_results[session_code].get("storagePath"):
                continue
            progress = f"Audio {i + 1}/{TOTAL_SESSIONS} ({session_code})"
            _update_progress(db, job_id, progress)
            logger.info("Course progress", extra={"job_id": job_id, "progress": progress})

            script = formatted_scripts[session_code]

            # TTS
            wav_path = convert_to_audio(script, job_data)

            # Post-process
            mp3_path = post_process_audio(wav_path)

            # Upload
            session_job_data = {
                **job_data,
                "contentType": "course_session",
                "params": {
                    **params,
                    "topic": f"{course_code} {session_def['label']}",
                },
            }
            storage_path, duration_sec = upload_audio(mp3_path, session_job_data)

            audio_results[session_code] = {
                "storagePath": storage_path,
                "durationSec": duration_sec,
            }
            _set_status("tts_converting", {
                "courseAudioResults": audio_results,
                "courseProgress": progress,
                "lastCompletedStage": "tts_converting",
            })

        _set_status("uploading", {
            "courseProgress": f"All {TOTAL_SESSIONS} audio files uploaded",
            "lastCompletedStage": "uploading",
        })

        # ========== STEP 6: Publish course + sessions ==========
        auto_publish = job_data.get("autoPublish", True)

        if auto_publish:
            _set_status("publishing")
            current_stage = "publishing"
            _update_progress(db, job_id, "Publishing course...")

            course_id, session_ids = _publish_course(
                db, job_id, plan, audio_results, job_data,
            )

            _set_status("completed", {
                "courseId": course_id,
                "courseSessionIds": session_ids,
                "courseProgress": "Published",
                "completedAt": fs.SERVER_TIMESTAMP,
                "lastCompletedStage": "publishing",
            })
            logger.info(
                "Course published",
                extra={"job_id": job_id, "course_code": course_code, "course_id": course_id},
            )
            record_job_metric(db, job_id, job_data, "completed")
        else:
            preview_sessions = []
            for session_def in SESSION_DEFS:
                session_code = f"{course_code}{session_def['suffix']}"
                audio = audio_results.get(session_code, {})
                preview_sessions.append({
                    "code": session_code,
                    "label": session_def["label"],
                    "title": _get_session_title(session_def, plan),
                    "order": session_def["order"],
                    "audioPath": audio.get("storagePath", ""),
                    "durationSec": audio.get("durationSec", 0),
                })
            _set_status("completed", {
                "courseProgress": "Completed (awaiting approval)",
                "coursePreviewSessions": preview_sessions,
                "completedAt": fs.SERVER_TIMESTAMP,
                "lastCompletedStage": "uploading",
            })
            logger.info(
                "Course completed (awaiting approval)",
                extra={"job_id": job_id, "course_code": course_code},
            )
            record_job_metric(db, job_id, job_data, "completed")

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        error_code = classify_error(e)
        logger.exception(
            "Course job failed",
            extra={
                "job_id": job_id,
                "job_run_id": job_run_id,
                "stage": current_stage,
                "error": error_msg,
                "error_code": error_code,
            },
        )
        _set_status("failed", {
            "error": error_msg,
            "errorCode": error_code,
            "failedStage": current_stage,
            "resumeAvailable": bool(formatted_scripts or audio_results or raw_scripts),
        })
        record_job_metric(db, job_id, job_data, "failed", current_stage, error_msg)


def _publish_course(
    db,
    job_id: str,
    plan: dict,
    audio_results: dict,
    job_data: dict,
) -> tuple[str, list[str]]:
    """Create the course document and 9 session documents in Firestore, idempotently."""
    import math

    params = job_data.get("params", {})
    course_code = params.get("courseCode", "COURSE101")
    course_title = params.get("courseTitle", plan.get("courseTitle", "Untitled"))
    subject_id = params.get("subjectId", "")
    subject_label = params.get("subjectLabel", "")
    subject_color = params.get("subjectColor", "#6B7280")
    subject_icon = params.get("subjectIcon", "school-outline")
    tone = params.get("tone", "gentle")
    audience = params.get("targetAudience", "beginner")
    voice_id = job_data.get("ttsVoice", "Calmdemy")
    voice = get_voice_display_name(voice_id)
    thumbnail_url = job_data.get("thumbnailUrl") or ""
    publish_token = job_data.get("publishToken") or job_id

    # Idempotency: if already published, return existing IDs
    if job_data.get("courseId") and job_data.get("courseSessionIds"):
        return job_data["courseId"], job_data["courseSessionIds"]

    # Calculate total duration
    total_duration = sum(
        r.get("durationSec", 0) for r in audio_results.values()
    )
    total_minutes = max(1, math.ceil(total_duration / 60))

    # Create course document
    course_data = {
        "code": course_code,
        "title": course_title,
        "description": plan.get("courseGoal", ""),
        "color": subject_color,
        "icon": subject_icon,
        "subjectId": subject_id,
        "subjectLabel": subject_label,
        "difficulty": audience,
        "tone": tone,
        "sessionCount": TOTAL_SESSIONS,
        "duration_minutes": total_minutes,
        "instructor": voice,
        "ttsVoiceId": voice_id,
        "thumbnailUrl": thumbnail_url,
        "generatedBy": "content-factory",
        "createdAt": fs.SERVER_TIMESTAMP,
    }

    course_ref = db.collection("courses").document(str(publish_token))
    course_ref.set(course_data, merge=True)
    course_id = course_ref.id
    logger.info(
        "Created course document",
        extra={"course_id": course_id, "course_code": course_code},
    )

    # Create session documents
    session_ids = []
    for session_def in SESSION_DEFS:
        session_code = f"{course_code}{session_def['suffix']}"
        audio = audio_results.get(session_code, {})
        session_title = _get_session_title(session_def, plan)
        duration_sec = audio.get("durationSec", 0)

        session_data = {
            "courseId": course_id,
            "code": session_code,
            "title": session_title,
            "description": f"{session_def['label']} for {course_title}",
            "duration_minutes": max(1, math.ceil(duration_sec / 60)),
            "audioPath": audio.get("storagePath", ""),
            "order": session_def["order"],
            "isFree": session_def["order"] == 0,  # Intro is free
            "generatedBy": "content-factory",
            "createdAt": fs.SERVER_TIMESTAMP,
        }

        session_ref = db.collection("course_sessions").document(f"{publish_token}-{session_code}")
        session_ref.set(session_data, merge=True)
        session_ids.append(session_ref.id)
        logger.info(
            "Created session document",
            extra={"session_id": session_ref.id, "session_code": session_code},
        )

    return course_id, session_ids
