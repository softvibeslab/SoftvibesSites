#!/usr/bin/env python3
"""Outbound-only runner that claims BeGlobal ingestion jobs from n8n.

Version 2 understands job kinds (ingest, resume, approval, rework), reports
material progress from ingestion-state.json while the worker runs, and turns
worker checkpoints into `waiting_human` events with a structured `pending`
object. Only status, stage, progress, stage booleans, a bounded message and
the sanitized pending object ever leave the workstation.
"""

from __future__ import annotations

import argparse
import json
import os
import secrets
import shutil
import sys
import threading
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from trigger_server import (
    JOB_KINDS,
    PAUSED_STATUS,
    JobStore,
    RequestError,
    execute_job,
    progress_from_stages,
    public_job,
    read_stage_state,
    sanitize_side_data,
    sanitize_stage_state,
    validate_job_payload,
)


DEFAULT_BASE_URL = "https://service.example.invalid/webhook/beglobal-premium"
TOKEN_ENV = "BEGLOBAL_N8N_RUNNER_TOKEN"
MAX_RESPONSE_BYTES = 128 * 1024
FINAL_STATUSES = {"succeeded", "failed"}
DEFAULT_PROGRESS_INTERVAL = 15.0


class RemoteError(RuntimeError):
    pass


def normalize_base_url(value: str) -> str:
    raw = str(value or "").strip().rstrip("/")
    parsed = urlsplit(raw)
    if parsed.scheme != "https" or not parsed.hostname:
        raise RemoteError("La URL del control plane debe usar HTTPS")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise RemoteError("La URL del control plane no puede incluir credenciales, query o fragment")
    if parsed.port not in (None, 443):
        raise RemoteError("La URL del control plane debe usar el puerto HTTPS estándar")
    path = "/" + "/".join(part for part in parsed.path.split("/") if part)
    return urlunsplit(("https", parsed.netloc, path.rstrip("/"), "", ""))


class N8nControlPlane:
    def __init__(self, base_url: str, token: str, runner_id: str, timeout: int = 30):
        self.base_url = normalize_base_url(base_url)
        self.token = token
        self.runner_id = runner_id
        self.timeout = timeout

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> tuple[int, Any]:
        body = None
        headers = {
            "Accept": "application/json",
            "Cache-Control": "no-store",
            "User-Agent": "BeGlobalPremiumRunner/2.0",
            "X-BeGlobal-Runner": self.token,
        }
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        request = Request(f"{self.base_url}{path}", data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=self.timeout) as response:
                raw = response.read(MAX_RESPONSE_BYTES + 1)
                if len(raw) > MAX_RESPONSE_BYTES:
                    raise RemoteError("Respuesta remota demasiado grande")
                if not raw:
                    return response.status, None
                return response.status, json.loads(raw)
        except HTTPError as exc:
            raw = exc.read(MAX_RESPONSE_BYTES)
            try:
                detail = json.loads(raw).get("error", raw.decode("utf-8", "replace"))
            except (json.JSONDecodeError, AttributeError):
                detail = raw.decode("utf-8", "replace")
            raise RemoteError(f"HTTP {exc.code}: {detail}") from exc
        except (URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise RemoteError(f"No fue posible comunicarse con n8n: {exc}") from exc

    def health(self) -> dict[str, Any]:
        status, value = self._request("GET", "/runner/health")
        if status != 200 or not isinstance(value, dict) or value.get("ok") is not True:
            raise RemoteError("El control plane no confirmó salud")
        return value

    def claim_next(self) -> dict[str, Any] | None:
        query = urlencode({"runner_id": self.runner_id})
        status, value = self._request("GET", f"/runner/next?{query}")
        if status == 204 or value is None:
            return None
        if status != 200 or not isinstance(value, dict):
            raise RemoteError("Respuesta inválida al reclamar un job")
        return value

    def event(
        self,
        job_id: str,
        status: str,
        stage: str,
        progress: int,
        message: str | None = None,
        *,
        stage_state: dict[str, bool] | None = None,
        pending: dict[str, Any] | None = None,
    ) -> None:
        payload: dict[str, Any] = {
            "job_id": job_id,
            "runner_id": self.runner_id,
            "status": status,
            "stage": stage,
            "progress": max(0, min(100, int(progress))),
            "message": (message or "")[:500],
        }
        if stage_state:
            payload["stage_state"] = stage_state
        if pending and status == PAUSED_STATUS:
            payload["pending"] = pending
        response_status, _ = self._request("POST", "/runner/events", payload)
        if response_status not in (200, 202):
            raise RemoteError("n8n no aceptó el evento del runner")


def materialize_remote_job(store: JobStore, envelope: Any) -> tuple[dict[str, Any], bool]:
    """Validate the claimed envelope and persist it locally, including its kind and side data."""
    if not isinstance(envelope, dict):
        raise RequestError("Envelope remoto inválido")
    job_id = str(envelope.get("job_id", "")).strip().lower()
    kind = str(envelope.get("kind") or "ingest")
    if kind not in JOB_KINDS:
        raise RequestError("kind de job no soportado")
    validated = validate_job_payload(envelope.get("request"))
    resume_data = sanitize_side_data(envelope.get("resume_data")) if kind == "resume" else None
    approval = sanitize_side_data(envelope.get("approval")) if kind in ("approval", "rework") else None
    if kind == "resume" and not resume_data:
        raise RequestError("Un job resume requiere resume_data")
    if kind in ("approval", "rework"):
        if not approval or not str(approval.get("approver", "")).strip() or approval.get("decision") not in ("approve", "reject", "return"):
            raise RequestError("Un job de aprobación requiere approver y decision válidos")
    job, created = store.create_remote(validated, job_id)
    job = store.update(job_id, kind=kind, resume_data=resume_data, approval=approval)
    return job, created


class ProgressReporter(threading.Thread):
    """Reads ingestion-state.json periodically and forwards material progress to n8n."""

    def __init__(self, control: N8nControlPlane, job: dict[str, Any], workspace: Path, interval: float):
        super().__init__(name="beglobal-progress-reporter", daemon=True)
        self.control = control
        self.job = job
        self.workspace = workspace
        self.interval = max(5.0, float(interval))
        self._stop = threading.Event()
        self.last_state: dict[str, bool] | None = sanitize_stage_state(job.get("stage_state"))
        self.failures = 0

    def stop(self) -> None:
        self._stop.set()

    def run(self) -> None:
        while not self._stop.wait(self.interval):
            state = read_stage_state(self.workspace, self.job["request"])
            if not state or state == self.last_state:
                continue
            try:
                self.control.event(self.job["job_id"], "running", "processing", progress_from_stages(state), "Progreso material actualizado", stage_state=state)
                self.last_state = state
                self.failures = 0
            except RemoteError:
                self.failures += 1


def report_local_state(control: N8nControlPlane, job: dict[str, Any], workspace: Path) -> None:
    """Send the final (or paused) local state of a job as a single safe event."""
    local = public_job(job)
    stage_state = sanitize_stage_state(job.get("stage_state")) or read_stage_state(workspace, job["request"])
    if stage_state:
        progress = progress_from_stages(stage_state)
    else:
        progress = 100 if local["status"] in FINAL_STATUSES else 10
    pending = job.get("pending") if local["status"] == PAUSED_STATUS else None
    control.event(job["job_id"], local["status"], local["stage"], progress, local.get("message"), stage_state=stage_state, pending=pending)


def process_one(control: N8nControlPlane, store: JobStore, workspace: Path, codex_bin: str, progress_interval: float = DEFAULT_PROGRESS_INTERVAL) -> bool:
    envelope = control.claim_next()
    if envelope is None:
        return False
    job_id = str(envelope.get("job_id", "")).strip().lower() if isinstance(envelope, dict) else ""
    try:
        job, created = materialize_remote_job(store, envelope)
    except RequestError:
        if len(job_id) in (24, 32) and all(char in "0123456789abcdef" for char in job_id):
            control.event(job_id, "failed", "validation_failed", 100, "El runner local rechazó el payload; requiere revisión")
            return True
        raise
    kind = job.get("kind") or "ingest"
    if not created and kind == "ingest" and job.get("status") in FINAL_STATUSES:
        report_local_state(control, job, workspace)
        return True

    initial_state = sanitize_stage_state(job.get("stage_state")) or read_stage_state(workspace, job["request"])
    control.event(
        job["job_id"],
        "running",
        "starting",
        progress_from_stages(initial_state) if initial_state else 5,
        f"Runner local inició el job ({kind})",
        stage_state=initial_state,
    )
    reporter = ProgressReporter(control, job, workspace, progress_interval)
    reporter.start()
    try:
        execute_job(store, job["job_id"], workspace, codex_bin)
    finally:
        reporter.stop()
        reporter.join(timeout=5)
    report_local_state(control, store.get(job["job_id"]), workspace)
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True, type=Path)
    parser.add_argument("--base-url", default=os.environ.get("BEGLOBAL_N8N_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--poll-seconds", type=float, default=5.0)
    parser.add_argument("--progress-seconds", type=float, default=DEFAULT_PROGRESS_INTERVAL)
    parser.add_argument("--once", action="store_true", help="Poll once and exit")
    parser.add_argument("--codex-bin", default=shutil.which("codex") or "codex")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    workspace = args.workspace.expanduser().resolve()
    if not workspace.is_dir():
        print("Workspace no encontrado", file=sys.stderr)
        return 2
    token = os.environ.get(TOKEN_ENV, "")
    if len(token) < 24:
        print(f"Define {TOKEN_ENV} con el token privado del runner", file=sys.stderr)
        return 2
    if args.poll_seconds < 1 or args.poll_seconds > 300:
        print("--poll-seconds debe estar entre 1 y 300", file=sys.stderr)
        return 2
    if args.progress_seconds < 5 or args.progress_seconds > 300:
        print("--progress-seconds debe estar entre 5 y 300", file=sys.stderr)
        return 2

    runner_id = f"runner-{secrets.token_hex(4)}"
    control = N8nControlPlane(args.base_url, token, runner_id)
    store = JobStore(workspace / "beglobal" / "dataset" / "premium" / "jobs")
    print(f"BeGlobal remote runner v2 conectado a {control.base_url}")
    print(f"Runner efímero: {runner_id}")
    print("El token no se imprime ni se escribe en disco.")

    failures = 0
    while True:
        try:
            if failures:
                control.health()
            processed = process_one(control, store, workspace, args.codex_bin, args.progress_seconds)
            failures = 0
            if args.once:
                return 0
            if not processed:
                time.sleep(args.poll_seconds)
        except KeyboardInterrupt:
            print("\nRunner detenido")
            return 0
        except (RemoteError, RequestError) as exc:
            failures += 1
            print(f"Control plane no disponible: {exc}", file=sys.stderr)
            if args.once:
                return 1
            time.sleep(min(60.0, args.poll_seconds * (2 ** min(failures, 4))))


if __name__ == "__main__":
    raise SystemExit(main())
