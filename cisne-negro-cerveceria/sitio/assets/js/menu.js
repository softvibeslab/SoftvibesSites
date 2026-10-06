/* Cervecería Cisne Negro · Menú digital, Pasaporte Cisne y NPS
 * - Catálogo desde /data/menu.json (fuente única; no se inventan datos).
 * - Maridaje en ambos sentidos: barril → "Va perfecto con…", platillo → "Pídelo con…".
 * - Filtro por perfil (barril + latas) y constructor del Vuelo del Cisne.
 * - Pasaporte (registro, entrada, check-in con código del día, cortesías) y NPS contra /api.
 */
(() => {
  'use strict';

  const DATA_URL = '/data/menu.json';
  const TOKEN_KEY = 'cisne.pasaporte.token';
  const PERFILES = ['lupulada', 'oscura', 'acida', 'ligera'];
  const PERFIL_LABEL = { lupulada: 'Lupulada', oscura: 'Oscura', acida: 'Ácida', ligera: 'Ligera' };
  const ASK = '¿Por qué se llama así? Pregúntale a tu bartender.';
  const VUELO_N = 4;
  const PREMIOS = { 5: '4 oz', 10: '12 oz' };   // casillas premiadas del Pasaporte (ver club_server.RECOMPENSAS)

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    data: null, dishes: {}, filtro: null, vuelo: [],
    token: safeGet(TOKEN_KEY), socio: null, visitaId: null, npsScore: null,
  };

  // ── Utilidades ─────────────────────────────────────────────────────────────
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* modo privado */ } }

  /** Crea un elemento. attrs: class, text, html no se usa (todo es textContent). */
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
  function svgUse(id, cls) {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.setAttribute('viewBox', '0 0 24 48');
    if (cls) s.setAttribute('class', cls);
    const u = document.createElementNS(ns, 'use');
    u.setAttribute('href', '#' + id);
    s.append(u);
    return s;
  }
  function checkSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', 'M5 12.5l4.2 4.2L19 7'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '3'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    s.append(p);
    return s;
  }
  const money = (n) => '$' + Number(n).toLocaleString('es-MX');
  const abv = (n) => Number(n).toFixed(1) + '% ABV';
  const precio4oz = (b) => (b.precios || []).find((p) => /^4\s*oz$/i.test(p.medida));
  const fechaLarga = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
  const soloDigitos = (s) => String(s || '').replace(/\D/g, '');
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Las hamburguesas y sándwiches se llaman "De X" en el menú; fuera de su sección necesitan contexto.
  // Misma regla que la landing (assets/js/landing.js).
  function dishLabel(item) {
    const name = item.nombre;
    if (/^De /.test(name) && item.img) {
      const lower = 'de ' + name.slice(3);
      if (/^hambur/.test(item.img)) return 'Hamburguesa ' + lower;
      if (/^san_/.test(item.img)) return 'Sándwich ' + lower;
    }
    return name;
  }

  // ── Catálogo ───────────────────────────────────────────────────────────────
  async function cargarMenu() {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('menu ' + res.status);
    return res.json();
  }

  function renderBarril() {
    const { barril, perfiles } = state.data;
    const lista = $('#lista-barril');
    lista.replaceChildren();
    barril.forEach((b, i) => {
      const pairs = (b.marida_con || []).map((id) => state.dishes[id]).filter(Boolean);
      const card = h('article', { class: 'tap', id: 'barril-' + b.id, 'data-perfil': b.perfil, 'aria-labelledby': 'tn-' + b.id },
        h('div', { class: 'tap__top' },
          h('span', { class: 'tap__num', text: String(i + 1).padStart(2, '0') }),
          b.perfil && h('span', { class: 'chip chip--' + b.perfil }, h('span', { class: 'dot dot--' + b.perfil }), PERFIL_LABEL[b.perfil] || b.perfil)),
        h('h3', { class: 'tap__name', id: 'tn-' + b.id, text: b.nombre }),
        h('p', { class: 'tap__meta', text: [b.estilo, abv(b.abv)].filter(Boolean).join(' · ') }),
        b.cerveceria && h('p', { class: 'tap__guest', text: 'Invitada de ' + b.cerveceria }),
        b.notas && h('p', { class: 'tap__notes', text: b.notas }),
        b.perfil && perfiles[b.perfil] && h('p', { class: 'tap__profile', text: 'Perfil: ' + perfiles[b.perfil] }),
        (b.historia || '').trim()
          ? h('p', { class: 'tap__story', text: b.historia.trim() })
          : h('p', { class: 'tap__story tap__story--ask', text: ASK }),
        h('ul', { class: 'tap__prices', 'aria-label': 'Precios' },
          (b.precios || []).map((p) => h('li', null, h('span', { text: p.medida }), h('b', { text: money(p.precio) })))),
        pairs.length > 0 && h('div', { class: 'marida' },
          h('p', { class: 'marida__t', text: 'Va perfecto con…' }),
          h('ul', { class: 'marida__lista' }, pairs.map((d) => h('li', null,
            h('a', { class: 'mini', href: '#plato-' + d.id },
              d.img && h('img', { src: '/assets/img/menu/' + d.img, alt: '', width: 112, height: 112, loading: 'lazy', decoding: 'async' }),
              h('span', { class: 'mini__n', text: dishLabel(d) }),
              h('span', { class: 'mini__p', text: money(d.precio) })))))));
      lista.append(card);
    });
    lista.append(h('p', { class: 'vacio', id: 'barril-vacio', hidden: true }));
  }

  function renderFiltros() {
    const { perfiles } = state.data;
    $$('[data-filtro]').forEach((box) => {
      box.replaceChildren(
        h('div', { class: 'filtro__chips' },
          h('button', { type: 'button', class: 'filtro__btn', 'data-perfil-btn': '', 'aria-pressed': 'true', text: 'Todas' }),
          PERFILES.filter((p) => perfiles[p]).map((p) => h('button', {
            type: 'button', class: 'filtro__btn', 'data-perfil-btn': p, 'aria-pressed': 'false',
          }, h('span', { class: 'dot dot--' + p }), PERFIL_LABEL[p]))),
        h('p', { class: 'filtro__desc', 'aria-live': 'polite' }));
    });
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-perfil-btn]');
      if (!btn) return;
      const p = btn.getAttribute('data-perfil-btn') || null;
      aplicarFiltro(state.filtro === p ? null : p);
    });
    aplicarFiltro(null, true);
  }

  function aplicarFiltro(perfil, silencioso) {
    state.filtro = perfil;
    const { perfiles } = state.data;
    $$('[data-perfil-btn]').forEach((b) => b.setAttribute('aria-pressed', String((b.getAttribute('data-perfil-btn') || null) === perfil)));
    let nB = 0; let nL = 0;
    $$('#lista-barril .tap').forEach((c) => { const ok = !perfil || c.dataset.perfil === perfil; c.hidden = !ok; if (ok) nB++; });
    $$('#lista-latas .row').forEach((r) => { const ok = !perfil || r.dataset.perfil === perfil; r.hidden = !ok; if (ok) nL++; });
    $$('#lista-latas .grupo').forEach((g) => { g.hidden = !!perfil && g.dataset.perfil !== perfil; });
    const vacio = $('#barril-vacio');
    vacio.hidden = nB > 0;
    vacio.textContent = perfil ? `Hoy no hay ${PERFIL_LABEL[perfil].toLowerCase()} en barril. Mira las latas o pregunta en la barra.` : '';
    $$('.filtro__desc').forEach((d) => {
      d.replaceChildren();
      if (!perfil) { d.textContent = 'Toca un perfil para filtrar el barril y las latas.'; return; }
      d.append(h('b', { text: PERFIL_LABEL[perfil] + ': ' }), perfiles[perfil] + '. ',
        `${nB} de barril · ${nL} en lata o botella.`);
    });
    if (!silencioso) { /* aria-live de .filtro__desc ya anuncia el cambio */ }
  }

  function renderLatas() {
    const { latas, perfiles } = state.data;
    const cont = $('#lista-latas');
    cont.replaceChildren();
    const orden = [...PERFILES, ...new Set(latas.map((l) => l.perfil).filter((p) => !PERFILES.includes(p)))];
    orden.forEach((p) => {
      const items = latas.filter((l) => (l.perfil || 'otras') === p);
      if (!items.length) return;
      cont.append(h('div', { class: 'grupo', 'data-perfil': p },
        h('div', { class: 'grupo__h' },
          h('h3', null, h('span', { class: 'dot dot--' + p }), PERFIL_LABEL[p] || p),
          perfiles[p] && h('p', { text: perfiles[p] })),
        h('ul', { class: 'rows' }, items.map((l) => h('li', { class: 'row', 'data-perfil': p },
          h('div', null,
            h('span', { class: 'row__n', text: l.nombre }),
            h('span', { class: 'row__e', text: [l.estilo, abv(l.abv)].filter(Boolean).join(' · ') }),
            h('span', { class: 'row__o', text: [l.cerveceria, l.origen].filter(Boolean).join(' · ') })),
          h('span', { class: 'row__p', text: money(l.precio) }))))));
    });
  }

  function renderComida() {
    const { comida, barril } = state.data;
    const cont = $('#lista-comida');
    cont.replaceChildren();
    comida.forEach((sec, si) => {
      const hid = 'sec-comida-' + si;
      cont.append(h('section', { class: 'seccion', 'aria-labelledby': hid },
        h('h3', { class: 'seccion__h', id: hid, text: sec.seccion }),
        h('ul', { class: 'platos' }, (sec.items || []).map((d) => {
          const con = barril.filter((b) => (b.marida_con || []).includes(d.id));
          return h('li', { class: 'plato', id: 'plato-' + d.id },
            d.img
              ? h('img', { class: 'plato__img', src: '/assets/img/menu/' + d.img, alt: 'Foto del platillo ' + dishLabel(d), width: 400, height: 400, loading: 'lazy', decoding: 'async' })
              : h('span', { class: 'plato__img', 'aria-hidden': 'true' }),
            h('div', { class: 'plato__body' },
              h('div', { class: 'plato__top' },
                h('h4', { class: 'plato__n', text: d.nombre }),
                h('span', { class: 'plato__p', text: money(d.precio) })),
              d.descripcion && h('p', { class: 'plato__d', text: d.descripcion })),
            con.length > 0 && h('p', { class: 'pidelo' },
              h('span', { class: 'pidelo__t', text: 'Pídelo con…' }),
              con.map((b) => h('a', { href: '#barril-' + b.id, 'data-barril': b.id },
                h('span', { class: 'dot dot--' + b.perfil }), b.nombre))));
        }))));
    });
  }

  function renderSinAlcohol() {
    $('#lista-sin').replaceChildren(...state.data.sin_alcohol.map((s) => h('li', { class: 'row' },
      h('div', null, h('span', { class: 'row__n', text: s.nombre }), s.detalle && h('span', { class: 'row__o', text: s.detalle })),
      h('span', { class: 'row__p', text: money(s.precio) }))));
  }

  function renderPie() {
    const n = state.data.negocio;
    $('#horario tbody').replaceChildren(...(n.horario || []).map((r) => h('tr', { class: /cerrado/i.test(r.horas) ? 'off' : null },
      h('th', { scope: 'row', text: r.dias }), h('td', { text: r.horas }))));
    $('#direccion').textContent = n.direccion || '';
    const wa = $('#pie-wa'); if (n.whatsapp_url) wa.href = n.whatsapp_url; else wa.hidden = true;
    const mapa = $('#pie-mapa'); if (n.google_maps_url) mapa.href = n.google_maps_url; else mapa.hidden = true;
  }

  // Si un ancla apunta a una cerveza oculta por el filtro, quita el filtro antes de saltar.
  function anclasMaridaje() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#barril-"], a[href^="#plato-"]');
      if (!a) return;
      const dest = document.getElementById(a.getAttribute('href').slice(1));
      if (dest && dest.hidden) aplicarFiltro(null);
    });
  }

  // Pestañas pegajosas: resalta la sección visible.
  function scrollSpy() {
    const links = $$('.tabs a');
    const byId = Object.fromEntries(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const visibles = new Map();
    const marcar = (id) => {
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = byId[id]; if (!a) return;
      a.setAttribute('aria-current', 'true');
      const nav = a.closest('.tabs__in');
      const left = a.offsetLeft - 16;
      if (left < nav.scrollLeft || a.offsetLeft + a.offsetWidth > nav.scrollLeft + nav.clientWidth) {
        nav.scrollTo({ left, behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
    };
    let fijoHasta = 0;   // tras tocar una pestaña, respeta la elección mientras dura el desplazamiento
    const ids = Object.keys(byId);
    const actualizar = () => {
      if (Date.now() < fijoHasta) return;
      const alFondo = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const id = alFondo ? ids[ids.length - 1] : ids.find((x) => visibles.get(x));
      if (id) marcar(id);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => visibles.set(en.target.id, en.isIntersecting));
      actualizar();
    }, { rootMargin: '-120px 0px -55% 0px' });
    window.addEventListener('scroll', () => { if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) actualizar(); }, { passive: true });
    links.forEach((a) => a.addEventListener('click', () => { marcar(a.getAttribute('href').slice(1)); fijoHasta = Date.now() + 1200; }));
    Object.keys(byId).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  // ── Vuelo del Cisne ────────────────────────────────────────────────────────
  function renderVuelo() {
    const v = state.data.vuelo || {};
    $('#t-vuelo').textContent = v.nombre || 'Vuelo del Cisne';
    $('#vuelo-desc').textContent = v.descripcion || '';
    $('#vuelo-nota').textContent = v.nota || '';
    const opciones = state.data.barril.filter(precio4oz);
    $('#vuelo-opciones').replaceChildren(...opciones.map((b) => h('li', null,
      h('button', { type: 'button', class: 'opcion', 'data-vuelo': b.id, 'aria-pressed': 'false' },
        h('span', { class: 'opcion__box' }, checkSvg()),
        h('span', null, h('span', { class: 'opcion__n', text: b.nombre }), h('span', { class: 'opcion__e', text: [b.estilo, abv(b.abv)].join(' · ') })),
        h('span', { class: 'opcion__p', text: money(precio4oz(b).precio) })))));

    $('#vuelo-opciones').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-vuelo]');
      if (!btn || btn.disabled) return;
      const id = btn.dataset.vuelo;
      const i = state.vuelo.indexOf(id);
      if (i >= 0) state.vuelo.splice(i, 1);
      else if (state.vuelo.length < VUELO_N) state.vuelo.push(id);
      pintarVuelo();
    });
    $('#vuelo-vasos').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quitar]');
      if (!btn) return;
      state.vuelo = state.vuelo.filter((x) => x !== btn.dataset.quitar);
      pintarVuelo();
    });
    $('#vuelo-vaciar').addEventListener('click', () => { state.vuelo = []; pintarVuelo(); });
    $('#vuelo-mostrar').addEventListener('click', mostrarVuelo);
    $$('#vuelo-tarjeta [data-cerrar]').forEach((b) => b.addEventListener('click', () => $('#vuelo-tarjeta').close()));
    $('#vuelo-tarjeta').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    pintarVuelo(true);
  }

  const beerById = (id) => state.data.barril.find((b) => b.id === id);
  const totalVuelo = () => state.vuelo.reduce((s, id) => s + precio4oz(beerById(id)).precio, 0);

  function pintarVuelo(inicial) {
    const n = state.vuelo.length;
    const lleno = n === VUELO_N;
    $$('#vuelo-opciones [data-vuelo]').forEach((b) => {
      const sel = state.vuelo.includes(b.dataset.vuelo);
      b.setAttribute('aria-pressed', String(sel));
      b.disabled = lleno && !sel;
    });
    const vasos = [];
    for (let i = 0; i < VUELO_N; i++) {
      const b = beerById(state.vuelo[i]);
      vasos.push(h('li', null, b
        ? h('button', { type: 'button', class: 'vaso vaso--lleno vaso--' + b.perfil, 'data-quitar': b.id, 'aria-label': `Vaso ${i + 1}: ${b.nombre}. Toca para quitarla` },
          h('span', { class: 'vaso__copa' }), h('span', { class: 'vaso__n', text: b.nombre }))
        : h('div', { class: 'vaso' }, h('span', { class: 'vaso__copa' }), h('span', { class: 'vaso__n vaso__n--vacio', text: `Vaso ${i + 1}` }))));
    }
    $('#vuelo-vasos').replaceChildren(...vasos);
    $('#vuelo-total').textContent = money(totalVuelo());
    if (!inicial) {
      $('#vuelo-estado').textContent = lleno
        ? `¡Listo! Tu vuelo suma ${money(totalVuelo())}.`
        : `Llevas ${n} de ${VUELO_N}. ${n ? 'Elige ' + (VUELO_N - n) + ' más.' : ''}`;
    } else {
      $('#vuelo-estado').textContent = `Elige ${VUELO_N} cervezas de barril.`;
    }
    $('#vuelo-mostrar').disabled = !lleno;
    $('#vuelo-vaciar').disabled = n === 0;
  }

  function mostrarVuelo() {
    if (state.vuelo.length !== VUELO_N) return;
    $('#vcard-lista').replaceChildren(...state.vuelo.map((id) => {
      const b = beerById(id);
      return h('li', null,
        h('span', null, h('span', { class: 'vcard__n', text: b.nombre }), h('span', { class: 'vcard__e', text: [b.estilo, abv(b.abv)].join(' · ') })),
        h('span', { class: 'vcard__p', text: money(precio4oz(b).precio) }));
    }));
    $('#vcard-total').textContent = money(totalVuelo());
    $('#vuelo-tarjeta').showModal();
  }

  // ── API del club ───────────────────────────────────────────────────────────
  class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

  async function api(path, body) {
    const headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    let res;
    try {
      res = await fetch('/api' + path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    } catch (e) {
      throw new ApiError(0, 'No hay conexión. Revisa tu internet e inténtalo otra vez.');
    }
    let data = {};
    try { data = await res.json(); } catch (e) { /* respuesta sin JSON */ }
    if (!res.ok) throw new ApiError(res.status, data.error || 'Algo salió mal. Inténtalo otra vez.');
    return data;
  }

  // ── Pasaporte ──────────────────────────────────────────────────────────────
  const dlg = () => $('#pasaporte');

  function msg(texto) { $('#pase-msg').textContent = texto || ''; }
  function err(texto) { $('#pase-err').textContent = texto || ''; }

  function abrirPasaporte() {
    const d = dlg();
    if (!d.open) d.showModal();
    pintarPasaporte();
    const foco = state.socio
      ? ($('#checkin-form').hidden ? $('#pase-t') : $('#checkin-codigo'))
      : $('#tab-registro[aria-selected="true"], #tab-entrar[aria-selected="true"]');
    if (foco) { if (foco === $('#pase-t')) foco.setAttribute('tabindex', '-1'); foco.focus(); }
  }
  function cerrarPasaporte() { dlg().close(); }

  function onCerrado() {
    if (location.hash === '#pasaporte') history.replaceState(null, '', location.pathname + location.search);
    msg(''); err('');
    $('#abrir-pasaporte').focus({ preventScroll: true });
  }

  function guardarSesion(token, socio) {
    state.token = token; safeSet(TOKEN_KEY, token);
    state.socio = socio;
  }
  function cerrarSesionLocal() {
    state.token = null; safeSet(TOKEN_KEY, null);
    state.socio = null; state.visitaId = null;
  }
  function sesionVencida() {
    cerrarSesionLocal();
    pintarPasaporte();
    err('Tu sesión venció. Vuelve a entrar con tu teléfono y PIN.');
    elegirTab('entrar');
  }

  function pintarBoton() {
    const c = $('#pase-sellos');
    const btn = $('#abrir-pasaporte');
    if (state.socio) {
      c.hidden = false;
      c.textContent = `${state.socio.sellos_ciclo}/${state.socio.ciclo}`;
      btn.setAttribute('aria-label', `Pasaporte Cisne: ${state.socio.sellos_ciclo} de ${state.socio.ciclo} sellos`);
    } else {
      c.hidden = true;
      btn.removeAttribute('aria-label');
    }
  }

  function pintarPasaporte(opts = {}) {
    pintarBoton();
    const s = state.socio;
    $('#pase-invitado').hidden = !!s;
    $('#pase-socio').hidden = !s;
    if (!s) return;

    $('#pase-hola').textContent = '¡Hola, ' + s.nombre.split(' ')[0] + '!';
    pintarSellos(s, opts.nuevo);

    const prog = $('#pase-prog');
    prog.replaceChildren();
    if (s.sellos_ciclo >= s.ciclo) {
      prog.append('¡Completaste tu Pasaporte! Tu siguiente visita empieza uno nuevo.');
    } else if (s.proxima_recompensa) {
      const f = s.proxima_recompensa.faltan;
      prog.append(`Te ${f === 1 ? 'falta 1 visita' : 'faltan ' + f + ' visitas'} para tu ${s.proxima_recompensa.nombre.charAt(0).toLowerCase() + s.proxima_recompensa.nombre.slice(1)}.`);
    }
    prog.append(h('span', { class: 'mono', text: `${s.visitas} ${s.visitas === 1 ? 'visita' : 'visitas'} en total · tel. •••• ${s.telefono_final}` }));

    const yaHoy = !!s.visita_hoy;
    if (yaHoy) state.visitaId = s.visita_hoy;
    $('#checkin-inicio').hidden = yaHoy || !$('#checkin-form').hidden;
    if (yaHoy) $('#checkin-form').hidden = true;
    $('#checkin-hecho').hidden = !yaHoy;

    // NPS: solo con visita de hoy y si no lo ha contestado; no mientras se muestra la recompensa.
    const npsVisible = yaHoy && !s.nps_hoy && $('#premio').hidden && $('#nps-gracias').hidden;
    if (npsVisible && $('#nps').hidden) resetNps();
    $('#nps').hidden = !npsVisible;

    const rs = s.recompensas || [];
    $('#cortesias-bloque').hidden = rs.length === 0;
    $('#cortesias').replaceChildren(...rs.map((r) => h('li', null,
      h('span', { class: 'mono', text: r.codigo }),
      h('b', { text: r.nombre.replace(/ de cortesía$/, '') }),
      h('small', { text: 'Vigente hasta el ' + fechaLarga(r.vence_at) + '. Muéstraselo al equipo.' }))));
  }

  function pintarSellos(s, nuevo) {
    const lista = $('#sellos');
    const items = [];
    for (let i = 1; i <= s.ciclo; i++) {
      const lleno = i <= s.sellos_ciclo;
      const premio = PREMIOS[i];
      const cls = ['sello', lleno && 'sello--lleno', premio && 'sello--premio', lleno && nuevo === i && !reduceMotion() && 'sello--nuevo'].filter(Boolean).join(' ');
      const label = `Visita ${i}${premio ? ', premio de ' + premio : ''}: ${lleno ? 'sellada' : 'pendiente'}`;
      items.push(h('li', { class: cls, 'aria-label': label },
        lleno ? svgUse('pluma') : h('span', { 'aria-hidden': 'true', text: String(i) }),
        premio && h('span', { class: 'sello__tag', 'aria-hidden': 'true', text: premio })));
    }
    lista.replaceChildren(...items);
    lista.setAttribute('aria-label', `Sellos de este ciclo: ${s.sellos_ciclo} de ${s.ciclo}`);
  }

  function elegirTab(cual) {
    const reg = cual === 'registro';
    $('#tab-registro').setAttribute('aria-selected', String(reg));
    $('#tab-entrar').setAttribute('aria-selected', String(!reg));
    $('#tab-registro').tabIndex = reg ? 0 : -1;
    $('#tab-entrar').tabIndex = reg ? -1 : 0;
    $('#form-registro').hidden = !reg;
    $('#form-entrar').hidden = reg;
  }

  function marcarInvalido(input, invalido) {
    if (invalido) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function ocupado(form, si) {
    $$('button, input, textarea', form).forEach((x) => { x.disabled = si; });
    form.setAttribute('aria-busy', String(si));
  }

  async function enviarRegistro(e) {
    e.preventDefault();
    const f = e.currentTarget;
    err(''); msg('');
    const nombre = f.nombre.value.trim();
    const tel = soloDigitos(f.telefono.value).replace(/^52(?=\d{10}$)/, '');
    const pin = soloDigitos(f.pin.value);
    const checks = [
      [f.nombre, !nombre, 'Escribe tu nombre.'],
      [f.telefono, tel.length !== 10, 'El teléfono debe tener 10 dígitos.'],
      [f.pin, !/^\d{4}$/.test(pin), 'El PIN son 4 números.'],
      [f.acepta_privacidad, !f.acepta_privacidad.checked, 'Necesitamos que aceptes el aviso de privacidad.'],
    ];
    checks.forEach(([el, bad]) => marcarInvalido(el, bad));
    const malo = checks.find(([, bad]) => bad);
    if (malo) { err(malo[2]); malo[0].focus(); return; }
    ocupado(f, true);
    try {
      const r = await api('/registro', { nombre, telefono: tel, pin, acepta_privacidad: true, acepta_whatsapp: f.acepta_whatsapp.checked });
      guardarSesion(r.token, r.socio);
      f.reset();
      pintarPasaporte();
      msg(`¡Listo, ${r.socio.nombre.split(' ')[0]}! Tu Pasaporte ya está activo.`);
      $('#checkin-abrir').focus();
    } catch (ex) {
      err(ex.message);
      if (ex.status === 409) { elegirTab('entrar'); $('#l-tel').value = tel; $('#l-pin').focus(); }
    } finally { ocupado(f, false); }
  }

  async function enviarLogin(e) {
    e.preventDefault();
    const f = e.currentTarget;
    err(''); msg('');
    const tel = soloDigitos(f.telefono.value).replace(/^52(?=\d{10}$)/, '');
    const pin = soloDigitos(f.pin.value);
    marcarInvalido(f.telefono, tel.length !== 10);
    marcarInvalido(f.pin, !/^\d{4}$/.test(pin));
    if (tel.length !== 10) { err('El teléfono debe tener 10 dígitos.'); f.telefono.focus(); return; }
    if (!/^\d{4}$/.test(pin)) { err('El PIN son 4 números.'); f.pin.focus(); return; }
    ocupado(f, true);
    try {
      const r = await api('/login', { telefono: tel, pin });
      guardarSesion(r.token, r.socio);
      f.reset();
      pintarPasaporte();
      msg(`¡Qué gusto verte, ${r.socio.nombre.split(' ')[0]}!`);
      if (state.socio.visita_hoy) { $('#pase-t').setAttribute('tabindex', '-1'); $('#pase-t').focus(); }
      else $('#checkin-abrir').focus();
    } catch (ex) {
      err(ex.message);
    } finally { ocupado(f, false); }
  }

  function abrirCheckin() {
    err(''); msg('');
    $('#checkin-inicio').hidden = true;
    $('#checkin-form').hidden = false;
    const inp = $('#checkin-codigo');
    inp.value = ''; marcarInvalido(inp, false);
    inp.focus();
  }
  function cancelarCheckin() {
    $('#checkin-form').hidden = true;
    $('#checkin-inicio').hidden = false;
    err('');
    $('#checkin-abrir').focus();
  }

  async function enviarCheckin(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const inp = $('#checkin-codigo');
    const codigo = soloDigitos(inp.value);
    err(''); msg('');
    if (codigo.length !== 4) { marcarInvalido(inp, true); err('El código del día son 4 números.'); inp.focus(); return; }
    ocupado(f, true);
    try {
      const r = await api('/checkin', { codigo });
      marcarInvalido(inp, false);
      state.socio = r.socio;
      state.visitaId = r.visita_id;
      $('#checkin-form').hidden = true;
      if (r.ya_registrada) {
        msg('Tu visita de hoy ya estaba registrada.');
        pintarPasaporte();
      } else if (r.recompensa) {
        mostrarPremio(r.recompensa);
        pintarPasaporte({ nuevo: r.socio.sellos_ciclo });
        msg(`¡Sellado! Visita ${r.socio.visitas} registrada.`);
        $('#premio').focus();
      } else {
        pintarPasaporte({ nuevo: r.socio.sellos_ciclo });
        msg(`¡Sellado! Visita ${r.socio.visitas} registrada.`);
        if (!$('#nps').hidden) setTimeout(() => $('#nps').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }), reduceMotion() ? 0 : 700);
      }
    } catch (ex) {
      if (ex.status === 401) return sesionVencida();
      marcarInvalido(inp, true);
      err(ex.message);
      inp.select();
    } finally {
      ocupado(f, false);
      if (!$('#checkin-form').hidden) inp.focus();
    }
  }

  function mostrarPremio(r) {
    $('#premio-nombre').textContent = r.nombre;
    $('#premio-codigo').textContent = r.codigo;
    $('#premio-vence').textContent = 'Vigente hasta el ' + fechaLarga(r.vence_at);
    $('#premio').hidden = false;
  }
  function seguirDespuesPremio() {
    $('#premio').hidden = true;
    pintarPasaporte();
    const nps = $('#nps');
    if (!nps.hidden) { nps.focus(); nps.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); }
    else $('#pase-t').focus();
  }

  // ── NPS ────────────────────────────────────────────────────────────────────
  function construirEscala() {
    const box = $('#nps-escala');
    box.setAttribute('role', 'radiogroup');
    box.setAttribute('aria-label', 'Del 0, nada probable, al 10, muy probable');
    for (let i = 0; i <= 10; i++) {
      box.append(h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', 'data-score': i, tabindex: i === 0 ? 0 : -1, text: String(i) }));
    }
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-score]');
      if (b) elegirScore(Number(b.dataset.score));
    });
    box.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const cur = state.npsScore == null ? -1 : state.npsScore;
      let n = e.key === 'Home' ? 0 : e.key === 'End' ? 10 : Math.min(10, Math.max(0, cur + keys[e.key]));
      if (cur === -1 && keys[e.key] === -1) n = 0;
      elegirScore(n, true);
    });
  }
  function elegirScore(n, foco) {
    state.npsScore = n;
    $$('#nps-escala [data-score]').forEach((b) => {
      const on = Number(b.dataset.score) === n;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && foco) b.focus();
    });
    $('#nps-enviar').disabled = false;
  }
  function resetNps() {
    state.npsScore = null;
    $$('#nps-escala [data-score]').forEach((b, i) => { b.setAttribute('aria-checked', 'false'); b.tabIndex = i === 0 ? 0 : -1; });
    $('#nps-comentario').value = '';
    $('#nps-enviar').disabled = true;
  }

  async function enviarNps(e) {
    e.preventDefault();
    const f = e.currentTarget;
    if (state.npsScore == null) { err('Elige un número del 0 al 10.'); return; }
    const visita = state.visitaId || (state.socio && state.socio.visita_hoy);
    err(''); msg('');
    ocupado(f, true);
    try {
      const score = state.npsScore;
      const r = await api('/nps', { visita_id: visita, score, comentario: $('#nps-comentario').value.trim() });
      if (state.socio) state.socio.nps_hoy = true;
      $('#nps').hidden = true;
      const t = $('#gracias-t'); const p = $('#gracias-p'); const btn = $('#resena');
      btn.hidden = true;
      if (r.ya_respondida) {
        t.textContent = '¡Gracias!'; p.textContent = 'Ya nos habías respondido hoy.';
      } else if (r.invitar_resena && r.resena_url) {
        t.textContent = '¡Gracias!';
        p.textContent = '¿Nos ayudas contándolo en Google? Así más gente encuentra el Cisne.';
        btn.href = r.resena_url; btn.hidden = false;
      } else if (score >= 7) {
        t.textContent = '¡Gracias por contarnos!'; p.textContent = 'Nos sirve para seguir mejorando. ¡Salud!';
      } else {
        t.textContent = 'Gracias por decírnoslo.'; p.textContent = 'El equipo lo va a revisar.';
      }
      $('#nps-gracias').hidden = false;
      $('#nps-gracias').focus();
    } catch (ex) {
      if (ex.status === 401) return sesionVencida();
      err(ex.message);
    } finally { ocupado(f, false); if (state.npsScore != null) $('#nps-enviar').disabled = false; }
  }

  function clickResena() {
    // El enlace abre la reseña en otra pestaña por sí mismo; aquí solo se registra el clic.
    const visita = state.visitaId || (state.socio && state.socio.visita_hoy);
    try {
      fetch('/api/resena-click', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.token },
        body: JSON.stringify({ visita_id: visita }),
      }).catch(() => {});
    } catch (e) { /* sin red: no bloquea la reseña */ }
  }

  async function salir() {
    const tok = state.token;
    cerrarSesionLocal();
    $('#premio').hidden = true; $('#nps-gracias').hidden = true; $('#checkin-form').hidden = true;
    pintarPasaporte();
    msg('Saliste de tu Pasaporte. ¡Vuelve pronto!');
    elegirTab('entrar');
    $('#tab-entrar').focus();
    if (tok) {
      try { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: '{}' }); } catch (e) { /* ya se cerró en el dispositivo */ }
    }
  }

  async function cargarSocio() {
    if (!state.token) { pintarPasaporte(); return; }
    try {
      const r = await api('/yo');
      state.socio = r.socio;
    } catch (ex) {
      if (ex.status === 401) cerrarSesionLocal();
    }
    pintarPasaporte();
  }

  function iniciarPasaporte() {
    const d = dlg();
    $('#abrir-pasaporte').addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#pasaporte'); abrirPasaporte(); });
    $$('[data-cerrar]', d).forEach((b) => b.addEventListener('click', cerrarPasaporte));
    d.addEventListener('click', (e) => { if (e.target === d) cerrarPasaporte(); });
    d.addEventListener('close', onCerrado);
    window.addEventListener('hashchange', () => { if (location.hash === '#pasaporte') abrirPasaporte(); });

    $('#tab-registro').addEventListener('click', () => { err(''); elegirTab('registro'); });
    $('#tab-entrar').addEventListener('click', () => { err(''); elegirTab('entrar'); });
    $('.seg').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const reg = $('#tab-registro').getAttribute('aria-selected') === 'true';
      elegirTab(reg ? 'entrar' : 'registro');
      (reg ? $('#tab-entrar') : $('#tab-registro')).focus();
    });
    $('#form-registro').addEventListener('submit', enviarRegistro);
    $('#form-entrar').addEventListener('submit', enviarLogin);
    $$('.pin, #checkin-codigo, input[type="tel"]').forEach((i) => i.addEventListener('input', () => {
      const max = i.classList.contains('pin') || i.id === 'checkin-codigo' ? 4 : 14;
      const limpio = i.type === 'tel' ? i.value.replace(/[^\d\s+()-]/g, '') : soloDigitos(i.value).slice(0, max);
      if (limpio !== i.value) i.value = limpio;
      marcarInvalido(i, false);
    }));

    $('#checkin-abrir').addEventListener('click', abrirCheckin);
    $('#checkin-cancelar').addEventListener('click', cancelarCheckin);
    $('#checkin-form').addEventListener('submit', enviarCheckin);
    $('#premio-seguir').addEventListener('click', seguirDespuesPremio);
    construirEscala();
    $('#nps').addEventListener('submit', enviarNps);
    $('#resena').addEventListener('click', clickResena);
    $('#salir').addEventListener('click', salir);

    cargarSocio().then(() => { if (location.hash === '#pasaporte') abrirPasaporte(); });
  }

  // ── Arranque ───────────────────────────────────────────────────────────────
  async function init() {
    iniciarPasaporte();
    try {
      state.data = await cargarMenu();
    } catch (e) {
      $('#cargando').textContent = 'No pudimos cargar el menú. Revisa tu conexión y recarga la página.';
      return;
    }
    state.dishes = {};
    (state.data.comida || []).forEach((s) => (s.items || []).forEach((it) => { state.dishes[it.id] = it; }));
    renderBarril();
    renderLatas();
    renderFiltros();
    renderVuelo();
    renderComida();
    renderSinAlcohol();
    renderPie();
    anclasMaridaje();
    $('#cargando').remove();
    $$('main > .msec, #pie').forEach((s) => { s.hidden = false; });
    scrollSpy();
    // Si se llegó con un ancla a una sección o platillo, recoloca la vista ya con contenido.
    const hash = location.hash.slice(1);
    if (hash && hash !== 'pasaporte') { const t = document.getElementById(hash); if (t) t.scrollIntoView(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
