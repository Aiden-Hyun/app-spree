from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable
from typing import Any


@dataclass(slots=True)
class StepContext:
    db: Any
    job: dict
    run_id: str
    step_name: str
    worker_id: str
    shard_key: str = "root"
    step_input: dict[str, Any] = field(default_factory=dict)
    progress_callback: Callable[[str | None], None] | None = None

    def progress(self, detail: str | None = None) -> None:
        if self.progress_callback is not None:
            self.progress_callback(detail)


@dataclass(slots=True)
class StepResult:
    output: dict[str, Any] = field(default_factory=dict)
    runtime_patch: dict[str, Any] = field(default_factory=dict)
    summary_patch: dict[str, Any] = field(default_factory=dict)
    compat_content_job_patch: dict[str, Any] = field(default_factory=dict)
    requeue_after_seconds: int | None = None
