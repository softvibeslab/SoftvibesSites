/* Cervecería Cisne Negro · Panel del equipo
 * Código del día, canje de cortesías, métricas de 30 días y bandeja NPS.
 * En producción nginx protege /admin y /api/admin con usuario y contraseña (basic auth):
 * el navegador reenvía las credenciales solo, así que aquí no se maneja ningún token.
 */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const SEGUIMIENTO = { nuevo: 'Nuevo', contactado: 'Contactado', resuelto: 'Resuelto', cerrado: 'Cerrado' };
  let filtro = 'pendientes';

  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }
  const num = (n) => Number(n || 0).toLocaleString('es-MX');
  const pl = (n, uno, varios) => `${num(n)} ${Number(n) === 1 ? uno : varios}`;
  const TZ = 'America/Mexico_City';
  const fecha = (iso) => new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ });

  class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

  async function api(path, body) {
    let res;
    try {
      res = await fetch('/api/admin' + path, {
        method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError(0, 'Sin conexión. Revisa el internet de la barra.');
    }
    let data = {};
    try { data = await res.json(); } catch (e) { /* sin JSON */ }
    if (res.status === 401) { avisar('Necesitas iniciar sesión. Recarga la página y escribe el usuario y la contraseña del equipo.'); throw new ApiError(401, 'Necesitas iniciar sesión.'); }
    if (!res.ok) throw new ApiError(res.status, data.error || 'Algo salió mal. Inténtalo otra vez.');
    return data;
  }

  function avisar(texto) {
    const a = $('#aviso');
    a.textContent = texto || '';
    a.hidden = !texto;
  }

  // ── Resumen: código del día + métricas ─────────────────────────────────────
  function metrica(k, v, s, mod) {
    return h('div', { class: 'metrica' + (mod ? ' metrica--' + mod : '') },
      h('p', { class: 'metrica__k', text: k }),
      h('p', { class: 'metrica__v', text: v }),
      s && h('p', { class: 'metrica__s', text: s }));
  }

  async function cargarResumen() {
    const box = $('#metricas');
    box.setAttribute('aria-busy', 'true');
    try {
      const r = await api('/resumen?dias=30');
      avisar('');
      $('#codigo').textContent = r.codigo_del_dia;
      $('#codigo').setAttribute('aria-label', 'Código del día: ' + String(r.codigo_del_dia).split('').join(' '));
      const f = new Date(r.fecha + 'T12:00:00-06:00');
      $('#codigo-fecha').textContent = f.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });

      const nps = r.nps || {};
      const rec = r.recompensas || {};
      const emitidas = Object.values(rec).reduce((a, b) => a + b, 0);
      const canjeadas = rec.canjeada || 0;
      box.replaceChildren(
        metrica('Socios', num(r.socios), `${pl(r.socios_nuevos, 'nuevo', 'nuevos')} en 30 días`),
        metrica('Visitas hoy', num(r.visitas_hoy), `${pl(r.visitas, 'visita', 'visitas')} en 30 días`),
        metrica('NPS', nps.score == null ? '—' : (nps.score > 0 ? '+' : '') + nps.score,
          nps.respuestas ? `${pl(nps.promotores, 'promotor', 'promotores')} · ${pl(nps.pasivos, 'pasivo', 'pasivos')} · ${pl(nps.detractores, 'detractor', 'detractores')}` : 'Aún no hay respuestas', 'nps'),
        metrica('Clics a reseña', num(r.clicks_resena), 'Promotores que fueron a Google'),
        metrica('Cortesías', `${num(canjeadas)}/${num(emitidas)}`, `${pl(canjeadas, 'canjeada', 'canjeadas')} de ${pl(emitidas, 'emitida', 'emitidas')}`),
        metrica('Por recuperar', num(r.por_recuperar), 'Detractores sin resolver', r.por_recuperar > 0 ? 'alerta' : null));
    } catch (ex) {
      if (ex.status !== 401) box.replaceChildren(h('p', { class: 'fine', text: ex.message }));
    } finally {
      box.setAttribute('aria-busy', 'false');
    }
  }

  // ── Canje ──────────────────────────────────────────────────────────────────
  async function canjear(e) {
    e.preventDefault();
    const inp = $('#canje-codigo');
    const out = $('#canje-res');
    let codigo = inp.value.trim().toUpperCase().replace(/\s+/g, '');
    if (codigo && !codigo.startsWith('CN-')) codigo = 'CN-' + codigo.replace(/^CN/, '');
    out.className = 'resultado';
    out.replaceChildren();
    if (!/^CN-[A-Z0-9]{5}$/.test(codigo)) {
      out.classList.add('resultado--error');
      out.textContent = 'El código tiene la forma CN-XXXXX (5 letras o números).';
      inp.focus();
      return;
    }
    const btn = $('#canje button');
    btn.disabled = true;
    try {
      const r = await api('/canjear', { codigo });
      out.classList.add('resultado--ok');
      out.append(h('p', { class: 'resultado__t', text: '✓ Canjeada' }),
        h('p', null, h('b', { text: r.socio }), ' · ' + r.nombre + ' · ', h('span', { class: 'mono', text: codigo })));
      inp.value = '';
      cargarResumen();
    } catch (ex) {
      out.classList.add('resultado--error');
      out.textContent = '✗ ' + ex.message;
    } finally {
      btn.disabled = false;
      inp.focus();
    }
  }

  // ── Bandeja NPS ────────────────────────────────────────────────────────────
  function claseScore(s) { return s <= 6 ? 'det' : s <= 8 ? 'pas' : 'pro'; }

  function tarjeta(r) {
    const id = 'r' + r.id;
    const tel = String(r.telefono || '');
    const wa = 'https://wa.me/52' + tel;
    const telFmt = tel.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
    const guardado = h('p', { class: 'resp__guardado', role: 'status', 'aria-live': 'polite' });
    const sel = h('select', { id: id + '-seg', name: 'seguimiento' },
      Object.entries(SEGUIMIENTO).map(([v, t]) => h('option', { value: v, selected: v === r.seguimiento, text: t })));
    const notas = h('textarea', { id: id + '-notas', name: 'notas', rows: 1, maxlength: 1000, placeholder: 'Qué se habló o qué se hizo' });
    notas.value = r.notas || '';
    const form = h('form', { class: 'resp__form', 'data-id': r.id },
      h('div', null, h('label', { for: id + '-seg', text: 'Seguimiento' }), sel),
      h('div', null, h('label', { for: id + '-notas', text: 'Notas' }), notas),
      h('button', { type: 'submit', class: 'btn btn--ghost btn--sm', text: 'Guardar' }),
      guardado);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      guardado.className = 'resp__guardado';
      guardado.textContent = 'Guardando…';
      try {
        await api('/nps/' + r.id, { seguimiento: sel.value, notas: notas.value });
        guardado.textContent = '✓ Guardado (' + SEGUIMIENTO[sel.value].toLowerCase() + ')';
        cargarResumen();
      } catch (ex) {
        guardado.classList.add('resp__guardado--error');
        guardado.textContent = ex.message;
      } finally { btn.disabled = false; }
    });

    return h('li', { class: 'resp', 'aria-labelledby': id + '-n' },
      h('span', { class: 'resp__score resp__score--' + claseScore(r.score), 'aria-label': 'Calificación ' + r.score + ' de 10', text: String(r.score) }),
      h('div', null,
        h('div', { class: 'resp__top' },
          h('span', { class: 'resp__nombre', id: id + '-n', text: r.nombre }),
          h('span', { class: 'resp__meta', text: fecha(r.creado_at) })),
        r.comentario
          ? h('p', { class: 'resp__com', text: '“' + r.comentario + '”' })
          : h('p', { class: 'resp__com resp__com--vacio', text: 'Sin comentario.' }),
        tel && h('a', { class: 'resp__wa', href: wa, target: '_blank', rel: 'noopener', text: 'WhatsApp · ' + telFmt }),
        form));
  }

  async function cargarNps() {
    const lista = $('#bandeja');
    lista.setAttribute('aria-busy', 'true');
    try {
      const r = await api('/nps?filtro=' + encodeURIComponent(filtro));
      const rows = r.respuestas || [];
      lista.replaceChildren(...(rows.length ? rows.map(tarjeta)
        : [h('li', { class: 'bandeja__vacio', text: filtro === 'pendientes' ? 'Nada pendiente. ¡Bien!' : 'Aún no hay respuestas.' })]));
      $('#nps-estado').textContent = `${rows.length} ${rows.length === 1 ? 'respuesta' : 'respuestas'}`;
    } catch (ex) {
      if (ex.status !== 401) lista.replaceChildren(h('li', { class: 'bandeja__vacio', text: ex.message }));
    } finally {
      lista.setAttribute('aria-busy', 'false');
    }
  }

  const AYUDA = {
    pendientes: 'Pendientes: calificaciones de 0 a 6 que aún no se resuelven. Contacta, escucha y anota qué se hizo.',
    detractores: 'Detractores: todas las calificaciones de 0 a 6.',
    todos: 'Todas las respuestas, de la más reciente a la más antigua.',
  };

  function init() {
    $('#canje').addEventListener('submit', canjear);
    $('#canje-codigo').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    $$('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
      filtro = b.dataset.filtro;
      $$('[data-filtro]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $('#nps-ayuda').textContent = AYUDA[filtro];
      cargarNps();
    }));
    $('#actualizar').addEventListener('click', () => { cargarResumen(); cargarNps(); });
    cargarResumen();
    cargarNps();
    // El código cambia a medianoche y las métricas se mueven durante el servicio.
    setInterval(() => { if (!document.hidden) cargarResumen(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
