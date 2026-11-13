// Workbook PAD · app del alumno. Sin frameworks: estado en memoria, vistas por hash,
// autoguardado por herramienta. El servidor calcula estados y avance (progress.py).
import { api, ApiError, session, logout, escapeHtml as esc, money, toast } from '/assets/api.js';

const SECTIONS = { prepara: 'P', apunta: 'A', dispara: 'D' };
const STAGE_SECTION = { P: 'prepara', A: 'apunta', D: 'dispara' };
const STATE_LABEL = { no_iniciado: 'No iniciado', en_proceso: 'En proceso', completado: 'Completado' };
const PLAN_STATES = [['pendiente', 'Pendiente'], ['en_proceso', 'En proceso'], ['hecho', 'Hecho']];
const FORMATS = ['Reel', 'Carrusel', 'Historia', 'Foto', 'Video', 'Testimonio', 'En vivo'];

const state = {
  user: null, content: null, wb: {}, progreso: null, evidencias: [],
  saving: {}, again: {}, dirty: {}, timers: {},
  ventasFiltro: null, revSemana: 0,
  chat: { loaded: false, conectado: null, mensajes: [], loading: false, error: null, welcome: false },
};
const view = document.getElementById('vista');

// ── utilidades ────────────────────────────────────────────────────────
const attr = (value) => esc(value ?? '');
const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((key, i) => {
    if (o[key] == null || typeof o[key] !== 'object') o[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[key];
  });
  o[keys.at(-1)] = value;
}
function num(value) {
  if (value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, '').replace(/\$/g, '').trim());
  return String(value).trim() === '' || !Number.isFinite(n) ? null : n;
}
const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;
// Idéntico a progress.package_numbers: utilidad = precio − costo total; margen = utilidad ÷ precio × 100.
function packageNumbers(p) {
  const known = ['materiales', 'mano_obra', 'traslados', 'otros'].map((k) => num(p[k])).filter((v) => v !== null);
  const cost = known.length ? round(known.reduce((a, b) => a + b, 0), 2) : null;
  const price = num(p.precio);
  const profit = price !== null && cost !== null ? round(price - cost, 2) : null;
  const margin = profit !== null && price ? round((profit / price) * 100, 1) : null;
  return { costo_total: cost, utilidad: profit, margen: margin };
}
const filled = (v) => (v == null ? false : typeof v === 'string' ? v.trim() !== '' : typeof v === 'object' ? Object.values(v).some(filled) : true);
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const tools = () => state.content.herramientas;
const toolsOf = (stage) => Object.entries(tools()).filter(([, t]) => t.etapa === stage).sort((a, b) => a[1].numero - b[1].numero).map(([k]) => k);
const toolState = (key) => state.progreso?.herramientas?.[key] || 'no_iniciado';
const badge = (s, attrName = '') => `<span class="badge badge--${s}" ${attrName}>${STATE_LABEL[s]}</span>`;

function handleError(error) {
  if (error instanceof ApiError && error.status === 401) {
    location.href = `/entrar/?siguiente=${encodeURIComponent('/app/' + location.hash)}`;
    return;
  }
  toast(error.message || 'Algo salió mal.', 'error');
}

// ── campos con enlace a datos (data-path relativo a la herramienta) ──────
function field(tool, path, label, opts = {}) {
  const value = getPath(state.wb[tool], path);
  const { type = 'text', placeholder = '', hint = '', area = false, wide = false, inputmode = '', options = null, cls = '' } = opts;
  const id = `f-${tool}-${path.replace(/\./g, '-')}`;
  let control;
  if (options) {
    control = `<select class="select" id="${id}" data-path="${path}">
      <option value="">Elige…</option>${options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return `<option value="${attr(v)}" ${String(value ?? '') === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
      }).join('')}</select>`;
  } else if (area) {
    control = `<textarea class="textarea" id="${id}" data-path="${path}" rows="${opts.rows || 3}" placeholder="${attr(placeholder)}">${esc(value ?? '')}</textarea>`;
  } else {
    control = `<input class="input" id="${id}" type="${type}" data-path="${path}" value="${attr(value)}" placeholder="${attr(placeholder)}" ${inputmode ? `inputmode="${inputmode}"` : ''} ${opts.list ? `list="${opts.list}"` : ''}>`;
  }
  return `<label class="field ${wide ? 'field--wide' : ''} ${cls}" for="${id}"><span>${esc(label)}</span>${control}${hint ? `<small class="hint">${esc(hint)}</small>` : ''}</label>`;
}
const moneyField = (tool, path, label, hint = '') => field(tool, path, label, { inputmode: 'decimal', placeholder: '$0', hint, cls: 'field--money' });

// ── guardado ──────────────────────────────────────────────────────────
function setSaveStatus(tool, text, kind = '') {
  document.querySelectorAll(`[data-save="${tool}"]`).forEach((el) => {
    el.textContent = text;
    el.dataset.kind = kind;
  });
}
function scheduleSave(tool) {
  state.dirty[tool] = true;
  setSaveStatus(tool, 'Cambios sin guardar', 'pending');
  clearTimeout(state.timers[tool]);
  state.timers[tool] = setTimeout(() => save(tool), 700);
}
async function save(tool) {
  clearTimeout(state.timers[tool]);
  if (state.saving[tool]) { state.again[tool] = true; return; }
  state.saving[tool] = true;
  state.dirty[tool] = false;
  setSaveStatus(tool, 'Guardando…', 'pending');
  try {
    const data = await api(`/api/workbook/${tool}`, { method: 'PUT', json: { datos: state.wb[tool] } });
    state.progreso = data.progreso;
    if (!state.dirty[tool]) setSaveStatus(tool, 'Guardado ✓', 'ok');
    renderChrome();
  } catch (error) {
    state.dirty[tool] = true;
    setSaveStatus(tool, 'No se guardó · reintenta', 'error');
    handleError(error);
  } finally {
    state.saving[tool] = false;
    if (state.again[tool]) { state.again[tool] = false; save(tool); }
  }
}
function flushAll() {
  Object.keys(state.dirty).forEach((tool) => { if (state.dirty[tool]) save(tool); });
}
addEventListener('beforeunload', (event) => {
  if (Object.values(state.dirty).some(Boolean)) { flushAll(); event.preventDefault(); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });

// ── chrome: progreso y navegación ─────────────────────────────────────
function renderChrome() {
  const p = state.progreso;
  if (!p) return;
  document.querySelectorAll('[data-progress-label]').forEach((el) => { el.textContent = `${p.porcentaje}%`; });
  document.querySelectorAll('[data-progress-bar]').forEach((el) => { el.style.width = `${p.porcentaje}%`; });
  document.querySelectorAll('[data-progress-detail]').forEach((el) => { el.textContent = `${p.completadas} de ${p.total} pasos · etapa ${p.etapa_actual}`; });
  document.querySelectorAll('[data-nav-state]').forEach((el) => {
    const s = p.etapas[el.dataset.navState];
    el.className = `dot dot--${s}`;
    el.title = STATE_LABEL[s];
  });
  document.querySelectorAll('[data-tool-badge]').forEach((el) => {
    const s = toolState(el.dataset.toolBadge);
    el.className = `badge badge--${s}`;
    el.textContent = STATE_LABEL[s];
  });
  document.querySelectorAll('[data-stage-badge]').forEach((el) => {
    const s = p.etapas[el.dataset.stageBadge];
    el.className = `badge badge--${s}`;
    el.textContent = STATE_LABEL[s];
  });
}
function setActiveNav(section) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === section) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

// ── router ────────────────────────────────────────────────────────────
function route() {
  flushAll();
  const [section = 'inicio', tool] = location.hash.replace(/^#/, '').split('/');
  if (tool && tools()[tool] && STAGE_SECTION[tools()[tool].etapa] === section) return renderTool(tool);
  if (SECTIONS[section]) return renderSection(section);
  return renderHome();
}
function mount(html, title) {
  view.innerHTML = html;
  document.title = `${title} · Workbook PAD`;
  view.focus({ preventScroll: true });
  scrollTo({ top: 0 });
}

// ── INICIO · MI NEGOCIO ───────────────────────────────────────────────
function renderHome() {
  setActiveNav('inicio');
  const p = state.progreso;
  const textos = state.content.textos;
  state.wb.inicio ||= {};
  const inicio = state.wb.inicio;
  const nombre = inicio.alumno || state.user.nombre;
  const next = p.siguiente;
  const nextTool = next ? tools()[next] : null;
  const stageCards = ['P', 'A', 'D'].map((s) => `
    <a class="route-step route-step--${p.etapas[s]}" href="#${STAGE_SECTION[s]}">
      <span class="route-step__letter">${s}</span>
      <span class="route-step__text"><b>${esc(textos.etapas[s].nombre)}</b><small>${esc(textos.etapas[s].objetivo)}</small></span>
      <span class="badge badge--${p.etapas[s]}" data-stage-badge="${s}">${STATE_LABEL[p.etapas[s]]}</span>
    </a>`).join('<span class="route-arrow" aria-hidden="true">→</span>');
  mount(`
    <section class="hero card">
      <div class="hero__copy">
        <p class="eyebrow">Mi espacio de trabajo PAD</p>
        <h1>Hola, ${esc(nombre)}</h1>
        <p class="hero__business">${esc(inicio.negocio || state.user.negocio || 'Escribe el nombre de tu negocio abajo')}</p>
        <p class="hero__welcome">${esc(textos.bienvenida)}</p>
      </div>
      <div class="hero__meter">
        <div class="meter" role="img" aria-label="Avance del workbook: ${p.porcentaje}%">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="meter__track"/><circle cx="60" cy="60" r="52" class="meter__value" style="stroke-dashoffset:${327 - (327 * p.porcentaje) / 100}"/></svg>
          <b>${p.porcentaje}%</b>
        </div>
        <small>${p.completadas} de ${p.total} pasos completados</small>
      </div>
    </section>

    <section class="block">
      <h2 class="block__title">Mi ruta</h2>
      <div class="route">${stageCards}</div>
    </section>

    <section class="block next card">
      ${nextTool ? `
        <div><p class="eyebrow">Qué sigue</p><h2>${esc(nextTool.titulo)}</h2><p>${esc(nextTool.objetivo)}</p><p class="hint">Resultado: ${esc(nextTool.resultado)}</p></div>
        <a class="btn" href="#${STAGE_SECTION[nextTool.etapa]}/${next}">Continuar →</a>` : `
        <div><p class="eyebrow">Qué sigue</p><h2>¡Completaste tu workbook!</h2><p>${esc(textos.filosofia)}</p></div>
        <button class="btn" type="button" data-copilot-open>Evaluar mis avances con el copiloto</button>`}
    </section>

    <section class="block card pad">
      <div class="block__head"><h2>Inicio · Mi negocio</h2><span class="save" data-save="inicio"></span></div>
      <div class="grid grid--2" data-tool-root="inicio">
        ${field('inicio', 'alumno', 'Alumno', { placeholder: 'Tu nombre' })}
        ${field('inicio', 'negocio', 'Negocio', { placeholder: 'Nombre de tu negocio' })}
        ${field('inicio', 'fecha_inicio', 'Fecha de inicio', { type: 'date' })}
        ${field('inicio', 'etapa', 'Mi etapa actual', { options: [['PREPARA', 'PREPARA'], ['APUNTA', 'APUNTA'], ['DISPARA', 'DISPARA']] })}
        ${field('inicio', 'meta', 'Mi meta principal para estos 30 días', { area: true, wide: true, rows: 2, placeholder: 'Ejemplo: cerrar 10 servicios del paquete integral' })}
        <details class="field--wide optional">
          <summary>Opcional · ayuda al copiloto a entender tu capacidad</summary>
          <div class="grid grid--2">
            ${field('inicio', 'modalidad', 'Modalidad', { options: ['Local o estudio', 'Móvil o a domicilio', 'Mixta'] })}
            ${field('inicio', 'capacidad', 'Capacidad semanal', { placeholder: 'Ejemplo: 8 autos por semana' })}
          </div>
        </details>
      </div>
    </section>

    <section class="block">
      <h2 class="block__title">Accesos rápidos</h2>
      <div class="quick">
        <button class="quick__item" type="button" data-copilot-open><i aria-hidden="true">✦</i><b>Mi Copiloto PAD</b><small>IA con el contexto de tu negocio</small></button>
        <a class="quick__item" href="#prepara/paquetes"><i aria-hidden="true">$</i><b>Paquetes y precios</b><small>Calculadora de margen</small></a>
        <a class="quick__item" href="#apunta/ventas"><i aria-hidden="true">↗</i><b>Mis prospectos</b><small>Embudo y seguimientos</small></a>
        <a class="quick__item" href="#dispara/plan30"><i aria-hidden="true">✓</i><b>Plan de 30 días</b><small>${p.plan.hechas} de ${p.plan.total} tareas hechas</small></a>
      </div>
    </section>
    <p class="philosophy">${esc(textos.filosofia)}</p>
  `, 'Inicio');
}

// ── secciones P / A / D ───────────────────────────────────────────────
function renderSection(section) {
  setActiveNav(section);
  const stage = SECTIONS[section];
  const info = state.content.textos.etapas[stage];
  const keys = toolsOf(stage);
  mount(`
    <header class="section-head">
      <span class="section-head__letter">${stage}</span>
      <div><p class="eyebrow">${esc(info.nombre)}</p><h1>${esc(info.objetivo)}</h1></div>
      <span class="badge badge--${state.progreso.etapas[stage]}" data-stage-badge="${stage}">${STATE_LABEL[state.progreso.etapas[stage]]}</span>
    </header>
    <div class="tool-list">
      ${keys.map((key) => {
        const t = tools()[key];
        return `<a class="tool-card card" href="#${section}/${key}">
          <span class="tool-card__num">${t.numero}</span>
          <span class="tool-card__body"><b>${esc(t.titulo)}</b><small>${esc(t.objetivo)}</small><small class="tool-card__result">Resultado: ${esc(t.resultado)}</small></span>
          <span class="tool-card__side">${badge(toolState(key), `data-tool-badge="${key}"`)}<span class="tool-card__go" aria-hidden="true">→</span></span>
        </a>`;
      }).join('')}
    </div>
    ${stage === 'D' ? `<p class="hint center">El avance se calcula con las tareas completadas de tu plan y tus herramientas terminadas.</p>` : ''}
  `, info.nombre);
}

// ── herramienta ───────────────────────────────────────────────────────
const RENDERERS = {};
const REFRESH = {};

function renderTool(key) {
  const t = tools()[key];
  const section = STAGE_SECTION[t.etapa];
  setActiveNav(section);
  state.wb[key] = ensureData(key, state.wb[key] ? structuredClone(state.wb[key]) : {});
  const order = Object.keys(tools()).sort((a, b) => tools()[a].numero - tools()[b].numero);
  const nextKey = order[order.indexOf(key) + 1];
  const next = nextKey ? tools()[nextKey] : null;
  mount(`
    <nav class="crumbs" aria-label="Ruta"><a href="#${section}">${esc(state.content.textos.etapas[t.etapa].nombre)}</a><span aria-hidden="true">/</span><span>Herramienta ${t.numero}</span></nav>
    <header class="tool-head">
      <div><h1>${esc(t.titulo)}</h1><p>${esc(t.objetivo)}</p></div>
      <div class="tool-head__status">${badge(toolState(key), `data-tool-badge="${key}"`)}<span class="save" data-save="${key}" aria-live="polite"></span></div>
    </header>
    <ol class="steps">${t.pasos.map((s, i) => `<li><span>${i + 1}</span>${esc(s)}</li>`).join('')}</ol>
    <div class="tool" data-tool-root="${key}">${RENDERERS[key](key)}</div>
    <footer class="tool-foot card">
      <div><p class="eyebrow">Resultado de esta herramienta</p><p>${esc(t.resultado)}</p></div>
      <div class="tool-foot__actions">
        <button class="btn btn--ghost" type="button" data-copilot-open>Pedir ayuda al copiloto</button>
        ${next ? `<a class="btn" href="#${STAGE_SECTION[next.etapa]}/${nextKey}">Siguiente: ${esc(next.titulo)} →</a>` : `<a class="btn" href="#inicio">Volver a Inicio</a>`}
      </div>
    </footer>
  `, t.titulo);
  REFRESH[key]?.(view.querySelector('[data-tool-root]'));
}

// Valores por defecto en memoria. Solo se guardan cuando el alumno edita algo.
function ensureData(key, data) {
  const c = state.content;
  if (key === 'diagnostico') { data.areas ||= {}; data.prioridades ||= ['', '', '']; while (data.prioridades.length < 3) data.prioridades.push(''); }
  if (key === 'cliente_ideal') { data.segmentos ||= []; if (!data.segmentos.length) data.segmentos.push({ puntajes: {} }); }
  if (key === 'paquetes') { data.paquetes ||= []; if (!data.paquetes.length) c.paquetes_base.forEach((nombre) => data.paquetes.push({ nombre })); }
  if (key === 'atencion') data.checks ||= {};
  if (key === 'ventas') { data.prospectos ||= []; data.guiones ||= {}; data.prospectos.forEach((p) => { p.id ||= uid(); }); }
  if (key === 'marketing') {
    data.dias ||= [];
    for (let i = 0; i < 7; i += 1) {
      data.dias[i] ||= { dia: i + 1, categoria: c.marketing_categorias[i] || '', estado: c.marketing_estados[0] };
      data.dias[i].dia = i + 1;
    }
  }
  if (key === 'plan30') data.tareas ||= {};
  if (key === 'revision') {
    data.semanas ||= [];
    for (let i = 0; i < 4; i += 1) {
      data.semanas[i] ||= { semana: i + 1, respuestas: {}, indicadores: {} };
      data.semanas[i].respuestas ||= {};
      data.semanas[i].indicadores ||= {};
    }
  }
  return data;
}

// Enlace genérico: cualquier control con data-path escribe en la herramienta.
view.addEventListener('input', onEdit);
view.addEventListener('change', onEdit);
function onEdit(event) {
  const el = event.target;
  const root = el.closest('[data-tool-root]');
  if (!root || !el.dataset.path) return;
  if (event.type === 'input' && (el.type === 'radio' || el.type === 'checkbox' || el.tagName === 'SELECT')) return;
  if (event.type === 'change' && !(el.type === 'radio' || el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'date')) return;
  const tool = root.dataset.toolRoot;
  let value;
  if (el.type === 'checkbox') value = el.checked;
  else if (el.dataset.type === 'int') value = el.value === '' ? null : parseInt(el.value, 10);
  else value = el.value;
  state.wb[tool] ||= {};
  setPath(state.wb[tool], el.dataset.path, value);
  RULES[tool]?.(el.dataset.path, value, root);
  scheduleSave(tool);
  REFRESH[tool]?.(root, el);
}
const RULES = {
  cliente_ideal(path, value, root) {
    // Principal y secundario no pueden ser el mismo segmento.
    const data = state.wb.cliente_ideal;
    const other = path === 'principal' ? 'secundario' : path === 'secundario' ? 'principal' : null;
    if (other && data[other] === value) {
      data[other] = null;
      root.querySelectorAll(`input[data-path="${other}"]`).forEach((r) => { r.checked = false; });
    }
  },
};

// Acciones (botones) dentro de las herramientas.
view.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || !view.contains(button)) return;
  const root = button.closest('[data-tool-root]');
  const tool = root?.dataset.toolRoot;
  const action = ACTIONS[button.dataset.action];
  if (action) action(button, tool, root);
});
function rerender(tool) {
  const root = view.querySelector(`[data-tool-root="${tool}"]`);
  const y = scrollY;
  root.innerHTML = RENDERERS[tool](tool);
  REFRESH[tool]?.(root);
  scrollTo({ top: y });
}
const ACTIONS = {
  'suggest-priorities'(_b, tool) {
    const data = state.wb.diagnostico;
    const ranked = state.content.diagnostico_areas
      .map((a) => ({ ...a, score: data.areas[a.id]?.calificacion }))
      .filter((a) => Number.isInteger(a.score))
      .sort((a, b) => a.score - b.score);
    if (!ranked.length) return toast('Primero califica tus áreas del 1 al 5.', 'error');
    let i = 0;
    data.prioridades = data.prioridades.map((p) => {
      if (filled(p)) return p;
      const area = ranked[i++];
      return area ? `Mejorar ${area.nombre.toLowerCase()}${filled(data.areas[area.id]?.mejora) ? `: ${data.areas[area.id].mejora}` : ''}` : p;
    });
    scheduleSave(tool);
    rerender(tool);
  },
  'add-segment'(_b, tool) {
    const list = state.wb.cliente_ideal.segmentos;
    if (list.length >= 5) return toast('Puedes comparar hasta 5 segmentos.', 'error');
    list.push({ puntajes: {} });
    scheduleSave(tool);
    rerender(tool);
  },
  'remove-segment'(button, tool) {
    const index = Number(button.dataset.index);
    const data = state.wb.cliente_ideal;
    if (!confirm(`¿Quitar el segmento «${data.segmentos[index].nombre || index + 1}»?`)) return;
    data.segmentos.splice(index, 1);
    for (const key of ['principal', 'secundario']) {
      if (data[key] === index) data[key] = null;
      else if (Number.isInteger(data[key]) && data[key] > index) data[key] -= 1;
    }
    scheduleSave(tool);
    rerender(tool);
  },
  'add-package'(_b, tool) {
    state.wb.paquetes.paquetes.push({ nombre: `Paquete ${state.wb.paquetes.paquetes.length + 1}` });
    scheduleSave(tool);
    rerender(tool);
  },
  'duplicate-package'(button, tool) {
    const list = state.wb.paquetes.paquetes;
    const index = Number(button.dataset.index);
    list.splice(index + 1, 0, { ...structuredClone(list[index]), nombre: `${list[index].nombre || 'Paquete'} (copia)` });
    scheduleSave(tool);
    rerender(tool);
  },
  'remove-package'(button, tool) {
    const list = state.wb.paquetes.paquetes;
    const index = Number(button.dataset.index);
    if (!confirm(`¿Eliminar «${list[index].nombre || 'este paquete'}»? Se conserva una copia en tu historial.`)) return;
    list.splice(index, 1);
    scheduleSave(tool);
    rerender(tool);
  },
  'use-sentence'(_b, tool, root) {
    const data = state.wb.propuesta_valor;
    if (filled(data.version_final) && !confirm('¿Reemplazar tu versión final con la frase armada?')) return;
    data.version_final = sentence(data);
    root.querySelector('[data-path="version_final"]').value = data.version_final;
    scheduleSave(tool);
  },
  'add-lead'(_b, tool) {
    state.wb.ventas.prospectos.unshift({ id: uid(), estado: 'nuevo', fecha_seguimiento: '' });
    state.ventasFiltro = null;
    scheduleSave(tool);
    rerender(tool);
    view.querySelector('[data-tool-root="ventas"] .lead input')?.focus();
  },
  'remove-lead'(button, tool) {
    const list = state.wb.ventas.prospectos;
    const index = list.findIndex((p) => p.id === button.dataset.id);
    if (index < 0 || !confirm(`¿Eliminar a «${list[index].cliente || 'este prospecto'}»? Se conserva una copia en tu historial.`)) return;
    list.splice(index, 1);
    scheduleSave(tool);
    rerender(tool);
  },
  'filter-leads'(button, tool) {
    state.ventasFiltro = button.dataset.estado || null;
    rerender(tool);
  },
  'rev-week'(button, tool) {
    state.revSemana = Number(button.dataset.week);
    rerender(tool);
  },
  'delete-evidence': deleteEvidence,
};

// 1 · Diagnóstico
RENDERERS.diagnostico = (tool) => {
  const labels = ['Necesito trabajarla', '', '', '', 'Bien estructurada'];
  return `
    <div class="areas">
      ${state.content.diagnostico_areas.map((a) => {
        const score = state.wb[tool].areas[a.id]?.calificacion;
        return `<fieldset class="area card">
          <legend>${esc(a.nombre)}</legend>
          <div class="scale" role="radiogroup" aria-label="Calificación de ${attr(a.nombre)}">
            ${[1, 2, 3, 4, 5].map((n) => `<label class="scale__opt" title="${attr(labels[n - 1] || String(n))}">
              <input type="radio" name="diag-${a.id}" value="${n}" data-type="int" data-path="areas.${a.id}.calificacion" ${score === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}
          </div>
          ${field(tool, `areas.${a.id}.mejora`, 'Qué debo mejorar', { placeholder: 'Evidencia o comentario' })}
        </fieldset>`;
      }).join('')}
    </div>
    <p class="hint">1 = necesito trabajarla · 5 = está bien estructurada.</p>
    <section class="card pad summary" data-diag-summary></section>
    <section class="card pad">
      <div class="block__head"><h3>Mis tres prioridades</h3><button class="btn btn--ghost btn--small" type="button" data-action="suggest-priorities">Sugerir desde mis áreas más bajas</button></div>
      <div class="stack">${[0, 1, 2].map((i) => field(tool, `prioridades.${i}`, `Prioridad ${i + 1}`)).join('')}</div>
    </section>`;
};
REFRESH.diagnostico = (root) => {
  const data = state.wb.diagnostico;
  const areas = state.content.diagnostico_areas;
  const rated = areas.filter((a) => Number.isInteger(data.areas[a.id]?.calificacion));
  const avg = rated.length ? (rated.reduce((s, a) => s + data.areas[a.id].calificacion, 0) / rated.length).toFixed(1) : '—';
  root.querySelector('[data-diag-summary]').innerHTML = `
    <div class="block__head"><h3>Mi diagnóstico</h3><span class="hint">${rated.length} de ${areas.length} áreas calificadas · promedio ${avg}</span></div>
    <ul class="bars">${areas.map((a) => {
      const n = data.areas[a.id]?.calificacion;
      return `<li><span>${esc(a.nombre)}</span><span class="bars__track"><span class="bars__fill ${n && n <= 2 ? 'is-low' : ''}" style="width:${n ? n * 20 : 0}%"></span></span><b>${n || '—'}</b></li>`;
    }).join('')}</ul>`;
};

// 2 · Cliente ideal
RENDERERS.cliente_ideal = (tool) => {
  const data = state.wb[tool];
  const criteria = state.content.segmento_criterios;
  return `
    <div class="stack">
      ${data.segmentos.map((s, i) => `
        <article class="card pad segment">
          <div class="block__head"><h3>Segmento ${i + 1}${s.nombre ? ` · ${esc(s.nombre)}` : ''}</h3>
            ${data.segmentos.length > 1 ? `<button class="link-btn" type="button" data-action="remove-segment" data-index="${i}">Quitar</button>` : ''}</div>
          <div class="grid grid--2">
            ${field(tool, `segmentos.${i}.nombre`, '¿A quién quiero vender?', { placeholder: 'Ejemplo: dueños de SUV familiares' })}
            ${field(tool, `segmentos.${i}.tipo_cliente`, 'Tipo de cliente', { options: ['Particular', 'Flotilla', 'Agencia', 'Empresa', 'Distribuidor', 'Coleccionista'] })}
            ${field(tool, `segmentos.${i}.vehiculo`, '¿Qué tipo de vehículo tiene?')}
            ${field(tool, `segmentos.${i}.problema`, '¿Qué problema necesita resolver?')}
            ${field(tool, `segmentos.${i}.servicio`, '¿Qué servicio busca?')}
            ${field(tool, `segmentos.${i}.valora`, '¿Qué valora al elegir un negocio?')}
            ${field(tool, `segmentos.${i}.zona`, '¿Dónde puedo encontrarlo?')}
            ${field(tool, `segmentos.${i}.objecion`, 'Objeción más frecuente')}
          </div>
          <div class="matrix">
            <p class="label">Matriz · califica del 1 al 5</p>
            <div class="matrix__grid">${criteria.map((c) => field(tool, `segmentos.${i}.puntajes.${c.id}`, c.nombre, { options: ['1', '2', '3', '4', '5'] })).join('')}</div>
          </div>
        </article>`).join('')}
      <button class="btn btn--ghost" type="button" data-action="add-segment">+ Agregar segmento para comparar</button>
      <section class="card pad">
        <h3>Elige tus segmentos</h3>
        <p class="hint">El puntaje suma la matriz. Tú decides: márcalos como principal y secundario.</p>
        <div class="ranking">
          ${data.segmentos.map((s, i) => `
            <div class="ranking__row">
              <span class="ranking__name"><b data-seg-name="${i}">${esc(s.nombre || `Segmento ${i + 1}`)}</b><small data-seg-score="${i}"></small></span>
              <label class="pill"><input type="radio" name="principal" value="${i}" data-type="int" data-path="principal" ${data.principal === i ? 'checked' : ''}> Principal</label>
              <label class="pill"><input type="radio" name="secundario" value="${i}" data-type="int" data-path="secundario" ${data.secundario === i ? 'checked' : ''}> Secundario</label>
            </div>`).join('')}
        </div>
      </section>
    </div>`;
};
REFRESH.cliente_ideal = (root) => {
  const data = state.wb.cliente_ideal;
  const criteria = state.content.segmento_criterios;
  const totals = data.segmentos.map((s) => criteria.reduce((sum, c) => sum + (num(s.puntajes?.[c.id]) || 0), 0));
  const best = Math.max(...totals);
  totals.forEach((total, i) => {
    const el = root.querySelector(`[data-seg-score="${i}"]`);
    if (el) el.textContent = `${total} de ${criteria.length * 5} puntos${total && total === best ? ' · mejor puntaje' : ''}`;
    const name = root.querySelector(`[data-seg-name="${i}"]`);
    if (name) name.textContent = data.segmentos[i].nombre || `Segmento ${i + 1}`;
  });
};

// 3 · Paquetes y precios
RENDERERS.paquetes = (tool) => `
  <div class="stack">
    ${state.wb[tool].paquetes.map((p, i) => `
      <article class="card pad package">
        <div class="block__head">
          <h3 data-pkg-title="${i}">${esc(p.nombre || `Paquete ${i + 1}`)}</h3>
          <div class="row-actions">
            <button class="link-btn" type="button" data-action="duplicate-package" data-index="${i}">Duplicar</button>
            ${state.wb[tool].paquetes.length > 1 ? `<button class="link-btn link-btn--danger" type="button" data-action="remove-package" data-index="${i}">Eliminar</button>` : ''}
          </div>
        </div>
        <div class="grid grid--2">
          ${field(tool, `paquetes.${i}.nombre`, 'Nombre')}
          ${field(tool, `paquetes.${i}.cliente`, 'Cliente al que va dirigido')}
          ${field(tool, `paquetes.${i}.incluye`, 'Qué incluye', { area: true, rows: 2 })}
          ${field(tool, `paquetes.${i}.no_incluye`, 'Qué no incluye', { area: true, rows: 2 })}
          ${field(tool, `paquetes.${i}.tiempo`, 'Tiempo de servicio', { placeholder: 'Ejemplo: 3 horas' })}
          ${field(tool, `paquetes.${i}.beneficio`, 'Beneficio principal para el cliente')}
        </div>
        <div class="calc">
          <div class="calc__inputs">
            <p class="label">Costos de este paquete</p>
            <div class="grid grid--4">
              ${moneyField(tool, `paquetes.${i}.materiales`, 'Materiales y químicos')}
              ${moneyField(tool, `paquetes.${i}.mano_obra`, 'Mano de obra')}
              ${moneyField(tool, `paquetes.${i}.traslados`, 'Traslados')}
              ${moneyField(tool, `paquetes.${i}.otros`, 'Otros costos')}
            </div>
            <div class="grid grid--4">${moneyField(tool, `paquetes.${i}.precio`, 'Precio de venta')}</div>
          </div>
          <dl class="calc__out" data-calc="${i}"></dl>
        </div>
      </article>`).join('')}
    <button class="btn btn--ghost" type="button" data-action="add-package">+ Agregar paquete</button>
    <p class="hint">Utilidad = precio de venta − costo total. Margen (%) = utilidad ÷ precio de venta × 100. El margen bruto no equivale a utilidad neta: faltan costos indirectos, impuestos y comisiones.</p>
  </div>`;
REFRESH.paquetes = (root) => {
  state.wb.paquetes.paquetes.forEach((p, i) => {
    const n = packageNumbers(p);
    const out = root.querySelector(`[data-calc="${i}"]`);
    const title = root.querySelector(`[data-pkg-title="${i}"]`);
    if (title) title.textContent = p.nombre || `Paquete ${i + 1}`;
    if (!out) return;
    const marginClass = n.margen === null ? '' : n.margen < 0 ? 'is-neg' : n.margen < 30 ? 'is-low' : 'is-ok';
    out.innerHTML = `
      <div><dt>Costo total</dt><dd>${money(n.costo_total)}</dd></div>
      <div><dt>Utilidad estimada</dt><dd class="${n.utilidad !== null && n.utilidad < 0 ? 'is-neg' : ''}">${money(n.utilidad)}</dd></div>
      <div class="calc__margin ${marginClass}"><dt>Margen estimado</dt><dd>${n.margen === null ? '—' : `${n.margen}%`}</dd></div>`;
  });
};

// 4 · Propuesta de valor
const sentence = (d) => `Ayudo a ${d.tipo_cliente?.trim() || '________'} a conseguir ${d.resultado?.trim() || '________'} mediante ${d.servicio?.trim() || '________'}, diferenciándome por ${d.ventaja?.trim() || '________'}.`;
RENDERERS.propuesta_valor = (tool) => `
  <div class="card pad stack">
    <div class="grid grid--2">
      ${field(tool, 'tipo_cliente', 'Ayudo a… (tipo de cliente)', { placeholder: 'dueños de autos de lujo en Polanco' })}
      ${field(tool, 'resultado', 'A conseguir… (resultado)', { placeholder: 'una pintura protegida y como nueva' })}
      ${field(tool, 'servicio', 'Mediante… (servicio)', { placeholder: 'corrección de pintura y cerámico' })}
      ${field(tool, 'ventaja', 'Diferenciándome por… (ventaja demostrable)', { placeholder: 'servicio a domicilio con reporte fotográfico' })}
    </div>
    <blockquote class="sentence" data-sentence></blockquote>
    <button class="btn btn--ghost" type="button" data-action="use-sentence">Usar esta frase como versión final</button>
    ${field(tool, 'version_final', 'Mi versión final', { area: true, rows: 3, hint: 'Escríbela con tus palabras. Evita promesas que no puedas demostrar.' })}
  </div>`;
REFRESH.propuesta_valor = (root) => { root.querySelector('[data-sentence]').textContent = sentence(state.wb.propuesta_valor); };

// 5 · Manual de atención
RENDERERS.atencion = (tool) => `
  <p class="hint">Marca cada paso cuando tu negocio ya lo realice de forma consistente.</p>
  <div class="moments">
    ${state.content.atencion_momentos.map((m, i) => `
      <details class="moment card" ${i === 0 ? 'open' : ''}>
        <summary><span class="moment__num">${i + 1}</span><b>${esc(m.nombre)}</b><span class="moment__count" data-moment-count="${m.id}"></span></summary>
        <ul class="checks">${m.items.map((item) => `
          <li><label class="checkline"><input type="checkbox" data-path="checks.${item.id}" ${state.wb[tool].checks[item.id] ? 'checked' : ''}><span>${esc(item.texto)}</span></label></li>`).join('')}
        </ul>
      </details>`).join('')}
  </div>
  <div class="card pad grid grid--2">
    ${field(tool, 'responsable', 'Responsable del protocolo')}
    ${field(tool, 'observaciones', 'Observaciones / ajustes necesarios', { area: true, rows: 2 })}
  </div>
  ${evidenceBlock(tool, 'Fotos de tu protocolo (opcional)')}`;
REFRESH.atencion = (root) => {
  const checks = state.wb.atencion.checks;
  state.content.atencion_momentos.forEach((m) => {
    const done = m.items.filter((i) => checks[i.id]).length;
    const el = root.querySelector(`[data-moment-count="${m.id}"]`);
    if (el) { el.textContent = `${done}/${m.items.length}`; el.classList.toggle('is-done', done === m.items.length); }
  });
};

// 6 · Sistema de ventas
RENDERERS.ventas = (tool) => {
  const data = state.wb[tool];
  const states = state.content.embudo_estados;
  const visible = data.prospectos.filter((p) => !state.ventasFiltro || p.estado === state.ventasFiltro);
  return `
    <section class="card pad">
      <div class="block__head"><h3>Mi embudo</h3><button class="btn btn--small" type="button" data-action="add-lead">+ Nuevo prospecto</button></div>
      <div class="funnel" data-funnel></div>
      <div class="due" data-due></div>
    </section>
    <div class="stack leads">
      ${visible.length ? visible.map((p) => {
        const i = data.prospectos.indexOf(p);
        return `<article class="card pad lead">
          <div class="grid grid--3">
            ${field(tool, `prospectos.${i}.cliente`, 'Cliente')}
            ${field(tool, `prospectos.${i}.vehiculo`, 'Vehículo', { placeholder: 'Marca, modelo y año' })}
            ${field(tool, `prospectos.${i}.servicio`, 'Servicio solicitado')}
            ${moneyField(tool, `prospectos.${i}.importe`, 'Importe cotizado')}
            ${field(tool, `prospectos.${i}.estado`, 'Estado', { options: states.map((s) => [s.id, s.nombre]) })}
            ${field(tool, `prospectos.${i}.fecha_seguimiento`, 'Fecha de seguimiento', { type: 'date' })}
            ${field(tool, `prospectos.${i}.proxima_accion`, 'Próxima acción', { wide: true })}
          </div>
          <div class="row-actions row-actions--end"><button class="link-btn link-btn--danger" type="button" data-action="remove-lead" data-id="${attr(p.id)}">Eliminar</button></div>
        </article>`;
      }).join('') : `<p class="empty card pad">${data.prospectos.length ? 'No hay prospectos en este estado.' : 'Registra tu primer prospecto con el botón «Nuevo prospecto».'}</p>`}
    </div>
    <section class="card pad">
      <h3>Mis guiones</h3>
      <div class="grid grid--2">
        ${field(tool, 'guiones.primer_contacto', 'Mi guion de primer contacto', { area: true })}
        ${field(tool, 'guiones.preguntas', 'Mis preguntas de diagnóstico', { area: true })}
        ${field(tool, 'guiones.seguimiento', 'Mi mensaje de seguimiento', { area: true })}
        ${field(tool, 'guiones.objecion', 'Mi respuesta a la objeción más común', { area: true })}
      </div>
    </section>`;
};
REFRESH.ventas = (root) => {
  const data = state.wb.ventas;
  const leads = data.prospectos;
  const funnel = root.querySelector('[data-funnel]');
  funnel.innerHTML = `<button type="button" class="chip ${!state.ventasFiltro ? 'is-active' : ''}" data-action="filter-leads" data-estado="">Todos <b>${leads.length}</b></button>` +
    state.content.embudo_estados.map((s) => {
      const count = leads.filter((p) => p.estado === s.id).length;
      return `<button type="button" class="chip ${state.ventasFiltro === s.id ? 'is-active' : ''} ${count ? '' : 'is-empty'}" data-action="filter-leads" data-estado="${s.id}">${esc(s.nombre)} <b>${count}</b></button>`;
    }).join('');
  const closed = new Set(['venta', 'entregado', 'posventa']);
  const due = leads.filter((p) => p.fecha_seguimiento && p.fecha_seguimiento <= today() && !closed.has(p.estado));
  const total = leads.filter((p) => p.estado === 'cotizacion' || p.estado === 'seguimiento').reduce((s, p) => s + (num(p.importe) || 0), 0);
  root.querySelector('[data-due]').innerHTML = `
    ${due.length ? `<p class="due__alert">⏰ ${due.length} seguimiento${due.length > 1 ? 's' : ''} para hoy o atrasado${due.length > 1 ? 's' : ''}: ${due.map((p) => esc(p.cliente || 'sin nombre')).join(', ')}</p>` : ''}
    ${total ? `<p class="hint">Cotizaciones abiertas: ${money(total)}</p>` : ''}`;
};

// 7 · Plan de marketing
RENDERERS.marketing = (tool) => `
  <div class="mix" data-mix></div>
  <datalist id="formatos">${FORMATS.map((f) => `<option value="${f}">`).join('')}</datalist>
  <div class="days">
    ${state.wb[tool].dias.map((d, i) => `
      <article class="card pad day">
        <div class="day__head"><span class="day__num">Día ${d.dia}</span>${field(tool, `dias.${i}.estado`, 'Estado', { options: state.content.marketing_estados, cls: 'field--inline' })}</div>
        ${field(tool, `dias.${i}.tema`, 'Tema / idea')}
        <div class="grid grid--2">
          ${field(tool, `dias.${i}.categoria`, 'Categoría', { options: state.content.marketing_categorias })}
          ${field(tool, `dias.${i}.formato`, 'Formato', { list: 'formatos', placeholder: 'Reel, carrusel…' })}
        </div>
        ${field(tool, `dias.${i}.objetivo`, 'Objetivo')}
        ${field(tool, `dias.${i}.cta`, 'Llamado a la acción', { placeholder: 'Ejemplo: escríbeme por WhatsApp' })}
      </article>`).join('')}
  </div>
  ${evidenceBlock(tool, 'Capturas de tus publicaciones')}`;
REFRESH.marketing = (root) => {
  const days = state.wb.marketing.dias;
  const published = days.filter((d) => d.estado === state.content.marketing_estados.at(-1)).length;
  root.querySelector('[data-mix]').innerHTML = `
    <span class="hint">Mezcla de la semana:</span>
    ${state.content.marketing_categorias.map((c) => `<span class="chip ${days.some((d) => d.categoria === c) ? 'is-active' : 'is-empty'}">${esc(c)} <b>${days.filter((d) => d.categoria === c).length}</b></span>`).join('')}
    <span class="hint">· ${published} de 7 publicados</span>`;
};

// 8 · Plan de 30 días
RENDERERS.plan30 = (tool) => `
  <section class="card pad plan-total" data-plan-total></section>
  <div class="weeks">
    ${state.content.plan30.map((w) => `
      <details class="week card" ${w.tareas.some((t) => state.wb[tool].tareas[t.id]?.estado !== 'hecho') && w.semana === firstOpenWeek() ? 'open' : ''}>
        <summary><span class="week__num">Semana ${w.semana}</span><b>${esc(w.titulo)}</b><span class="week__count" data-week-count="${w.semana}"></span></summary>
        <div class="progress progress--thin"><span data-week-bar="${w.semana}"></span></div>
        <ul class="tasks">
          ${w.tareas.map((t) => {
            const current = state.wb[tool].tareas[t.id]?.estado || 'pendiente';
            return `<li class="task" data-task="${t.id}">
              <div class="task__head"><span class="task__day">Día ${t.dia}</span><p>${esc(t.accion)}</p></div>
              <div class="segmented" role="radiogroup" aria-label="Estado de la tarea del día ${t.dia}">
                ${PLAN_STATES.map(([v, l]) => `<label><input type="radio" name="task-${t.id}" value="${v}" data-path="tareas.${t.id}.estado" ${current === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
              </div>
              <div class="grid grid--2">
                ${field(tool, `tareas.${t.id}.evidencia`, 'Evidencia (enlace o descripción)', { placeholder: 'Pega el enlace o describe la prueba' })}
                ${field(tool, `tareas.${t.id}.observaciones`, 'Observaciones')}
              </div>
            </li>`;
          }).join('')}
        </ul>
      </details>`).join('')}
  </div>
  ${evidenceBlock(tool, 'Fotos y archivos de evidencia')}`;
function firstOpenWeek() {
  const tareas = state.wb.plan30?.tareas || {};
  return state.content.plan30.find((w) => w.tareas.some((t) => tareas[t.id]?.estado !== 'hecho'))?.semana;
}
REFRESH.plan30 = (root) => {
  const tareas = state.wb.plan30.tareas;
  let done = 0; let total = 0;
  state.content.plan30.forEach((w) => {
    const d = w.tareas.filter((t) => tareas[t.id]?.estado === 'hecho').length;
    done += d; total += w.tareas.length;
    const count = root.querySelector(`[data-week-count="${w.semana}"]`);
    if (count) { count.textContent = `${d}/${w.tareas.length}`; count.classList.toggle('is-done', d === w.tareas.length); }
    const bar = root.querySelector(`[data-week-bar="${w.semana}"]`);
    if (bar) bar.style.width = `${(d / w.tareas.length) * 100}%`;
    w.tareas.forEach((t) => root.querySelector(`[data-task="${t.id}"]`)?.classList.toggle('is-done', tareas[t.id]?.estado === 'hecho'));
  });
  const pct = total ? Math.round((done / total) * 100) : 0;
  root.querySelector('[data-plan-total]').innerHTML = `
    <div class="block__head"><h3>Avance del plan</h3><b class="big">${done} de ${total} tareas</b></div>
    <div class="progress"><span style="width:${pct}%"></span></div>`;
};

// 9 · Revisión semanal e indicadores
RENDERERS.revision = (tool) => {
  const weeks = state.wb[tool].semanas;
  const i = state.revSemana;
  const prev = i > 0 ? weeks[i - 1] : null;
  return `
    <div class="tabs" role="tablist" aria-label="Semana">
      ${weeks.map((w, n) => `<button class="tab ${n === i ? 'is-active' : ''}" type="button" role="tab" aria-selected="${n === i}" data-action="rev-week" data-week="${n}">Semana ${n + 1}${filled(w.respuestas) ? ' ✓' : ''}</button>`).join('')}
    </div>
    <section class="card pad stack">
      <h3>Revisión · semana ${i + 1}</h3>
      ${state.content.revision_preguntas.map((q) => field(tool, `semanas.${i}.respuestas.${q.id}`, q.texto, { area: true, rows: 2 })).join('')}
    </section>
    <section class="card pad">
      <h3>Indicadores del negocio · semana ${i + 1}</h3>
      <div class="grid grid--4 indicators">
        ${state.content.indicadores.map((ind) => {
          const before = prev?.indicadores?.[ind.id];
          return field(tool, `semanas.${i}.indicadores.${ind.id}`, ind.nombre, {
            inputmode: 'decimal', placeholder: ind.tipo === 'dinero' ? '$0' : '0',
            hint: filled(before) ? `Semana anterior: ${ind.tipo === 'dinero' ? money(num(before)) : before}` : '',
          });
        }).join('')}
      </div>
    </section>
    ${evidenceBlock(tool, 'Evidencias de tu semana')}`;
};

// 10 · Cierre
RENDERERS.cierre = (tool) => `
  <div class="card pad stack">
    ${field(tool, 'mayor_avance', 'Mi mayor avance', { area: true, rows: 2 })}
    ${field(tool, 'cambio', 'El cambio que más impacto tuvo', { area: true, rows: 2 })}
    ${field(tool, 'indicador', 'El indicador que mejoró')}
    ${field(tool, 'objetivo_90', 'Mi siguiente objetivo a 90 días', { area: true, rows: 2 })}
    ${field(tool, 'fecha_revision', 'Fecha de revisión', { type: 'date' })}
  </div>
  <p class="philosophy">${esc(state.content.textos.filosofia)}</p>`;

// ── evidencias y fotografías ──────────────────────────────────────────
function evidenceBlock(tool, title) {
  return `<section class="card pad evidence" data-evidence="${tool}">
    <div class="block__head"><h3>${esc(title)}</h3><span class="hint">JPG, PNG, WEBP o PDF · máx. 8 MB</span></div>
    <form class="evidence__form" data-evidence-form="${tool}">
      <label class="field"><span>Archivo</span><input class="input" type="file" name="archivo" accept="image/jpeg,image/png,image/webp,application/pdf" required></label>
      <label class="field"><span>Nota (opcional)</span><input class="input" name="nota" maxlength="500" placeholder="Ejemplo: antes y después del pulido"></label>
      <button class="btn btn--dark" type="submit">Subir evidencia</button>
    </form>
    <ul class="gallery" data-gallery="${tool}">${galleryItems(tool)}</ul>
  </section>`;
}
function galleryItems(tool) {
  const items = state.evidencias.filter((e) => e.herramienta === tool);
  if (!items.length) return '<li class="hint">Aún no subes evidencias aquí.</li>';
  return items.map((e) => {
    const url = `/api/evidencias/${e.id}/archivo`;
    const isPdf = e.mime === 'application/pdf';
    return `<li class="gallery__item">
      <a href="${url}" target="_blank" rel="noopener" class="gallery__thumb">${isPdf ? '<span class="gallery__pdf">PDF</span>' : `<img src="${url}" alt="${attr(e.nota || e.nombre)}" loading="lazy">`}</a>
      <div class="gallery__meta"><b>${esc(e.nota || e.nombre)}</b><small>${new Date(e.creada).toLocaleDateString('es-MX')}</small></div>
      <button class="link-btn link-btn--danger" type="button" data-action="delete-evidence" data-id="${e.id}" aria-label="Eliminar evidencia ${attr(e.nombre)}">Eliminar</button>
    </li>`;
  }).join('');
}
function refreshGalleries() {
  document.querySelectorAll('[data-gallery]').forEach((el) => { el.innerHTML = galleryItems(el.dataset.gallery); });
}
view.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-evidence-form]');
  if (!form) return;
  event.preventDefault();
  const file = form.archivo.files[0];
  if (!file) return toast('Elige una foto o un PDF.', 'error');
  if (file.size > 8 * 1024 * 1024) return toast('El archivo supera 8 MB.', 'error');
  const body = new FormData();
  body.append('archivo', file);
  body.append('herramienta', form.dataset.evidenceForm);
  body.append('nota', form.nota.value.trim());
  const button = form.querySelector('button');
  button.disabled = true;
  button.textContent = 'Subiendo…';
  try {
    const data = await api('/api/evidencias', { method: 'POST', form: body });
    state.evidencias = data.evidencias;
    form.reset();
    refreshGalleries();
    toast('Evidencia guardada.');
  } catch (error) {
    handleError(error);
  } finally {
    button.disabled = false;
    button.textContent = 'Subir evidencia';
  }
});
async function deleteEvidence(button) {
  if (!confirm('¿Eliminar esta evidencia?')) return;
  try {
    const data = await api(`/api/evidencias/${button.dataset.id}`, { method: 'DELETE' });
    state.evidencias = data.evidencias;
    refreshGalleries();
  } catch (error) {
    handleError(error);
  }
}

// ── Copiloto PAD (Hermes) ─────────────────────────────────────────────
const dialog = document.querySelector('.copilot');
const chatBox = dialog.querySelector('[data-copilot-messages]');
const chatForm = dialog.querySelector('[data-copilot-form]');
const chatInput = dialog.querySelector('#copilot-input');
let lastFocus = null;

// Render seguro: escapa todo y solo después aplica un markdown mínimo.
function inline(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
}
function renderMarkdown(text) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const out = [];
  let list = null; let para = []; let table = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`); list = null; } };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !/^[|:\-\s]+$/.test(r)); // quita la fila separadora |---|---|
    out.push(`<div class="md-table">${rows.map((r) => `<p>${r.replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim())).filter(Boolean).join(' · ')}</p>`).join('')}</div>`);
    table = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (/^\|.*\|$/.test(trimmed)) { flushPara(); flushList(); table.push(trimmed); continue; }
    flushTable();
    const heading = trimmed.match(/^#{1,4}\s+(.*)$/);
    const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (!trimmed) { flushPara(); flushList(); continue; }
    if (heading) { flushPara(); flushList(); out.push(`<h4>${inline(heading[1])}</h4>`); continue; }
    if (bullet || ordered) {
      flushPara();
      const type = bullet ? 'ul' : 'ol';
      if (list && list.type !== type) flushList();
      list ||= { type, items: [] };
      list.items.push((bullet || ordered)[1]);
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flushTable(); flushPara(); flushList();
  return out.join('');
}

function welcomeMessage() {
  const nombre = (state.user.nombre || '').split(' ')[0];
  return `### ¡Bienvenido${nombre ? `, ${nombre}` : ''}!
Soy tu **Copiloto PAD**. Trabajo con lo que registras en tu workbook: tu diagnóstico, tu cliente ideal, tus paquetes y tus avances.
- Uso tus datos guardados, así que no te pregunto lo que ya escribiste.
- Separo los hechos de las hipótesis y no invento costos ni resultados.
- Tú decides: yo propongo y tú validas.

**Para empezar:** completa tu **Diagnóstico de mi negocio** en PREPARA y después pídeme «Diagnosticar mi negocio».`;
}

function renderChat() {
  const c = state.chat;
  const status = dialog.querySelector('[data-copilot-status]');
  status.textContent = c.conectado === null ? 'Comprobando conexión…' : c.conectado ? '● Conectado a Hermes' : '● No conectado';
  status.dataset.state = c.conectado === null ? 'pending' : c.conectado ? 'on' : 'off';
  const parts = [];
  if (c.welcome) parts.push(`<div class="msg msg--assistant msg--local"><span class="msg__who">Bienvenida</span>${renderMarkdown(welcomeMessage())}</div>`);
  if (!c.mensajes.length && !c.welcome && !c.loading) {
    parts.push(`<div class="chat-empty"><b>¿En qué te ayudo?</b><p>Elige un acceso de trabajo o escribe tu pregunta. El copiloto ya conoce lo que guardaste en tu workbook.</p></div>`);
  }
  for (const m of c.mensajes) {
    parts.push(m.rol === 'user'
      ? `<div class="msg msg--user"><span class="msg__who">Tú</span><p>${inline(m.texto)}</p></div>`
      : `<div class="msg msg--assistant"><span class="msg__who">Copiloto PAD</span>${renderMarkdown(m.texto)}</div>`);
  }
  if (c.loading) parts.push(`<div class="msg msg--assistant msg--thinking" role="status"><span class="msg__who">Copiloto PAD</span><p><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span> Pensando con el contexto de tu negocio… puede tardar hasta un minuto.</p></div>`);
  if (c.error) {
    parts.push(`<div class="msg msg--error" role="alert"><p><b>${esc(c.error.message)}</b></p>
      ${c.error.prompt ? `<p>Mientras tanto, puedes copiar tu consulta con tu información y usarla en otra herramienta de IA.</p>
      <button class="btn btn--small" type="button" data-copy-prompt>Copiar prompt con mi información</button>` : ''}</div>`);
  }
  chatBox.innerHTML = parts.join('');
  chatBox.scrollTop = chatBox.scrollHeight;
  dialog.querySelectorAll('[data-copilot-shortcuts] button, [data-copilot-form] button, #copilot-input').forEach((el) => { el.disabled = c.loading; });
}

function renderShortcuts() {
  dialog.querySelector('[data-copilot-shortcuts]').innerHTML = state.content.copiloto_accesos
    .map((a, i) => `<button class="chip chip--action" type="button" data-shortcut="${attr(a.id)}"><b>${i + 1}</b> ${esc(a.titulo)}</button>`).join('');
  dialog.querySelector('[data-copilot-aviso]').textContent = state.content.textos.aviso_ia;
}

async function loadChat() {
  try {
    const data = await api('/api/copiloto');
    state.chat.conectado = data.conectado;
    state.chat.mensajes = data.mensajes;
    state.chat.loaded = true;
  } catch (error) {
    state.chat.conectado = false;
    handleError(error);
  }
  renderChat();
}

function openCopilot(trigger) {
  lastFocus = trigger || document.activeElement;
  // Chrome devuelve el foco al elemento enfocado antes de showModal: que sea quien abrió.
  if (lastFocus && lastFocus !== document.activeElement && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('copilot-open');
  renderChat();
  if (!state.chat.loaded) loadChat();
  setTimeout(() => chatInput.focus(), 30);
}
function closeCopilot() {
  if (dialog.open) dialog.close();
}
dialog.addEventListener('close', () => {
  document.body.classList.remove('copilot-open');
  state.chat.welcome = false;
  if (lastFocus && document.contains(lastFocus)) setTimeout(() => lastFocus.focus({ preventScroll: true }), 0);
});
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeCopilot(); });
dialog.querySelector('[data-copilot-close]').addEventListener('click', closeCopilot);
document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-copilot-open]');
  if (opener) openCopilot(opener);
});

async function ask(payload) {
  if (state.chat.loading) return;
  flushAll();
  state.chat.loading = true;
  state.chat.error = null;
  state.chat.welcome = false;
  renderChat();
  try {
    const data = await api('/api/copiloto', { method: 'POST', json: payload });
    state.chat.mensajes = data.mensajes;
    state.chat.conectado = true;
    chatInput.value = '';
  } catch (error) {
    if (error.status === 401) return handleError(error);
    if (error.status === 503) state.chat.conectado = false;
    state.chat.error = { message: error.message, prompt: error.data?.prompt_con_contexto || null };
  } finally {
    state.chat.loading = false;
    renderChat();
    if (dialog.open) chatInput.focus();
  }
}
chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const mensaje = chatInput.value.trim();
  if (mensaje) ask({ mensaje });
});
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); chatForm.requestSubmit(); }
});
dialog.addEventListener('click', async (event) => {
  const shortcut = event.target.closest('[data-shortcut]');
  if (shortcut) return ask({ acceso: shortcut.dataset.shortcut });
  const copyButton = event.target.closest('[data-copy-prompt]');
  if (copyButton) {
    const text = state.chat.error?.prompt || '';
    try {
      await navigator.clipboard.writeText(text);
      // Los toasts quedan debajo del diálogo modal: confirmar en el propio botón.
      copyButton.textContent = 'Copiado ✓ · pégalo en tu herramienta de IA';
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.className = 'textarea copy-fallback';
      area.setAttribute('aria-label', 'Prompt con tu información; cópialo manualmente');
      event.target.closest('.msg').append(area);
      area.select();
    }
  }
});
dialog.querySelector('[data-copilot-clear]').addEventListener('click', async () => {
  if (!state.chat.mensajes.length || !confirm('¿Borrar toda la conversación con el copiloto?')) return;
  try {
    const data = await api('/api/copiloto', { method: 'DELETE' });
    state.chat.mensajes = data.mensajes;
    state.chat.error = null;
    renderChat();
  } catch (error) {
    handleError(error);
  }
});

// ── arranque ──────────────────────────────────────────────────────────
document.querySelector('[data-logout]').addEventListener('click', () => { flushAll(); logout(); });

async function start() {
  try {
    const user = await session();
    if (!user) { location.href = `/entrar/?siguiente=${encodeURIComponent('/app/' + location.hash)}`; return; }
    if (user.cambiar_password) { location.href = '/entrar/'; return; }
    state.user = user;
    if (user.rol === 'admin') document.querySelector('[data-admin-link]').hidden = false;
    const [content, wb, ev] = await Promise.all([api('/api/contenido'), api('/api/workbook'), api('/api/evidencias')]);
    state.content = content;
    state.wb = wb.workbook || {};
    state.progreso = wb.progreso;
    state.evidencias = ev.evidencias;
    renderShortcuts();
    renderChrome();
    route();
    addEventListener('hashchange', route);
    const params = new URLSearchParams(location.search);
    if (params.get('bienvenida') === '1') {
      history.replaceState(null, '', location.pathname + location.hash);
      state.chat.welcome = true;
      openCopilot(document.querySelector('.copilot-launcher'));
    }
  } catch (error) {
    view.innerHTML = `<div class="card pad"><h1>No pudimos cargar tu workbook</h1><p>${esc(error.message)}</p><button class="btn" type="button" data-reload>Reintentar</button></div>`;
    view.querySelector('[data-reload]')?.addEventListener('click', () => location.reload());
    handleError(error);
  }
}
start();
