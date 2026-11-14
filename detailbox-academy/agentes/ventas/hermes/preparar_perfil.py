#!/usr/bin/env python3
"""Prepara el perfil Hermes `detailbox-ventas` (Asesor de admisiones de las landings). Vista previa por defecto; no inicia gateway."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

PROFILE = 'detailbox-ventas'
DESCRIPTION = ('Asesor de admisiones de Detailbox Academy: conduce el embudo de las landings (conocer, nutrir, '
               'cualificar, agendar) y entrega la ficha por WhatsApp. Sin herramientas; lo invoca el backend del workshop.')
HERE = Path(__file__).resolve().parent
DEFAULT_REPO = HERE.parents[2]  # detailbox-academy/
REQUIRED = ('index.html', 'workshop/backend/hermes_worker.py')


def profile_root(env):
    native = Path.home() / '.hermes'
    configured = Path(env.get('HERMES_HOME', native)).expanduser()
    try:
        configured.resolve().relative_to(native.resolve())
        return native
    except ValueError:
        return configured.parent.parent if configured.parent.name == 'profiles' else configured


def resolve_repo(env):
    repo = Path(env.get('DETAILBOX_REPO_PATH') or DEFAULT_REPO).expanduser().resolve()
    missing = [item for item in REQUIRED if not (repo / item).is_file()]
    if missing:
        raise RuntimeError('DETAILBOX_REPO_PATH debe apuntar a detailbox-academy/; faltan: ' + ', '.join(missing))
    return repo


def command(binary, arguments, env):
    result = subprocess.run([binary, *arguments], env=env, capture_output=True, text=True, timeout=90)
    if result.returncode:
        raise RuntimeError('Hermes no completó la preparación; revisa el perfil con su CLI.')


def install(env, apply=False, runner=command):
    root = profile_root(env)
    destination = root / 'profiles' / PROFILE
    repo = resolve_repo(env)
    binary = env.get('HERMES_BIN') or shutil.which('hermes')
    if apply and not binary:
        raise RuntimeError('Instala Hermes o define HERMES_BIN con su ejecutable.')
    if destination.is_symlink():
        raise RuntimeError('El destino del perfil no puede ser un enlace simbólico.')
    fresh = not destination.exists()
    report = {'profile': PROFILE, 'destination': str(destination), 'repo': str(repo), 'apply': apply,
              'create': fresh, 'configure_model': fresh, 'gateway_started': False, 'copied': [], 'preserved': []}
    targets = [(HERE / 'SOUL.md', destination / 'SOUL.md')]  # sin skills: el worker no ejecuta herramientas
    for _, target in targets:
        report['preserved' if target.exists() else 'copied'].append(str(target.relative_to(destination)))
    if not apply:
        return report
    run_env = dict(env)
    run_env['HERMES_HOME'] = str(root)
    if fresh:
        runner(binary, ['profile', 'create', PROFILE, '--no-skills', '--no-alias', '--description', DESCRIPTION], run_env)
        if not destination.is_dir():
            raise RuntimeError('Hermes no creó el perfil en la ubicación prevista; no se copiaron archivos.')
        seeded = destination / 'SOUL.md'  # solo la plantilla creada en ESTA ejecución
        if seeded.exists():
            seeded.rename(destination / 'SOUL.hermes-default.md')
    for source, target in targets:
        if target.exists() or target.is_symlink():
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.is_dir():
            shutil.copytree(source, target, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        else:
            with target.open('x', encoding='utf-8') as stream:
                stream.write(source.read_text(encoding='utf-8'))
    if fresh:
        # Mismo transporte que el worker soporta. En producción: llave propia de Detailbox (decisión D4).
        runner(binary, ['--profile', PROFILE, 'config', 'set', 'model.default', env.get('DETAILBOX_VENTAS_MODEL', 'gpt-6-astra')], run_env)
        runner(binary, ['--profile', PROFILE, 'config', 'set', 'model.provider', env.get('DETAILBOX_VENTAS_PROVIDER', 'openai-codex')], run_env)
    report['next'] = 'Verifica el worker con expected_profile detailbox-ventas (ver agentes/ventas/hermes/README.md). En producción usa la llave propia de Detailbox.'
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--install', action='store_true', help='Crear el perfil y copiar solo archivos ausentes')
    args = parser.parse_args()
    try:
        print(json.dumps(install(os.environ, args.install), ensure_ascii=False, indent=2))
        return 0
    except (RuntimeError, OSError, subprocess.SubprocessError) as error:
        print(json.dumps({'ok': False, 'error': str(error)}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    sys.exit(main())
