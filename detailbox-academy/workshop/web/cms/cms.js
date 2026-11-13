// CMS del Workshop PAD · Detailbox Academy. Sin frameworks: hash-routing + <dialog> nativo.
import { api, session, logout, escapeHtml as h, money, toast } from '/assets/api.js';

const main = document.getElementById('vista');
const nav = document.getElementById('cms-nav');
const dialog = document.getElementById('dialogo');
const projection = document.getElementById('proyeccion');

const state = { seq: 0, user: null, talleres: null, usuarios: null, contenido: null, meta: null, block: 'textos', drafts: {} };

const STAGES = { P: 'Prepara', A: 'Apunta', D: 'Dispara' };
const STATUS = { no_iniciado: 'No iniciado', en_proceso: 'En proceso', completado: 'Completado' };
const ORIGIN = { qr: 'Código QR', cms: 'CMS', cli: 'Consola' };
const BLOCKS = {
  textos: ['Textos generales', 'Bienvenida, filosofía, avisos y nombres de las etapas.'],
  herramientas: ['Herramientas', 'Título, objetivo, pasos (máximo 3) y resultado de cada herramienta.'],
  diagnostico_areas: ['Áreas del diagnóstico', 'Áreas que el alumno califica del 1 al 5.'],
  segmento_criterios: ['Criterios de segmentos', 'Criterios de la matriz para comparar segmentos de clientes.'],
  paquetes_base: ['Paquetes base', 'Nombres de los paquetes con los que arranca el constructor.'],
  atencion_momentos: ['Manual de atención', 'Momentos de atención y pasos que el alumno marca.'],
  embudo_estados: ['Embudo de ventas', 'Estados por los que pasa cada prospecto.'],
  marketing_categorias: ['Categorías de marketing', 'Categorías del calendario de 7 días.'],
  marketing_estados: ['Estados de publicación', 'Estados de cada publicación del calendario.'],
  plan30: ['Plan de 30 días', 'Semanas y tareas del tablero de implementación.'],
  revision_preguntas: ['Revisión semanal', 'Preguntas de la revisión de cada semana.'],
  indicadores: ['Indicadores', 'Indicadores que el alumno registra cada semana.'],
  copiloto_accesos: ['Accesos del Copiloto PAD', 'Los cinco accesos rápidos y el prompt que envía cada uno.'],
};
const TEXT_LABELS = { bienvenida: 'Bienvenida', filosofia: 'Filosofía del producto', aviso_ia: 'Aviso de IA', aviso_privacidad: 'Aviso de privacidad (registro por QR)' };
const ACTIONS = {
  registro_qr: 'Se registró con el código QR', usuario_creado: 'Creó un usuario', usuario_editado: 'Editó un usuario',
  password_restablecida: 'Restableció una contraseña', password_cambiada: 'Cambió su contraseña', taller_creado: 'Creó un taller',
  taller_editado: 'Editó un taller', codigo_regenerado: 'Regeneró el código QR de un taller', contenido_editado: 'Editó contenido',
  contenido_restaurado: 'Restauró contenido original',
};
const FIELD_NAMES = { nombre: 'nombre', email: 'correo', negocio: 'negocio', taller_id: 'taller', rol: 'rol', activo: 'estado', fecha: 'fecha', sede: 'sede', registro_abierto: 'registro' };

// ── utilidades ─────────────────────────────────────────────────────────
const clone = (value) => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function fmtDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtDate(value) {
  if (!value) return 'Sin fecha';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return new Date(+match[1], +match[2] - 1, +match[3]).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copiado al portapapeles.');
  } catch {
    const area = el('<textarea class="sr-only"></textarea>');
    area.value = text;
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    toast(ok ? 'Copiado al portapapeles.' : 'No se pudo copiar. Selecciona el texto y cópialo manualmente.', ok ? 'ok' : 'error');
  }
}

function slug(value) {
  return String(value || 'item').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item';
}

function newId(prefix, taken) {
  let id;
  do { id = `${slug(prefix)}-${Math.random().toString(36).slice(2, 6)}`; } while (taken.has(id));
  taken.add(id);
  return id;
}

function packageNumbers(pkg) {
  const num = (v) => {
    if (v === null || v === undefined || String(v).trim() === '') return null;
    const n = Number(String(v).replace(/[,$\s]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const parts = ['materiales', 'mano_obra', 'traslados', 'otros'].map((k) => num(pkg[k])).filter((v) => v !== null);
  const cost = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) * 100) / 100 : null;
  const price = num(pkg.precio);
  const profit = price !== null && cost !== null ? Math.round((price - cost) * 100) / 100 : null;
  const margin = profit !== null && price ? Math.round((profit / price) * 1000) / 10 : null;
  return { cost, price, profit, margin };
}

function errorBox(message) {
  return `<div class="notice notice--danger form-error" role="alert">${h(message)}</div>`;
}

// ── diálogos ───────────────────────────────────────────────────────────
let opener = null;
dialog.addEventListener('close', () => {
  // El evento llega en otra tarea: si ya se abrió otro diálogo, no tocar su contenido.
  if (dialog.open) return;
  dialog.innerHTML = '';
  dialog.className = 'cms-dialog';
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
});
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

function openDialog({ title, body, foot = '', wide = false }) {
  if (dialog.open) dialog.close();
  opener = document.activeElement;
  dialog.className = `cms-dialog${wide ? ' cms-dialog--wide' : ''}`;
  dialog.innerHTML = `
    <div class="dialog__head"><h2 id="dialogo-titulo">${h(title)}</h2>
      <button class="icon-btn" type="button" data-close aria-label="Cerrar">✕</button></div>
    <div class="dialog__body">${body}</div>
    ${foot ? `<div class="dialog__foot">${foot}</div>` : ''}`;
  dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  dialog.showModal();
  const focusTarget = dialog.querySelector('[autofocus], .dialog__body input, .dialog__body select, .dialog__body textarea') || dialog.querySelector('[data-close]');
  focusTarget?.focus();
  return dialog;
}

function confirmDialog(message, { title = 'Confirmar', confirm = 'Confirmar', danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    openDialog({
      title,
      body: `<p>${message}</p>`,
      foot: `<button class="btn btn--ghost" type="button" data-close>Cancelar</button>
             <button class="btn ${danger ? 'btn--danger' : ''}" type="button" data-ok autofocus>${h(confirm)}</button>`,
    });
    dialog.querySelector('[data-ok]').addEventListener('click', () => { answered = true; dialog.close(); resolve(true); });
    const onClose = () => {
      if (dialog.open) return; // cierre tardío de un diálogo anterior
      dialog.removeEventListener('close', onClose);
      if (!answered) resolve(false);
    };
    dialog.addEventListener('close', onClose);
  });
}

function showSecret(title, email, password) {
  openDialog({
    title,
    body: `
      <p>Contraseña temporal para <b>${h(email)}</b>:</p>
      <div class="secret"><input class="input" readonly value="${h(password)}" aria-label="Contraseña temporal">
        <button class="btn btn--ghost" type="button" data-copy>Copiar</button></div>
      <div class="notice notice--warn">Se muestra <b>una sola vez</b>. Entrégala en persona o por un canal privado. Al entrar, el usuario deberá cambiarla.</div>`,
    foot: '<button class="btn" type="button" data-close>Listo, ya la guardé</button>',
  });
  dialog.querySelector('[data-copy]').addEventListener('click', () => copy(password));
  dialog.querySelector('.secret .input').select();
}

// ── datos compartidos ──────────────────────────────────────────────────
async function loadTalleres(force = false) {
  if (!state.talleres || force) state.talleres = (await api('/api/cms/talleres')).talleres;
  return state.talleres;
}
async function loadUsuarios(force = false) {
  if (!state.usuarios || force) state.usuarios = (await api('/api/cms/usuarios')).usuarios;
  return state.usuarios;
}
async function loadContenido(force = false) {
  if (!state.contenido || force) {
    const data = await api('/api/cms/contenido');
    state.contenido = data.contenido;
    state.meta = data.meta;
  }
  return state.contenido;
}

// ── router ─────────────────────────────────────────────────────────────
const SECTIONS = { resumen: renderResumen, talleres: renderTalleres, usuarios: renderUsuarios, contenido: renderContenido, actividad: renderActividad };

async function route() {
  const section = SECTIONS[location.hash.slice(1)] ? location.hash.slice(1) : 'resumen';
  if (state.leaveGuard && section !== state.current && !(await state.leaveGuard(section))) {
    history.replaceState(null, '', `#${state.current}`);
    return;
  }
  state.leaveGuard = null;
  state.current = section;
  const seq = ++state.seq; // una respuesta tardía de otra sección no debe pintar encima
  nav.querySelectorAll('a').forEach((a) => {
    if (a.dataset.section === section) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  main.innerHTML = '<p class="cms-loading" role="status">Cargando…</p>';
  try {
    await SECTIONS[section](seq);
  } catch (error) {
    if (seq !== state.seq) return;
    if (error.status === 401) { location.href = '/entrar/?siguiente=/cms/'; return; }
    main.innerHTML = `<div class="card empty" role="alert"><strong>No se pudo cargar esta sección</strong>${h(error.message)}
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn btn--ghost" type="button" data-retry>Reintentar</button></div></div>`;
    main.querySelector('[data-retry]').addEventListener('click', route);
  }
  if (seq !== state.seq) return;
  const heading = main.querySelector('h1');
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  document.title = `${heading?.textContent || 'CMS'} · CMS Workshop PAD`;
}

// ── 1. Resumen ─────────────────────────────────────────────────────────
const stale = (seq) => seq !== undefined && seq !== state.seq;

async function renderResumen(seq) {
  const data = await api('/api/cms/resumen');
  if (stale(seq)) return;
  main.innerHTML = `
    <div class="page-head"><div><h1>Resumen</h1><p>Estado general del Workshop PAD.</p></div></div>
    <div class="stats">
      <div class="card stat"><small>Alumnos registrados</small><b>${data.alumnos}</b></div>
      <div class="card stat"><small>Alumnos activos</small><b>${data.activos}</b></div>
      <div class="card stat"><small>Avance promedio</small><b>${data.promedio}%</b>
        <div class="progress" role="progressbar" aria-label="Avance promedio" aria-valuenow="${data.promedio}" aria-valuemin="0" aria-valuemax="100"><span style="width:${data.promedio}%"></span></div></div>
      <div class="card stat"><small>Talleres</small><b>${data.talleres}</b></div>
      <div class="card stat stat--status"><small>Copiloto PAD (Hermes)</small>
        <b><span class="dot ${data.copiloto ? 'dot--on' : 'dot--off'}" aria-hidden="true"></span>${data.copiloto ? 'Conectado' : 'No conectado'}</b>
        ${data.copiloto ? '' : '<p class="hint" style="margin-top:8px">Los alumnos ven la alternativa de copiar su prompt con contexto.</p>'}</div>
    </div>
    <h2 class="section-title">Accesos rápidos</h2>
    <div class="quick">
      <div class="card"><b>Registrar alumnos con QR</b><p class="muted">Crea un taller y proyecta su código en el aula.</p>
        <a class="btn" href="#talleres">Ir a talleres</a></div>
      <div class="card"><b>Revisar avances</b><p class="muted">Consulta el workbook de cada alumno en solo lectura.</p>
        <a class="btn btn--ghost" href="#usuarios">Ver usuarios</a></div>
      <div class="card"><b>Ajustar el contenido</b><p class="muted">Instrucciones, plan de 30 días y prompts del copiloto.</p>
        <a class="btn btn--ghost" href="#contenido">Editar contenido</a></div>
    </div>`;
}

// ── 2. Talleres y QR ───────────────────────────────────────────────────
async function renderTalleres(seq) {
  const talleres = await loadTalleres(true);
  if (stale(seq)) return;
  main.innerHTML = `
    <div class="page-head"><div><h1>Talleres y QR</h1>
      <p>Cada taller tiene un código QR. Al escanearlo, el alumno crea su cuenta y queda inscrito en ese taller.</p></div>
      <button class="btn" type="button" data-new>Nuevo taller</button></div>
    <div class="workshops">${talleres.length ? talleres.map(workshopCard).join('') : `
      <div class="card empty"><strong>Aún no hay talleres</strong>Crea el primero para generar su código QR de registro.</div>`}</div>`;
  main.querySelector('[data-new]').addEventListener('click', () => workshopForm());
  main.querySelectorAll('[data-taller]').forEach((card) => bindWorkshop(card, talleres.find((t) => t.id === +card.dataset.taller)));
}

function workshopCard(t) {
  const qr = `/api/cms/talleres/${t.id}/qr.svg?v=${encodeURIComponent(t.codigo)}`;
  return `
  <article class="card workshop" data-taller="${t.id}" aria-labelledby="taller-${t.id}">
    <div>
      <div class="row"><h2 id="taller-${t.id}">${h(t.nombre)}</h2>
        <span class="badge ${t.registro_abierto ? 'badge--abierto' : 'badge--cerrado'}">${t.registro_abierto ? 'Registro abierto' : 'Registro cerrado'}</span></div>
      <div class="workshop__meta"><span>📅 ${h(fmtDate(t.fecha))}</span>${t.sede ? `<span>📍 ${h(t.sede)}</span>` : ''}
        <span>👥 ${t.alumnos} ${t.alumnos === 1 ? 'usuario' : 'usuarios'}</span></div>
      <div class="workshop__code"><span class="label">Código de registro</span><b>${h(t.codigo)}</b></div>
      <div class="copy-line"><input class="input" readonly value="${h(t.url_registro)}" aria-label="Enlace de registro de ${h(t.nombre)}">
        <button class="btn btn--ghost btn--small" type="button" data-copy>Copiar enlace</button></div>
      <div class="workshop__actions">
        <button class="btn btn--small" type="button" data-project ${t.registro_abierto ? '' : 'disabled'}>Proyectar QR</button>
        <a class="btn btn--small btn--ghost" href="/api/cms/talleres/${t.id}/qr.svg?descargar=1">Descargar QR</a>
        <button class="btn btn--small btn--ghost" type="button" data-toggle>${t.registro_abierto ? 'Cerrar registro' : 'Abrir registro'}</button>
        <button class="btn btn--small btn--ghost" type="button" data-edit>Editar</button>
        <button class="btn btn--small btn--ghost" type="button" data-regen>Regenerar código</button>
      </div>
    </div>
    <div class="qr ${t.registro_abierto ? '' : 'qr--closed'}">
      <img src="${qr}" alt="Código QR de registro para ${h(t.nombre)}" width="216" height="216">
      ${t.registro_abierto ? '' : '<div class="qr__closed">Registro cerrado: el código no acepta nuevos alumnos.</div>'}
    </div>
  </article>`;
}

function bindWorkshop(card, t) {
  card.querySelector('[data-copy]').addEventListener('click', () => copy(t.url_registro));
  card.querySelector('[data-project]').addEventListener('click', (e) => openProjection(t, e.currentTarget));
  card.querySelector('[data-edit]').addEventListener('click', () => workshopForm(t));
  card.querySelector('[data-toggle]').addEventListener('click', async () => {
    try {
      state.talleres = (await api(`/api/cms/talleres/${t.id}`, { method: 'PATCH', json: { registro_abierto: !t.registro_abierto } })).talleres;
      toast(t.registro_abierto ? 'Registro cerrado.' : 'Registro abierto.');
      renderTalleres();
    } catch (error) { toast(error.message, 'error'); }
  });
  card.querySelector('[data-regen]').addEventListener('click', async () => {
    const ok = await confirmDialog(`Se generará un código nuevo para <b>${h(t.nombre)}</b>. El QR y el enlace actuales <b>dejarán de funcionar</b>; si ya los imprimiste o compartiste, tendrás que reemplazarlos.`,
      { title: 'Regenerar código', confirm: 'Regenerar', danger: true });
    if (!ok) return;
    try {
      state.talleres = (await api(`/api/cms/talleres/${t.id}/codigo`, { method: 'POST' })).talleres;
      toast('Código regenerado. El QR anterior ya no funciona.');
      renderTalleres();
    } catch (error) { toast(error.message, 'error'); }
  });
}

function workshopForm(t = null) {
  openDialog({
    title: t ? 'Editar taller' : 'Nuevo taller',
    body: `
      <form id="taller-form" class="stack" novalidate>
        <label class="field"><span>Nombre del taller *</span><input class="input" name="nombre" required maxlength="120" value="${h(t?.nombre || '')}" placeholder="Workshop PAD · Generación 5"></label>
        <div class="grid-2">
          <label class="field"><span>Fecha</span><input class="input" type="date" name="fecha" value="${h(t?.fecha || '')}"></label>
          <label class="field"><span>Sede</span><input class="input" name="sede" maxlength="120" value="${h(t?.sede || '')}" placeholder="Por confirmar"></label>
        </div>
        <p class="hint">La fecha se usa como fecha de inicio del plan de 30 días de cada alumno registrado.</p>
        <div data-error></div>
      </form>`,
    foot: `<button class="btn btn--ghost" type="button" data-close>Cancelar</button>
           <button class="btn" type="submit" form="taller-form">${t ? 'Guardar cambios' : 'Crear taller'}</button>`,
  });
  const form = dialog.querySelector('#taller-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    if (!payload.nombre.trim()) { form.querySelector('[data-error]').innerHTML = errorBox('Escribe el nombre del taller.'); form.nombre.focus(); return; }
    const submit = dialog.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const data = await api(t ? `/api/cms/talleres/${t.id}` : '/api/cms/talleres', { method: t ? 'PATCH' : 'POST', json: payload });
      state.talleres = data.talleres;
      dialog.close();
      toast(t ? 'Taller actualizado.' : 'Taller creado. Ya puedes proyectar su QR.');
      renderTalleres();
    } catch (error) {
      form.querySelector('[data-error]').innerHTML = errorBox(error.message);
      submit.disabled = false;
    }
  });
}

let projectionOpener = null;
function openProjection(t, trigger) {
  projectionOpener = trigger;
  projection.innerHTML = `
    <button class="btn btn--ghost projection__close" type="button" data-close-projection>Salir (Esc)</button>
    <div class="projection__inner">
      <div class="projection__brand"><img src="/assets/detailbox-logo.webp" alt="">Detailbox Academy · Workshop PAD</div>
      <h2 id="proyeccion-titulo">${h(t.nombre)}</h2>
      <img class="projection__qr" src="/api/cms/talleres/${t.id}/qr.svg?v=${encodeURIComponent(t.codigo)}" alt="Código QR de registro">
      <p class="projection__cta">Escanea para registrarte</p>
      <p class="projection__alt">¿Sin cámara? Entra a <b>${h(new URL(t.url_registro).host)}/registro</b> con el código <b>${h(t.codigo)}</b></p>
    </div>`;
  projection.hidden = false;
  document.body.style.overflow = 'hidden';
  projection.querySelector('[data-close-projection]').addEventListener('click', closeProjection);
  projection.querySelector('[data-close-projection]').focus();
  if (projection.requestFullscreen) projection.requestFullscreen().catch(() => {});
}

function closeProjection() {
  if (projection.hidden) return;
  projection.hidden = true;
  projection.innerHTML = '';
  document.body.style.overflow = '';
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  projectionOpener?.focus();
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !projection.hidden) closeProjection();
  if (event.key === 'Tab' && !projection.hidden) { // único control: mantener el foco dentro
    event.preventDefault();
    projection.querySelector('[data-close-projection]')?.focus();
  }
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !projection.hidden) closeProjection(); });

// ── 3. Usuarios ────────────────────────────────────────────────────────
const filters = { q: '', taller: '', rol: '', estado: '' };

async function renderUsuarios(seq) {
  const [usuarios, talleres] = await Promise.all([loadUsuarios(true), loadTalleres(true)]);
  if (stale(seq)) return;
  const tallerOptions = talleres.map((t) => `<option value="${t.id}">${h(t.nombre)}</option>`).join('');
  main.innerHTML = `
    <div class="page-head"><div><h1>Usuarios</h1><p>Alumnos y equipo de Detailbox. Desde aquí consultas el avance de cada alumno.</p></div>
      <button class="btn" type="button" data-new>Nuevo usuario</button></div>
    <div class="toolbar" role="search">
      <label class="field"><span>Buscar</span><input class="input" type="search" data-f="q" placeholder="Nombre, correo o negocio" value="${h(filters.q)}"></label>
      <label class="field"><span>Taller</span><select class="select" data-f="taller"><option value="">Todos</option><option value="none">Sin taller</option>${tallerOptions}</select></label>
      <label class="field"><span>Rol</span><select class="select" data-f="rol"><option value="">Todos</option><option value="alumno">Alumnos</option><option value="admin">Administradores</option></select></label>
      <label class="field"><span>Estado</span><select class="select" data-f="estado"><option value="">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option></select></label>
    </div>
    <p class="count" data-count aria-live="polite"></p>
    <div class="card table-wrap"><table class="table">
      <thead><tr><th scope="col">Usuario</th><th scope="col">Negocio</th><th scope="col">Taller</th><th scope="col">Origen</th>
        <th scope="col">Avance</th><th scope="col">Etapa</th><th scope="col">Último acceso</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
      <tbody data-rows></tbody></table></div>`;
  main.querySelectorAll('[data-f]').forEach((control) => {
    control.value = filters[control.dataset.f];
    control.addEventListener('input', () => { filters[control.dataset.f] = control.value; paintUsers(); });
  });
  main.querySelector('[data-new]').addEventListener('click', () => userForm());
  paintUsers();
}

function paintUsers() {
  const q = filters.q.trim().toLowerCase();
  const list = state.usuarios.filter((u) => (!q || [u.nombre, u.email, u.negocio].some((v) => (v || '').toLowerCase().includes(q)))
    && (!filters.taller || (filters.taller === 'none' ? !u.taller_id : u.taller_id === +filters.taller))
    && (!filters.rol || u.rol === filters.rol)
    && (!filters.estado || (filters.estado === 'activo') === u.activo));
  main.querySelector('[data-count]').textContent = `${list.length} de ${state.usuarios.length} usuarios`;
  const tbody = main.querySelector('[data-rows]');
  tbody.innerHTML = list.length ? list.map((u) => `
    <tr class="${u.activo ? '' : 'is-inactive'}" data-user="${u.id}">
      <td class="user-cell"><b>${h(u.nombre)}</b><small>${h(u.email)}</small>${u.rol === 'admin' ? ' <span class="badge badge--admin">Admin</span>' : ''}</td>
      <td data-label="Negocio">${h(u.negocio || '—')}</td>
      <td data-label="Taller">${h(u.taller || '—')}</td>
      <td data-label="Origen">${h(ORIGIN[u.origen] || u.origen)}</td>
      <td data-label="Avance">${u.rol === 'alumno' ? `<div class="mini-progress"><div class="progress" role="progressbar" aria-label="Avance de ${h(u.nombre)}" aria-valuenow="${u.progreso}" aria-valuemin="0" aria-valuemax="100"><span style="width:${u.progreso}%"></span></div><span>${u.progreso}%</span></div>` : '—'}</td>
      <td data-label="Etapa">${u.rol === 'alumno' ? h(`${u.etapa} · ${STAGES[u.etapa] || ''}`) : '—'}</td>
      <td data-label="Último acceso">${h(u.ultimo_acceso ? fmtDateTime(u.ultimo_acceso) : 'Nunca')}</td>
      <td data-label="Estado"><span class="badge ${u.activo ? 'badge--abierto' : 'badge--inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td data-label="Acciones"><div class="cell-actions">
        ${u.rol === 'alumno' ? '<button class="btn btn--small" type="button" data-view>Ver workbook</button>' : ''}
        <button class="btn btn--small btn--ghost" type="button" data-edit>Editar</button>
        <details class="more"><summary class="btn btn--small btn--ghost" aria-label="Más acciones para ${h(u.nombre)}">Más</summary>
          <div class="more__menu">
            <button class="btn btn--small btn--ghost" type="button" data-reset>Restablecer contraseña</button>
            ${u.id === state.user.id ? '' : `<button class="btn btn--small btn--ghost" type="button" data-active>${u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}</button>`}
          </div></details>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="9" class="empty">No hay usuarios con estos filtros.</td></tr>';
  tbody.querySelectorAll('[data-user]').forEach((row) => {
    const u = state.usuarios.find((x) => x.id === +row.dataset.user);
    row.querySelector('[data-view]')?.addEventListener('click', () => viewWorkbook(u));
    row.querySelector('[data-edit]').addEventListener('click', () => userForm(u));
    row.querySelector('[data-reset]').addEventListener('click', () => { row.querySelector('details').open = false; resetPassword(u); });
    row.querySelector('[data-active]')?.addEventListener('click', () => { row.querySelector('details').open = false; toggleActive(u); });
  });
}

function userForm(u = null) {
  const talleres = state.talleres || [];
  const isSelf = u && u.id === state.user.id;
  openDialog({
    title: u ? `Editar · ${u.nombre}` : 'Nuevo usuario',
    body: `
      <form id="user-form" class="stack" novalidate>
        <label class="field"><span>Nombre *</span><input class="input" name="nombre" required maxlength="120" value="${h(u?.nombre || '')}"></label>
        <label class="field"><span>Correo *</span><input class="input" type="email" name="email" required maxlength="254" value="${h(u?.email || '')}" autocomplete="off"></label>
        <label class="field"><span>Negocio</span><input class="input" name="negocio" maxlength="120" value="${h(u?.negocio || '')}"></label>
        <div class="grid-2">
          <label class="field"><span>Taller</span><select class="select" name="taller_id"><option value="">Sin taller</option>
            ${talleres.map((t) => `<option value="${t.id}" ${u?.taller_id === t.id ? 'selected' : ''}>${h(t.nombre)}</option>`).join('')}</select></label>
          <label class="field"><span>Rol</span><select class="select" name="rol" ${isSelf ? 'disabled' : ''}>
            <option value="alumno" ${u?.rol !== 'admin' ? 'selected' : ''}>Alumno</option>
            <option value="admin" ${u?.rol === 'admin' ? 'selected' : ''}>Administrador (acceso al CMS)</option></select></label>
        </div>
        ${u && !isSelf ? `<label class="check"><input type="checkbox" name="activo" ${u.activo ? 'checked' : ''}> Cuenta activa (si la desactivas, se cierra su sesión)</label>` : ''}
        ${isSelf ? '<p class="hint">No puedes cambiar tu propio rol ni desactivar tu cuenta.</p>' : ''}
        ${u ? '' : '<p class="hint">Se generará una contraseña temporal que verás una sola vez. Los alumnos también pueden registrarse solos con el QR del taller.</p>'}
        <div data-error></div>
      </form>`,
    foot: `<button class="btn btn--ghost" type="button" data-close>Cancelar</button>
           <button class="btn" type="submit" form="user-form">${u ? 'Guardar cambios' : 'Crear usuario'}</button>`,
  });
  const form = dialog.querySelector('#user-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const payload = { nombre: fd.get('nombre').trim(), email: fd.get('email').trim(), negocio: fd.get('negocio').trim(),
      taller_id: fd.get('taller_id') ? Number(fd.get('taller_id')) : null };
    if (!isSelf) payload.rol = fd.get('rol');
    if (u && !isSelf) payload.activo = form.activo.checked;
    const error = form.querySelector('[data-error]');
    if (!payload.nombre || !payload.email) { error.innerHTML = errorBox('Nombre y correo son obligatorios.'); return; }
    const submit = dialog.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      if (u) {
        await api(`/api/cms/usuarios/${u.id}`, { method: 'PATCH', json: payload });
        dialog.close();
        toast('Usuario actualizado.');
      } else {
        const data = await api('/api/cms/usuarios', { method: 'POST', json: payload });
        showSecret('Usuario creado', payload.email, data.password_temporal);
      }
      await loadUsuarios(true);
      if (location.hash === '#usuarios') paintUsers();
    } catch (err) {
      error.innerHTML = errorBox(err.message);
      submit.disabled = false;
    }
  });
}

async function resetPassword(u) {
  const ok = await confirmDialog(`Se generará una contraseña temporal nueva para <b>${h(u.nombre)}</b> y se cerrarán sus sesiones abiertas.`,
    { title: 'Restablecer contraseña', confirm: 'Restablecer' });
  if (!ok) return;
  try {
    const data = await api(`/api/cms/usuarios/${u.id}/password`, { method: 'POST' });
    showSecret('Contraseña restablecida', u.email, data.password_temporal);
  } catch (error) { toast(error.message, 'error'); }
}

async function toggleActive(u) {
  if (u.activo) {
    const ok = await confirmDialog(`<b>${h(u.nombre)}</b> ya no podrá entrar y se cerrará su sesión. Su información se conserva.`,
      { title: 'Desactivar cuenta', confirm: 'Desactivar', danger: true });
    if (!ok) return;
  }
  try {
    await api(`/api/cms/usuarios/${u.id}`, { method: 'PATCH', json: { activo: !u.activo } });
    toast(u.activo ? 'Cuenta desactivada.' : 'Cuenta activada.');
    await loadUsuarios(true);
    paintUsers();
  } catch (error) { toast(error.message, 'error'); }
}

// ── Workbook en solo lectura ───────────────────────────────────────────
function kv(pairs) {
  const rows = pairs.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');
  return rows.length ? `<dl class="kv">${rows.map(([k, v]) => `<dt>${h(k)}</dt><dd>${h(v)}</dd>`).join('')}</dl>` : '';
}

function humanize(key) {
  const text = String(key).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function readable(value, depth = 0) { // respaldo legible para campos no previstos (nunca JSON crudo)
  if (value === null || value === undefined || value === '') return '';
  if (typeof value !== 'object') return h(value === true ? 'Sí' : value === false ? 'No' : value);
  if (Array.isArray(value)) {
    const items = value.map((v) => readable(v, depth + 1)).filter(Boolean);
    return items.length ? `<ul class="wb-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '';
  }
  const rows = Object.entries(value).map(([k, v]) => [k, readable(v, depth + 1)]).filter(([, v]) => v);
  return rows.length ? `<dl class="kv">${rows.map(([k, v]) => `<dt>${h(humanize(k))}</dt><dd>${v}</dd>`).join('')}</dl>` : '';
}

function toolBody(key, data, c) {
  if (!data || typeof data !== 'object' || !Object.keys(data).length) return '<p class="muted">Sin información todavía.</p>';
  const known = new Set();
  const take = (...keys) => keys.forEach((k) => known.add(k));
  let html = '';
  if (key === 'diagnostico') {
    take('areas', 'prioridades');
    const areas = data.areas || {};
    html += `<div class="wb-scroll"><table class="wb-mini-table"><thead><tr><th>Área</th><th>Calificación</th><th>Qué debo mejorar</th></tr></thead><tbody>
      ${c.diagnostico_areas.map((a) => `<tr><td>${h(a.nombre)}</td><td>${h(areas[a.id]?.calificacion ?? '—')}</td><td>${h(areas[a.id]?.mejora || '—')}</td></tr>`).join('')}</tbody></table></div>`;
    const pr = (data.prioridades || []).filter((p) => String(p || '').trim());
    if (pr.length) html += `<div><span class="label">Tres prioridades</span><ol class="wb-list">${pr.map((p) => `<li>${h(p)}</li>`).join('')}</ol></div>`;
  } else if (key === 'cliente_ideal') {
    take('segmentos', 'principal', 'secundario', 'matriz');
    (data.segmentos || []).forEach((s, i) => {
      if (!s || typeof s !== 'object') return;
      const tag = data.principal === i ? ' · <span class="badge badge--completado">Principal</span>' : data.secundario === i ? ' · <span class="badge badge--en_proceso">Secundario</span>' : '';
      html += `<div><b>${h(s.nombre || `Segmento ${i + 1}`)}</b>${tag}${kv([['Tipo de cliente', s.tipo_cliente], ['Vehículo', s.vehiculo], ['Problema', s.problema],
        ['Servicio que busca', s.servicio], ['Qué valora', s.valora], ['Zona', s.zona], ['Objeción frecuente', s.objecion]])}
        ${s.puntajes ? readable({ puntajes: s.puntajes }) : ''}</div>`;
    });
    if (data.matriz) html += readable({ matriz: data.matriz });
  } else if (key === 'paquetes') {
    take('paquetes');
    html += (data.paquetes || []).filter((p) => p && typeof p === 'object').map((p) => {
      const n = packageNumbers(p);
      return `<div><b>${h(p.nombre || 'Paquete sin nombre')}</b>${kv([['Cliente', p.cliente], ['Incluye', p.incluye], ['No incluye', p.no_incluye], ['Tiempo', p.tiempo],
        ['Precio de venta', n.price !== null ? money(n.price) : ''], ['Costo total', n.cost !== null ? money(n.cost) : ''],
        ['Utilidad', n.profit !== null ? money(n.profit) : ''], ['Margen', n.margin !== null ? `${n.margin}%` : ''], ['Beneficio', p.beneficio]])}</div>`;
    }).join('');
  } else if (key === 'propuesta_valor') {
    take('tipo_cliente', 'resultado', 'servicio', 'ventaja', 'version_final');
    html += `<p>Ayudo a <b>${h(data.tipo_cliente || '___')}</b> a conseguir <b>${h(data.resultado || '___')}</b> mediante <b>${h(data.servicio || '___')}</b>, diferenciándome por <b>${h(data.ventaja || '___')}</b>.</p>`;
    html += kv([['Versión final', data.version_final]]);
  } else if (key === 'atencion') {
    take('checks', 'responsable', 'observaciones');
    const checks = data.checks || {};
    html += c.atencion_momentos.map((m) => {
      const done = m.items.filter((i) => checks[i.id]).length;
      return `<div><b>${h(m.nombre)}</b> <span class="muted">· ${done} de ${m.items.length}</span>
        <ul class="wb-list">${m.items.map((i) => `<li>${checks[i.id] ? '✅' : '⬜️'} ${h(i.texto)}</li>`).join('')}</ul></div>`;
    }).join('');
    html += kv([['Responsable', data.responsable], ['Observaciones', data.observaciones]]);
  } else if (key === 'ventas') {
    take('prospectos', 'guiones');
    const names = Object.fromEntries(c.embudo_estados.map((e) => [e.id, e.nombre]));
    const leads = (data.prospectos || []).filter((p) => p && typeof p === 'object');
    if (leads.length) {
      html += `<div class="wb-scroll"><table class="wb-mini-table"><thead><tr><th>Cliente</th><th>Vehículo</th><th>Servicio</th><th>Importe</th><th>Estado</th><th>Próxima acción</th><th>Seguimiento</th></tr></thead><tbody>
        ${leads.map((p) => `<tr><td>${h(p.cliente || '—')}</td><td>${h(p.vehiculo || '—')}</td><td>${h(p.servicio || '—')}</td><td>${h(p.importe ? money(Number(String(p.importe).replace(/[,$\s]/g, '')) || p.importe) : '—')}</td>
          <td>${h(names[p.estado] || p.estado || '—')}</td><td>${h(p.proxima_accion || '—')}</td><td>${h(p.fecha_seguimiento || '—')}</td></tr>`).join('')}</tbody></table></div>`;
    }
    const g = data.guiones || {};
    html += kv([['Guion de primer contacto', g.primer_contacto], ['Preguntas de diagnóstico', g.preguntas], ['Mensaje de seguimiento', g.seguimiento], ['Respuesta a la objeción', g.objecion]]);
  } else if (key === 'marketing') {
    take('dias');
    const days = (data.dias || []).filter((d) => d && typeof d === 'object');
    if (days.length) html += `<div class="wb-scroll"><table class="wb-mini-table"><thead><tr><th>Día</th><th>Tema</th><th>Categoría</th><th>Formato</th><th>Objetivo</th><th>CTA</th><th>Estado</th></tr></thead><tbody>
      ${days.map((d, i) => `<tr><td>${h(d.dia ?? i + 1)}</td><td>${h(d.tema || '—')}</td><td>${h(d.categoria || '—')}</td><td>${h(d.formato || '—')}</td><td>${h(d.objetivo || '—')}</td><td>${h(d.cta || '—')}</td><td>${h(d.estado || 'Pendiente')}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (key === 'plan30') {
    take('tareas');
    const tasks = data.tareas || {};
    const label = { hecho: '✅ Hecho', en_proceso: '🔄 En proceso', pendiente: '⬜️ Pendiente' };
    html += c.plan30.map((w) => `<div><b>Semana ${h(w.semana)} · ${h(w.titulo)}</b><ul class="wb-list">${w.tareas.map((t) => {
      const s = tasks[t.id] || {};
      return `<li>${label[s.estado] || label.pendiente} · Día ${h(t.dia)}: ${h(t.accion)}${s.evidencia ? ` · <span class="muted">Evidencia: ${h(s.evidencia)}</span>` : ''}${s.observaciones ? ` · <span class="muted">${h(s.observaciones)}</span>` : ''}</li>`;
    }).join('')}</ul></div>`).join('');
  } else if (key === 'revision') {
    take('semanas');
    const q = Object.fromEntries(c.revision_preguntas.map((x) => [x.id, x.texto]));
    const ind = Object.fromEntries(c.indicadores.map((x) => [x.id, x]));
    html += (data.semanas || []).filter((w) => w && typeof w === 'object').map((w, i) => `<div><b>Semana ${h(w.semana ?? i + 1)}</b>
      ${kv(Object.entries(w.respuestas || {}).map(([k, v]) => [q[k] || humanize(k), v]))}
      ${kv(Object.entries(w.indicadores || {}).map(([k, v]) => [ind[k]?.nombre || humanize(k), ind[k]?.tipo === 'dinero' && v !== '' && !Number.isNaN(Number(v)) ? money(Number(v)) : v]))}</div>`).join('');
  } else if (key === 'cierre') {
    take('mayor_avance', 'cambio', 'indicador', 'objetivo_90', 'fecha_revision');
    html += kv([['Mi mayor avance', data.mayor_avance], ['El cambio con más impacto', data.cambio], ['El indicador que mejoró', data.indicador],
      ['Objetivo a 90 días', data.objetivo_90], ['Fecha de revisión', data.fecha_revision]]);
  }
  const rest = Object.fromEntries(Object.entries(data).filter(([k]) => !known.has(k)));
  html += readable(rest);
  return html || '<p class="muted">Sin información todavía.</p>';
}

async function viewWorkbook(u) {
  openDialog({ title: `Workbook · ${u.nombre}`, wide: true, body: '<p class="muted" role="status">Cargando workbook…</p>' });
  try {
    const [data, c] = await Promise.all([api(`/api/cms/usuarios/${u.id}/workbook`), loadContenido()]);
    if (!dialog.open) return;
    const p = data.progreso;
    const inicio = data.workbook.inicio || {};
    const tools = Object.entries(c.herramientas).sort((a, b) => a[1].numero - b[1].numero);
    const evidencias = data.evidencias || [];
    const toolTitle = Object.fromEntries(tools.map(([k, t]) => [k, t.titulo]));
    dialog.querySelector('.dialog__body').innerHTML = `
      <div class="wb-head">
        <p class="muted">${h(data.usuario.email)}${data.usuario.negocio ? ` · ${h(data.usuario.negocio)}` : ''} · Solo lectura</p>
        <div class="row"><b>${p.porcentaje}% de avance</b><span class="muted">(${p.completadas} de ${p.total} unidades · plan ${p.plan.hechas}/${p.plan.total} tareas)</span></div>
        <div class="progress" role="progressbar" aria-label="Avance del workbook" aria-valuenow="${p.porcentaje}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p.porcentaje}%"></span></div>
        <div class="wb-stages">${Object.entries(STAGES).map(([s, n]) => `<span class="wb-stage">${s} · ${n} <span class="badge badge--${p.etapas[s]}">${STATUS[p.etapas[s]]}</span></span>`).join('')}</div>
        ${p.siguiente ? `<p class="hint">Siguiente herramienta sugerida: <b>${h(toolTitle[p.siguiente] || p.siguiente)}</b></p>` : ''}
      </div>
      <section class="wb-section"><h3>Inicio · Mi negocio</h3><div class="wb-tool">${kv([['Alumno', inicio.alumno], ['Negocio', inicio.negocio], ['Fecha de inicio', inicio.fecha_inicio ? fmtDate(inicio.fecha_inicio) : ''],
        ['Meta principal (30 días)', inicio.meta], ['Etapa elegida', inicio.etapa], ['Modalidad', inicio.modalidad], ['Capacidad semanal', inicio.capacidad]]) || '<p class="muted">Sin información todavía.</p>'}</div></section>
      ${Object.entries(STAGES).map(([s, n]) => `<section class="wb-section"><h3>${s} · ${n}</h3>
        ${tools.filter(([, t]) => t.etapa === s).map(([k, t]) => `<div class="wb-tool"><div class="wb-tool__head"><b>${t.numero}. ${h(t.titulo)}</b>
          <span class="badge badge--${p.herramientas[k]}">${STATUS[p.herramientas[k]]}</span></div>${toolBody(k, data.workbook[k], c)}</div>`).join('')}</section>`).join('')}
      <section class="wb-section"><h3>Evidencias y fotografías (${evidencias.length})</h3>
        ${evidencias.length ? `<div class="evidence-grid">${evidencias.map((e) => `<a class="evidence" href="/api/cms/evidencias/${e.id}/archivo" target="_blank" rel="noopener">
          ${e.mime === 'application/pdf' ? '<span class="evidence__pdf">PDF</span>' : `<img src="/api/cms/evidencias/${e.id}/archivo" alt="${h(e.nota || e.nombre)}" loading="lazy">`}
          <span><b>${h(toolTitle[e.herramienta] || (e.herramienta === 'inicio' ? 'Inicio' : e.herramienta))}</b><br>${h(e.nota || e.nombre)}</span></a>`).join('')}</div>` : '<p class="muted">Aún no sube evidencias.</p>'}
      </section>`;
  } catch (error) {
    if (dialog.open) dialog.querySelector('.dialog__body').innerHTML = errorBox(error.message);
  }
}

// ── 4. Contenido ───────────────────────────────────────────────────────
async function renderContenido(seq) {
  await Promise.all([loadContenido(true), loadUsuarios().catch(() => [])]);
  if (stale(seq)) return;
  state.drafts = {};
  main.innerHTML = `
    <div class="page-head"><div><h1>Contenido</h1><p>Lo que ven los alumnos en su Workbook PAD. Los cambios se aplican al guardar.</p></div></div>
    <div class="content-layout">
      <nav class="card block-nav" aria-label="Bloques de contenido">${Object.entries(BLOCKS).map(([k, [label]]) => `<button type="button" data-block="${k}">${h(label)}</button>`).join('')}</nav>
      <div>
        <label class="field block-select"><span>Bloque de contenido</span><select class="select" data-block-select>${Object.entries(BLOCKS).map(([k, [label]]) => `<option value="${k}">${h(label)}</option>`).join('')}</select></label>
        <section class="card editor" data-editor aria-live="polite"></section>
      </div>
    </div>`;
  main.querySelectorAll('[data-block]').forEach((b) => b.addEventListener('click', () => selectBlock(b.dataset.block)));
  main.querySelector('[data-block-select]').addEventListener('change', (e) => selectBlock(e.target.value));
  state.leaveGuard = async () => !isDirty(state.block) || confirmDialog('Tienes cambios sin guardar en este bloque. ¿Salir y descartarlos?', { title: 'Cambios sin guardar', confirm: 'Salir sin guardar', danger: true });
  selectBlock(state.block, true);
}

function isDirty(key) {
  return state.drafts[key] && !same(state.drafts[key], state.contenido[key]);
}

async function selectBlock(key, force = false) {
  if (!force && key !== state.block && isDirty(state.block)) {
    const ok = await confirmDialog('Tienes cambios sin guardar en este bloque. ¿Cambiar de bloque y descartarlos?', { title: 'Cambios sin guardar', confirm: 'Descartar cambios', danger: true });
    if (!ok) { main.querySelector('[data-block-select]').value = state.block; return; }
  }
  if (!force) delete state.drafts[state.block];
  state.block = key;
  main.querySelectorAll('[data-block]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.block === key)));
  main.querySelector('[data-block-select]').value = key;
  paintEditor();
}

function lastEdit(key) {
  const meta = state.meta?.[key];
  if (!meta) return '';
  const who = meta.actualizado_por ? (state.usuarios || []).find((u) => u.id === meta.actualizado_por)?.nombre || `usuario #${meta.actualizado_por}` : null;
  return `Última edición: ${fmtDateTime(meta.actualizado)}${who ? ` · ${who}` : ' · contenido original del workbook'}`;
}

function paintEditor() {
  const key = state.block;
  const editor = main.querySelector('[data-editor]');
  if (!state.drafts[key]) state.drafts[key] = clone(state.contenido[key]);
  const draft = state.drafts[key];
  const [label, description] = BLOCKS[key];
  editor.innerHTML = `
    <div class="editor__head"><div><h2>${h(label)}</h2><p>${h(description)}</p><p class="hint">${h(lastEdit(key))}</p></div>
      <button class="btn btn--small btn--ghost" type="button" data-restore>Restaurar original</button></div>
    <div data-form></div>
    <div class="editor__bar"><div class="editor__error" data-error></div><span class="dirty" data-dirty aria-live="polite"></span>
      <div class="row"><button class="btn btn--ghost" type="button" data-discard>Descartar cambios</button>
        <button class="btn" type="button" data-save>Guardar</button></div></div>`;
  const form = editor.querySelector('[data-form]');
  const refresh = () => {
    const dirty = isDirty(key);
    editor.querySelector('[data-dirty]').textContent = dirty ? 'Cambios sin guardar' : 'Sin cambios';
    editor.querySelector('[data-save]').disabled = !dirty;
    editor.querySelector('[data-discard]').disabled = !dirty;
  };
  const ctx = { onChange: refresh, rerender: () => { buildForm(key, draft, form, ctx); refresh(); }, original: collectIds(state.contenido[key]) };
  buildForm(key, draft, form, ctx);
  refresh();
  editor.querySelector('[data-save]').addEventListener('click', () => saveBlock(key));
  editor.querySelector('[data-discard]').addEventListener('click', () => { delete state.drafts[key]; paintEditor(); });
  editor.querySelector('[data-restore]').addEventListener('click', async () => {
    const ok = await confirmDialog(`Se reemplazará <b>${h(label)}</b> por el contenido original del workbook. Las ediciones hechas en este bloque se perderán.`,
      { title: 'Restaurar original', confirm: 'Restaurar', danger: true });
    if (!ok) return;
    try {
      const data = await api(`/api/cms/contenido/${key}/restaurar`, { method: 'POST' });
      state.contenido[key] = data.valor;
      await loadContenido(true);
      delete state.drafts[key];
      toast('Contenido original restaurado.');
      paintEditor();
    } catch (error) { editor.querySelector('[data-error]').innerHTML = errorBox(error.message); }
  });
}

async function saveBlock(key) {
  const editor = main.querySelector('[data-editor]');
  const draft = state.drafts[key];
  if (key === 'plan30') draft.forEach((w, i) => { w.semana = i + 1; });
  const button = editor.querySelector('[data-save]');
  button.disabled = true;
  editor.querySelector('[data-error]').innerHTML = '';
  try {
    const data = await api(`/api/cms/contenido/${key}`, { method: 'PUT', json: { valor: draft } });
    state.contenido[key] = data.valor;
    await loadContenido(true);
    delete state.drafts[key];
    toast('Contenido guardado. Los alumnos ya ven el cambio.');
    paintEditor();
  } catch (error) {
    editor.querySelector('[data-error]').innerHTML = errorBox(error.message);
    button.disabled = false;
    editor.querySelector('[data-error] [role="alert"]')?.scrollIntoView({ block: 'nearest' });
  }
}

function collectIds(value, out = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => collectIds(v, out));
  else if (value && typeof value === 'object') {
    if (typeof value.id === 'string') out.add(value.id);
    Object.values(value).forEach((v) => { if (typeof v === 'object') collectIds(v, out); });
  }
  return out;
}

// Campo enlazado a una propiedad del borrador; edita sin volver a pintar (conserva el foco).
function bound(obj, prop, label, { type = 'text', rows = 3, options = null, hint = '', maxlength = 4000 } = {}) {
  const id = `f-${Math.random().toString(36).slice(2, 9)}`;
  let control;
  if (type === 'textarea') control = `<textarea class="textarea" id="${id}" rows="${rows}" maxlength="${maxlength}"></textarea>`;
  else if (type === 'select') control = `<select class="select" id="${id}">${options.map(([v, l]) => `<option value="${h(v)}">${h(l)}</option>`).join('')}</select>`;
  else control = `<input class="input" id="${id}" type="${type}" maxlength="${maxlength}">`;
  const wrap = el(`<div class="field"><label class="label" for="${id}">${h(label)}</label>${control}${hint ? `<span class="hint">${h(hint)}</span>` : ''}</div>`);
  const input = wrap.querySelector('input, textarea, select');
  input.value = obj[prop] ?? '';
  input.addEventListener('input', () => {
    obj[prop] = type === 'number' ? (input.value === '' ? '' : Number(input.value)) : input.value;
    wrap.closest('[data-form]')?.dispatchEvent(new Event('draftchange', { bubbles: true }));
  });
  return wrap;
}

function buildForm(key, draft, form, ctx) {
  form.innerHTML = '';
  form.addEventListener('draftchange', ctx.onChange);
  const taken = collectIds(draft);
  if (key === 'textos') {
    Object.keys(TEXT_LABELS).forEach((k) => { if (k in draft) form.append(bound(draft, k, TEXT_LABELS[k], { type: 'textarea', rows: 3 })); });
    const stages = el('<fieldset class="fieldset"><legend>Etapas del método</legend></fieldset>');
    ['P', 'A', 'D'].forEach((s) => {
      draft.etapas[s] = draft.etapas[s] || { nombre: '', objetivo: '' };
      const box = el(`<div class="grid-2"></div>`);
      box.append(bound(draft.etapas[s], 'nombre', `${s} · Nombre`), bound(draft.etapas[s], 'objetivo', `${s} · Objetivo`));
      stages.append(box);
    });
    form.append(stages);
    Object.keys(draft).filter((k) => !(k in TEXT_LABELS) && k !== 'etapas' && typeof draft[k] === 'string')
      .forEach((k) => form.append(bound(draft, k, humanize(k), { type: 'textarea' })));
  } else if (key === 'herramientas') {
    Object.entries(draft).sort((a, b) => a[1].numero - b[1].numero).forEach(([tk, tool]) => {
      const box = el(`<fieldset class="fieldset"><legend>${tool.numero}. ${h(tool.titulo)}</legend>
        <span class="fixed-tag">Etapa ${h(tool.etapa)} · ${h(STAGES[tool.etapa] || '')} · Herramienta ${tool.numero} <span class="sr-only">(no editable)</span></span></fieldset>`);
      box.append(bound(tool, 'titulo', 'Título', { maxlength: 120 }), bound(tool, 'objetivo', 'Objetivo', { type: 'textarea', rows: 2 }));
      const steps = el('<div class="nested"><span class="label">Pasos (máximo 3, regla del workbook)</span><div class="list" data-steps></div></div>');
      const paintSteps = () => {
        const list = steps.querySelector('[data-steps]');
        list.innerHTML = '';
        tool.pasos.forEach((step, i) => {
          const row = el('<div class="item"><div class="item__fields"></div><div class="item__tools"></div></div>');
          row.querySelector(':scope > .item__fields').append(bound(tool.pasos, i, `Paso ${i + 1}`, { type: 'textarea', rows: 2 }));
          row.querySelector(':scope > .item__tools').append(moveButtons(tool.pasos, i, () => { paintSteps(); ctx.onChange(); }, `paso ${i + 1}`),
            removeButton(async () => { tool.pasos.splice(i, 1); paintSteps(); ctx.onChange(); }, `Quitar paso ${i + 1}`));
          list.append(row);
        });
        steps.querySelector('.steps-warning')?.remove();
        if (tool.pasos.length > 3) steps.append(el('<p class="steps-warning" role="alert">Hay más de 3 pasos: el servidor no lo permitirá. Quita uno antes de guardar.</p>'));
      };
      const add = el('<button class="btn btn--small btn--ghost" type="button">+ Agregar paso</button>');
      add.addEventListener('click', () => { tool.pasos.push(''); paintSteps(); ctx.onChange(); steps.querySelectorAll('textarea')[tool.pasos.length - 1]?.focus(); });
      paintSteps();
      box.append(steps, add, bound(tool, 'resultado', 'Resultado', { type: 'textarea', rows: 2 }));
      form.append(box);
      void tk;
    });
  } else if (['paquetes_base', 'marketing_categorias', 'marketing_estados'].includes(key)) {
    const warn = key === 'paquetes_base' ? 'Solo afecta a alumnos que todavía no crean sus paquetes.' : 'Los alumnos guardan el texto elegido: si renombras uno, sus registros anteriores conservarán el nombre viejo.';
    form.append(el(`<p class="notice">${h(warn)}</p>`));
    form.append(listEditor(draft, { ctx, primitive: true, label: 'Nombre', newItem: () => '', noun: 'elemento' }));
  } else {
    const specs = {
      diagnostico_areas: { fields: [['nombre', 'Área']], noun: 'área', prefix: 'area' },
      segmento_criterios: { fields: [['nombre', 'Criterio']], noun: 'criterio', prefix: 'criterio' },
      embudo_estados: { fields: [['nombre', 'Estado']], noun: 'estado', prefix: 'estado' },
      revision_preguntas: { fields: [['texto', 'Pregunta', 'textarea']], noun: 'pregunta', prefix: 'pregunta' },
      indicadores: { fields: [['nombre', 'Indicador'], ['tipo', 'Tipo', 'select', [['numero', 'Número'], ['dinero', 'Dinero (MXN)']]]], noun: 'indicador', prefix: 'indicador', defaults: { tipo: 'numero' } },
      copiloto_accesos: { fields: [['titulo', 'Título del acceso'], ['prompt', 'Prompt que se envía al copiloto', 'textarea', null, 5]], noun: 'acceso', prefix: 'acceso' },
      atencion_momentos: { fields: [['nombre', 'Momento']], noun: 'momento', prefix: 'momento', defaults: { items: [] },
        nested: { prop: 'items', label: 'Pasos que el alumno marca', fields: [['texto', 'Paso', 'textarea', null, 2]], noun: 'paso', prefix: 'paso' } },
      plan30: { fields: [['titulo', 'Título de la semana']], noun: 'semana', prefix: 'semana', defaults: { tareas: [] }, numbered: 'Semana', noId: true,
        nested: { prop: 'tareas', label: 'Tareas', fields: [['dia', 'Día', 'number'], ['accion', 'Acción', 'textarea', null, 2]], noun: 'tarea', prefix: 'tarea', inline: true } },
    }[key];
    if (key === 'copiloto_accesos') form.append(el('<p class="notice">El prompt se envía al Copiloto PAD junto con la información que el alumno registró en su workbook.</p>'));
    if (key === 'plan30') form.append(el('<p class="notice">El avance del alumno se calcula con estas tareas. Al quitar una tarea, su estado registrado deja de contar.</p>'));
    form.append(listEditor(draft, { ctx, taken, ...specs }));
  }
  if (!['textos', 'herramientas'].includes(key)) {
    form.prepend(el('<p class="hint">Los elementos nuevos reciben un identificador automático. Los existentes conservan el suyo para no perder lo que los alumnos ya capturaron.</p>'));
  }
}

function moveButtons(list, i, after, noun) {
  const box = document.createDocumentFragment();
  const up = el(`<button class="icon-btn" type="button" aria-label="Subir ${h(noun)}">↑</button>`);
  const down = el(`<button class="icon-btn" type="button" aria-label="Bajar ${h(noun)}">↓</button>`);
  up.disabled = i === 0;
  down.disabled = i === list.length - 1;
  up.addEventListener('click', () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; after(); });
  down.addEventListener('click', () => { [list[i + 1], list[i]] = [list[i], list[i + 1]]; after(); });
  box.append(up, down);
  return box;
}

function removeButton(onRemove, label) {
  const button = el(`<button class="icon-btn icon-btn--danger" type="button" aria-label="${h(label)}">✕</button>`);
  button.addEventListener('click', onRemove);
  return button;
}

function listEditor(items, spec) {
  const { ctx, primitive = false, fields = [], noun = 'elemento', prefix = 'item', defaults = {}, nested = null, numbered = null, inline = false, noId = false } = spec;
  const existed = (item) => !primitive && (item.id ? ctx.original.has(item.id) : [...collectIds(item)].some((id) => ctx.original.has(id)));
  const taken = spec.taken || new Set();
  const wrap = el('<div><div class="list" data-list></div></div>');
  const list = wrap.querySelector('[data-list]');
  const paint = () => {
    list.innerHTML = '';
    if (!items.length) list.append(el(`<p class="muted">No hay elementos. Agrega uno.</p>`));
    items.forEach((item, i) => {
      const row = el('<div class="item"><div class="item__fields"></div><div class="item__tools"></div></div>');
      const box = row.querySelector(':scope > .item__fields');
      if (inline) box.classList.add('item__fields--inline');
      if (nested) row.classList.add('item--block');
      if (primitive) {
        box.append(bound(items, i, `${spec.label} ${i + 1}`, { maxlength: 80 }));
      } else {
        const isOld = existed(item);
        const idText = noId ? '' : `id: ${h(item.id)}`;
        const head = el(`<div class="item__id">${numbered ? `<b>${h(numbered)} ${i + 1}</b>${idText ? ' · ' : ''}` : ''}${idText}${isOld ? '' : ' <span class="new">· nuevo</span>'}</div>`);
        if (!inline) box.append(head);
        fields.forEach(([prop, label, type = 'text', options = null, rows = 3]) => {
          if (item[prop] === undefined) item[prop] = type === 'number' ? '' : (options ? options[0][0] : '');
          box.append(bound(item, prop, label, { type, options, rows }));
        });
        if (inline) box.append(head);
        if (nested) {
          item[nested.prop] = item[nested.prop] || [];
          const inner = el(`<div class="nested"><span class="label">${h(nested.label)}</span></div>`);
          inner.append(listEditor(item[nested.prop], { ...nested, ctx, taken }));
          box.append(inner);
        }
      }
      const tools = row.querySelector(':scope > .item__tools');
      tools.append(moveButtons(items, i, () => { paint(); ctx.onChange(); }, `${noun} ${i + 1}`));
      tools.append(removeButton(async () => {
        if (existed(item)) {
          const what = item.id ? ` (id <b>${h(item.id)}</b>)` : ' y contiene elementos que los alumnos pueden haber usado';
          const ok = await confirmDialog(`Este ${h(noun)} ya existía${what}. Si algún alumno ya lo usó, esa información dejará de mostrarse y de contar en su avance. ¿Quitarlo?`,
            { title: `Quitar ${noun}`, confirm: 'Quitar', danger: true });
          if (!ok) return;
        }
        items.splice(i, 1);
        paint();
        ctx.onChange();
      }, `Quitar ${noun} ${i + 1}`));
      list.append(row);
    });
  };
  const add = el(`<button class="btn btn--small btn--ghost" type="button" style="margin-top:10px">+ Agregar ${h(noun)}</button>`);
  add.addEventListener('click', () => {
    items.push(primitive ? '' : noId ? clone(defaults) : { id: newId(prefix, taken), ...clone(defaults) });
    paint();
    ctx.onChange();
    const last = list.querySelectorAll(':scope > .item');
    last[last.length - 1]?.querySelector('input, textarea, select')?.focus();
  });
  paint();
  wrap.append(add);
  return wrap;
}

// ── 5. Actividad ───────────────────────────────────────────────────────
async function renderActividad(seq) {
  const [{ actividad }] = await Promise.all([api('/api/cms/actividad'), loadTalleres().catch(() => []), loadUsuarios().catch(() => [])]);
  if (stale(seq)) return;
  const userName = (id) => (state.usuarios || []).find((u) => u.id === id)?.nombre || `usuario #${id}`;
  const tallerName = (id) => (state.talleres || []).find((t) => t.id === id)?.nombre || `taller #${id}`;
  const detail = (d) => {
    if (!d) return '';
    const parts = [];
    if (d.usuario) parts.push(userName(d.usuario));
    if (d.taller) parts.push(tallerName(d.taller));
    if (d.clave) parts.push(BLOCKS[d.clave]?.[0] || d.clave);
    if (d.rol) parts.push(`rol ${d.rol === 'admin' ? 'administrador' : 'alumno'}`);
    if (d.campos?.length) parts.push(`campos: ${d.campos.map((c) => FIELD_NAMES[c] || c).join(', ')}`);
    return parts.join(' · ');
  };
  main.innerHTML = `
    <div class="page-head"><div><h1>Actividad</h1><p>Últimas 150 acciones registradas: registros, cambios de usuarios, talleres y contenido.</p></div></div>
    ${actividad.length ? `<div class="card"><ul class="activity">${actividad.map((a) => `
      <li><time datetime="${h(a.creada)}">${h(fmtDateTime(a.creada))}</time>
        <div><b>${h(a.actor || 'Sistema')}</b> · ${h(ACTIONS[a.accion] || a.accion)}${detail(a.detalle) ? `<small>${h(detail(a.detalle))}</small>` : ''}</div></li>`).join('')}</ul></div>`
      : '<div class="card empty"><strong>Sin actividad todavía</strong>Aquí aparecerán los registros y cambios.</div>'}`;
}

// Menús «Más»: cerrar al hacer clic fuera o con Escape.
document.addEventListener('click', (event) => {
  document.querySelectorAll('details.more[open]').forEach((d) => { if (!d.contains(event.target)) d.open = false; });
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const open = document.querySelector('details.more[open]');
  if (open) { open.open = false; open.querySelector('summary').focus(); }
});

// ── arranque ───────────────────────────────────────────────────────────
async function boot() {
  let user;
  try {
    user = await session();
  } catch (error) {
    main.innerHTML = `<div class="card empty" role="alert"><strong>No se pudo conectar</strong>${h(error.message)}</div>`;
    return;
  }
  if (!user) { location.href = '/entrar/?siguiente=/cms/'; return; }
  if (user.rol !== 'admin') {
    main.innerHTML = `<div class="card empty"><strong>Esta sección es solo para el equipo de Detailbox</strong>
      Tu cuenta es de alumno. <div class="row" style="justify-content:center;margin-top:14px"><a class="btn" href="/app/">Ir a mi Workbook PAD</a>
      <button class="btn btn--ghost" type="button" data-logout>Cerrar sesión</button></div></div>`;
    main.querySelector('[data-logout]').addEventListener('click', logout);
    return;
  }
  state.user = user;
  document.getElementById('cms-user-name').textContent = user.nombre;
  document.getElementById('cms-user').hidden = false;
  nav.hidden = false;
  document.getElementById('logout').addEventListener('click', logout);
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (event) => { if (Object.keys(state.drafts).some(isDirty)) { event.preventDefault(); event.returnValue = ''; } });
  if (user.cambiar_password) toast('Tu contraseña es temporal. Cámbiala desde la app del alumno (Mi cuenta).');
  route();
}

boot();
