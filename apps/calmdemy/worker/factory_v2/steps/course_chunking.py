from __future__ import annotations

from factory_v2.shared.course_tts_chunks import split_course_tts_chunks


def _course_session_chunks(
    formatted_scripts: dict[str, str],
    course_code: str,
    session_def: dict,
) -> tuple[str, list[str]]:
    session_code = f"{course_code}{session_def['suffix']}"
    script = formatted_scripts.get(session_code)
    if not script:
        raise ValueError(f"Missing formatted script for {session_code}")
    chunks = split_course_tts_chunks(script)
    if not chunks:
        raise ValueError(f"Unable to derive TTS chunks for {session_code}")
    return session_code, chunks
