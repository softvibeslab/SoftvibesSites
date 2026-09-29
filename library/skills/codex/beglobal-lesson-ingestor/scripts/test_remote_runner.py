#!/usr/bin/env python3
"""Tests for the v2 remote runner: kinds, checkpoints, material progress and secret screening."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import remote_runner  # noqa: E402
from trigger_server import (  # noqa: E402
    STAGE_WEIGHTS,
    JobStore,
    RequestError,
    build_prompt,
    parse_worker_outcome,
    progress_from_stages,
    read_stage_state,
    sanitize_pending,
)


LESSON_URL = "https://platform.example.invalid/cursos/contenido/c417f6c0-88a3-4cbe-81d5-d5da22d8fc8f/1526"
JOB_ID = "a" * 24


def request_payload() -> dict[str, Any]:
    return {"item_url": LESSON_URL, "owner": "Roger", "rights_confirmed": True, "rights_scope": "analysis_internal", "options": {}}


def stages(*done: str) -> dict[str, bool]:
    return {key: key in done for key in STAGE_WEIGHTS}


class FakeControlPlane:
    def __init__(self, envelopes: list[dict[str, Any]]):
        self.envelopes = list(envelopes)
        self.events: list[dict[str, Any]] = []
        self.runner_id = "runner-0badc0de"

    def health(self) -> dict[str, Any]:
        return {"ok": True}

    def claim_next(self) -> dict[str, Any] | None:
        return self.envelopes.pop(0) if self.envelopes else None

    def event(self, job_id, status, stage, progress, message=None, *, stage_state=None, pending=None):
        self.events.append({"job_id": job_id, "status": status, "stage": stage, "progress": progress, "message": message, "stage_state": stage_state, "pending": pending})


class OutcomeParsingTests(unittest.TestCase):
    def write_outcome(self, root: Path, payload: dict[str, Any]) -> Path:
        path = root / "job.result.txt"
        path.write_text("worker log\nBEGLOBAL_JOB_OUTCOME=" + json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")
        return path

    def test_waiting_human_requires_sanitized_pending(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            good = self.write_outcome(root, {"status": "waiting_human", "stage": "disk_confirmation", "message": "Confirma", "stage_state": stages("cataloged", "access_verified"), "pending": {"reason": "disk_confirmation", "prompt": "Se estiman 4.2 GiB", "fields": [{"field": "confirm_download", "type": "boolean"}], "facts": {"estimated_gib": 4.2, "drm": False}}})
            outcome = parse_worker_outcome(good)
            self.assertEqual(outcome["status"], "waiting_human")
            self.assertEqual(outcome["pending"]["facts"]["estimated_gib"], 4.2)
            self.assertEqual(outcome["stage_state"]["access_verified"], True)
            self.assertEqual(progress_from_stages(outcome["stage_state"]), 20)
            missing = self.write_outcome(root, {"status": "waiting_human", "stage": "access_required", "message": "x"})
            self.assertIsNone(parse_worker_outcome(missing))
            leaky = self.write_outcome(root, {"status": "waiting_human", "stage": "access_required", "message": "x", "pending": {"reason": "access_required", "prompt": "abre ~/private"}})
            self.assertIsNone(parse_worker_outcome(leaky))
            leaky_message = self.write_outcome(root, {"status": "failed", "stage": "worker_failed", "message": "Authorization: Bearer abc"})
            self.assertIsNone(parse_worker_outcome(leaky_message))
            bad_state = self.write_outcome(root, {"status": "succeeded", "stage": "complete", "message": "ok", "stage_state": {"media_path": True}})
            outcome = parse_worker_outcome(bad_state)
            self.assertIsNotNone(outcome)
            self.assertIsNone(outcome["stage_state"], "un stage_state inválido se descarta sin invalidar el resultado")

    def test_sanitize_pending_rejects_urls_in_facts(self):
        self.assertIsNone(sanitize_pending({"reason": "access_required", "prompt": "ok", "facts": {"url": "https://x"}}))
        self.assertIsNone(sanitize_pending({"reason": "invented", "prompt": "ok"}))
        clean = sanitize_pending({"reason": "access_required", "prompt": "Abre https://platform.example.invalid/cursos/x en Chrome", "fields": [{"field": "logged_in", "type": "boolean", "required": True}]})
        self.assertEqual(clean["fields"][0]["field"], "logged_in")

    def test_prompt_carries_kind_resume_data_and_approval(self):
        job = {"job_id": JOB_ID, "request": {**request_payload(), "item_type": "lesson", "course_id": "c417f6c0-88a3-4cbe-81d5-d5da22d8fc8f", "lesson_id": "1526", "options": {"download_media": True, "download_resources": True, "analysis_level": "complete", "run_graphify": False, "update_dashboard": True, "publish_dashboard": False}}, "kind": "resume", "resume_data": {"reason": "disk_confirmation", "confirm_download": True}}
        prompt = build_prompt(job, Path("/tmp/ws"))
        self.assertIn("job_kind: resume", prompt)
        self.assertIn('"confirm_download": true', prompt)
        self.assertIn("RESUMED job", prompt)
        self.assertIn("waiting_human", prompt)
        job.update({"kind": "approval", "resume_data": None, "approval": {"approver": "Corporate", "decision": "approve", "notes": ""}})
        prompt = build_prompt(job, Path("/tmp/ws"))
        self.assertIn("CORPORATE APPROVAL", prompt)
        self.assertIn('"approver": "Corporate"', prompt)


class RunnerFlowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.workspace = self.root / "workspace"
        self.workspace.mkdir()
        self.store = JobStore(self.root / "jobs")
        self.original_execute = remote_runner.execute_job

    def tearDown(self):
        remote_runner.execute_job = self.original_execute
        self.temp.cleanup()

    def fake_execute(self, **final: Any):
        def _run(store, job_id, workspace, codex_bin):
            store.update(job_id, status="running", stage="starting")
            store.update(job_id, **final)
        remote_runner.execute_job = _run

    def write_state(self, *done: str) -> None:
        path = self.workspace / "beglobal" / "dataset" / "premium" / "courses" / "c417f6c0-88a3-4cbe-81d5-d5da22d8fc8f" / "lessons" / "1526" / "ingestion-state.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"stage_state": stages(*done)}), encoding="utf-8")

    def test_checkpoint_is_reported_as_waiting_human(self):
        self.write_state("cataloged", "access_verified", "lessons_indexed")
        pending = {"reason": "disk_confirmation", "prompt": "Se estiman 4.2 GiB", "fields": [{"field": "confirm_download", "type": "boolean", "required": True}], "facts": {"estimated_gib": 4.2}}
        self.fake_execute(status="waiting_human", stage="disk_confirmation", pending=pending, stage_state=stages("cataloged", "access_verified", "lessons_indexed"), result={"exit_code": 0, "message": "Confirma la descarga"})
        control = FakeControlPlane([{"job_id": JOB_ID, "kind": "ingest", "request": request_payload()}])
        self.assertTrue(remote_runner.process_one(control, self.store, self.workspace, "codex", progress_interval=5))
        self.assertEqual([event["status"] for event in control.events], ["running", "waiting_human"])
        self.assertEqual(control.events[0]["progress"], 30, "el arranque usa el estado material existente")
        final = control.events[-1]
        self.assertEqual(final["pending"]["reason"], "disk_confirmation")
        self.assertEqual(final["progress"], 30)
        self.assertEqual(final["stage_state"]["lessons_indexed"], True)
        self.assertEqual(self.store.get(JOB_ID)["status"], "waiting_human")

    def test_resume_reexecutes_existing_job_with_resume_data(self):
        self.store.create_remote(remote_runner.validate_job_payload(request_payload()), JOB_ID)
        self.store.update(JOB_ID, status="waiting_human", stage="disk_confirmation", pending={"reason": "disk_confirmation", "prompt": "x", "fields": [], "facts": {}})
        self.fake_execute(status="succeeded", stage="complete", pending=None, stage_state=stages(*[key for key in STAGE_WEIGHTS if key != "human_approved"]), result={"exit_code": 0, "message": "Ingesta terminada"})
        control = FakeControlPlane([{"job_id": JOB_ID, "kind": "resume", "request": request_payload(), "resume_data": {"reason": "disk_confirmation", "confirm_download": True}}])
        self.assertTrue(remote_runner.process_one(control, self.store, self.workspace, "codex", progress_interval=5))
        job = self.store.get(JOB_ID)
        self.assertEqual(job["kind"], "resume")
        self.assertEqual(job["resume_data"]["confirm_download"], True)
        self.assertEqual(control.events[-1]["status"], "succeeded")
        self.assertEqual(control.events[-1]["progress"], 95)
        self.assertIsNone(control.events[-1]["pending"])

    def test_finished_ingest_job_is_only_re_reported(self):
        self.store.create_remote(remote_runner.validate_job_payload(request_payload()), JOB_ID)
        self.store.update(JOB_ID, status="succeeded", stage="complete", stage_state=stages(*STAGE_WEIGHTS), result={"exit_code": 0, "message": "Listo"})
        calls = []
        remote_runner.execute_job = lambda *args, **kwargs: calls.append(args)
        control = FakeControlPlane([{"job_id": JOB_ID, "kind": "ingest", "request": request_payload()}])
        self.assertTrue(remote_runner.process_one(control, self.store, self.workspace, "codex"))
        self.assertEqual(calls, [])
        self.assertEqual(len(control.events), 1)
        self.assertEqual(control.events[0]["progress"], 100)

    def test_approval_requires_valid_decision_and_screens_secrets(self):
        with self.assertRaises(RequestError):
            remote_runner.materialize_remote_job(self.store, {"job_id": JOB_ID, "kind": "approval", "request": request_payload(), "approval": {"approver": "", "decision": "approve"}})
        with self.assertRaises(RequestError):
            remote_runner.materialize_remote_job(self.store, {"job_id": JOB_ID, "kind": "resume", "request": request_payload(), "resume_data": {"reason": "access_required", "cookie": "abc"}})
        with self.assertRaises(RequestError):
            remote_runner.materialize_remote_job(self.store, {"job_id": JOB_ID, "kind": "teleport", "request": request_payload()})
        job, created = remote_runner.materialize_remote_job(self.store, {"job_id": JOB_ID, "kind": "rework", "request": request_payload(), "approval": {"approver": "Corporate", "decision": "return", "notes": "Cita timestamps"}})
        self.assertTrue(created)
        self.assertEqual(job["kind"], "rework")
        self.assertEqual(job["approval"]["decision"], "return")

    def test_invalid_envelope_is_reported_as_validation_failure(self):
        control = FakeControlPlane([{"job_id": JOB_ID, "kind": "ingest", "request": {"item_url": "https://evil.example/x"}}])
        self.assertTrue(remote_runner.process_one(control, self.store, self.workspace, "codex"))
        self.assertEqual(control.events[0]["status"], "failed")
        self.assertEqual(control.events[0]["stage"], "validation_failed")

    def test_read_stage_state_ignores_garbage(self):
        request = {"course_id": "c417f6c0-88a3-4cbe-81d5-d5da22d8fc8f", "lesson_id": "1526"}
        self.assertIsNone(read_stage_state(self.workspace, request))
        self.write_state("cataloged")
        self.assertEqual(read_stage_state(self.workspace, request)["cataloged"], True)
        path = self.workspace / "beglobal" / "dataset" / "premium" / "courses" / request["course_id"] / "lessons" / "1526" / "ingestion-state.json"
        path.write_text("{not json", encoding="utf-8")
        self.assertIsNone(read_stage_state(self.workspace, request))
        manifest = path.with_name("lesson.manifest.json")
        manifest.write_text(json.dumps({"stage_state": stages("cataloged", "access_verified")}), encoding="utf-8")
        self.assertEqual(progress_from_stages(read_stage_state(self.workspace, request)), 20, "fallback al manifiesto cuando ingestion-state.json no sirve")


if __name__ == "__main__":
    unittest.main()
