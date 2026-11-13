"""Cálculos determinísticos del Workbook PAD: estados, avance, márgenes y contexto.

Una sola fuente de verdad. La app muestra lo que calcula este módulo y el
copiloto recibe estos números ya calculados (la IA no recalcula márgenes).
"""
from __future__ import annotations

NOT_STARTED, IN_PROGRESS, DONE = 'no_iniciado', 'en_proceso', 'completado'
STAGE_TOOLS = {'P': ('diagnostico', 'cliente_ideal', 'paquetes', 'propuesta_valor'),
               'A': ('atencion', 'ventas', 'marketing'),
               'D': ('plan30', 'revision', 'cierre')}


def filled(value):
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, (list, dict)):
        return any(filled(item) for item in (value.values() if isinstance(value, dict) else value))
    return bool(value)


def number(value):
    try:
        result = float(str(value).replace(',', '').replace('$', '').strip())
    except (TypeError, ValueError):
        return None
    return result if result == result and abs(result) < 1e12 else None


def package_numbers(package):
    """Utilidad = precio − costo total; margen (%) = utilidad ÷ precio × 100 (workbook p. 3)."""
    parts = [number(package.get(key)) for key in ('materiales', 'mano_obra', 'traslados', 'otros')]
    known = [value for value in parts if value is not None]
    cost = round(sum(known), 2) if known else None
    price = number(package.get('precio'))
    profit = round(price - cost, 2) if price is not None and cost is not None else None
    margin = round(profit / price * 100, 1) if profit is not None and price else None
    return {'costo_total': cost, 'utilidad': profit, 'margen': margin}


def _state(done, started):
    return DONE if done else IN_PROGRESS if started else NOT_STARTED


def tool_state(key, data, content):
    data = data if isinstance(data, dict) else {}
    started = filled(data)
    if key == 'diagnostico':
        areas = data.get('areas') or {}
        rated = [a['id'] for a in content['diagnostico_areas']
                 if isinstance(areas.get(a['id']), dict) and number(areas[a['id']].get('calificacion')) in (1, 2, 3, 4, 5)]
        priorities = [p for p in (data.get('prioridades') or []) if filled(p)]
        return _state(len(rated) == len(content['diagnostico_areas']) and len(priorities) >= 3, started)
    if key == 'cliente_ideal':
        segments = data.get('segmentos') or []
        principal = data.get('principal')
        ok = isinstance(principal, int) and 0 <= principal < len(segments) and all(
            filled(segments[principal].get(field)) for field in ('nombre', 'problema', 'servicio'))
        return _state(ok, started)
    if key == 'paquetes':
        packages = data.get('paquetes') or []
        complete = [p for p in packages if isinstance(p, dict) and filled(p.get('nombre'))
                    and number(p.get('precio')) and package_numbers(p)['costo_total']]
        return _state(len(complete) >= 3, started)
    if key == 'propuesta_valor':
        return _state(all(filled(data.get(f)) for f in ('tipo_cliente', 'resultado', 'servicio', 'ventaja')), started)
    if key == 'atencion':
        checks = data.get('checks') or {}
        ids = [item['id'] for moment in content['atencion_momentos'] for item in moment['items']]
        started = started and (any(checks.get(i) for i in ids) or filled(data.get('responsable')))
        return _state(all(checks.get(i) is True for i in ids) and filled(data.get('responsable')), started)
    if key == 'ventas':
        scripts = data.get('guiones') or {}
        has_lead = any(isinstance(p, dict) and filled(p.get('cliente')) for p in (data.get('prospectos') or []))
        return _state(has_lead and all(filled(scripts.get(f)) for f in ('primer_contacto', 'preguntas', 'seguimiento', 'objecion')), started)
    if key == 'marketing':
        days = [d for d in (data.get('dias') or []) if isinstance(d, dict)]
        return _state(len([d for d in days if filled(d.get('tema')) and filled(d.get('categoria'))]) >= 7, started)
    if key == 'plan30':
        done, total = plan_counts(data, content)
        return _state(total and done == total, done > 0 or started)
    if key == 'revision':
        weeks = [w for w in (data.get('semanas') or []) if isinstance(w, dict) and filled(w.get('respuestas'))]
        return _state(len(weeks) >= 4, started)
    if key == 'cierre':
        return _state(all(filled(data.get(f)) for f in ('mayor_avance', 'cambio', 'indicador', 'objetivo_90')), started)
    return _state(False, started)


def plan_counts(data, content):
    tasks = (data or {}).get('tareas') or {}
    ids = [task['id'] for week in content['plan30'] for task in week['tareas']]
    done = sum(1 for i in ids if isinstance(tasks.get(i), dict) and tasks[i].get('estado') == 'hecho')
    return done, len(ids)


def summary(workbook, content):
    """Avance = herramientas P y A completadas + tareas del plan hechas + revisión y cierre."""
    states = {key: tool_state(key, workbook.get(key), content) for key in content['herramientas']}
    done_tasks, total_tasks = plan_counts(workbook.get('plan30'), content)
    units = [states[k] == DONE for k in STAGE_TOOLS['P'] + STAGE_TOOLS['A'] + ('revision', 'cierre')]
    completed = sum(units) + done_tasks
    total = len(units) + total_tasks
    stages = {}
    for stage, keys in STAGE_TOOLS.items():
        values = [states[k] for k in keys]
        stages[stage] = DONE if all(v == DONE for v in values) else NOT_STARTED if all(v == NOT_STARTED for v in values) else IN_PROGRESS
    current = next((s for s in 'PAD' if stages[s] != DONE), 'D')
    next_tool = next((k for s in 'PAD' for k in STAGE_TOOLS[s] if states[k] != DONE), None)
    return {'porcentaje': round(completed / total * 100) if total else 0, 'completadas': completed, 'total': total,
            'herramientas': states, 'etapas': stages, 'etapa_actual': current, 'siguiente': next_tool,
            'plan': {'hechas': done_tasks, 'total': total_tasks}}


def _line(label, value):
    return f'- {label}: {value}' if filled(value) else None


def context_text(user, workbook, content, limit=12000):
    """Resumen del alumno para el copiloto. Solo datos registrados; lo vacío se declara vacío."""
    s = summary(workbook, content)
    w = {k: (v if isinstance(v, dict) else {}) for k, v in workbook.items()}
    out = [f'ALUMNO: {user["nombre"]}', f'Avance del workbook: {s["porcentaje"]}% · etapa actual {s["etapa_actual"]}',
           'Estado por herramienta: ' + ', '.join(f'{k}={v}' for k, v in s['herramientas'].items())]
    inicio = w.get('inicio', {})
    out += ['', '## Mi negocio'] + [x for x in (
        _line('Negocio', inicio.get('negocio')), _line('Fecha de inicio', inicio.get('fecha_inicio')),
        _line('Meta principal (30 días)', inicio.get('meta')), _line('Etapa elegida por el alumno', inicio.get('etapa')),
        _line('Modalidad', inicio.get('modalidad')), _line('Capacidad semanal', inicio.get('capacidad'))) if x]
    d = w.get('diagnostico', {})
    if filled(d):
        out += ['', '## Diagnóstico (1 = necesito trabajarla, 5 = bien estructurada)']
        for area in content['diagnostico_areas']:
            item = (d.get('areas') or {}).get(area['id']) or {}
            if filled(item):
                out.append(f'- {area["nombre"]}: {item.get("calificacion", "sin calificar")} · mejorar: {item.get("mejora") or "—"}')
        out += [f'- Prioridad {i + 1}: {p}' for i, p in enumerate(d.get('prioridades') or []) if filled(p)]
    c = w.get('cliente_ideal', {})
    segments = [x for x in (c.get('segmentos') or []) if isinstance(x, dict)]
    for label, index in (('principal', c.get('principal')), ('secundario', c.get('secundario'))):
        if isinstance(index, int) and 0 <= index < len(segments):
            seg = segments[index]
            out += ['', f'## Segmento {label}: {seg.get("nombre") or "sin nombre"}'] + [x for x in (
                _line('Tipo de cliente', seg.get('tipo_cliente')), _line('Vehículo', seg.get('vehiculo')),
                _line('Problema', seg.get('problema')), _line('Servicio que busca', seg.get('servicio')),
                _line('Qué valora', seg.get('valora')), _line('Zona', seg.get('zona')),
                _line('Objeción frecuente', seg.get('objecion'))) if x]
    packages = [p for p in (w.get('paquetes', {}).get('paquetes') or []) if isinstance(p, dict) and filled(p)]
    if packages:
        out += ['', '## Paquetes (costos y márgenes calculados por la plataforma, no estimados por IA)']
        for p in packages:
            n = package_numbers(p)
            out.append(f'- {p.get("nombre") or "Sin nombre"}: precio {p.get("precio") or "—"} · costo total {n["costo_total"] if n["costo_total"] is not None else "sin costos"} · '
                       f'utilidad {n["utilidad"] if n["utilidad"] is not None else "—"} · margen {str(n["margen"]) + "%" if n["margen"] is not None else "—"} · '
                       f'tiempo {p.get("tiempo") or "—"} · incluye: {p.get("incluye") or "—"} · no incluye: {p.get("no_incluye") or "—"}')
    pv = w.get('propuesta_valor', {})
    if filled(pv):
        out += ['', '## Propuesta de valor', f'- Ayudo a {pv.get("tipo_cliente") or "___"} a conseguir {pv.get("resultado") or "___"} mediante {pv.get("servicio") or "___"}, diferenciándome por {pv.get("ventaja") or "___"}.']
        if filled(pv.get('version_final')):
            out.append(f'- Versión final: {pv["version_final"]}')
    at = w.get('atencion', {})
    if filled(at):
        checks = at.get('checks') or {}
        missing = [i['texto'] for m in content['atencion_momentos'] for i in m['items'] if not checks.get(i['id'])]
        out += ['', '## Manual de atención', f'- Pasos que aún no realiza: {len(missing)}'] + [f'  · {t}' for t in missing[:12]]
    v = w.get('ventas', {})
    leads = [p for p in (v.get('prospectos') or []) if isinstance(p, dict) and filled(p.get('cliente'))]
    if filled(v):
        states = {e['id']: e['nombre'] for e in content['embudo_estados']}
        out += ['', f'## Sistema de ventas · {len(leads)} prospectos registrados']
        for estado_id, nombre in states.items():
            count = sum(1 for p in leads if p.get('estado') == estado_id)
            if count:
                out.append(f'- {nombre}: {count}')
        for key, label in (('primer_contacto', 'Guion de primer contacto'), ('preguntas', 'Preguntas de diagnóstico'),
                           ('seguimiento', 'Mensaje de seguimiento'), ('objecion', 'Respuesta a la objeción más común')):
            line = _line(label, (v.get('guiones') or {}).get(key))
            if line:
                out.append(line)
    m = w.get('marketing', {})
    days = [x for x in (m.get('dias') or []) if isinstance(x, dict) and filled(x.get('tema'))]
    if days:
        out += ['', '## Calendario de 7 días'] + [f'- Día {x.get("dia")}: {x.get("tema")} · {x.get("categoria") or "—"} · {x.get("formato") or "—"} · CTA {x.get("cta") or "—"} · {x.get("estado") or "Pendiente"}' for x in days]
    out += ['', f'## Plan de 30 días: {s["plan"]["hechas"]} de {s["plan"]["total"]} tareas hechas']
    r = w.get('revision', {})
    weeks = [x for x in (r.get('semanas') or []) if isinstance(x, dict) and filled(x)]
    if weeks:
        last = weeks[-1]
        out += ['', f'## Última revisión semanal (semana {last.get("semana", "—")})']
        for q in content['revision_preguntas']:
            line = _line(q['texto'], (last.get('respuestas') or {}).get(q['id']))
            if line:
                out.append(line)
        for ind in content['indicadores']:
            line = _line(ind['nombre'], (last.get('indicadores') or {}).get(ind['id']))
            if line:
                out.append(line)
    text = '\n'.join(out)
    return text if len(text) <= limit else text[:limit] + '\n[contexto recortado]'
