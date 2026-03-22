from __future__ import annotations

import os
import sys
import tempfile
import unittest
from unittest.mock import patch

WORKER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKER_DIR not in sys.path:
    sys.path.insert(0, WORKER_DIR)

from factory_v2.shared.content_publisher import publish_content
from factory_v2.shared.storage_uploader import upload_audio, upload_image


class _FakeBlob:
    def __init__(self, path: str):
        self.path = path
        self._exists = False
        self.metadata = None
        self.cache_control = None

    def exists(self) -> bool:
        return self._exists

    def reload(self) -> None:
        return None

    def upload_from_filename(self, filename: str, content_type: str | None = None, retry=None, timeout=None) -> None:
        self._exists = True

    def patch(self) -> None:
        self._exists = True


class _FakeBucket:
    def __init__(self):
        self._blobs: dict[str, _FakeBlob] = {}

    def blob(self, path: str) -> _FakeBlob:
        if path not in self._blobs:
            self._blobs[path] = _FakeBlob(path)
        return self._blobs[path]


class _FakeSnapshot:
    def __init__(self, ref, data):
        self.reference = ref
        self.id = ref.id
        self._data = dict(data) if data is not None else None

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> dict:
        return dict(self._data or {})


class _FakeDocRef:
    def __init__(self, db, collection_name: str, doc_id: str):
        self._db = db
        self._collection_name = collection_name
        self.id = doc_id

    def get(self):
        return _FakeSnapshot(self, self._db._collections.setdefault(self._collection_name, {}).get(self.id))

    def set(self, payload: dict, merge: bool = False):
        collection = self._db._collections.setdefault(self._collection_name, {})
        if merge and self.id in collection:
            existing = dict(collection[self.id])
            existing.update(payload)
            collection[self.id] = existing
        else:
            collection[self.id] = dict(payload)


class _FakeCollection:
    def __init__(self, db, name: str):
        self._db = db
        self._name = name

    def document(self, doc_id: str):
        return _FakeDocRef(self._db, self._name, doc_id)


class _FakeDB:
    def __init__(self):
        self._collections: dict[str, dict[str, dict]] = {}

    def collection(self, name: str):
        return _FakeCollection(self, name)


class IdempotentRetriesTests(unittest.TestCase):
    def test_upload_audio_reuses_existing_blob_path(self) -> None:
        bucket = _FakeBucket()
        job_data = {
            "contentType": "guided_meditation",
            "params": {"topic": "Calm ocean"},
            "_factoryContentJobId": "content-123",
            "_factoryStepName": "upload_audio",
        }
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b"not-a-real-mp3-but-good-enough-for-size-fallback")
            tmp_path = tmp.name

        try:
            with patch("factory_v2.shared.storage_uploader.storage.bucket", return_value=bucket):
                first_path, first_duration = upload_audio(tmp_path, job_data)
                second_path, second_duration = upload_audio(tmp_path, job_data)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        self.assertEqual(first_path, second_path)
        self.assertGreater(first_duration, 0)
        self.assertEqual(first_duration, second_duration)

    def test_upload_image_reuses_existing_blob_path_and_url(self) -> None:
        bucket = _FakeBucket()
        job_data = {
            "contentType": "guided_meditation",
            "params": {"topic": "Calm ocean"},
            "_factoryContentJobId": "content-123",
            "_factoryStepName": "generate_image",
        }
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp.write(b"png")
            tmp_path = tmp.name

        try:
            with patch("factory_v2.shared.storage_uploader.storage.bucket", return_value=bucket):
                first_path, first_url = upload_image(tmp_path, job_data)
                second_path, second_url = upload_image(tmp_path, job_data)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        self.assertEqual(first_path, second_path)
        self.assertEqual(first_url, second_url)

    def test_publish_content_uses_deterministic_document_id(self) -> None:
        db = _FakeDB()
        job_data = {
            "contentType": "guided_meditation",
            "params": {"topic": "Calm ocean"},
            "_factoryContentJobId": "content-123",
            "_resolvedTitle": "Calm Ocean",
            "thumbnailUrl": "https://example.com/image.png",
        }

        first_id = publish_content(db, "audio/path.mp3", 120.0, "hello world", job_data)
        second_id = publish_content(db, "audio/path.mp3", 120.0, "hello world", job_data)

        self.assertEqual(first_id, second_id)
        self.assertEqual(list(db._collections["guided_meditations"].keys()), ["content-123"])


if __name__ == "__main__":
    unittest.main()
