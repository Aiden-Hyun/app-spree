"""
Step 1: Generate a narration script using an LLM.
"""

import os
from models.registry import get_llm
import config

# Approximate words-per-minute for narrated meditation audio
WORDS_PER_MINUTE = 130

# Cache loaded model to reuse across jobs in the same VM session
_cached_model = None
_cached_model_id = None


def _load_prompt_template(content_type: str) -> str:
    """Load the prompt template file for a content type."""
    prompts_dir = os.path.join(os.path.dirname(__file__), "..", "prompts")
    filename = f"{content_type}.txt"
    filepath = os.path.join(prompts_dir, filename)

    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"No prompt template found at {filepath}")

    with open(filepath, "r") as f:
        return f.read()


def _build_prompt(template: str, job_data: dict) -> str:
    """Fill in the prompt template with job parameters."""
    params = job_data.get("params", {})
    duration = params.get("duration_minutes", 10)
    word_count = duration * WORDS_PER_MINUTE

    replacements = {
        "topic": params.get("topic", "general mindfulness"),
        "duration_minutes": str(duration),
        "word_count": str(word_count),
        "difficulty": params.get("difficulty", "beginner"),
        "style": params.get("style", "calm and soothing"),
        "technique": params.get("technique", "mindfulness"),
        "category": params.get("category", "nature"),
        "custom_instructions": params.get("customInstructions", ""),
    }

    result = template
    for key, value in replacements.items():
        result = result.replace("{" + key + "}", value)

    return result


def generate_script(job_data: dict) -> str:
    """Generate a meditation/story script using the specified LLM."""
    global _cached_model, _cached_model_id

    model_id = job_data.get("llmModel", "gemma-3-12b")
    content_type = job_data.get("contentType", "guided_meditation")

    print(f"  [llm] Generating script with {model_id}...")

    # Load model (reuse if same model as previous job)
    if _cached_model is None or _cached_model_id != model_id:
        if _cached_model is not None:
            _cached_model.unload()
        _cached_model = get_llm(model_id)
        _cached_model.load(config.MODEL_DIR)
        _cached_model_id = model_id

    # Build prompt
    template = _load_prompt_template(content_type)
    prompt = _build_prompt(template, job_data)

    # Estimate max tokens based on duration
    duration = job_data.get("params", {}).get("duration_minutes", 10)
    max_tokens = max(2048, duration * WORDS_PER_MINUTE * 2)

    # Generate
    script = _cached_model.generate(prompt, max_tokens=max_tokens)

    # Clean up end marker if present
    for marker in ["---END---", "<end_of_script>"]:
        if marker in script:
            script = script[:script.index(marker)].strip()

    word_count = len(script.split())
    print(f"  [llm] Script generated: {word_count} words")

    return script
