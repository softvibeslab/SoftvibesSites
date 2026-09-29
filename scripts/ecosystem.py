#!/usr/bin/env python3
"""Offline installer and exporter. Never executes third-party payloads."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_ROOTS = {'AGENTS.md', 'README.md', 'THIRD_PARTY_NOTICES.md', '.gitignore',
                 'catalog', 'docs', 'library', 'licenses', 'plugins', 'scripts',
                 'templates', 'tests'}
MANIFEST = 'catalog/files.sha256.json'
CACHE_PARTS = {'__pycache__', '.pytest_cache'}
PROHIBITED_PARTS = {'.git', '.env', 'node_modules', '.venv', 'venv', 'dist', 'build',
                    '.ssh', '.aws', '.DS_Store'}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_relative(name: str) -> Path:
    p = Path(name)
    if p.is_absolute() or '..' in p.parts or not p.parts or '\\' in name:
        raise ValueError(f'Ruta inválida en catálogo: {name}')
    return p


def files(root: Path) -> dict[str, str]:
    result = {}
    for p in sorted(root.rglob('*')):
        rel = p.relative_to(root)
        if rel.parts[0] == '.git' or any(x in CACHE_PARTS for x in rel.parts):
            continue
        if p.is_symlink():
            raise ValueError(f'Enlace inesperado en el paquete: {rel}')
        if not p.is_file() or str(rel) == MANIFEST:
            continue
        if rel.parts[0] not in ALLOWED_ROOTS:
            raise ValueError(f'Archivo fuera del alcance: {rel}')
        if any(x in PROHIBITED_PARTS for x in rel.parts) or (
            p.name.startswith('.env.') and p.name != '.env.example'
        ) or p.suffix in {'.zip', '.pyc', '.db', '.sqlite'}:
            raise ValueError(f'Archivo prohibido: {rel}')
        result[str(rel)] = digest(p)
    return result


def verify(root: Path = ROOT) -> dict[str, str]:
    expected = json.loads((root / MANIFEST).read_text())
    if not expected:
        raise ValueError('Manifiesto vacío')
    for name in expected:
        safe_relative(name)
    actual = files(root)
    if actual != expected:
        missing = sorted(set(expected) - set(actual))
        extra = sorted(set(actual) - set(expected))
        modified = sorted(n for n in actual.keys() & expected.keys()
                          if actual[n] != expected[n])
        raise ValueError(f'Integridad: faltantes={missing[:5]}, extras={extra[:5]}, modificados={modified[:5]}')
    entries = json.loads((root / 'catalog/skills.json').read_text())
    by_id = {e['id']: e for e in entries}
    if len(by_id) != len(entries):
        raise ValueError('IDs de skills duplicados')
    for entry in entries:
        skill = root / safe_relative(entry['path']) / 'SKILL.md'
        if not re.fullmatch(r'[A-Za-z0-9_.-]+', entry['name']):
            raise ValueError(f'Nombre inválido: {entry["id"]}')
        if digest(skill) != entry['sha256']:
            raise ValueError(f'Skill modificada sin actualizar catálogo: {entry["id"]}')
    profiles = json.loads((root / 'catalog/profiles.json').read_text())
    for profile, ids in profiles.items():
        names = [by_id[i]['name'] for i in ids]
        if len(names) != len(set(names)):
            raise ValueError(f'Colisión en perfil {profile}')
    return expected


def select(profile: str, root: Path = ROOT) -> list[dict]:
    entries = json.loads((root / 'catalog/skills.json').read_text())
    profiles = json.loads((root / 'catalog/profiles.json').read_text())
    index = {e['id']: e for e in entries}
    return [index[i] for i in profiles[profile]]


def outside_package(project: Path, root: Path) -> Path:
    project = project.expanduser().resolve()
    if project == root or root in project.parents:
        raise ValueError('El destino debe estar fuera del paquete fuente')
    return project


def install(project: Path, profile: str, root: Path = ROOT) -> dict:
    expected = verify(root)
    project = outside_package(project, root)
    selected = select(profile, root)
    version = digest(root / MANIFEST)[:16]
    agents = project / '.agents'
    dest = agents / 'skills'
    store = agents / '.softvibes-ecosystem'
    snapshot = store / version
    for p in [agents, dest, store, snapshot]:
        if p.is_symlink() or (p.exists() and not p.is_dir()):
            raise ValueError(f'Destino no válido: {p}')
    # Preflight every conflict before making any changes.
    conflicts = []
    for entry in selected:
        link = dest / entry['name']
        target = snapshot / entry['path']
        if os.path.lexists(link) and not (link.is_symlink() and link.resolve() == target.resolve()):
            conflicts.append(entry['name'])
    if conflicts:
        raise ValueError('No se sobrescriben skills existentes: ' + ', '.join(conflicts))
    if snapshot.exists():
        verify(snapshot)
    else:
        store.mkdir(parents=True, exist_ok=True)
        import tempfile
        staging = Path(tempfile.mkdtemp(prefix='.staging-', dir=store))
        try:
            for name in [*expected, MANIFEST]:
                src = root / safe_relative(name)
                target = staging / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, target)
            verify(staging)
            staging.rename(snapshot)
        finally:
            if staging.exists():
                shutil.rmtree(staging)
    dest.mkdir(parents=True, exist_ok=True)
    created = []
    try:
        for entry in selected:
            link = dest / entry['name']
            if not os.path.lexists(link):
                link.symlink_to(os.path.relpath(snapshot / entry['path'], dest), target_is_directory=True)
                created.append(link)
    except OSError:
        for link in created:
            link.unlink()
        raise
    return {'profile': profile, 'skills': len(selected), 'created': len(created), 'project': str(project)}


def init(project: Path, root: Path = ROOT) -> Path:
    verify(root)
    project = outside_package(project, root)
    if project.exists() and (not project.is_dir() or any(project.iterdir())):
        raise ValueError('init requiere un directorio nuevo o vacío')
    shutil.copytree(root / 'templates/project', project, dirs_exist_ok=True)
    (project / 'projects').mkdir(exist_ok=True)
    return project


def pack(output: Path, root: Path = ROOT) -> dict:
    expected = verify(root)
    output = outside_package(output, root)
    if output.exists():
        raise ValueError('El archivo de salida ya existe; elige otro nombre')
    output.parent.mkdir(parents=True, exist_ok=True)
    # Fixed timestamps and sorted paths make repeated exports reproducible.
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for name in sorted([*expected, MANIFEST]):
            src = root / safe_relative(name)
            info = zipfile.ZipInfo('softvibes-ecosistema/' + name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100755 if os.access(src, os.X_OK) else 0o100644) << 16
            archive.writestr(info, src.read_bytes())
    return {'output': str(output), 'sha256': digest(output), 'files': len(expected) + 1}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('verify')
    commands.add_parser('seal')
    listing = commands.add_parser('list')
    listing.add_argument('--profile', choices=['web', 'all'], default='all')
    listing.add_argument('--search', default='')
    installation = commands.add_parser('install')
    installation.add_argument('--project', type=Path, required=True)
    installation.add_argument('--profile', choices=['web', 'all'], default='web')
    initialization = commands.add_parser('init')
    initialization.add_argument('--project', type=Path, required=True)
    archive = commands.add_parser('pack')
    archive.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == 'seal':
            # Hashes in the skill catalog must match the reviewed skill content.
            entries_path = ROOT / 'catalog/skills.json'
            entries = json.loads(entries_path.read_text())
            for e in entries:
                e['sha256'] = digest(ROOT / safe_relative(e['path']) / 'SKILL.md')
            entries_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
            (ROOT / MANIFEST).write_text(json.dumps(files(ROOT), indent=2, sort_keys=True) + '\n')
            print('Snapshot sellado; ejecuta verify y las pruebas antes de compartir.')
        elif args.command == 'verify':
            print(f'OK: {len(verify())} archivos comprobados, catálogo y perfiles válidos.')
        elif args.command == 'list':
            for entry in select(args.profile):
                if args.search.casefold() in (entry['name'] + ' ' + entry['description']).casefold():
                    print(f"{entry['name']}\t{entry['id']}\t{entry['path']}")
        elif args.command == 'install':
            print(json.dumps(install(args.project, args.profile), ensure_ascii=False))
        elif args.command == 'init':
            print(f'Workspace creado: {init(args.project)}')
        elif args.command == 'pack':
            print(json.dumps(pack(args.output), ensure_ascii=False))
        return 0
    except (ValueError, OSError, KeyError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
