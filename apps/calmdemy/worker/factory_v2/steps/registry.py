from __future__ import annotations

from collections.abc import Callable

from .base import StepContext, StepResult
from . import single_content, course_legacy


StepExecutor = Callable[[StepContext], StepResult]


EXECUTORS: dict[str, StepExecutor] = {
    "generate_script": single_content.execute_generate_script,
    "format_script": single_content.execute_format_script,
    "generate_image": single_content.execute_generate_image,
    "synthesize_audio": single_content.execute_synthesize_audio,
    "post_process_audio": single_content.execute_post_process_audio,
    "upload_audio": single_content.execute_upload_audio,
    "publish_content": single_content.execute_publish_content,
    "run_course_pipeline": course_legacy.execute_run_course_pipeline,
    "publish_course_manual": course_legacy.execute_publish_course_manual,
}


def get_executor(step_name: str) -> StepExecutor:
    executor = EXECUTORS.get(step_name)
    if executor is None:
        raise KeyError(f"No executor registered for step '{step_name}'")
    return executor
