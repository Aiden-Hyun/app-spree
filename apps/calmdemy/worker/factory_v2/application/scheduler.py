from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class WorkflowSpec:
    name: str
    steps: list[str]
    edges: dict[str, list[str]] = field(default_factory=dict)
    terminal_step: str = ""

    def next_steps(self, step_name: str) -> list[str]:
        return list(self.edges.get(step_name, []))

    def prerequisites(self, step_name: str) -> list[str]:
        required: list[str] = []
        for source, targets in self.edges.items():
            if step_name in targets:
                required.append(source)
        return required


SINGLE_CONTENT_WORKFLOW = WorkflowSpec(
    name="single_content",
    steps=[
        "generate_script",
        "format_script",
        "generate_image",
        "synthesize_audio",
        "post_process_audio",
        "upload_audio",
        "publish_content",
    ],
    edges={
        "generate_script": ["format_script"],
        "format_script": ["generate_image", "synthesize_audio"],
        "generate_image": ["publish_content"],
        "synthesize_audio": ["post_process_audio"],
        "post_process_audio": ["upload_audio"],
        "upload_audio": ["publish_content"],
    },
    terminal_step="publish_content",
)

COURSE_WORKFLOW = WorkflowSpec(
    name="course",
    steps=[
        "generate_course_plan",
        "generate_course_thumbnail",
        "generate_course_scripts",
        "format_course_scripts",
        "synthesize_course_audio",
        "upload_course_audio",
        "publish_course",
    ],
    edges={
        "generate_course_plan": ["generate_course_thumbnail", "generate_course_scripts"],
        "generate_course_scripts": ["format_course_scripts"],
        "format_course_scripts": ["synthesize_course_audio"],
        "synthesize_course_audio": ["upload_course_audio"],
        "generate_course_thumbnail": ["publish_course"],
        "upload_course_audio": ["publish_course"],
    },
    terminal_step="publish_course",
)


def workflow_for_job_type(job_type: str) -> WorkflowSpec:
    if job_type == "course":
        return COURSE_WORKFLOW
    return SINGLE_CONTENT_WORKFLOW
