#!/usr/bin/env python3
"""Unit tests for the BeGlobal loopback trigger contract."""

from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path

from trigger_server import (
    SENSITIVE_CHILD_ENV_NAMES,
    JobStore,
    RequestError,
    execute_job,
    validate_job_payload,
)
from remote_runner import RemoteError, materialize_remote_job, normalize_base_url
from validate_item_url import ItemUrlError, normalize_item_url


LESSON_URL = "https://platform.example.invalid/cursos/contenido/c417f6c0-88a3-4cbe-81d5-d5da22d8fc8f/1526"
COURSE_URL = "https://platform.example.invalid/cursos/6f8454a9-1655-4cac-832d-545af437957b"


def valid_payload() -> dict:
    return {
        "item_url": LESSON_URL + "?temporary=discarded#player",
        "course_id": "c417f6c0-88a3-4cbe-81d5-d5da22d8fc8f",
        "owner": "Corporate Knowledge Ops",
        "rights_confirmed": True,
        "rights_scope": "analysis_internal",
        "options": {"run_graphify": True},
    }


class UrlTests(unittest.TestCase):
    def test_lesson_is_normalized_and_transient_parts_removed(self):
        item = normalize_item_url(LESSON_URL + "?token=secret#video")
        self.assertEqual(item.item_type, "lesson")
        self.assertEqual(item.lesson_id, "1526")
        self.assertEqual(item.normalized_url, LESSON_URL)

    def test_course_uses_observed_stable_course_route(self):
        item = normalize_item_url(COURSE_URL + "?token=discarded#overview")
        self.assertEqual(item.item_type, "course")
        self.assertIsNone(item.lesson_id)
        self.assertEqual(item.normalized_url, COURSE_URL)

    def test_external_domain_is_rejected(self):
        with self.assertRaises(ItemUrlError):
            normalize_item_url("https://example.com/cursos/contenido/x/1")

    def test_credentials_in_url_are_rejected(self):
        with self.assertRaises(ItemUrlError):
            normalize_item_url(LESSON_URL.replace("https://", "https://user:pass@"))


class PayloadTests(unittest.TestCase):
    def test_defaults_and_rights_are_materialized(self):
        payload = validate_job_payload(valid_payload())
        self.assertEqual(payload["item_url"], LESSON_URL)
        self.assertTrue(payload["options"]["download_media"])
        self.assertTrue(payload["options"]["run_graphify"])
        self.assertFalse(payload["options"]["publish_dashboard"])
        serialized = json.dumps(payload).lower()
        self.assertNotIn("temporary", serialized)
        self.assertNotIn("secret", serialized)

    def test_rights_are_required(self):
        payload = valid_payload()
        payload["rights_confirmed"] = False
        with self.assertRaises(RequestError):
            validate_job_payload(payload)

    def test_course_id_must_match_url(self):
        payload = valid_payload()
        payload["course_id"] = "11111111-1111-1111-1111-111111111111"
        with self.assertRaises(RequestError):
            validate_job_payload(payload)


class StoreTests(unittest.TestCase):
    def test_idempotency_returns_same_job(self):
        with tempfile.TemporaryDirectory() as temp:
            store = JobStore(Path(temp))
            payload = validate_job_payload(valid_payload())
            first, created_first = store.create(payload, "dashboard:test:12345678")
            second, created_second = store.create(payload, "dashboard:test:12345678")
            self.assertTrue(created_first)
            self.assertFalse(created_second)
            self.assertEqual(first["job_id"], second["job_id"])

    def test_idempotency_rejects_changed_payload(self):
        with tempfile.TemporaryDirectory() as temp:
            store = JobStore(Path(temp))
            first = validate_job_payload(valid_payload())
            store.create(first, "dashboard:test:12345678")
            changed = dict(first)
            changed["owner"] = "Otro owner"
            with self.assertRaises(RequestError):
                store.create(changed, "dashboard:test:12345678")

    def test_remote_job_id_is_preserved_and_idempotent(self):
        with tempfile.TemporaryDirectory() as temp:
            store = JobStore(Path(temp))
            envelope = {"job_id": "a" * 24, "request": valid_payload()}
            first, created_first = materialize_remote_job(store, envelope)
            second, created_second = materialize_remote_job(store, envelope)
            self.assertTrue(created_first)
            self.assertFalse(created_second)
            self.assertEqual(first["job_id"], "a" * 24)
            self.assertEqual(second["source"], "n8n-control-plane")


class RemoteRunnerTests(unittest.TestCase):
    def test_control_plane_requires_https(self):
        with self.assertRaises(RemoteError):
            normalize_base_url("http://service.example.invalid/webhook/beglobal-premium")

    def test_control_plane_removes_trailing_slash(self):
        self.assertEqual(
            normalize_base_url("https://service.example.invalid/webhook/beglobal-premium/"),
            "https://service.example.invalid/webhook/beglobal-premium",
        )


class ExecutionTests(unittest.TestCase):
    def test_worker_invocation_uses_argument_list_and_updates_state(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            workspace = root / "workspace"
            workspace.mkdir()
            store = JobStore(root / "jobs")
            payload = validate_job_payload(valid_payload())
            job, _ = store.create(payload, None)
            fake = root / "fake-codex"
            fake.write_text(
                "#!/usr/bin/env python3\n"
                "import os, pathlib, sys\n"
                "prompt = sys.stdin.read()\n"
                "out = pathlib.Path(sys.argv[sys.argv.index('-o') + 1])\n"
                "out.write_text('fake success\\nBEGLOBAL_JOB_OUTCOME={\"status\":\"succeeded\",\"stage\":\"complete\",\"message\":\"Ingesta terminada\"}')\n"
                "assert '$beglobal-lesson-ingestor' in prompt\n",
                encoding="utf-8",
            )
            fake.chmod(0o700)
            os.environ["BEGLOBAL_TRIGGER_TOKEN"] = "must-not-affect-prompt"
            try:
                execute_job(store, job["job_id"], workspace, str(fake))
            finally:
                os.environ.pop("BEGLOBAL_TRIGGER_TOKEN", None)
            completed = store.get(job["job_id"])
            self.assertEqual(completed["status"], "succeeded")
            self.assertEqual(completed["result"]["exit_code"], 0)

    def test_worker_does_not_inherit_control_plane_secrets(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            workspace = root / "workspace"
            workspace.mkdir()
            store = JobStore(root / "jobs")
            payload = validate_job_payload(valid_payload())
            job, _ = store.create(payload, None)
            fake = root / "fake-codex"
            fake.write_text(
                "#!/usr/bin/env python3\n"
                "import os, pathlib, sys\n"
                "sys.stdin.read()\n"
                "out = pathlib.Path(sys.argv[sys.argv.index('-o') + 1])\n"
                "blocked = [name for name in "
                + repr(sorted(SENSITIVE_CHILD_ENV_NAMES))
                + " if name in os.environ]\n"
                "out.write_text(','.join(blocked) + '\\nBEGLOBAL_JOB_OUTCOME={\"status\":\"succeeded\",\"stage\":\"complete\",\"message\":\"Ingesta terminada\"}')\n"
                "raise SystemExit(1 if blocked else 0)\n",
                encoding="utf-8",
            )
            fake.chmod(0o700)
            previous = {name: os.environ.get(name) for name in SENSITIVE_CHILD_ENV_NAMES}
            try:
                for name in SENSITIVE_CHILD_ENV_NAMES:
                    os.environ[name] = f"secret-for-{name}"
                execute_job(store, job["job_id"], workspace, str(fake))
            finally:
                for name, value in previous.items():
                    if value is None:
                        os.environ.pop(name, None)
                    else:
                        os.environ[name] = value
            completed = store.get(job["job_id"])
            self.assertEqual(completed["status"], "succeeded")

    def test_worker_access_block_is_not_reported_as_success(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            workspace = root / "workspace"
            workspace.mkdir()
            store = JobStore(root / "jobs")
            payload = validate_job_payload(valid_payload())
            job, _ = store.create(payload, None)
            fake = root / "fake-codex"
            fake.write_text(
                "#!/usr/bin/env python3\n"
                "import pathlib, sys\n"
                "sys.stdin.read()\n"
                "out = pathlib.Path(sys.argv[sys.argv.index('-o') + 1])\n"
                "out.write_text('blocked\\nBEGLOBAL_JOB_OUTCOME={\"status\":\"failed\",\"stage\":\"access_required\",\"message\":\"Acceso humano requerido\"}')\n",
                encoding="utf-8",
            )
            fake.chmod(0o700)
            execute_job(store, job["job_id"], workspace, str(fake))
            completed = store.get(job["job_id"])
            self.assertEqual(completed["status"], "failed")
            self.assertEqual(completed["stage"], "access_required")

    def test_worker_missing_outcome_is_protocol_error(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            workspace = root / "workspace"
            workspace.mkdir()
            store = JobStore(root / "jobs")
            payload = validate_job_payload(valid_payload())
            job, _ = store.create(payload, None)
            fake = root / "fake-codex"
            fake.write_text(
                "#!/usr/bin/env python3\n"
                "import pathlib, sys\n"
                "sys.stdin.read()\n"
                "out = pathlib.Path(sys.argv[sys.argv.index('-o') + 1])\n"
                "out.write_text('No structured outcome')\n",
                encoding="utf-8",
            )
            fake.chmod(0o700)
            execute_job(store, job["job_id"], workspace, str(fake))
            completed = store.get(job["job_id"])
            self.assertEqual(completed["status"], "failed")
            self.assertEqual(completed["stage"], "worker_protocol_error")


if __name__ == "__main__":
    unittest.main()
