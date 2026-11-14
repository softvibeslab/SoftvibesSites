/* Asesor de admisiones de Detailbox Academy: botón flotante + chat con el agente de ventas (perfil Hermes
   `detailbox-ventas`, vía POST /api/ventas). Embudo: conocer → orientar → cualificar → agendar → WhatsApp.
   La conversación vive solo en esta pestaña (sessionStorage); el servidor no la guarda. */
(() => {
  'use strict';
  const script = document.currentScript;
  const ORIGIN = ['inicio', 'pad', 'ecosistema'].includes(script?.dataset.origen) ? script.dataset.origen : 'inicio';
  const API = '/api/ventas';
  const KEY = 'dbx-asesor-v1';
  const WHATSAPP = '529841799401';
  const STEPS = [['conocer', 'Conocerte'], ['orientar', 'Orientarte'], ['cualificar', 'Tu perfil'], ['agendar', 'Agenda'], ['listo', 'WhatsApp']];
  const LABELS = { nombre: 'Nombre', ciudad: 'Ciudad', interes: 'Me interesa', perfil: 'Punto de partida', experiencia: 'Experiencia',
    negocio: 'Negocio', objetivo: 'Objetivo', cuando: 'Empezar', inversion: 'Inversión', decision: 'Decisión', cita: 'Cita',
    canal_cita: 'Medio', dudas: 'Dudas' };
  const GREETING = {
    inicio: ['¡Hola! Soy el **asesor de admisiones** de Detailbox Academy (un asistente de IA). Te ayudo a elegir tu curso y dejo lista tu cita con admisiones.\n\n¿Qué te gustaría lograr?',
      ['Aprender desde cero', 'Ya doy servicios', 'Especializarme en PPF o wrap', 'Estructurar mi negocio']],
    pad: ['¡Hola! Soy el **asesor de admisiones** de Detailbox Academy (un asistente de IA). Te ayudo a ver si el **Curso Método PAD** es para ti y dejo lista tu cita con admisiones.\n\n¿Cómo está hoy tu negocio de detailing?',
      ['Apenas voy a empezar', 'Tengo clientes, pero sin orden', 'Quiero vender más', 'Tengo dudas del curso']],
    ecosistema: ['¡Hola! Soy el **asesor de admisiones** de Detailbox Academy (un asistente de IA). Te oriento sobre el **Detailbox AI Ecosystem** y dejo lista tu solicitud de acceso anticipado.\n\n¿Qué tipo de negocio tienes?',
      ['Tengo un taller o estudio', 'Trabajo a domicilio', '¿Qué incluye cada nivel?', 'Aún no tengo negocio']],
  };
  const ICON = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Render seguro: escapa todo y luego aplica un markdown mínimo (párrafos, listas, negritas).
  function markdown(text) {
    const out = []; let list = null; let para = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
    for (const raw of String(text).replace(/\r/g, '').split('\n')) {
      const line = raw.trim().replace(/^#{1,4}\s+/, '');
      const bullet = line.match(/^[-*•]\s+(.*)$/); const ordered = line.match(/^\d+[.)]\s+(.*)$/);
      if (!line) { flushPara(); flushList(); continue; }
      if (bullet || ordered) {
        flushPara(); const t = bullet ? 'ul' : 'ol';
        if (list && list.t !== t) flushList();
        list ||= { t, items: [] }; list.items.push((bullet || ordered)[1]); continue;
      }
      flushList(); para.push(line);
    }
    flushPara(); flushList();
    return out.join('');
  }

  const fresh = () => ({ mensajes: [{ rol: 'assistant', texto: GREETING[ORIGIN][0], local: true }], opciones: GREETING[ORIGIN][1],
    ficha: {}, etapa: 'conocer', whatsapp: null, loading: false, error: null });
  let state;
  try { state = { ...fresh(), ...JSON.parse(sessionStorage.getItem(KEY) || 'null'), loading: false }; } catch { state = fresh(); }
  if (!Array.isArray(state.mensajes) || !state.mensajes.length) state = fresh();
  const save = () => { try { const { loading, ...keep } = state; sessionStorage.setItem(KEY, JSON.stringify(keep)); } catch { /* modo privado */ } };

  function fallbackUrl() {
    const lines = ['Hola Detailbox Academy, quiero información sobre sus cursos.'];
    for (const [k, label] of Object.entries(LABELS)) if (state.ficha[k]) lines.push(`• ${label}: ${state.ficha[k]}`);
    const message = lines.join('\n');
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  // ── DOM ─────────────────────────────────────────────────────────────
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'dbx-agent-launcher';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'dbx-agent');
  launcher.innerHTML = `<span class="dbx-agent-launcher__icon">${ICON.chat}</span><b>Asesor IA<small>Te orienta y agenda</small></b>`;

  const panel = document.createElement('section');
  panel.className = 'dbx-agent';
  panel.id = 'dbx-agent';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Asesor de admisiones de Detailbox Academy');
  panel.innerHTML = `
    <header class="dbx-agent__head">
      <span class="dbx-agent__avatar" aria-hidden="true">DB</span>
      <div class="dbx-agent__title"><b>Asesor de admisiones</b><span data-status>Asistente de IA · Detailbox Academy</span></div>
      <button class="dbx-agent__icon-btn" type="button" data-reset title="Empezar de nuevo" aria-label="Empezar de nuevo">${ICON.reset}</button>
      <button class="dbx-agent__icon-btn" type="button" data-close title="Cerrar" aria-label="Cerrar el asesor">${ICON.close}</button>
    </header>
    <ol class="dbx-agent__steps" aria-label="Avance">${STEPS.map(([id, label]) => `<li data-step="${id}">${label}</li>`).join('')}</ol>
    <div class="dbx-agent__log" data-log aria-live="polite"></div>
    <div class="dbx-agent__chips" data-chips></div>
    <div class="dbx-agent__handoff" data-handoff></div>
    <form class="dbx-agent__form" data-form>
      <label class="dbx-sr" for="dbx-agent-input" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Tu mensaje</label>
      <textarea id="dbx-agent-input" rows="1" maxlength="600" placeholder="Escribe tu respuesta…" autocomplete="off"></textarea>
      <button class="dbx-agent__send" type="submit" aria-label="Enviar">${ICON.send}</button>
    </form>
    <p class="dbx-agent__note">Respuestas generadas con IA; fechas, sede e inversión las confirma admisiones. No guardamos esta conversación: al final tú decides si envías tu ficha por WhatsApp.</p>`;
  document.body.append(launcher, panel);

  const log = panel.querySelector('[data-log]');
  const chips = panel.querySelector('[data-chips]');
  const handoff = panel.querySelector('[data-handoff]');
  const form = panel.querySelector('[data-form]');
  const input = panel.querySelector('textarea');
  const sendButton = panel.querySelector('.dbx-agent__send');
  const status = panel.querySelector('[data-status]');

  function render() {
    log.innerHTML = state.mensajes.map((m) => (m.rol === 'user'
      ? `<div class="dbx-msg dbx-msg--user"><p>${inline(m.texto)}</p></div>`
      : `<div class="dbx-msg dbx-msg--assistant">${markdown(m.texto)}</div>`)).join('')
      + (state.error ? `<div class="dbx-msg dbx-msg--notice" role="status">${esc(state.error)}</div>` : '')
      + (state.loading ? '<div class="dbx-msg dbx-msg--assistant" role="status" aria-label="El asesor está escribiendo"><span class="dbx-typing"><i></i><i></i><i></i></span></div>' : '');
    log.scrollTop = log.scrollHeight;

    chips.innerHTML = state.loading ? '' : (state.opciones || []).map((o) => `<button class="dbx-chip" type="button">${esc(o)}</button>`).join('');

    const current = STEPS.findIndex(([id]) => id === state.etapa);
    panel.querySelectorAll('[data-step]').forEach((li, i) => {
      li.classList.toggle('is-done', i < current);
      li.classList.toggle('is-current', i === current);
      li.toggleAttribute('aria-current', i === current);
    });

    const wa = state.whatsapp;
    const fields = Object.entries(LABELS).filter(([k]) => state.ficha[k]);
    if (wa?.listo) {
      handoff.innerHTML = `<details><summary>Ver mi ficha (${fields.length} datos)</summary><dl>${fields.map(([k, l]) => `<dt>${esc(l)}</dt><dd>${esc(state.ficha[k])}</dd>`).join('')}</dl></details>
        <a class="dbx-wa" href="${esc(wa.url)}" target="_blank" rel="noopener">Enviar mi ficha por WhatsApp ↗</a>`;
    } else {
      handoff.innerHTML = `<a class="dbx-wa dbx-wa--soft" href="${esc(wa?.url || fallbackUrl())}" target="_blank" rel="noopener">¿Prefieres hablar ya con una persona? Ir a WhatsApp${fields.length ? ' con lo que llevamos' : ''} ↗</a>`;
    }
    input.disabled = sendButton.disabled = state.loading;
  }

  async function send(text) {
    text = String(text || '').trim().slice(0, 600);
    if (!text || state.loading) return;
    state.mensajes.push({ rol: 'user', texto: text });
    state.opciones = []; state.error = null; state.loading = true;
    input.value = ''; autosize(); render(); save();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 80000);
    try {
      const response = await fetch(API, {
        method: 'POST', credentials: 'omit', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ origen: ORIGIN, ficha: state.ficha, mensajes: state.mensajes.slice(-16).map(({ rol, texto }) => ({ rol, texto })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.whatsapp) state.whatsapp = { ...data.whatsapp, listo: false };
        state.error = data.error || (response.status === 404 ? 'El asesor no está disponible en esta página. Escríbenos por WhatsApp.' : 'No pude responder. Intenta de nuevo o continúa por WhatsApp.');
        status.dataset.state = response.status === 503 || response.status === 404 ? 'off' : '';
        return;
      }
      state.mensajes.push({ rol: 'assistant', texto: data.respuesta });
      Object.assign(state, { ficha: data.ficha || {}, etapa: data.etapa || state.etapa, opciones: data.opciones || [], whatsapp: data.whatsapp || null });
      status.dataset.state = '';
    } catch {
      state.error = 'Se tardó demasiado o se perdió la conexión. Intenta de nuevo o continúa por WhatsApp.';
    } finally {
      clearTimeout(timer);
      state.loading = false; render(); save();
      if (!matchMedia('(max-width: 560px)').matches) input.focus();
    }
  }

  function autosize() { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 110)}px`; }

  let lastFocus = null;
  function open() {
    teaser?.remove();
    lastFocus = document.activeElement;
    panel.hidden = false; launcher.setAttribute('aria-expanded', 'true');
    document.body.classList.add('dbx-agent-open');
    render();
    try { sessionStorage.setItem(`${KEY}-visto`, '1'); } catch { /* modo privado */ }
    if (!matchMedia('(max-width: 560px)').matches) setTimeout(() => input.focus(), 50); // en celular, sin abrir el teclado
  }
  function close() {
    panel.hidden = true; launcher.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('dbx-agent-open');
    (lastFocus && document.contains(lastFocus) ? lastFocus : launcher).focus();
  }

  launcher.addEventListener('click', open);
  panel.querySelector('[data-close]').addEventListener('click', close);
  panel.querySelector('[data-reset]').addEventListener('click', () => { if (state.loading) return; state = fresh(); save(); render(); input.focus(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(); } });
  chips.addEventListener('click', (event) => { const chip = event.target.closest('.dbx-chip'); if (chip) send(chip.textContent); });
  form.addEventListener('submit', (event) => { event.preventDefault(); send(input.value); });
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(input.value); } });
  document.querySelectorAll('[data-open-asesor]').forEach((el) => el.addEventListener('click', (event) => { event.preventDefault(); open(); }));

  // Invitación discreta, una vez por sesión.
  let teaser = null;
  let seen = false;
  try { seen = sessionStorage.getItem(`${KEY}-visto`) === '1'; } catch { /* modo privado */ }
  if (!seen) {
    setTimeout(() => {
      if (!panel.hidden) return;
      teaser = document.createElement('div');
      teaser.className = 'dbx-agent-teaser';
      teaser.setAttribute('aria-hidden', 'true');
      teaser.textContent = ORIGIN === 'pad' ? '¿Te ayudo a ver si el curso PAD es para ti?' : ORIGIN === 'ecosistema' ? '¿Te explico qué nivel le queda a tu negocio?' : '¿Te ayudo a elegir tu curso?';
      teaser.addEventListener('click', open);
      document.body.append(teaser);
      setTimeout(() => teaser?.remove(), 12000);
      try { sessionStorage.setItem(`${KEY}-visto`, '1'); } catch { /* modo privado */ }
    }, 7000);
  }
})();
