"""
Step 2: QA and formatting — validate and clean up the generated script.
"""

import re

from observability import get_logger

logger = get_logger(__name__)

def format_script(script: str, job_data: dict) -> str:
    """Validate structure and normalize pause markers in the script."""
    logger.info("Formatting script")

    text = script.strip()

    # Normalize pause markers to consistent format: [PAUSE Xs]
    text = re.sub(
        r'\[pause\s*(\d+)\s*s(?:econds?)?\s*\]',
        lambda m: f"[PAUSE {m.group(1)}s]",
        text,
        flags=re.IGNORECASE,
    )

    # Remove any markdown formatting the LLM may have added
    text = re.sub(r'^#+\s+.*$', '', text, flags=re.MULTILINE)  # headers
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)                # bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)                    # italic
    text = re.sub(r'```[\s\S]*?```', '', text)                  # code blocks

    # Remove blank lines that are more than double
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Remove any "Title:" or "Script:" prefix lines
    text = re.sub(r'^(Title|Script|Narration|Scene)\s*:.*\n?', '', text, flags=re.MULTILINE | re.IGNORECASE)

    text = text.strip()

    word_count = len(text.split())
    pause_count = len(re.findall(r'\[PAUSE \d+s\]', text))
    logger.info(
        "Formatted script",
        extra={"word_count": word_count, "pause_count": pause_count},
    )

    if word_count < 50:
        raise ValueError(f"Script too short ({word_count} words). LLM may have failed.")

    return text
