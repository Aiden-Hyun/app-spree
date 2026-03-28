from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

WORKER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKER_DIR not in sys.path:
    sys.path.insert(0, WORKER_DIR)

from factory_v2.steps.base import StepContext
from factory_v2.steps.course_planning import execute_generate_course_thumbnail


class CourseThumbnailGenerationTests(unittest.TestCase):
    def test_thumbnail_step_raises_when_image_generation_fails(self) -> None:
        job = {
            "request": {
                "content_job": {
                    "params": {
                        "courseTitle": "Mastery Through Case Studies",
                        "topic": "Case-study based CBT practice",
                    },
                    "contentType": "course",
                    "coursePlan": {
                        "courseTitle": "Mastery Through Case Studies",
                        "modules": [],
                    },
                },
                "compat": {"content_job_id": "job-123"},
            },
            "runtime": {
                "course_plan": {
                    "courseTitle": "Mastery Through Case Studies",
                    "modules": [],
                },
                "thumbnail_generation_requested": True,
            },
        }

        with (
            patch(
                "factory_v2.shared.image_generator.build_image_prompt",
                return_value="A magnifying glass hovering over a detailed case study page.",
            ),
            patch(
                "factory_v2.shared.image_generator.generate_image",
                side_effect=RuntimeError("generation boom"),
            ),
            patch("factory_v2.shared.storage_uploader.upload_image") as upload_image,
        ):
            with self.assertRaisesRegex(RuntimeError, "generation boom"):
                execute_generate_course_thumbnail(
                    StepContext(
                        db=None,
                        job=job,
                        run_id="run-1",
                        step_name="generate_course_thumbnail",
                        worker_id="local-image",
                    )
                )

        upload_image.assert_not_called()


if __name__ == "__main__":
    unittest.main()
