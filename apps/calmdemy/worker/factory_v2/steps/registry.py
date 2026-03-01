from __future__ import annotations

from collections.abc import Callable

from .base import StepContext, StepResult
from . import course, single_content


StepExecutor = Callable[[StepContext], StepResult]


EXECUTORS: dict[str, StepExecutor] = {
    "generate_script": single_content.execute_generate_script,
    "format_script": single_content.execute_format_script,
    "generate_image": single_content.execute_generate_image,
    "synthesize_audio": single_content.execute_synthesize_audio,
    "post_process_audio": single_content.execute_post_process_audio,
    "upload_audio": single_content.execute_upload_audio,
    "publish_content": single_content.execute_publish_content,
    "generate_course_plan": course.execute_generate_course_plan,
    "generate_course_thumbnail": course.execute_generate_course_thumbnail,
    "generate_course_scripts": course.execute_generate_course_scripts,
    "format_course_scripts": course.execute_format_course_scripts,
    "synthesize_course_audio": course.execute_synthesize_course_audio,
    "upload_course_audio": course.execute_upload_course_audio,
    "publish_course": course.execute_publish_course,
}


def get_executor(step_name: str) -> StepExecutor:
    executor = EXECUTORS.get(step_name)
    if executor is None:
        raise KeyError(f"No executor registered for step '{step_name}'")
    return executor
