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
import os
import traceback

from firebase_admin import firestore as fs

from .llm_generator import _get_llm_adapter
from .qa_formatter import format_script
from .tts_converter import convert_to_audio
from .audio_processor import post_process_audio
from .storage_uploader import upload_audio


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


def _update_status(db, job_id: str, status: str, extra: dict | None = None):
    """Update job status and timestamp in Firestore."""
    data = {
        "status": status,
        "updatedAt": fs.SERVER_TIMESTAMP,
    }
    if status == "llm_generating" and not extra:
        data["startedAt"] = fs.SERVER_TIMESTAMP
    if extra:
        data.update(extra)
    db.collection("content_jobs").document(job_id).update(data)


def _update_progress(db, job_id: str, progress: str):
    """Update course progress indicator."""
    db.collection("content_jobs").document(job_id).update({
        "courseProgress": progress,
        "updatedAt": fs.SERVER_TIMESTAMP,
    })


def _load_system_prompt() -> str:
    """Load the course system prompt."""
    prompt_path = os.path.join(
        os.path.dirname(__file__), "..", "course_system_prompt.txt"
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
        return json.loads(extracted)


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

    try:
        # ========== STEP 1: Generate course plan ==========
        _update_status(db, job_id, "llm_generating")
        _update_progress(db, job_id, "Generating course plan...")

        print(f"  [course] Generating plan for {course_code}...")
        adapter = _get_llm_adapter(job_data)
        plan_prompt = _build_course_plan_prompt(job_data)
        plan_raw = adapter.generate(plan_prompt, max_tokens=4096)

        plan = _parse_plan(plan_raw)
        print(f"  [course] Plan parsed: {plan.get('courseTitle', 'unknown')}")

        # Save plan to job
        _update_status(db, job_id, "llm_generating", {"coursePlan": plan})

        # ========== STEP 2: Generate scripts for all 9 sessions ==========
        scripts: dict[str, str] = {}
        for i, session_def in enumerate(SESSION_DEFS):
            session_code = f"{course_code}{session_def['suffix']}"
            progress = f"Script {i + 1}/{TOTAL_SESSIONS} ({session_code})"
            _update_progress(db, job_id, progress)
            print(f"  [course] {progress}")

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

        # Save all scripts
        _update_status(db, job_id, "qa_formatting", {
            "generatedScript": json.dumps(
                {k: v[:200] + "..." for k, v in scripts.items()},
                indent=2,
            ),
        })

        # ========== STEP 3: QA format each script ==========
        formatted_scripts: dict[str, str] = {}
        for session_code, script in scripts.items():
            try:
                formatted = format_script(script, job_data)
            except ValueError:
                # If QA fails (too short), use raw script
                formatted = script.strip()
            formatted_scripts[session_code] = formatted

        # ========== STEP 4 & 5: TTS + post-process each session ==========
        _update_status(db, job_id, "tts_converting")
        audio_results: dict[str, dict] = {}  # session_code -> {path, duration}

        for i, session_def in enumerate(SESSION_DEFS):
            session_code = f"{course_code}{session_def['suffix']}"
            progress = f"Audio {i + 1}/{TOTAL_SESSIONS} ({session_code})"
            _update_progress(db, job_id, progress)
            print(f"  [course] {progress}")

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

        _update_status(db, job_id, "uploading", {
            "courseProgress": f"All {TOTAL_SESSIONS} audio files uploaded",
        })

        # ========== STEP 6: Publish course + sessions ==========
        auto_publish = job_data.get("autoPublish", True)

        if auto_publish:
            _update_status(db, job_id, "publishing")
            _update_progress(db, job_id, "Publishing course...")

            course_id, session_ids = _publish_course(
                db, plan, audio_results, job_data,
            )

            _update_status(db, job_id, "completed", {
                "courseId": course_id,
                "courseSessionIds": session_ids,
                "courseProgress": "Published",
                "completedAt": fs.SERVER_TIMESTAMP,
            })
            print(f"  [course] Course {course_code} published! ID: {course_id}")
        else:
            _update_status(db, job_id, "completed", {
                "courseProgress": "Completed (awaiting approval)",
                "completedAt": fs.SERVER_TIMESTAMP,
            })
            print(f"  [course] Course {course_code} done (awaiting approval).")

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        print(f"  [course] Job {job_id} FAILED: {error_msg}")
        traceback.print_exc()
        _update_status(db, job_id, "failed", {
            "error": error_msg,
            "courseProgress": "Failed",
        })


def _publish_course(
    db,
    plan: dict,
    audio_results: dict,
    job_data: dict,
) -> tuple[str, list[str]]:
    """Create the course document and 9 session documents in Firestore."""
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
    voice = job_data.get("ttsVoice", "Calmdemy")

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
        "generatedBy": "content-factory",
        "createdAt": fs.SERVER_TIMESTAMP,
    }

    _, course_ref = db.collection("courses").add(course_data)
    course_id = course_ref.id
    print(f"  [publish] Created course: {course_id} ({course_code})")

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

        _, session_ref = db.collection("course_sessions").add(session_data)
        session_ids.append(session_ref.id)
        print(f"  [publish] Created session: {session_ref.id} ({session_code})")

    return course_id, session_ids
