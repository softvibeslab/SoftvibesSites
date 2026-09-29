#!/usr/bin/env python3
"""Validate a private BeGlobal lesson or course package against the output contract.

Checks: every top-level JSON parses, declared assets and knowledge artifacts
resolve (inside the lesson, inside the private premium root, or in an extra
asset root), sizes and checksums match, transient secrets are absent, each
stage flagged true has material evidence, and the percentage derives only from
the ten canonical stage booleans. Never prints secrets or playback references.

Usage:
    validate_ingestion.py LESSON_OR_COURSE_DIR [--asset-root DIR ...] [--skip-checksums] [--write]

Exit code 0 when valid, 1 when problems were found, 2 on usage errors.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any


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
FORBIDDEN_VALUES = (".m3u8", "authorization:", "cookie:", "bearer ", "session_token", "x-amz-", "signature=", "set-cookie")
TEXT_SUFFIXES = {".json", ".md", ".txt", ".vtt", ".srt", ".tsv"}
SCAN_DIRS = ("transcript", "graphify", "resources")
MEDIA_ROLE_HINTS = ("video", "audio")
TRANSCRIPT_ROLE_HINTS = ("transcript", "subtitle", "subtitles", "caption")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_json(path: Path, problems: list[str]) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        problems.append(f"{path.name}: JSON inválido ({exc.__class__.__name__})")
        return None


def premium_root_for(root: Path) -> Path:
    for parent in (root, *root.parents):
        if parent.name == "premium":
            return parent
    return root


def workspace_root_for(premium_root: Path) -> Path:
    """The workspace that contains beglobal/dataset/premium; public projections may live there."""
    parents = premium_root.resolve().parents
    return parents[2] if len(parents) > 2 else premium_root.resolve()


def resolve_artifact(rel: str, root: Path, premium_root: Path, asset_roots: list[Path], allow_dir: bool = False) -> Path | None:
    """Resolve a declared path without escaping the workspace or the asset roots. Returns None when it cannot be found safely."""
    rel = str(rel or "").strip()
    if not rel or rel.startswith("/") or "\\" in rel:
        return None
    candidates = [root / rel, premium_root / rel, *(extra / rel for extra in asset_roots)]
    for extra in asset_roots:
        if extra.is_dir() and "/" not in rel:
            candidates.extend(extra.rglob(rel))
    allowed = [workspace_root_for(premium_root), *(extra.resolve() for extra in asset_roots)]
    for candidate in candidates:
        try:
            resolved = candidate.resolve()
        except OSError:
            continue
        if not any(str(resolved).startswith(str(base)) for base in allowed):
            continue
        if resolved.is_file() or (allow_dir and resolved.is_dir() and any(resolved.iterdir())):
            return resolved
    return None


def scan_forbidden(root: Path, problems: list[str]) -> int:
    scanned = 0
    candidates = [path for path in root.iterdir() if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES]
    for sub in SCAN_DIRS:
        folder = root / sub
        if folder.is_dir():
            candidates.extend(path for path in folder.rglob("*") if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES)
    for path in candidates:
        try:
            text = path.read_text(encoding="utf-8", errors="replace").lower()
        except OSError:
            problems.append(f"{path.relative_to(root)}: no se pudo leer")
            continue
        scanned += 1
        for marker in FORBIDDEN_VALUES:
            if marker in text:
                problems.append(f"{path.relative_to(root)}: contiene un valor transitorio prohibido")
                break
    return scanned


def iter_knowledge_artifacts(manifest: dict[str, Any]) -> list[tuple[str, str]]:
    raw = manifest.get("knowledge_artifacts") or {}
    if isinstance(raw, dict):
        return [(str(name), str(path)) for name, path in raw.items() if isinstance(path, str)]
    if isinstance(raw, list):
        out = []
        for entry in raw:
            if isinstance(entry, dict) and entry.get("path"):
                out.append((str(entry.get("name") or entry.get("role") or "artifact"), str(entry["path"])))
            elif isinstance(entry, str):
                out.append(("artifact", entry))
        return out
    return []


def check_assets(root: Path, premium_root: Path, asset_roots: list[Path], manifest: dict[str, Any], skip_checksums: bool, problems: list[str]) -> dict[str, Any]:
    found: dict[str, Path] = {}
    external: list[str] = []
    exists_all = True
    checksums_ok = True
    for asset in manifest.get("assets") or []:
        if not isinstance(asset, dict):
            problems.append("asset con formato inválido")
            exists_all = False
            continue
        rel = str(asset.get("path", ""))
        role = str(asset.get("role", "asset"))
        storage = str(asset.get("storage", "local_private"))
        target = resolve_artifact(rel, root, premium_root, asset_roots)
        if target is None:
            if storage != "local_private":
                external.append(role)
                continue
            problems.append(f"asset ausente ({role}): {Path(rel).name}")
            exists_all = False
            continue
        found[role] = target
        declared_bytes = asset.get("bytes")
        if isinstance(declared_bytes, int) and declared_bytes != target.stat().st_size:
            problems.append(f"asset con tamaño distinto ({role}): {Path(rel).name}")
            checksums_ok = False
        declared_hash = str(asset.get("sha256") or "").lower()
        if declared_hash and not skip_checksums and declared_hash != sha256_file(target):
            problems.append(f"asset con SHA-256 distinto ({role}): {Path(rel).name}")
            checksums_ok = False
    artifacts: dict[str, Path] = {}
    for name, rel in iter_knowledge_artifacts(manifest):
        target = resolve_artifact(rel, root, premium_root, asset_roots, allow_dir=True)
        if target is None:
            problems.append(f"artefacto de conocimiento ausente: {name}")
            exists_all = False
        else:
            artifacts[name] = target
    return {"assets": found, "artifacts": artifacts, "external": external, "exists_all": exists_all, "checksums_ok": checksums_ok}


def evidence_for(root: Path, manifest: dict[str, Any], mode: str, resolved: dict[str, Any]) -> dict[str, bool]:
    assets: dict[str, Path] = resolved["assets"]
    artifacts: dict[str, Path] = resolved["artifacts"]
    media_ok = any(any(hint in role for hint in MEDIA_ROLE_HINTS) for role in assets)
    transcript_dir = root / "transcript"
    transcript_ok = any(any(hint in role for hint in TRANSCRIPT_ROLE_HINTS) for role in assets) or (transcript_dir.is_dir() and any(transcript_dir.iterdir()))
    resources_dir = root / "resources"
    resources_ok = resources_dir.is_dir() and any(resources_dir.iterdir())
    graphify_dir = root / "graphify"
    graphify_ok = any(name.startswith("graphify") for name in artifacts) or (graphify_dir.is_dir() and any(graphify_dir.iterdir()))
    access_status = str(manifest.get("access_status") or "")
    access_ok = access_status.startswith("verified") or access_status == "accessible" or bool(str(manifest.get("access_evidence") or "").strip()) or bool(manifest.get("access_gate_evidence"))
    cataloged = (root / "page-metadata.json").is_file() or (root / "course-page-metadata.json").is_file() or bool(manifest.get("title") and manifest.get("source_url"))
    return {
        "cataloged": cataloged,
        "access_verified": access_ok,
        "lessons_indexed": mode == "lesson" or (root / "lesson-queue.json").is_file() or (root / "lesson-index.sanitized.json").is_file(),
        "media_registered": media_ok,
        "content_extracted": transcript_ok or resources_ok,
        "analysis_created": (root / "analysis.md").is_file() or "analysis" in assets or "analysis" in artifacts,
        "technical_sheet": (root / "technical-sheet.md").is_file() or "technical_sheet" in artifacts,
        "use_cases_linked": (root / "use-case-links.json").is_file() or "use_case_links" in artifacts,
        "graphify_indexed": graphify_ok,
        "human_approved": True,  # evaluated separately against approval.review.json
    }


def check_approval(root: Path, stage_state: dict[str, bool], parsed: dict[str, Any], problems: list[str]) -> None:
    data = parsed.get("approval.review.json")
    approved = isinstance(data, dict) and data.get("decision") == "approve" and bool(str(data.get("approver") or "").strip()) and bool(str(data.get("decision_time") or "").strip())
    if stage_state.get("human_approved") and not approved:
        problems.append("human_approved=true sin approval.review.json aprobado (approver, decision=approve, decision_time)")
    if approved and not stage_state.get("human_approved"):
        problems.append("approval.review.json aprobado pero human_approved=false")


def validate_lesson(root: Path, asset_roots: list[Path], skip_checksums: bool) -> dict[str, Any]:
    problems: list[str] = []
    premium_root = premium_root_for(root)
    parsed: dict[str, Any] = {}
    json_ok = True
    for path in sorted(root.glob("*.json")):
        value = load_json(path, problems)
        if value is None:
            json_ok = False
        parsed[path.name] = value
    manifest = parsed.get("lesson.manifest.json")
    if not isinstance(manifest, dict):
        return {"ok": False, "mode": "lesson", "progress": 0, "problems": problems + ["lesson.manifest.json ausente o inválido"]}
    state = parsed.get("ingestion-state.json") if isinstance(parsed.get("ingestion-state.json"), dict) else {}
    raw_state = state.get("stage_state") if isinstance(state.get("stage_state"), dict) else manifest.get("stage_state")
    if not isinstance(raw_state, dict) or set(raw_state) != set(STAGE_WEIGHTS) or any(not isinstance(v, bool) for v in raw_state.values()):
        problems.append("stage_state debe contener exactamente las diez etapas booleanas (en ingestion-state.json o en el manifiesto)")
        stage_state = {key: False for key in STAGE_WEIGHTS}
    else:
        stage_state = {key: bool(raw_state[key]) for key in STAGE_WEIGHTS}
    manifest_state = manifest.get("stage_state")
    if isinstance(manifest_state, dict) and isinstance(state.get("stage_state"), dict) and {k: bool(v) for k, v in manifest_state.items()} != stage_state:
        problems.append("stage_state difiere entre el manifiesto y ingestion-state.json")

    resolved = check_assets(root, premium_root, asset_roots, manifest, skip_checksums, problems)
    evidence = evidence_for(root, manifest, "lesson", resolved)
    for key, flagged in stage_state.items():
        if flagged and not evidence.get(key, False):
            problems.append(f"etapa {key}=true sin evidencia material")
    check_approval(root, stage_state, parsed, problems)
    scanned = scan_forbidden(root, problems)
    progress = sum(weight for key, weight in STAGE_WEIGHTS.items() if stage_state.get(key))
    declared = state.get("verified_ingestion_percent")
    if isinstance(declared, (int, float)) and int(declared) != progress:
        problems.append(f"verified_ingestion_percent={int(declared)} no coincide con el cálculo por etapas ({progress})")
    return {
        "ok": not problems,
        "mode": "lesson",
        "lesson_id": str(manifest.get("lesson_id") or root.name),
        "progress": progress,
        "stage_state": stage_state,
        "json_files_parse": json_ok,
        "declared_artifacts_exist": resolved["exists_all"],
        "checksums_match": None if skip_checksums else resolved["checksums_ok"],
        "external_assets": resolved["external"],
        "transient_secrets_absent": not any("prohibido" in item for item in problems),
        "files_scanned": scanned,
        "problems": problems,
    }


def validate_course(root: Path, asset_roots: list[Path], skip_checksums: bool) -> dict[str, Any]:
    problems: list[str] = []
    premium_root = premium_root_for(root)
    parsed: dict[str, Any] = {}
    json_ok = True
    for path in sorted(root.glob("*.json")):
        value = load_json(path, problems)
        if value is None:
            json_ok = False
        parsed[path.name] = value
    manifest = parsed.get("course.manifest.json")
    if not isinstance(manifest, dict):
        return {"ok": False, "mode": "course", "progress": 0, "problems": problems + ["course.manifest.json ausente o inválido"]}
    resolved = check_assets(root, premium_root, asset_roots, manifest, skip_checksums, problems)
    scanned = scan_forbidden(root, problems)
    lessons_dir = root / "lessons"
    lessons: list[dict[str, Any]] = []
    if lessons_dir.is_dir():
        for lesson_dir in sorted(path for path in lessons_dir.iterdir() if path.is_dir()):
            if (lesson_dir / "lesson.manifest.json").is_file():
                lessons.append(validate_lesson(lesson_dir, asset_roots, skip_checksums))
    invalid = [item for item in lessons if not item["ok"]]
    for item in invalid[:20]:
        problems.append(f"lección {item.get('lesson_id')}: {len(item['problems'])} problema(s)")
    if len(invalid) > 20:
        problems.append(f"... y {len(invalid) - 20} lecciones más con problemas")
    average = round(sum(item["progress"] for item in lessons) / len(lessons)) if lessons else 0
    return {
        "ok": not problems,
        "mode": "course",
        "course_id": str(manifest.get("course_id") or root.name),
        "progress": average,
        "lessons_validated": len(lessons),
        "lessons_invalid": len(invalid),
        "lessons": [{"lesson_id": item.get("lesson_id"), "ok": item["ok"], "progress": item["progress"], "problems": item["problems"]} for item in lessons],
        "json_files_parse": json_ok,
        "declared_artifacts_exist": resolved["exists_all"],
        "checksums_match": None if skip_checksums else resolved["checksums_ok"],
        "transient_secrets_absent": not any("prohibido" in item for item in problems),
        "files_scanned": scanned,
        "problems": problems,
    }


def validate(root: Path, asset_roots: list[Path], skip_checksums: bool) -> dict[str, Any]:
    root = root.resolve()
    if not root.is_dir():
        return {"ok": False, "mode": None, "progress": 0, "problems": ["directorio inexistente"]}
    if (root / "lesson.manifest.json").is_file():
        return validate_lesson(root, asset_roots, skip_checksums)
    if (root / "course.manifest.json").is_file():
        return validate_course(root, asset_roots, skip_checksums)
    return {"ok": False, "mode": None, "progress": 0, "problems": ["falta lesson.manifest.json o course.manifest.json"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("target", type=Path)
    parser.add_argument("--asset-root", action="append", default=[], type=Path, help="Almacén privado adicional donde buscar originales (repetible)")
    parser.add_argument("--skip-checksums", action="store_true")
    parser.add_argument("--write", action="store_true", help="Escribe validation-record.json en el directorio")
    parser.add_argument("--summary", action="store_true", help="Imprime solo ok/progreso/problemas")
    args = parser.parse_args()
    asset_roots = [path.expanduser().resolve() for path in args.asset_root if path.expanduser().is_dir()]
    result = validate(args.target, asset_roots, args.skip_checksums)
    if args.write and result.get("mode"):
        record = {
            "schema_version": "1.1",
            "validated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "json_files_parse": result.get("json_files_parse"),
            "declared_artifacts_exist": result.get("declared_artifacts_exist"),
            "checksums_match": result.get("checksums_match"),
            "premium_files_private": True,
            "transient_secrets_absent": result.get("transient_secrets_absent"),
            "progress": result["progress"],
            "problems": result["problems"],
        }
        path = args.target.resolve() / "validation-record.json"
        temp = path.with_suffix(".json.tmp")
        temp.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temp.replace(path)
    if args.summary:
        summary = {key: result.get(key) for key in ("ok", "mode", "progress", "lessons_validated", "lessons_invalid", "external_assets") if key in result}
        summary["problems"] = result["problems"]
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
