from __future__ import annotations

import os
import shutil
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from PIL import Image

WORKER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKER_DIR not in sys.path:
    sys.path.insert(0, WORKER_DIR)

from factory_v2.shared import image_generator


class _FakePipe:
    def __init__(self) -> None:
        self.calls = []

    def to(self, _device: str) -> "_FakePipe":
        return self

    def set_progress_bar_config(self, **_kwargs) -> None:
        return None

    def enable_attention_slicing(self) -> None:
        return None

    def enable_vae_slicing(self) -> None:
        return None

    def enable_vae_tiling(self) -> None:
        return None

    def __call__(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(images=[Image.new("RGB", (8, 8), color="white")])


class _FakePipelineClass:
    created_pipes: list[_FakePipe] = []

    @classmethod
    def from_pretrained(cls, *_args, **_kwargs) -> _FakePipe:
        pipe = _FakePipe()
        cls.created_pipes.append(pipe)
        return pipe


class ImageGeneratorTests(unittest.TestCase):
    def setUp(self) -> None:
        _FakePipelineClass.created_pipes = []
        image_generator._release_cached_pipe()

    def tearDown(self) -> None:
        image_generator._release_cached_pipe()

    def test_generate_image_does_not_reuse_pipeline_when_cache_disabled(self) -> None:
        output_paths: list[str] = []

        with (
            patch.object(image_generator.config, "IMAGE_PIPELINE_CACHE_ENABLED", False),
            patch.object(image_generator.config, "IMAGE_MODEL_ID", "fake/flux"),
            patch.object(image_generator, "_resolve_pipeline_class", return_value=_FakePipelineClass),
            patch.object(image_generator, "_empty_runtime_cache") as empty_runtime_cache,
        ):
            first_path = image_generator.generate_image("calm lake at sunrise", width=8, height=8)
            second_path = image_generator.generate_image("forest path", width=8, height=8)
            output_paths.extend([first_path, second_path])

        self.assertEqual(len(_FakePipelineClass.created_pipes), 2)
        self.assertIsNone(image_generator._cached_pipe)
        self.assertEqual(empty_runtime_cache.call_count, 2)

        for output_path in output_paths:
            self.assertTrue(os.path.exists(output_path))
            shutil.rmtree(os.path.dirname(output_path), ignore_errors=True)

    def test_generate_image_reuses_pipeline_when_cache_enabled(self) -> None:
        output_paths: list[str] = []

        with (
            patch.object(image_generator.config, "IMAGE_PIPELINE_CACHE_ENABLED", True),
            patch.object(image_generator.config, "IMAGE_MODEL_ID", "fake/flux"),
            patch.object(image_generator, "_resolve_pipeline_class", return_value=_FakePipelineClass),
            patch.object(image_generator, "_empty_runtime_cache") as empty_runtime_cache,
        ):
            first_path = image_generator.generate_image("calm lake at sunrise", width=8, height=8)
            second_path = image_generator.generate_image("forest path", width=8, height=8)
            output_paths.extend([first_path, second_path])

        self.assertEqual(len(_FakePipelineClass.created_pipes), 1)
        self.assertIsNotNone(image_generator._cached_pipe)
        self.assertEqual(empty_runtime_cache.call_count, 0)

        for output_path in output_paths:
            self.assertTrue(os.path.exists(output_path))
            shutil.rmtree(os.path.dirname(output_path), ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
