from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class JobState(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepState(str, Enum):
    READY = "ready"
    LEASED = "leased"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    RETRY_SCHEDULED = "retry_scheduled"
    DEAD_LETTER = "dead_letter"


@dataclass(slots=True)
class FactoryJob:
    id: str
    job_type: str
    request: dict[str, Any]
    state: JobState = JobState.QUEUED
    current_run_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    summary: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class JobRun:
    id: str
    job_id: str
    run_number: int
    state: JobState
    trigger: str
    started_at: datetime | None = None
    ended_at: datetime | None = None


@dataclass(slots=True)
class StepRun:
    id: str
    job_id: str
    run_id: str
    step_name: str
    state: StepState
    attempt: int = 1
    shard_key: str | None = None
    lease_owner: str | None = None
    lease_expires_at: datetime | None = None
    input_ref: str | None = None
    output_ref: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None


@dataclass(slots=True)
class Artifact:
    id: str
    job_id: str
    run_id: str
    kind: str
    producer_step_run_id: str
    payload: dict[str, Any] = field(default_factory=dict)
