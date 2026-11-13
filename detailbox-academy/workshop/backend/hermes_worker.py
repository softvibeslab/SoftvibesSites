"""Una inferencia del perfil Hermes `detailbox-pad`, sin herramientas ni bucle.

Lo inicia el backend del workshop con el Python de Hermes. El perfil aporta
identidad (SOUL.md), modelo y autenticación; el backend aporta reglas y el
contexto del alumno. No ejecuta terminal, archivos, memoria ni herramientas.
Protocolo: un JSON por stdin, un JSON por stdout; nunca devuelve credenciales
ni trazas internas. Basado en el worker de Agente Cisne (Softvibes).
"""
from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import io
import json
import logging
import os
from pathlib import Path
import sys

PROFILE = 'detailbox-pad'
MAX_INPUT = 2 * 1024 * 1024
MAX_REPLY = 60_000
SAFE_ERROR = 'El copiloto no pudo completar la solicitud. Revisa el perfil Hermes y su autenticación.'


class WorkerError(ValueError):
    """Fallo interno; su contenido no sale del proceso."""


def validate_request(request):
    if not isinstance(request, dict) or request.get('action') not in ('status', 'respond'):
        raise WorkerError('action')
    if request.get('expected_profile', PROFILE) != PROFILE:
        raise WorkerError('profile mismatch')
    if request['action'] == 'status':
        return
    instructions, messages = request.get('instructions'), request.get('messages')
    if not isinstance(instructions, str) or not instructions.strip() or len(instructions) > 60_000:
        raise WorkerError('instructions')
    if not isinstance(messages, list) or not messages or len(messages) > 30:
        raise WorkerError('messages')
    for item in messages:
        if (not isinstance(item, dict) or item.get('role') not in ('user', 'assistant')
                or not isinstance(item.get('content'), str) or not item['content'].strip() or len(item['content']) > 20_000):
            raise WorkerError('message')
    if messages[-1]['role'] != 'user':
        raise WorkerError('last message')


def profile_paths():
    root = Path(os.environ.get('DETAILBOX_HERMES_ROOT', '')).expanduser().resolve()
    profile = Path(os.environ.get('DETAILBOX_HERMES_PROFILE_DIR', '')).expanduser().resolve()
    if profile.name != PROFILE or profile.parent.name != 'profiles':
        raise WorkerError('profile')
    if not (root / 'run_agent.py').is_file() or not (profile / 'config.yaml').is_file() or not (profile / 'SOUL.md').is_file():
        raise WorkerError('installation')
    os.environ['HERMES_HOME'] = str(profile)  # antes de importar Hermes: cachea rutas
    for name in ('HERMES_KANBAN_TASK', 'HERMES_CONFIG', 'HERMES_ENV', 'HERMES_PROFILE',
                 'HERMES_INFERENCE_MODEL', 'HERMES_INFERENCE_PROVIDER'):
        os.environ.pop(name, None)
    return root, profile


def load_runtime():
    root, profile = profile_paths()
    sys.path.insert(0, str(root))
    from hermes_cli.config import load_config
    from hermes_cli.runtime_provider import resolve_runtime_provider
    from run_agent import AIAgent

    model_config = load_config().get('model') or {}
    model, provider = model_config.get('default'), model_config.get('provider')
    if not isinstance(model, str) or not model or not isinstance(provider, str) or not provider:
        raise WorkerError('model configuration')
    runtime = resolve_runtime_provider(requested=provider, target_model=model)
    # Adaptador probado para el transporte Responses del perfil; otros requieren su propio adaptador.
    if runtime.get('api_mode') != 'codex_responses' or not runtime.get('api_key'):
        raise WorkerError('unsupported or unauthenticated runtime')
    soul = (profile / 'SOUL.md').read_text(encoding='utf-8')
    if not soul.strip() or len(soul) > 32_000:
        raise WorkerError('identity')
    return model, runtime, soul, AIAgent


def _plain(value):
    if hasattr(value, 'model_dump'):
        return value.model_dump(mode='json', exclude_none=True)
    if isinstance(value, dict):
        return {k: _plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_plain(v) for v in value]
    return value


def reply_text(response):
    status = response.get('status') if isinstance(response, dict) else getattr(response, 'status', None)
    if status in ('failed', 'cancelled'):
        raise WorkerError('failed response')
    raw = response.get('output') if isinstance(response, dict) else getattr(response, 'output', None)
    parts = []
    for item in _plain(raw) or []:
        if isinstance(item, dict) and item.get('type') == 'message' and item.get('role') == 'assistant':
            for block in item.get('content') or []:
                if isinstance(block, dict) and block.get('type') == 'output_text' and isinstance(block.get('text'), str):
                    parts.append(block['text'])
    text = '\n'.join(parts).strip()
    if not text:
        raise WorkerError('empty response')
    return text[:MAX_REPLY]


def handle(request, runtime_loader=load_runtime):
    validate_request(request)
    model, runtime, soul, agent_class = runtime_loader()
    if request['action'] == 'status':
        return {'configured': True, 'model': model, 'profile': PROFILE}
    agent = agent_class(
        model=model, provider=runtime['provider'], api_key=runtime['api_key'],
        base_url=runtime.get('base_url'), api_mode=runtime['api_mode'],
        credential_pool=runtime.get('credential_pool'),
        enabled_toolsets=[], disabled_toolsets=[], skip_memory=True,
        skip_context_files=True, load_soul_identity=False, session_db=None,
        save_trajectories=False, verbose_logging=False, quiet_mode=True,
        max_iterations=1, max_tokens=2500, platform='detailbox_workshop',
        reasoning_config={'effort': 'low'}, checkpoints_enabled=False,
    )
    agent.tools, agent.valid_tool_names, agent.request_overrides = [], set(), {}
    agent.suppress_status_output, agent.stream_delta_callback, agent.tool_gen_callback = True, None, None
    instructions = (soul + '\n\nCANAL: Workbook PAD (web del alumno). Sin herramientas, archivos, terminal ni memoria; '
                    'responde solo con texto.\n\n' + request['instructions'])
    kwargs = agent._build_api_kwargs([{'role': 'system', 'content': instructions},
                                      {'role': 'user', 'content': 'Consulta del alumno.'}])
    kwargs.update(instructions=instructions, input=[{'role': m['role'], 'content': m['content']} for m in request['messages']],
                  store=False, timeout=50)
    kwargs.pop('tools', None)
    kwargs.pop('tool_choice', None)
    kwargs.pop('parallel_tool_calls', None)
    kwargs = agent._get_transport().preflight_kwargs(kwargs, allow_stream=False)
    return {'reply': reply_text(agent._interruptible_api_call(kwargs))}


def main():
    logging.disable(logging.CRITICAL)
    captured, code = io.StringIO(), 0
    try:
        raw = sys.stdin.buffer.read(MAX_INPUT + 1)
        if len(raw) > MAX_INPUT:
            raise WorkerError('input size')
        request = json.loads(raw)
        with redirect_stdout(captured), redirect_stderr(captured):
            result = handle(request)
    except Exception:
        code, result = 1, {'configured': False, 'profile': PROFILE, 'error': SAFE_ERROR}
    sys.stdout.write(json.dumps(result, ensure_ascii=False) + '\n')
    return code


if __name__ == '__main__':
    raise SystemExit(main())
