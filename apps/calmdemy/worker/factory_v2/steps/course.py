from __future__ import annotations

import ast
import json
import math
import os
import re
from typing import Any

import config
from firebase_admin import firestore as fs

from observability import get_logger

from .base import StepContext, StepResult

logger = get_logger(__name__)

DEFAULT_FALLBACK_URL = (
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
)

SESSION_DEFS = [
    {"suffix": "INT", "type": "intro", "label": "Course Intro", "order": 0, "duration_min": 2},
    {"suffix": "M1L", "type": "lesson", "label": "Module 1 — Lesson", "order": 1, "duration_min": 5},
    {"suffix": "M1P", "type": "practice", "label": "Module 1 — Practice", "order": 2, "duration_min": 8},
    {"suffix": "M2L", "type": "lesson", "label": "Module 2 — Lesson", "order": 3, "duration_min": 5},
    {"suffix": "M2P", "type": "practice", "label": "Module 2 — Practice", "order": 4, "duration_min": 8},
    {"suffix": "M3L", "type": "lesson", "label": "Module 3 — Lesson", "order": 5, "duration_min": 5},
    {"suffix": "M3P", "type": "practice", "label": "Module 3 — Practice", "order": 6, "duration_min": 8},
    {"suffix": "M4L", "type": "lesson", "label": "Module 4 — Lesson", "order": 7, "duration_min": 5},
    {"suffix": "M4P", "type": "practice", "label": "Module 4 — Practice", "order": 8, "duration_min": 8},
]


def _content_job_data(job: dict) -> dict[str, Any]:
    request = job.get("request") or {}
    payload = request.get("content_job") or request.get("job_data") or {}
    if not payload:
        raise ValueError("factory_jobs.request.content_job is required")
    return dict(payload)


def _runtime(job: dict) -> dict[str, Any]:
    return dict(job.get("runtime") or {})


def _course_code(job_data: dict) -> str:
    params = job_data.get("params") or {}
    return str(params.get("courseCode") or "COURSE101")


def _load_system_prompt() -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "system_prompts", "course_system_prompt.txt"
    )
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


def _build_course_plan_prompt(job_data: dict) -> str:
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
    cleaned = text
    cleaned = cleaned.replace("“", '"').replace("”", '"')
    cleaned = cleaned.replace("‘", "'").replace("’", "'")
    cleaned = re.sub(r'(<[^>]*?)="([^"]*?)"', r"\\1='\\2'", cleaned)
    cleaned = re.sub(r"<break\\s+time='(\\d+)s'\\s*/?>", r"[PAUSE \\1s]", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
    return cleaned


def _parse_plan(raw: str) -> dict:
    text = raw.strip()
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
    params = job_data.get("params", {})
    course_code = params.get("courseCode", "COURSE101")
    course_title = params.get("courseTitle", plan.get("courseTitle", "Untitled"))
    approach = params.get("subjectLabel", "CBT")
    tone = params.get("tone", "gentle")
    audience = params.get("targetAudience", "beginner")

    session_type = session_def["type"]
    duration_min = session_def["duration_min"]
    words = duration_min * 130

    if session_type == "intro":
        intro_outline = plan.get("intro", {}).get("outline", "Welcome to the course.")
        return (
            f"You are CalmNest Course Scriptwriter. Write a Course Intro script "
            f"for the course '{course_title}' (code: {course_code}).\\n\\n"
            f"Therapy approach: {approach}\\n"
            f"Tone: {tone}\\n"
            f"Target audience: {audience}\\n"
            f"Duration: about {duration_min} minutes (~{words} words)\\n\\n"
            f"Intro outline from the course plan:\\n{intro_outline}\\n\\n"
            f"Course goal: {plan.get('courseGoal', '')}\\n\\n"
            f"Rules:\\n"
            f"- Narrator is Britney Irvine.\\n"
            f"- Include a short educational disclaimer (not treatment).\\n"
            f"- Use [PAUSE Xs] markers for pauses (e.g. [PAUSE 3s]).\\n"
            f"- Write ONLY the narration script. No titles or metadata at the top.\\n"
            f"- End with ---END---"
        )

    module_idx = int(session_def["suffix"][1]) - 1
    module = plan.get("modules", [{}])[module_idx] if module_idx < len(plan.get("modules", [])) else {}

    if session_type == "lesson":
        title = module.get("lessonTitle", "Lesson")
        summary = module.get("lessonSummary", "")
        objective = module.get("objective", "")
        return (
            f"You are CalmNest Course Scriptwriter. Write a Lesson script "
            f"for Module {module_idx + 1} of '{course_title}' ({course_code}).\\n\\n"
            f"Module title: {module.get('moduleTitle', '')}\\n"
            f"Lesson title: {title}\\n"
            f"Learning objective: {objective}\\n"
            f"Lesson summary: {summary}\\n"
            f"Therapy approach: {approach}\\n"
            f"Tone: {tone}\\n"
            f"Target audience: {audience}\\n"
            f"Duration: about {duration_min} minutes (~{words} words)\\n\\n"
            f"Rules:\\n"
            f"- Clear teaching with one example and one tool.\\n"
            f"- Use [PAUSE Xs] markers for pauses.\\n"
            f"- Include a gentle closing and takeaway line.\\n"
            f"- Start with a brief intro connecting to the course theme.\\n"
            f"- Write ONLY the narration script. No titles or metadata at the top.\\n"
            f"- End with ---END---"
        )

    title = module.get("practiceTitle", "Practice")
    practice_type = module.get("practiceType", "guided exercise")
    prompts = module.get("reflectionPrompts", [])
    takeaway = module.get("keyTakeaway", "")
    return (
        f"You are CalmNest Course Scriptwriter. Write a Practice script "
        f"for Module {module_idx + 1} of '{course_title}' ({course_code}).\\n\\n"
        f"Module title: {module.get('moduleTitle', '')}\\n"
        f"Practice title: {title}\\n"
        f"Practice type: {practice_type}\\n"
        f"Reflection prompts to include: {', '.join(prompts)}\\n"
        f"Key takeaway: {takeaway}\\n"
        f"Therapy approach: {approach}\\n"
        f"Tone: {tone}\\n"
        f"Target audience: {audience}\\n"
        f"Duration: about {duration_min} minutes (~{words} words)\\n\\n"
        f"Rules:\\n"
        f"- Guided exercise with varied prompts and intentional pauses.\\n"
        f"- Use [PAUSE Xs] markers for pauses (3s-10s).\\n"
        f"- Include re-centering language and reflection.\\n"
        f"- Clear start and end.\\n"
        f"- Write ONLY the narration script. No titles or metadata at the top.\\n"
        f"- End with ---END---"
    )


def _get_session_title(session_def: dict, plan: dict) -> str:
    if session_def["type"] == "intro":
        return plan.get("intro", {}).get("title", "Course Intro")

    module_idx = int(session_def["suffix"][1]) - 1
    modules = plan.get("modules", [])
    module = modules[module_idx] if module_idx < len(modules) else {}

    if session_def["type"] == "lesson":
        return module.get("lessonTitle", session_def["label"])
    return module.get("practiceTitle", session_def["label"])


def _build_course_preview_sessions(
    course_code: str,
    plan: dict,
    audio_results: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    sessions: list[dict[str, Any]] = []
    for session_def in SESSION_DEFS:
        session_code = f"{course_code}{session_def['suffix']}"
        audio = audio_results.get(session_code, {})
        sessions.append(
            {
                "code": session_code,
                "label": session_def["label"],
                "title": _get_session_title(session_def, plan),
                "order": session_def["order"],
                "audioPath": audio.get("storagePath", ""),
                "durationSec": audio.get("durationSec", 0),
            }
        )
    return sessions


def _content_job_id(job: dict) -> str:
    request = job.get("request") or {}
    compat = request.get("compat") or {}
    return str(compat.get("content_job_id") or "").strip()


def _count_audio_results(audio_results: dict[str, dict[str, Any]]) -> int:
    count = 0
    for payload in audio_results.values():
        if isinstance(payload, dict) and payload.get("storagePath"):
            count += 1
    return count


def _persist_course_audio_checkpoint(
    ctx: StepContext,
    audio_results: dict[str, dict[str, Any]],
) -> None:
    """
    Persist per-session audio progress so retries can resume from the next session.
    """
    job_id = str(ctx.job.get("id") or "").strip()
    if not job_id:
        return

    completed = _count_audio_results(audio_results)
    progress = f"Audio {completed}/{len(SESSION_DEFS)}"

    factory_ref = ctx.db.collection("factory_jobs").document(job_id)
    try:
        factory_ref.update(
            {
                "runtime.course_audio_results": audio_results,
                "summary.currentStep": "synthesize_course_audio",
                "summary.courseAudioCount": completed,
                "updated_at": fs.SERVER_TIMESTAMP,
            }
        )
    except Exception:
        factory_ref.set(
            {
                "runtime": {"course_audio_results": audio_results},
                "summary": {
                    "currentStep": "synthesize_course_audio",
                    "courseAudioCount": completed,
                },
                "updated_at": fs.SERVER_TIMESTAMP,
            },
            merge=True,
        )

    content_job_id = _content_job_id(ctx.job)
    if not content_job_id:
        return

    content_ref = ctx.db.collection(config.JOBS_COLLECTION).document(content_job_id)
    transaction = ctx.db.transaction()

    @fs.transactional
    def _tx_patch(tx) -> None:
        snapshot = content_ref.get(transaction=tx)
        if not snapshot.exists:
            return
        data = snapshot.to_dict() or {}
        active_run_id = str(data.get("v2RunId") or "").strip()
        if active_run_id and active_run_id != ctx.run_id:
            return
        tx.set(
            content_ref,
            {
                "status": "tts_converting",
                "courseAudioResults": audio_results,
                "courseProgress": progress,
                "jobRunId": ctx.run_id,
                "lastRunStatus": "running",
                "runEndedAt": None,
                "updatedAt": fs.SERVER_TIMESTAMP,
            },
            merge=True,
        )

    _tx_patch(transaction)


def _publish_course(
    db,
    publish_token: str,
    plan: dict,
    audio_results: dict[str, dict[str, Any]],
    job_data: dict,
) -> tuple[str, list[str]]:
    from factory_v2.shared.voice_utils import get_voice_display_name

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

    total_duration = sum(r.get("durationSec", 0) for r in audio_results.values())
    total_minutes = max(1, math.ceil(total_duration / 60))

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
        "sessionCount": len(SESSION_DEFS),
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

    session_ids: list[str] = []
    for session_def in SESSION_DEFS:
        session_code = f"{course_code}{session_def['suffix']}"
        audio = audio_results.get(session_code, {})
        duration_sec = audio.get("durationSec", 0)

        session_data = {
            "courseId": course_id,
            "code": session_code,
            "title": _get_session_title(session_def, plan),
            "description": f"{session_def['label']} for {course_title}",
            "duration_minutes": max(1, math.ceil(duration_sec / 60)),
            "audioPath": audio.get("storagePath", ""),
            "order": session_def["order"],
            "isFree": False,
            "generatedBy": "content-factory",
            "createdAt": fs.SERVER_TIMESTAMP,
        }

        session_ref = db.collection("course_sessions").document(f"{publish_token}-{session_code}")
        session_ref.set(session_data, merge=True)
        session_ids.append(session_ref.id)

    return course_id, session_ids


def execute_generate_course_plan(ctx: StepContext) -> StepResult:
    from factory_v2.shared.llm_generator import _get_llm_adapter

    job_data = _content_job_data(ctx.job)
    runtime = _runtime(ctx.job)

    plan = runtime.get("course_plan") or job_data.get("coursePlan")
    if not plan:
        adapter = _get_llm_adapter(job_data)
        plan_prompt = _build_course_plan_prompt(job_data)
        plan_raw = adapter.generate(plan_prompt, max_tokens=4096)
        plan = _parse_plan(plan_raw)

    return StepResult(
        output={"module_count": len(plan.get("modules") or [])},
        runtime_patch={"course_plan": plan},
        summary_patch={"currentStep": "generate_course_plan"},
        compat_content_job_patch={
            "status": "llm_generating",
            "coursePlan": plan,
            "courseProgress": "Generating course plan",
            "jobRunId": ctx.run_id,
        },
    )


def execute_generate_course_thumbnail(ctx: StepContext) -> StepResult:
    from factory_v2.shared.image_generator import build_image_prompt, generate_image
    from factory_v2.shared.storage_uploader import upload_image

    job_data = _content_job_data(ctx.job)
    runtime = _runtime(ctx.job)
    plan = runtime.get("course_plan") or job_data.get("coursePlan") or {}

    thumbnail_url = runtime.get("thumbnail_url") or job_data.get("thumbnailUrl") or ""
    image_path = runtime.get("image_path") or job_data.get("imagePath") or ""
    image_prompt = runtime.get("image_prompt") or job_data.get("imagePrompt") or ""

    if not thumbnail_url:
        try:
            title = job_data.get("params", {}).get("courseTitle", plan.get("courseTitle", "Untitled Course"))
            image_prompt = image_prompt or build_image_prompt(
                job_data,
                title,
                job_data.get("params", {}).get("topic", ""),
                "course",
                plan=plan,
            )
            local_image_path = generate_image(image_prompt)
            image_path, thumbnail_url = upload_image(local_image_path, {**job_data, "contentType": "course"})
        except Exception as exc:
            logger.warning("Course image generation failed", extra={"job_id": ctx.job.get("id"), "error": str(exc)})
            thumbnail_url = thumbnail_url or DEFAULT_FALLBACK_URL
            image_prompt = image_prompt or f"Course thumbnail for {job_data.get('params', {}).get('courseTitle', 'Untitled')}"

    return StepResult(
        output={"thumbnail_url": thumbnail_url},
        runtime_patch={
            "image_prompt": image_prompt,
            "image_path": image_path,
            "thumbnail_url": thumbnail_url,
            "image_model": config.IMAGE_MODEL_ID,
        },
        summary_patch={"currentStep": "generate_course_thumbnail"},
        compat_content_job_patch={
            "status": "image_generating",
            "imagePrompt": image_prompt,
            "imagePath": image_path,
            "thumbnailUrl": thumbnail_url,
            "imageModel": config.IMAGE_MODEL_ID,
            "jobRunId": ctx.run_id,
        },
    )


def execute_generate_course_scripts(ctx: StepContext) -> StepResult:
    from factory_v2.shared.llm_generator import _get_llm_adapter

    job_data = _content_job_data(ctx.job)
    runtime = _runtime(ctx.job)
    plan = runtime.get("course_plan") or job_data.get("coursePlan")
    if not plan:
        raise ValueError("Missing runtime.course_plan")

    course_code = _course_code(job_data)
    raw_scripts: dict[str, str] = dict(runtime.get("course_raw_scripts") or job_data.get("courseRawScripts") or {})
    adapter = _get_llm_adapter(job_data)

    for index, session_def in enumerate(SESSION_DEFS):
        session_code = f"{course_code}{session_def['suffix']}"
        if raw_scripts.get(session_code, "").strip():
            continue

        prompt = _build_session_script_prompt(session_def, plan, job_data)
        raw_script = adapter.generate(
            prompt,
            max_tokens=max(2048, session_def["duration_min"] * 130 * 2),
        )
        for marker in ["---END---", "<end_of_script>"]:
            if marker in raw_script:
                raw_script = raw_script[: raw_script.index(marker)].strip()
        raw_scripts[session_code] = raw_script

        logger.info(
            "Course script generated",
            extra={
                "job_id": ctx.job.get("id"),
                "session_code": session_code,
                "index": index,
            },
        )

    preview = {k: f"{v[:200]}..." for k, v in raw_scripts.items()}

    return StepResult(
        output={"script_count": len(raw_scripts)},
        runtime_patch={"course_raw_scripts": raw_scripts},
        summary_patch={"currentStep": "generate_course_scripts"},
        compat_content_job_patch={
            "status": "llm_generating",
            "generatedScript": json.dumps(preview, indent=2),
            "courseRawScripts": raw_scripts,
            "courseProgress": f"Scripts {len(raw_scripts)}/{len(SESSION_DEFS)}",
            "jobRunId": ctx.run_id,
        },
    )


def execute_format_course_scripts(ctx: StepContext) -> StepResult:
    from factory_v2.shared.qa_formatter import format_script

    job_data = _content_job_data(ctx.job)
    runtime = _runtime(ctx.job)

    course_code = _course_code(job_data)
    raw_scripts: dict[str, str] = dict(runtime.get("course_raw_scripts") or job_data.get("courseRawScripts") or {})
    if not raw_scripts:
        raise ValueError("Missing runtime.course_raw_scripts")

    formatted_scripts: dict[str, str] = dict(runtime.get("course_formatted_scripts") or job_data.get("courseFormattedScripts") or {})

    for session_def in SESSION_DEFS:
        session_code = f"{course_code}{session_def['suffix']}"
        if formatted_scripts.get(session_code, "").strip():
            continue

        script = raw_scripts.get(session_code, "").strip()
        if not script:
            raise ValueError(f"Missing raw script for {session_code}")

        try:
            formatted = format_script(script, job_data)
        except ValueError:
            formatted = script

        formatted_scripts[session_code] = formatted

    return StepResult(
        output={"formatted_count": len(formatted_scripts)},
        runtime_patch={"course_formatted_scripts": formatted_scripts},
        summary_patch={"currentStep": "format_course_scripts"},
        compat_content_job_patch={
            "status": "qa_formatting",
            "courseFormattedScripts": formatted_scripts,
            "courseProgress": f"Formatted {len(formatted_scripts)}/{len(SESSION_DEFS)}",
            "jobRunId": ctx.run_id,
        },
    )


def execute_synthesize_course_audio(ctx: StepContext) -> StepResult:
    from factory_v2.shared.audio_processor import post_process_audio
    from factory_v2.shared.storage_uploader import upload_audio
    from factory_v2.shared.tts_converter import convert_to_audio

    job_data = _content_job_data(ctx.job)
    runtime = _runtime(ctx.job)

    course_code = _course_code(job_data)
    formatted_scripts: dict[str, str] = dict(runtime.get("course_formatted_scripts") or job_data.get("courseFormattedScripts") or {})
    if not formatted_scripts:
        raise ValueError("Missing runtime.course_formatted_scripts")

    audio_results: dict[str, dict[str, Any]] = dict(runtime.get("course_audio_results") or job_data.get("courseAudioResults") or {})

    for index, session_def in enumerate(SESSION_DEFS):
        session_code = f"{course_code}{session_def['suffix']}"
        if audio_results.get(session_code, {}).get("storagePath"):
            continue

        script = formatted_scripts.get(session_code)
        if not script:
            raise ValueError(f"Missing formatted script for {session_code}")

        wav_path = convert_to_audio(script, job_data)
        mp3_path = post_process_audio(wav_path)

        session_job_data = {
            **job_data,
            "contentType": "course_session",
            "params": {
                **(job_data.get("params") or {}),
                "topic": f"{course_code} {session_def['label']}",
            },
        }
        storage_path, duration_sec = upload_audio(mp3_path, session_job_data)
        audio_results[session_code] = {
            "storagePath": storage_path,
            "durationSec": duration_sec,
        }
        _persist_course_audio_checkpoint(ctx, audio_results)

        logger.info(
            "Course audio synthesized",
            extra={
                "job_id": ctx.job.get("id"),
                "session_code": session_code,
                "index": index,
            },
        )

    return StepResult(
        output={"audio_count": len(audio_results)},
        runtime_patch={"course_audio_results": audio_results},
        summary_patch={"currentStep": "synthesize_course_audio"},
        compat_content_job_patch={
            "status": "tts_converting",
            "courseAudioResults": audio_results,
            "courseProgress": f"Audio {len(audio_results)}/{len(SESSION_DEFS)}",
            "jobRunId": ctx.run_id,
        },
    )


def execute_upload_course_audio(ctx: StepContext) -> StepResult:
    job_data = _content_job_data(ctx.job)
    runtime = _runtime(ctx.job)

    audio_results: dict[str, dict[str, Any]] = dict(runtime.get("course_audio_results") or job_data.get("courseAudioResults") or {})
    if not audio_results:
        raise ValueError("Missing runtime.course_audio_results")

    return StepResult(
        output={"audio_count": len(audio_results)},
        summary_patch={"currentStep": "upload_course_audio"},
        compat_content_job_patch={
            "status": "uploading",
            "courseAudioResults": audio_results,
            "courseProgress": f"All {len(SESSION_DEFS)} audio files uploaded",
            "jobRunId": ctx.run_id,
        },
    )


def execute_publish_course(ctx: StepContext) -> StepResult:
    job_data = _content_job_data(ctx.job)
    runtime = _runtime(ctx.job)

    course_code = _course_code(job_data)
    plan = runtime.get("course_plan") or job_data.get("coursePlan")
    if not plan:
        raise ValueError("Missing runtime.course_plan")

    audio_results: dict[str, dict[str, Any]] = dict(runtime.get("course_audio_results") or job_data.get("courseAudioResults") or {})
    if not audio_results:
        raise ValueError("Missing runtime.course_audio_results")

    request_status = str(job_data.get("status") or "").strip().lower()
    auto_publish = bool(job_data.get("autoPublish", True))
    manual_publish = request_status == "publishing"
    should_publish = auto_publish or manual_publish

    if not should_publish:
        preview_sessions = _build_course_preview_sessions(course_code, plan, audio_results)
        return StepResult(
            output={"awaiting_approval": True, "preview_count": len(preview_sessions)},
            runtime_patch={"course_preview_sessions": preview_sessions},
            summary_patch={"currentStep": "publish_course", "awaitingApproval": True},
            compat_content_job_patch={
                "status": "completed",
                "coursePreviewSessions": preview_sessions,
                "courseProgress": "Completed (awaiting approval)",
                "jobRunId": ctx.run_id,
            },
        )

    publish_token = str(job_data.get("publishToken") or job_data.get("id") or ctx.job.get("id") or course_code)

    existing_course_id = runtime.get("course_id") or job_data.get("courseId")
    existing_session_ids = runtime.get("course_session_ids") or job_data.get("courseSessionIds")
    if existing_course_id and existing_session_ids:
        return StepResult(
            output={"course_id": existing_course_id, "session_count": len(existing_session_ids)},
            summary_patch={"currentStep": "publish_course", "courseId": existing_course_id},
            compat_content_job_patch={
                "status": "completed",
                "courseId": existing_course_id,
                "courseSessionIds": existing_session_ids,
                "courseProgress": "Published",
                "jobRunId": ctx.run_id,
            },
        )

    course_id, session_ids = _publish_course(
        ctx.db,
        publish_token=publish_token,
        plan=plan,
        audio_results=audio_results,
        job_data={
            **job_data,
            "thumbnailUrl": runtime.get("thumbnail_url") or job_data.get("thumbnailUrl") or "",
        },
    )

    return StepResult(
        output={"course_id": course_id, "session_count": len(session_ids)},
        runtime_patch={"course_id": course_id, "course_session_ids": session_ids},
        summary_patch={"currentStep": "publish_course", "courseId": course_id},
        compat_content_job_patch={
            "status": "completed",
            "courseId": course_id,
            "courseSessionIds": session_ids,
            "courseProgress": "Published",
            "jobRunId": ctx.run_id,
        },
    )
