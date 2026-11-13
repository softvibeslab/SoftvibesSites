"""Proveedor del copiloto: ejecuta hermes_worker.py con el Python de Hermes.

El backend conserva sesión, permisos y contexto; el proceso solo recibe JSON
por stdin (nunca cookies, contraseñas ni datos de otros alumnos).
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import threading
import time

from hermes_worker import PROFILE


class CopilotError(RuntimeError):
    status_code = 503


class HermesProvider:
    def __init__(self, root=None, profile_dir=None, concurrency=3):
        self.root = Path(root or os.environ.get('DETAILBOX_HERMES_ROOT') or Path.home() / '.hermes/hermes-agent').expanduser().absolute()
        self.home = Path(profile_dir or os.environ.get('DETAILBOX_HERMES_PROFILE_DIR')
                         or Path.home() / '.hermes/profiles' / PROFILE).expanduser().absolute()
        self.python = self.root / 'venv/bin/python3'
        self.worker = Path(__file__).with_name('hermes_worker.py')
        self._slots = threading.BoundedSemaphore(concurrency)
        self._lock = threading.Lock()
        self._status, self._status_at = None, 0.0

    def _environment(self):
        names = ('HOME', 'PATH', 'LANG', 'LC_ALL', 'TMPDIR', 'SSL_CERT_FILE', 'SSL_CERT_DIR')
        env = {n: os.environ[n] for n in names if n in os.environ}
        env.update(HERMES_HOME=str(self.home), DETAILBOX_HERMES_ROOT=str(self.root),
                   DETAILBOX_HERMES_PROFILE_DIR=str(self.home), PYTHONIOENCODING='utf-8',
                   PYTHONUNBUFFERED='1', HERMES_LOG_LEVEL='CRITICAL')
        return env

    def _call(self, payload, timeout):
        if (self.home.name != PROFILE or not (self.home / 'config.yaml').is_file()
                or not self.python.is_file() or not self.worker.is_file()):
            raise CopilotError('El perfil Hermes del copiloto no está instalado en este servidor.')
        try:
            result = subprocess.run([str(self.python), str(self.worker)],
                                    input=json.dumps({**payload, 'expected_profile': PROFILE}, ensure_ascii=False),
                                    capture_output=True, text=True, timeout=timeout, check=False,
                                    cwd=str(self.home), env=self._environment())
        except subprocess.TimeoutExpired:
            raise CopilotError('El copiloto tardó demasiado en responder. Intenta de nuevo.') from None
        except (OSError, ValueError):
            raise CopilotError('No fue posible iniciar el copiloto.') from None
        try:
            value = json.loads(result.stdout)
        except (TypeError, ValueError):
            raise CopilotError('El copiloto no devolvió una respuesta válida.') from None
        if result.returncode or not isinstance(value, dict) or value.get('error'):
            raise CopilotError('El copiloto no pudo responder. Revisa la conexión del perfil Hermes.')
        return value

    def status(self):
        with self._lock:
            if self._status is not None and time.monotonic() - self._status_at < 60:
                return dict(self._status)
            try:
                result = self._call({'action': 'status'}, 30)
                self._status = {'configured': result.get('configured') is True and result.get('profile') == PROFILE,
                                'model': result.get('model')}
            except CopilotError:
                self._status = {'configured': False, 'model': None}
            self._status_at = time.monotonic()
            return dict(self._status)

    def respond(self, instructions, messages):
        if not self._slots.acquire(blocking=False):
            error = CopilotError('El copiloto está atendiendo a otros alumnos. Intenta en un momento.')
            error.status_code = 429
            raise error
        try:
            return self._call({'action': 'respond', 'instructions': instructions, 'messages': messages}, 70)['reply']
        finally:
            self._slots.release()
