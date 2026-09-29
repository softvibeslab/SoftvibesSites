#!/usr/bin/env python3
"""Loopback-only bridge from the Training dashboard to a Codex ingestion job."""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import queue
import re
import secrets
import shutil
import subprocess
import sys
import threading
import time
import uuid
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from validate_item_url import ItemUrlError, normalize_item_url


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
DEFAULT_ORIGINS = {"https://service.example.invalid"}
TOKEN_ENV = "BEGLOBAL_TRIGGER_TOKEN"
SENSITIVE_CHILD_ENV_NAMES = {
    TOKEN_ENV,
    "BEGLOBAL_N8N_RUNNER_TOKEN",
    "BEGLOBAL_DASHBOARD_TOKEN",
    "N8N_API_KEY",
}
MAX_BODY_BYTES = 32 * 1024
IDEMPOTENCY_RE = re.compile(r"^[A-Za-z0-9._:-]{8,128}$")
ALLOWED_SCOPES = {"analysis_internal", "private_reproduction", "controlled_download"}
ALLOWED_ANALYSIS_LEVELS = {"standard", "complete"}
FINAL_STATUSES = {"succeeded", "failed"}
PAUSED_STATUS = "waiting_human"
WORKER_STATUSES = FINAL_STATUSES | {PAUSED_STATUS}
WORKER_OUTCOME_PREFIX = "BEGLOBAL_JOB_OUTCOME="
JOB_KINDS = ("ingest", "resume", "approval", "rework")
PENDING_REASONS = ("access_required", "disk_confirmation", "scope_expansion", "approval", "restricted")
STAGE_WEIGHTS = {
    "cataloged": 10,
    "access_verified": 10,
    "lessons_indexed": 10,
    "media_registered": 15,
    "content_extracted": 15,
    "analysis_created": 15,
    "technical_sheet": 10,
    "use_cases_linked": 5,
    "graphify_indexed": 5,
    "human_approved": 5,
}
FORBIDDEN_TEXT_MARKERS = (".m3u8", "/users/", "cookie", "bearer ", "authorization", "session_token", "token=", "signature=", "x-amz-", "\\")
FORBIDDEN_FACT_MARKERS = FORBIDDEN_TEXT_MARKERS + ("http",)
_FIELD_RE = re.compile(r"^[a-z_]{1,40}$")
MAX_SIDE_DATA_BYTES = 4096
OPTION_DEFAULTS = {
    "download_media": True,
    "download_resources": True,
    "analysis_level": "complete",
    "run_graphify": False,
    "update_dashboard": True,
    "publish_dashboard": False,
}


class RequestError(ValueError):
    def __init__(self, message: str, status: int = HTTPStatus.BAD_REQUEST):
        super().__init__(message)
        self.status = int(status)


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp, path)


def validate_job_payload(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise RequestError("El cuerpo debe ser un objeto JSON")
    try:
        item = normalize_item_url(payload.get("item_url", ""))
    except ItemUrlError as exc:
        raise RequestError(str(exc)) from exc

    owner = str(payload.get("owner", "")).strip()
    if not owner or len(owner) > 120 or any(ord(ch) < 32 for ch in owner):
        raise RequestError("owner es obligatorio y debe tener máximo 120 caracteres")
    if payload.get("rights_confirmed") is not True:
        raise RequestError("rights_confirmed=true es obligatorio")
    scope = str(payload.get("rights_scope", ""))
    if scope not in ALLOWED_SCOPES:
        raise RequestError("rights_scope no permitido")

    supplied_course = str(payload.get("course_id", "")).strip().lower()
    if supplied_course and supplied_course != item.course_id:
        raise RequestError("course_id no coincide con item_url")

    raw_options = payload.get("options") or {}
    if not isinstance(raw_options, dict):
        raise RequestError("options debe ser un objeto")
    unknown = set(raw_options) - set(OPTION_DEFAULTS)
    if unknown:
        raise RequestError(f"Opciones desconocidas: {', '.join(sorted(unknown))}")
    options = dict(OPTION_DEFAULTS)
    options.update(raw_options)
    for key in ("download_media", "download_resources", "run_graphify", "update_dashboard", "publish_dashboard"):
        if not isinstance(options[key], bool):
            raise RequestError(f"{key} debe ser booleano")
    if options["analysis_level"] not in ALLOWED_ANALYSIS_LEVELS:
        raise RequestError("analysis_level debe ser standard o complete")
    if options["publish_dashboard"] and not options["update_dashboard"]:
        raise RequestError("publish_dashboard requiere update_dashboard=true")

    return {
        "item_url": item.normalized_url,
        "item_type": item.item_type,
        "course_id": item.course_id,
        "lesson_id": item.lesson_id,
        "owner": owner,
        "rights_confirmed": True,
        "rights_scope": scope,
        "options": options,
    }


def _fingerprint(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


class JobStore:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def path(self, job_id: str) -> Path:
        if not re.fullmatch(r"[0-9a-f]{24,32}", job_id):
            raise RequestError("job_id inválido", HTTPStatus.NOT_FOUND)
        return self.root / f"{job_id}.json"

    def get(self, job_id: str) -> dict[str, Any]:
        path = self.path(job_id)
        if not path.exists():
            raise RequestError("Job no encontrado", HTTPStatus.NOT_FOUND)
        return json.loads(path.read_text(encoding="utf-8"))

    def create(self, payload: dict[str, Any], idempotency_key: str | None) -> tuple[dict[str, Any], bool]:
        if idempotency_key:
            if not IDEMPOTENCY_RE.fullmatch(idempotency_key):
                raise RequestError("Idempotency-Key inválido")
            job_id = hashlib.sha256(idempotency_key.encode()).hexdigest()[:24]
        else:
            job_id = uuid.uuid4().hex
        request_fingerprint = _fingerprint(payload)
        with self._lock:
            path = self.path(job_id)
            if path.exists():
                existing = json.loads(path.read_text(encoding="utf-8"))
                if existing.get("request_fingerprint") != request_fingerprint:
                    raise RequestError("Idempotency-Key ya se usó con otro payload", HTTPStatus.CONFLICT)
                return existing, False
            job = {
                "schema_version": "1.0.0",
                "job_id": job_id,
                "status": "queued",
                "stage": "queued",
                "created_at": _now(),
                "updated_at": _now(),
                "request_fingerprint": request_fingerprint,
                "request": payload,
                "result": None,
            }
            _atomic_json(path, job)
            return job, True

    def create_remote(self, payload: dict[str, Any], job_id: str) -> tuple[dict[str, Any], bool]:
        """Materialize a server-assigned job ID in the private local store."""
        request_fingerprint = _fingerprint(payload)
        with self._lock:
            path = self.path(job_id)
            if path.exists():
                existing = json.loads(path.read_text(encoding="utf-8"))
                if existing.get("request_fingerprint") != request_fingerprint:
                    raise RequestError("job_id remoto ya existe con otro payload", HTTPStatus.CONFLICT)
                return existing, False
            job = {
                "schema_version": "1.0.0",
                "job_id": job_id,
                "status": "queued",
                "stage": "queued",
                "created_at": _now(),
                "updated_at": _now(),
                "request_fingerprint": request_fingerprint,
                "request": payload,
                "result": None,
                "source": "n8n-control-plane",
            }
            _atomic_json(path, job)
            return job, True

    def update(self, job_id: str, **changes: Any) -> dict[str, Any]:
        with self._lock:
            job = self.get(job_id)
            job.update(changes)
            job["updated_at"] = _now()
            _atomic_json(self.path(job_id), job)
            return job


def _clean_text(value: Any, limit: int) -> str:
    return re.sub(r"[\x00-\x1f]", " ", str(value if value is not None else "")).strip()[:limit]


def _has_marker(text: str, markers: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in markers)


def sanitize_stage_state(value: Any) -> dict[str, bool] | None:
    """Return the ten canonical stage booleans or None when the value is not trustworthy."""
    if not isinstance(value, dict) or not value:
        return None
    if any(key not in STAGE_WEIGHTS for key in value) or any(not isinstance(item, bool) for item in value.values()):
        return None
    return {key: bool(value.get(key, False)) for key in STAGE_WEIGHTS}


def progress_from_stages(stage_state: dict[str, bool] | None) -> int:
    if not stage_state:
        return 0
    return sum(weight for key, weight in STAGE_WEIGHTS.items() if stage_state.get(key) is True)


def sanitize_pending(value: Any) -> dict[str, Any] | None:
    """Validate the human checkpoint declared by the worker. Rejects anything that smells like a secret or a local path."""
    if not isinstance(value, dict):
        return None
    reason = str(value.get("reason", ""))
    if reason not in PENDING_REASONS:
        return None
    prompt = _clean_text(value.get("prompt"), 500)
    if not prompt or _has_marker(prompt, FORBIDDEN_TEXT_MARKERS):
        return None
    fields: list[dict[str, Any]] = []
    raw_fields = value.get("fields") or []
    if not isinstance(raw_fields, list) or len(raw_fields) > 8:
        return None
    for entry in raw_fields:
        if not isinstance(entry, dict):
            return None
        field = str(entry.get("field", ""))
        kind = str(entry.get("type", "string"))
        if not _FIELD_RE.fullmatch(field) or kind not in {"boolean", "string", "enum"}:
            return None
        clean: dict[str, Any] = {"field": field, "type": kind, "required": entry.get("required") is not False}
        values = entry.get("values")
        if values is not None:
            if not isinstance(values, list) or len(values) > 10 or any(not isinstance(item, str) or len(item) > 60 for item in values):
                return None
            clean["values"] = values
        fields.append(clean)
    raw_facts = value.get("facts") or {}
    if not isinstance(raw_facts, dict) or len(raw_facts) > 10:
        return None
    facts: dict[str, Any] = {}
    for key, item in raw_facts.items():
        if not _FIELD_RE.fullmatch(str(key)):
            return None
        if isinstance(item, bool) or (isinstance(item, (int, float)) and item == item and abs(item) != float("inf")):
            facts[key] = item
        elif isinstance(item, str) and len(item) <= 120 and not _has_marker(item, FORBIDDEN_FACT_MARKERS) and _clean_text(item, 120) == item:
            facts[key] = item
        else:
            return None
    return {"reason": reason, "prompt": prompt, "fields": fields, "facts": facts}


def sanitize_side_data(value: Any) -> dict[str, Any] | None:
    """Bound and screen resume_data / approval payloads that arrive from the control plane."""
    if value is None:
        return None
    if not isinstance(value, dict):
        raise RequestError("Los datos adicionales del job deben ser un objeto")
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True)
    if len(encoded.encode("utf-8")) > MAX_SIDE_DATA_BYTES:
        raise RequestError("Los datos adicionales del job son demasiado grandes")
    if _has_marker(encoded, (".m3u8", "cookie", "bearer ", "authorization", "session_token", "password", "token=", "signature=", "x-amz-")):
        raise RequestError("Los datos adicionales del job contienen un valor prohibido")
    return json.loads(encoded)


def stage_state_path(workspace: Path, request: dict[str, Any]) -> Path:
    base = workspace / "beglobal" / "dataset" / "premium" / "courses" / str(request["course_id"])
    if request.get("lesson_id"):
        base = base / "lessons" / str(request["lesson_id"])
    return base / "ingestion-state.json"


def read_stage_state(workspace: Path, request: dict[str, Any]) -> dict[str, bool] | None:
    """Read the material stage booleans written by the worker; never raises.

    Prefers ingestion-state.json and falls back to the lesson/course manifest,
    because older packages keep stage_state only in the manifest.
    """
    state_path = stage_state_path(workspace, request)
    manifest_name = "lesson.manifest.json" if request.get("lesson_id") else "course.manifest.json"
    for path in (state_path, state_path.with_name(manifest_name)):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError, KeyError, TypeError):
            continue
        state = sanitize_stage_state(data.get("stage_state") if isinstance(data, dict) else None)
        if state:
            return state
    return None


def public_job(job: dict[str, Any]) -> dict[str, Any]:
    request = job["request"]
    result = job.get("result") or {}
    stage_state = sanitize_stage_state(job.get("stage_state"))
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "stage": job["stage"],
        "kind": job.get("kind") or "ingest",
        "stage_state": stage_state,
        "progress": progress_from_stages(stage_state) if stage_state else None,
        "pending": job.get("pending") if job["status"] == PAUSED_STATUS else None,
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
        "item_url": request["item_url"],
        "course_id": request["course_id"],
        "lesson_id": request["lesson_id"],
        "options": request["options"],
        "exit_code": result.get("exit_code"),
        "message": result.get("message"),
    }


KIND_INSTRUCTIONS = {
    "ingest": "Process only this item and any child lessons individually observed and covered by the same explicit scope.",
    "resume": "This is a RESUMED job. resume_data holds the human answer to the previous checkpoint (see resume_data.reason). Continue from the existing artifacts and never repeat stages already materialized. If resume_data.confirm_download is false, skip media acquisition, keep media_registered=false and complete every stage that does not need media. If resume_data.logged_in is true, re-check access in the active browser session before continuing.",
    "approval": "This is a CORPORATE APPROVAL job. Do not download, transcribe or analyze anything. Write approval.review.json with approver, decision, notes and decision_time from the approval payload. Set human_approved=true in ingestion-state.json and lesson.manifest.json only when decision=approve; for reject leave human_approved=false and record the decision. Recompute the validation record, rebuild the safe dashboard projection when update_dashboard is true and publish only when publish_dashboard is true.",
    "rework": "This is a REWORK job requested by Corporate (see approval.notes). Revise the analysis, technical sheet and use-case links according to the notes, keep originals untouched, keep human_approved=false and finish with status succeeded when the revised artifacts validate.",
}


def build_prompt(job: dict[str, Any], workspace: Path) -> str:
    request = job["request"]
    options = request["options"]
    kind = job.get("kind") if job.get("kind") in JOB_KINDS else "ingest"
    side_lines = [f"job_kind: {kind}"]
    if job.get("resume_data"):
        side_lines.append("resume_data: " + json.dumps(job["resume_data"], ensure_ascii=False, sort_keys=True))
    if job.get("approval"):
        side_lines.append("approval: " + json.dumps(job["approval"], ensure_ascii=False, sort_keys=True))
    side_block = "\n".join(side_lines)
    return f"""Use $beglobal-lesson-ingestor to execute this authorized dashboard job.

job_id: {job['job_id']}
item_url: {request['item_url']}
owner: {request['owner']}
rights_confirmed: true
rights_scope: {request['rights_scope']}
download_media: {str(options['download_media']).lower()}
download_resources: {str(options['download_resources']).lower()}
analysis_level: {options['analysis_level']}
run_graphify: {str(options['run_graphify']).lower()}
update_dashboard: {str(options['update_dashboard']).lower()}
publish_dashboard: {str(options['publish_dashboard']).lower()}
workspace_root: {workspace}
{side_block}

{KIND_INSTRUCTIONS[kind]} Use the active browser session; if interactive login or new rights are required, stop and report that human action is needed. Never persist credentials, cookies, authorization headers, session tokens, DRM data, or transient playback URLs. Reuse existing artifacts by checksum. Generate the complete page inventory, resource inventory, media metadata, transcript/document extraction, analysis, technical sheet, manifests, validation record, and requested safe dashboard update. Never self-approve Corporate review.

Human checkpoints: when a human action can unblock the job, do NOT fail. End with status=waiting_human and a pending object. Reasons: access_required (login or entitlement missing in the browser), disk_confirmation (estimated download above 2 GiB or above 20% of free space; include facts estimated_gib, duration_hours, free_gib, drm=false), scope_expansion (the declared rights_scope does not cover a needed action), restricted (DRM or paywall; this one cannot be resumed). pending.prompt, pending.fields and pending.facts must never contain local paths, playback URLs, cookies or tokens.

Always include stage_state: the ten booleans from ingestion-state.json (cataloged, access_verified, lessons_indexed, media_registered, content_extracted, analysis_created, technical_sheet, use_cases_linked, graphify_indexed, human_approved).

End the final response with exactly one standalone machine-readable line and no code fence:
{WORKER_OUTCOME_PREFIX}{{"status":"succeeded|failed|waiting_human","stage":"complete|access_required|disk_confirmation|scope_expansion|restricted|validation_failed|worker_failed","message":"safe summary without credentials","stage_state":{{...}},"pending":{{"reason":"...","prompt":"...","fields":[...],"facts":{{...}}}}}}
Use status=waiting_human whenever login, disk confirmation, scope expansion or another human action is required. Use status=failed only for technical errors or restricted content that no human action can unblock. A technically successful stop is not a successful ingestion.
"""


def parse_worker_outcome(result_file: Path) -> dict[str, str] | None:
    if not result_file.is_file():
        return None
    for line in reversed(result_file.read_text(encoding="utf-8").splitlines()):
        if not line.startswith(WORKER_OUTCOME_PREFIX):
            continue
        try:
            value = json.loads(line.removeprefix(WORKER_OUTCOME_PREFIX))
        except json.JSONDecodeError:
            return None
        if not isinstance(value, dict):
            return None
        status = str(value.get("status", ""))
        stage = str(value.get("stage", ""))
        message = _clean_text(str(value.get("message", "")).replace("\n", " "), 500)
        if status not in WORKER_STATUSES or not re.fullmatch(r"[a-z0-9_-]{1,64}", stage):
            return None
        if status == "succeeded" and stage != "complete":
            return None
        if _has_marker(message, (".m3u8", "cookie", "bearer ", "authorization", "session_token", "token=", "signature=")):
            return None
        stage_state = sanitize_stage_state(value.get("stage_state")) if value.get("stage_state") is not None else None
        pending = None
        if status == PAUSED_STATUS:
            pending = sanitize_pending(value.get("pending"))
            if pending is None:
                return None
        return {"status": status, "stage": stage, "message": message, "stage_state": stage_state, "pending": pending}
    return None


def execute_job(store: JobStore, job_id: str, workspace: Path, codex_bin: str) -> None:
    job = store.update(job_id, status="running", stage="starting", result=None, pending=None)
    result_file = store.root / f"{job_id}.result.txt"
    command = [
        codex_bin,
        "-a",
        "never",
        "exec",
        "--ephemeral",
        "--skip-git-repo-check",
        "-C",
        str(workspace),
        "-s",
        "workspace-write",
        "-o",
        str(result_file),
        "-",
    ]
    environment = dict(os.environ)
    for sensitive_name in SENSITIVE_CHILD_ENV_NAMES:
        environment.pop(sensitive_name, None)
    try:
        completed = subprocess.run(
            command,
            input=build_prompt(job, workspace),
            text=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=environment,
            timeout=8 * 60 * 60,
            check=False,
        )
        outcome = parse_worker_outcome(result_file) if completed.returncode == 0 else None
        success = bool(outcome and outcome["status"] == "succeeded")
        if completed.returncode != 0:
            status = "failed"
            stage = "worker_failed"
            message = "El worker terminó con error; revisa el resultado local privado"
        elif outcome is None:
            status = "failed"
            stage = "worker_protocol_error"
            message = "El worker terminó sin declarar un resultado de ingesta válido"
        else:
            status = outcome["status"]
            stage = outcome["stage"]
            if status == PAUSED_STATUS:
                default_message = "El job espera una acción humana"
            elif success:
                default_message = "Ingesta terminada"
            else:
                default_message = "La ingesta requiere atención"
            message = outcome["message"] or default_message
        stage_state = (outcome or {}).get("stage_state") or read_stage_state(workspace, job["request"])
        store.update(
            job_id,
            status=status,
            stage=stage,
            stage_state=stage_state,
            pending=(outcome or {}).get("pending") if status == PAUSED_STATUS else None,
            result={
                "exit_code": completed.returncode,
                "message": message,
                "result_file": str(result_file),
            },
        )
    except subprocess.TimeoutExpired:
        store.update(
            job_id,
            status="failed",
            stage="timeout",
            pending=None,
            result={"exit_code": None, "message": "El worker superó el límite de 8 horas"},
        )
    except Exception:
        store.update(
            job_id,
            status="failed",
            stage="worker_error",
            result={"exit_code": None, "message": "No fue posible iniciar el worker local"},
        )


class Bridge:
    def __init__(self, workspace: Path, store: JobStore, token: str, origins: set[str], execute: bool, codex_bin: str):
        self.workspace = workspace
        self.store = store
        self.token = token
        self.origins = origins
        self.execute = execute
        self.codex_bin = codex_bin
        self.jobs: queue.Queue[str] = queue.Queue()
        self.worker: threading.Thread | None = None
        if execute:
            self.worker = threading.Thread(target=self._work, name="beglobal-ingestion-worker", daemon=True)
            self.worker.start()

    def _work(self) -> None:
        while True:
            job_id = self.jobs.get()
            try:
                execute_job(self.store, job_id, self.workspace, self.codex_bin)
            finally:
                self.jobs.task_done()

    def enqueue(self, job_id: str) -> None:
        if self.execute:
            self.jobs.put(job_id)


def handler_factory(bridge: Bridge):
    class Handler(BaseHTTPRequestHandler):
        server_version = "BeGlobalLoopbackBridge/1.0"

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[{self.log_date_time_string()}] {self.command} {self.path} {args[1] if len(args) > 1 else ''}")

        def _origin(self) -> str | None:
            return self.headers.get("Origin")

        def _origin_allowed(self) -> bool:
            origin = self._origin()
            return origin is None or origin in bridge.origins

        def _headers(self, status: int, content_type: str = "application/json; charset=utf-8") -> None:
            self.send_response(status)
            origin = self._origin()
            if origin in bridge.origins:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-BeGlobal-Trigger, Idempotency-Key")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Type", content_type)
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()

        def _json(self, status: int, value: dict[str, Any]) -> None:
            body = json.dumps(value, ensure_ascii=False).encode()
            self._headers(status)
            self.wfile.write(body)

        def _authorized(self) -> bool:
            supplied = self.headers.get("X-BeGlobal-Trigger", "")
            return bool(supplied) and hmac.compare_digest(supplied, bridge.token)

        def _guard(self) -> bool:
            if not self._origin_allowed():
                self._json(HTTPStatus.FORBIDDEN, {"error": "Origin no permitido"})
                return False
            if not self._authorized():
                self._json(HTTPStatus.UNAUTHORIZED, {"error": "Token local inválido"})
                return False
            return True

        def do_OPTIONS(self) -> None:
            if not self._origin_allowed():
                self._json(HTTPStatus.FORBIDDEN, {"error": "Origin no permitido"})
                return
            self._headers(HTTPStatus.NO_CONTENT, "text/plain; charset=utf-8")

        def do_GET(self) -> None:
            if not self._guard():
                return
            if self.path == "/health":
                self._json(HTTPStatus.OK, {
                    "ok": True,
                    "service": "beglobal-lesson-ingestor",
                    "execute_enabled": bridge.execute,
                    "queue_depth": bridge.jobs.qsize(),
                })
                return
            match = re.fullmatch(r"/v1/jobs/([0-9a-f]{24,32})", self.path)
            if match:
                try:
                    self._json(HTTPStatus.OK, public_job(bridge.store.get(match.group(1))))
                except RequestError as exc:
                    self._json(exc.status, {"error": str(exc)})
                return
            self._json(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada"})

        def do_POST(self) -> None:
            if not self._guard():
                return
            if self.path != "/v1/jobs":
                self._json(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > MAX_BODY_BYTES:
                    raise RequestError("Tamaño de cuerpo inválido", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
                payload = json.loads(self.rfile.read(length))
                validated = validate_job_payload(payload)
                job, created = bridge.store.create(validated, self.headers.get("Idempotency-Key"))
                if created:
                    bridge.enqueue(job["job_id"])
                response = public_job(job)
                response["created"] = created
                response["execution_enabled"] = bridge.execute
                self._json(HTTPStatus.ACCEPTED if created else HTTPStatus.OK, response)
            except json.JSONDecodeError:
                self._json(HTTPStatus.BAD_REQUEST, {"error": "JSON inválido"})
            except RequestError as exc:
                self._json(exc.status, {"error": str(exc)})

    return Handler


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True, type=Path)
    parser.add_argument("--host", default=DEFAULT_HOST, choices=[DEFAULT_HOST])
    parser.add_argument("--port", default=DEFAULT_PORT, type=int)
    parser.add_argument("--origin", action="append", default=[])
    parser.add_argument("--execute", action="store_true", help="Run queued jobs with codex exec")
    parser.add_argument("--run-job", help="Execute one queued job and exit")
    parser.add_argument("--codex-bin", default=shutil.which("codex") or "codex")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    workspace = args.workspace.expanduser().resolve()
    if not workspace.is_dir():
        print("Workspace no encontrado", file=sys.stderr)
        return 2
    store = JobStore(workspace / "beglobal" / "dataset" / "premium" / "jobs")

    if args.run_job:
        execute_job(store, args.run_job, workspace, args.codex_bin)
        print(json.dumps(public_job(store.get(args.run_job)), ensure_ascii=False))
        return 0

    token = os.environ.get(TOKEN_ENV) or secrets.token_urlsafe(24)
    origins = set(args.origin) or set(DEFAULT_ORIGINS)
    bridge = Bridge(workspace, store, token, origins, args.execute, args.codex_bin)
    server = ThreadingHTTPServer((args.host, args.port), handler_factory(bridge))
    print(f"BeGlobal trigger bridge: http://{args.host}:{args.port}")
    print(f"Origin permitido: {', '.join(sorted(origins))}")
    print(f"Ejecución automática: {'sí' if args.execute else 'no; solo cola'}")
    print(f"Token temporal: {token}")
    print("Pega el token en el dashboard; permanece solo en memoria del navegador.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nBridge detenido")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
