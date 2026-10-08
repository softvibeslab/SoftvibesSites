/* Batería funcional del menú, Pasaporte, NPS, ranking, panel, Mi pedido (con QR para el mesero), Wi-Fi y app
 * instalable (Playwright + Chromium).
 * No la corras contra producción: crea socios, visitas y NPS.
 * Uso recomendado: tests/funcional/correr.sh  (levanta un servidor con base desechable).
 * Variables: BASE_URL (default http://127.0.0.1:8095), QA_DIR (capturas; default sitio/qa/funcional/).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const jsQR = require('../../sitio/assets/js/lib/jsqr.js');
const RAIZ = path.join(__dirname, '..', '..');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8095';
if (/softvibes\.art|https:/.test(BASE)) { console.error('Esta batería escribe datos: no se corre contra producción.'); process.exit(2); }
const QA = (process.env.QA_DIR || path.join(__dirname, '..', '..', 'sitio', 'qa', 'funcional')) + '/';
fs.mkdirSync(QA, { recursive: true });
const res = [];
const ok = (nombre, cond, extra = '') => { res.push([cond ? 'PASS' : 'FAIL', nombre, extra]); console.log(cond ? 'PASS' : 'FAIL', nombre, extra); };
const MOV = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function nuevaPagina(b, opts) {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  p.errores = [];
  p.on('pageerror', (e) => p.errores.push(e.message));
  return { ctx, p };
}
async function registrar(p, nombre, tel, pin) {
  await p.goto(BASE + '/menu/#pasaporte');
  await p.waitForSelector('#pase-invitado:not([hidden])');
  await p.fill('#r-nombre', nombre); await p.fill('#r-tel', tel); await p.fill('#r-pin', pin); await p.check('#r-priv');
  await p.click('#form-registro button[type=submit]');
  await p.waitForSelector('#pase-socio:not([hidden])');
}
async function checkin(p, codigo) {
  await p.click('#checkin-abrir'); await p.fill('#checkin-codigo', codigo);
  await p.click('#checkin-form button[type=submit]');
  await p.waitForSelector('#checkin-hecho:not([hidden])');
  if (await p.isVisible('#premio')) await p.click('#premio-seguir');
}
/** Lee el QR dibujado en SVG (módulos "Mx yh1v1h-1z") y lo decodifica con jsQR, como la cámara del mesero. */
async function leerQR(p, sel) {
  const { lado, d } = await p.$eval(sel, (svg) => ({ lado: Number(svg.getAttribute('viewBox').split(' ')[2]), d: svg.querySelector('path').getAttribute('d') }));
  const e = 6; const w = lado * e;
  const px = new Uint8ClampedArray(w * w * 4).fill(255);
  for (const [, x, y] of d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    for (let yy = y * e; yy < (+y + 1) * e; yy++) for (let xx = x * e; xx < (+x + 1) * e; xx++) { const i = (yy * w + xx) * 4; px[i] = px[i + 1] = px[i + 2] = 0; }
  }
  const r = jsQR(px, w, w);
  return r ? r.data : null;
}
const socioVisible = async (p) => (await p.isVisible('#pase-socio')) && !(await p.isVisible('#pase-invitado'));

(async () => {
  const b = await chromium.launch();
  const admin = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const codigo = (await (await admin.request.get(BASE + '/api/admin/resumen')).json()).codigo_del_dia;

  // ── 1. Persistencia ────────────────────────────────────────────────────
  {
    const { ctx, p } = await nuevaPagina(b, MOV);
    await registrar(p, 'Rocío Paredes', '7712000001', '4321');
    await p.reload(); await p.waitForTimeout(600);
    ok('1a Registro → recargar: sigue dentro', await socioVisible(p));
    const cookies = await ctx.cookies();
    const c = cookies.find((x) => x.name === 'cn_sesion');
    ok('1a Cookie cn_sesion HttpOnly de ~180 días', !!c && c.httpOnly && (c.expires - Date.now() / 1000) > 179 * 86400, c ? `expira en ${Math.round((c.expires - Date.now() / 1000) / 86400)} días` : 'sin cookie');
    await p.evaluate(() => localStorage.clear());
    await p.reload(); await p.waitForTimeout(800);
    ok('1b localStorage borrado → recargar: sigue dentro por la cookie', await socioVisible(p));
    await checkin(p, codigo);
    ok('1b Check-in registrado', await p.isVisible('#checkin-hecho'));
    await p.route('**/api/yo', (r) => r.fulfill({ status: 503, body: '<html>503</html>' }));
    await p.reload(); await p.waitForTimeout(800);
    ok('1c /api/yo 503 → sigue dentro', await socioVisible(p));
    ok('1c /api/yo 503 → aviso de sin conexión', await p.isVisible('#pase-red'), await p.textContent('#pase-red-t'));
    await p.screenshot({ path: QA + 'v2-menu-390-sinred.png' });
    await p.unroute('**/api/yo');
    await p.route('**/api/yo', (r) => r.abort('internetdisconnected'));
    await p.reload(); await p.waitForTimeout(800);
    ok('1c Red caída (fetch falla) → sigue dentro con aviso', (await socioVisible(p)) && (await p.isVisible('#pase-red')));
    await p.unroute('**/api/yo');
    await p.evaluate(() => window.dispatchEvent(new Event('online'))); await p.waitForTimeout(600);
    ok('1c Al volver la red el aviso desaparece', !(await p.isVisible('#pase-red')));
    // Tarjeta del socio con "#N este mes"
    await p.reload(); await p.waitForTimeout(700);
    ok('3  Tarjeta muestra "#N este mes"', await p.isVisible('#pase-rank'), await p.textContent('#pase-rank'));
    await p.screenshot({ path: QA + 'v2-menu-390-pasaporte.png' });
    // ── 3. Ranking (con este socio) ──
    await p.click('#ptab-ranking'); await p.waitForSelector('#rank-lista li'); await p.waitForTimeout(300);
    const yo = await p.textContent('#rank-yo');
    ok('3  "Tú vas en el lugar N de M"', /Tú vas en el lugar #\d+ de \d+/.test(yo), yo.trim());
    const filas = await p.$$eval('#rank-lista .rank__fila', (els) => els.map((e) => e.textContent.trim()));
    ok('3  Top con podio (1–3) y ≥3 socios', filas.length >= 3 && (await p.$$('.rank__fila--podio')).length === Math.min(3, filas.length), filas.slice(0, 4).join(' | '));
    ok('3  El socio aparece en el ranking público (marcado "Tú")', (await p.$$('.rank__fila--yo')).length === 1);
    await p.screenshot({ path: QA + 'v2-menu-390-ranking.png' });
    await p.click('[data-periodo="semana"]'); await p.waitForTimeout(400);
    ok('3  Selector Semana', (await p.getAttribute('[data-periodo="semana"]', 'aria-pressed')) === 'true', (await p.textContent('#rank-estado')).trim());
    await p.click('[data-periodo="mes"]'); await p.waitForTimeout(300);
    await p.click('#rank-switch'); await p.waitForTimeout(700);
    const pub = await (await admin.request.get(BASE + '/api/ranking?periodo=mes')).json();
    ok('3  Interruptor apagado → no aparece en el ranking público', (await p.getAttribute('#rank-switch', 'aria-checked')) === 'false' && !pub.ranking.some((f) => f.alias === 'Rocío P.'));
    ok('3  …pero sigue viendo su lugar', /Tú vas en el lugar/.test(await p.textContent('#rank-yo')));
    await p.screenshot({ path: QA + 'v2-menu-390-ranking-oculto.png' });
    await p.click('#rank-switch'); await p.waitForTimeout(700);
    const pub2 = await (await admin.request.get(BASE + '/api/ranking?periodo=mes')).json();
    ok('3  Interruptor encendido → vuelve a aparecer', pub2.ranking.some((f) => f.alias === 'Rocío P.'));
    // ── Salir ──
    await p.click('#ptab-pase'); await p.click('#salir'); await p.waitForTimeout(500);
    await p.reload(); await p.waitForTimeout(700);
    ok('1d Salir → recargar: pide login', (await p.isVisible('#pase-invitado')) && !(await p.isVisible('#pase-socio')));
    ok('1d Cookie borrada al salir', !(await ctx.cookies()).some((x) => x.name === 'cn_sesion' && x.value));
    // Ranking sin sesión
    await p.click('#ptab-ranking'); await p.waitForTimeout(500);
    ok('3  Ranking visible sin sesión', (await p.$$('#rank-lista .rank__fila')).length >= 3);
    ok('—  Sin errores JS (persistencia/ranking)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
  }

  // ── 2. NPS → Google con 3, 8 y 10 ─────────────────────────────────────
  const esperado = {
    3: ['detractor', 'Gracias por decírnoslo', 'El equipo lo va a revisar. También puedes dejar tu opinión en Google.'],
    8: ['pasivo', 'Gracias', 'Si quieres, cuéntanos tu experiencia en Google.'],
    10: ['promotor', '¡Gracias!', '¿Nos ayudas contándolo en Google?'],
  };
  let i = 0;
  for (const score of [3, 8, 10]) {
    const { ctx, p } = await nuevaPagina(b, MOV);
    await registrar(p, ['Nadia Detra', 'Pablo Pasivo', 'Pilar Promo'][i], '771400000' + i, '1111');
    await checkin(p, codigo);
    await p.waitForSelector('#nps:not([hidden])');
    if (score === 3) await p.screenshot({ path: QA + 'v2-menu-390-nps.png' });
    await p.click(`#nps-escala [data-score="${score}"]`);
    await p.fill('#nps-comentario', score === 3 ? 'Tardaron mucho en servir' : '');
    await p.click('#nps-enviar');
    await p.waitForSelector('#nps-gracias:not([hidden])');
    const t = (await p.textContent('#gracias-t')).trim(); const tx = (await p.textContent('#gracias-p')).trim();
    const href = await p.getAttribute('#resena', 'href');
    const visible = await p.isVisible('#resena');
    ok(`2  NPS ${score} (${esperado[score][0]}): texto correcto y botón a Google`, t === esperado[score][1] && tx === esperado[score][2] && visible && /google\.com\/maps/.test(href), `«${t} ${tx}» · botón «${(await p.textContent('#resena-t')).trim()}» · target=${await p.getAttribute('#resena', 'target')}`);
    ok(`2  NPS ${score}: sin premio por reseñar`, !/premio|cortes|regalo|gratis/i.test(t + tx));
    const [popup] = await Promise.all([ctx.waitForEvent('page'), p.click('#resena')]);
    await popup.close();
    await p.screenshot({ path: QA + `v2-menu-390-nps-${esperado[score][0]}.png` });
    await p.reload(); await p.waitForTimeout(600);
    ok(`2  NPS ${score}: tras recargar no vuelve a pedir login ni el NPS`, (await socioVisible(p)) && !(await p.isVisible('#nps')));
    ok(`—  Sin errores JS (NPS ${score})`, p.errores.length === 0, p.errores.join(' / '));
    await ctx.close(); i++;
  }
  const est = await (await admin.request.get(BASE + '/api/admin/estadisticas?semanas=8')).json();
  ok('2  Los clics a Google se registran (/api/resena-click)', est.kpis.clicks_resena >= 19 + 3, `clics=${est.kpis.clicks_resena}`);

  // ── 4. Panel ───────────────────────────────────────────────────────────
  const pe = []; admin.on('pageerror', (e) => pe.push(e.message));
  const tabs = ['hoy', 'estadisticas', 'nps', 'miembros', 'ranking'];
  await admin.goto(BASE + '/admin/');
  for (const t of tabs) {
    await admin.click('#tab-' + t); await admin.waitForTimeout(600);
    ok(`4  Pestaña ${t}: visible y en el hash`, (await admin.isVisible('#panel-' + t)) && admin.url().endsWith('#' + t));
  }
  await admin.reload(); await admin.waitForTimeout(500);
  ok('4  Recargar conserva la pestaña (hash)', await admin.isVisible('#panel-ranking'));
  await admin.focus('#tab-ranking'); await admin.keyboard.press('ArrowLeft'); await admin.waitForTimeout(400);
  ok('4  Flechas del teclado cambian de pestaña', (await admin.isVisible('#panel-miembros')) && admin.url().endsWith('#miembros'));

  // Estadísticas
  await admin.goto(BASE + '/admin/#estadisticas'); await admin.waitForTimeout(800);
  const nKpi = (await admin.$$('#kpis .kpi')).length; const nSvg = (await admin.$$('.graf__svg')).length; const nBar = (await admin.$$('.graf__barra')).length;
  ok('4  Estadísticas con datos (KPIs, 5 gráficas, barras)', nKpi === 9 && nSvg === 5 && nBar > 20, `kpis=${nKpi} svg=${nSvg} barras=${nBar}`);
  await admin.click('[data-semanas="26"]'); await admin.waitForTimeout(600);
  ok('4  Selector 26 semanas', (await admin.$$eval('#graf-semanal .graf:first-child tbody tr', (r) => r.length)) === 26);
  const svg = (await admin.$$('.graf__svg'))[0]; await svg.hover({ position: { x: 300, y: 120 } }); await admin.waitForTimeout(200);
  ok('4  Tooltip al pasar el cursor', await admin.isVisible('.graf__tip:not([hidden])'), (await admin.textContent('.graf__tip:not([hidden])')).trim());
  await admin.click('[data-semanas="12"]'); await admin.waitForTimeout(600);
  await admin.click('#graf-historico details summary');
  ok('4  "Ver datos en tabla"', await admin.isVisible('#graf-historico details table'));

  // Miembros: alta → PIN una vez
  await admin.goto(BASE + '/admin/#miembros'); await admin.waitForTimeout(500);
  await admin.click('#alta button[type=submit]');
  ok('4  Alta: valida campos', /nombre/i.test(await admin.textContent('#alta-err')));
  await admin.fill('#a-nombre', 'Tomás Barrera'); await admin.fill('#a-tel', '771 500 0001'); await admin.check('#a-priv');
  await admin.click('#alta button[type=submit]'); await admin.waitForSelector('#alta-pin:not([hidden])');
  const pin1 = (await admin.textContent('#alta-pin-v')).trim();
  ok('4  Alta: muestra el PIN generado', /^\d{4}$/.test(pin1), pin1);
  await admin.screenshot({ path: QA + 'v2-admin-1280-alta-pin.png' });
  await admin.click('#alta-pin-ok');
  ok('4  PIN se oculta al confirmar', !(await admin.isVisible('#alta-pin')));
  await admin.fill('#a-nombre', 'Duplicado'); await admin.fill('#a-tel', '7715000001'); await admin.check('#a-priv');
  await admin.click('#alta button[type=submit]'); await admin.waitForTimeout(400);
  ok('4  Error de la API se muestra (teléfono duplicado)', (await admin.textContent('#alta-err')).includes('Ese teléfono ya está registrado.'));
  await admin.fill('#a-nombre', ''); await admin.fill('#a-tel', '');
  await admin.fill('#socios-q', 'Tomás'); await admin.waitForTimeout(700);
  ok('4  Búsqueda de miembros', (await admin.$$('#socios-tabla tbody tr')).length === 1);
  await admin.click('#socios-tabla tbody tr button.btn'); await admin.waitForSelector('#ficha[open] .fi-sec');
  // Editar datos
  await admin.fill('#fi-notas', 'Le gusta la Red IPA'); await admin.uncheck('#ficha input[name=mostrar_ranking]');
  await admin.click('#ficha form button[type=submit]'); await admin.waitForTimeout(600);
  const det = await (await admin.request.get(BASE + '/api/admin/socios?q=Tomás')).json();
  ok('4  Editar socio (notas + ranking)', det.socios[0].notas === 'Le gusta la Red IPA' && det.socios[0].mostrar_ranking === 0);
  // Registrar visita
  await admin.click('text=Registrar visita de hoy'); await admin.waitForTimeout(600);
  ok('4  Registrar visita desde el panel', /Visita de hoy registrada/.test(await admin.textContent('#fi-msg')) && (await admin.$$('#ficha .fi-lista li')).length >= 1);
  // Restablecer PIN
  await admin.click('text=Restablecer PIN'); await admin.click('#cf-si'); await admin.waitForSelector('#ficha .pin-once:not([hidden])');
  const pin2 = (await admin.textContent('#ficha .pin-once__v')).trim();
  ok('4  Restablecer PIN muestra el nuevo', /^\d{4}$/.test(pin2), `${pin1} → ${pin2}`);
  await admin.screenshot({ path: QA + 'v2-admin-1280-ficha.png' });
  {
    const { ctx, p } = await nuevaPagina(b, MOV);
    await p.goto(BASE + '/menu/#pasaporte'); await p.waitForSelector('#pase-invitado:not([hidden])');
    await p.click('#tab-entrar'); await p.fill('#l-tel', '7715000001'); await p.fill('#l-pin', pin2); await p.click('#form-entrar button[type=submit]');
    await p.waitForTimeout(800);
    ok('4  El socio entra con el PIN nuevo', await socioVisible(p));
    if (pin1 !== pin2) {
      const r = await p.request.post(BASE + '/api/login', { data: { telefono: '7715000001', pin: pin1 } });
      ok('4  El PIN anterior ya no sirve', r.status() === 401);
    }
    await ctx.close();
  }
  await admin.click('#ficha .drawer__top [data-cerrar]');
  // Borrar visita (desde la ficha)
  await admin.click('#socios-tabla tbody tr button.btn'); await admin.waitForSelector('#ficha[open] .fi-sec');
  const antes = (await admin.$$('#ficha .fi-sec:nth-of-type(3) .fi-lista li')).length;
  await admin.click('#ficha button[aria-label^="Borrar visita"]'); await admin.click('#cf-si'); await admin.waitForTimeout(700);
  ok('4  Borrar visita', /Visita borrada/.test(await admin.textContent('#fi-msg')) && /Sin visitas/.test(await admin.textContent('#fi-contenido')));
  // Borrar socio con confirmación fuerte
  await admin.click('text=Borrar socio…');
  ok('4  Borrar socio exige escribir el nombre', await admin.isDisabled('#cf-si'));
  await admin.fill('#cf-input', 'Tomás'); ok('4  …nombre incompleto no habilita', await admin.isDisabled('#cf-si'));
  await admin.screenshot({ path: QA + 'v2-admin-1280-borrar-socio.png' });
  await admin.fill('#cf-input', 'Tomás Barrera'); await admin.click('#cf-si'); await admin.waitForTimeout(700);
  const tras = await (await admin.request.get(BASE + '/api/admin/socios?q=7715000001')).json();
  ok('4  Socio borrado', tras.total === 0 && !(await admin.isVisible('#ficha')));

  // NPS: crear (papel) → editar → borrar
  await admin.goto(BASE + '/admin/#nps'); await admin.waitForTimeout(500);
  await admin.click('#nps-nuevo'); await admin.fill('#dn-buscar', 'Héctor'); await admin.waitForSelector('#dn-resultados label');
  await admin.click('#dn-escala label:has-text("4")');
  await admin.fill('#dn-comentario', 'Encuesta en papel: la música muy alta');
  await admin.screenshot({ path: QA + 'v2-admin-1280-nps-capturar.png' });
  await admin.click('#dn-guardar'); await admin.waitForTimeout(700);
  await admin.fill('#nps-q', 'música muy alta'); await admin.waitForTimeout(700);
  ok('4  NPS capturado en papel aparece en la tabla', (await admin.$$('#nps-tabla tbody tr')).length === 1 && /Capturado en papel/.test(await admin.textContent('#nps-tabla tbody')));
  ok('4  Detractor con enlace a WhatsApp wa.me/52…', /^https:\/\/wa\.me\/52\d{10}$/.test(await admin.getAttribute('#nps-tabla a.btn--wa', 'href')));
  await admin.click('#nps-tabla button:has-text("Editar")');
  await admin.click('#dn-escala label:has-text("7")'); await admin.selectOption('#dn-seg', 'contactado'); await admin.fill('#dn-notas', 'Se le llamó; bajamos el volumen');
  await admin.click('#dn-guardar'); await admin.waitForTimeout(700);
  const txt = await admin.textContent('#nps-tabla tbody');
  ok('4  Editar NPS (score, seguimiento, notas)', /Contactado/.test(txt) && /bajamos el volumen/.test(txt) && (await admin.textContent('#nps-tabla .score')).includes('7'));
  await admin.click('#nps-tabla button:has-text("Borrar")'); await admin.click('#cf-si'); await admin.waitForTimeout(700);
  ok('4  Borrar NPS', /0 respuestas/.test(await admin.textContent('#nps-estado')));
  await admin.fill('#nps-q', ''); await admin.waitForTimeout(600);
  await admin.click('[data-nps-filtro="pendientes"]'); await admin.waitForTimeout(500);
  ok('4  Filtro pendientes', (await admin.textContent('#nps-estado')).length > 0, (await admin.textContent('#nps-estado')).trim());
  await admin.click('[data-nps-filtro="todos"]'); await admin.waitForTimeout(500);
  ok('4  Paginación NPS', (await admin.$$('#nps-pager button')).length === 2, (await admin.textContent('#nps-pager')).trim());
  const csv = await admin.request.get(BASE + '/api/admin/nps.csv');
  ok('4  nps.csv descargable', csv.ok() && (await csv.text()).includes('score'));
  const csv2 = await admin.request.get(BASE + '/api/admin/socios.csv');
  ok('4  socios.csv descargable', csv2.ok() && (await csv2.text()).includes('telefono'));

  // Ranking del panel
  await admin.goto(BASE + '/admin/#ranking'); await admin.waitForTimeout(500);
  ok('4  Ranking del panel con nombre completo', /Ana María Ruiz/.test(await admin.textContent('#rank-tabla')));
  await admin.click('#rank-tabla tbody tr button.btn'); await admin.waitForSelector('#ficha[open] .fi-sec');
  ok('4  Ranking → ficha del socio', (await admin.textContent('#fi-t')).length > 2);
  await admin.keyboard.press('Escape');

  // 401
  await admin.route('**/api/admin/resumen*', (r) => r.fulfill({ status: 401, body: '' }));
  await admin.goto(BASE + '/admin/#hoy'); await admin.waitForTimeout(600);
  ok('4  401 → "Necesitas iniciar sesión"', /Necesitas iniciar sesión/.test(await admin.textContent('#aviso')));
  await admin.unroute('**/api/admin/resumen*');
  ok('—  Sin errores JS en el panel', pe.length === 0, pe.join(' / '));

  // Capturas del panel por pestaña
  for (const [w, nom] of [[1280, '1280'], [390, '390']]) {
    const pg = await (await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: w === 390 ? 2 : 1 })).newPage();
    for (const t of tabs) {
      await pg.goto(BASE + '/admin/#' + t); await pg.waitForTimeout(800);
      await pg.screenshot({ path: QA + `v2-admin-${nom}-${t}.png`, fullPage: true });
    }
    await pg.goto(BASE + '/admin/#miembros'); await pg.waitForTimeout(600);
    await pg.click('#socios-tabla tbody tr button.btn'); await pg.waitForSelector('#ficha[open] .fi-sec'); await pg.waitForTimeout(300);
    await pg.screenshot({ path: QA + `v2-admin-${nom}-ficha.png` });
  }

  // ── 5. Mi pedido, Wi-Fi y app instalable (v2) ──────────────────────────
  const QA2 = path.join(QA, '..') + '/';   // capturas v2-menu-*.png en sitio/qa/
  const menu = await (await admin.request.get(BASE + '/data/menu.json')).json();
  const b4 = (id) => menu.barril.find((x) => x.id === id).precios.find((x) => x.medida === '4 oz').precio;
  const dinero = (n) => '$' + Number(n).toLocaleString('es-MX');
  const STUB_WAKELOCK = () => {
    window.__wl = 0; window.__wlRel = 0;
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: {
      request: async () => { window.__wl++; const l = new EventTarget(); l.release = async () => { window.__wlRel++; }; return l; },
    } });
  };
  const textoAviso = async (p) => { await p.waitForFunction(() => document.querySelector('#pedido-aviso').textContent.length > 0); return (await p.textContent('#pedido-aviso')).trim(); };
  {
    const { ctx, p } = await nuevaPagina(b, MOV);
    await ctx.addInitScript(STUB_WAKELOCK);
    await p.goto(BASE + '/menu/'); await p.waitForSelector('#barril:not([hidden])');
    ok('5  Sin pedido no hay barra flotante', !(await p.isVisible('#pedido-barra')));
    const alarma = menu.barril.find((x) => x.id === 'alarma');
    const grande = alarma.precios[0];
    await p.click('#barril-alarma [data-agregar]');
    ok('5  Barril: aviso "Agregado: ¡Alarma! 12 oz" (aria-live)', (await textoAviso(p)) === `Agregado: ¡Alarma! ${grande.medida}` && (await p.getAttribute('#pedido-aviso', 'aria-live')) === 'polite', await p.textContent('#pedido-aviso'));
    await p.click('#barril-alarma .opc-chip[data-opcion="4 oz"]');
    ok('5  Chip de medida 4 oz seleccionado', (await p.getAttribute('#barril-alarma .opc-chip[data-opcion="4 oz"]', 'aria-pressed')) === 'true');
    await p.click('#barril-alarma [data-agregar]');
    await p.evaluate(() => document.querySelector('#barril-alarma .tap__pedir').scrollIntoView({ block: 'center' })); await p.waitForTimeout(3400);
    await p.screenshot({ path: QA2 + 'v2-menu-390-agregar.png' });
    const lata = menu.latas.find((x) => x.id === 'lata-loba-negra');
    await p.click('[data-agregar="lata"][data-id="lata-loba-negra"]');
    await p.click('#plato-chips-camote .opc-chip[data-opcion="110g"]');
    await p.click('#plato-chips-camote [data-agregar]');
    ok('5  Platillo con variante: "Chips de Camote 110 g"', (await textoAviso(p)) === 'Agregado: Chips de Camote 110 g');
    const vuelo = menu.barril.filter((x) => x.precios.some((y) => y.medida === '4 oz')).slice(0, 4).map((x) => x.id);
    ok('5  "Agregar vuelo al pedido" inactivo sin 4 cervezas', await p.isDisabled('#vuelo-agregar'));
    for (const id of vuelo) await p.click(`#vuelo-opciones [data-vuelo="${id}"]`);
    ok('5  …activo con 4 cervezas (y "Muéstraselo a tu mesero" se conserva)', !(await p.isDisabled('#vuelo-agregar')) && !(await p.isDisabled('#vuelo-mostrar')));
    await p.click('#vuelo-agregar');
    const totVuelo = vuelo.reduce((s, id) => s + b4(id), 0);
    const total1 = grande.precio + b4('alarma') + lata.precio + 135 + totVuelo;
    await p.waitForTimeout(200);
    const barra = (await p.textContent('#abrir-pedido')).replace(/\s+/g, ' ').trim();
    ok('5  Barra "Mi pedido · 5 · $total"', barra.includes('Mi pedido') && (await p.textContent('#pbar-n')) === '5' && (await p.textContent('#pbar-total')) === dinero(total1), barra);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(400);
    const tapa = await p.evaluate(() => {
      const bar = document.querySelector('.pbar__btn').getBoundingClientRect();
      const legal = document.querySelector('.mfoot__legal').getBoundingClientRect();
      return legal.bottom <= bar.top;
    });
    ok('5  La barra no tapa el final de la página', tapa);
    await p.screenshot({ path: QA2 + 'v2-menu-390-barra.png' });
    // Drawer
    await p.click('#abrir-pedido'); await p.waitForSelector('#pedido[open]');
    ok('5  Drawer: 5 líneas y foco en el título', (await p.$$('#pedido-lineas > li')).length === 5 && (await p.evaluate(() => document.activeElement.id)) === 'pedido-t');
    await p.click('#pedido-lineas > li:nth-child(1) [data-acc="mas"]');
    ok('5  ＋ sube la cantidad (y conserva el foco)', (await p.textContent('#pedido-lineas > li:nth-child(1) .cant__v')) === '2' && (await p.evaluate(() => document.activeElement.dataset.acc)) === 'mas');
    await p.click('#pedido-lineas > li:nth-child(1) [data-acc="mas"]');
    await p.click('#pedido-lineas > li:nth-child(1) [data-acc="menos"]');
    const chipsLi = p.locator('#pedido-lineas > li', { hasText: 'Chips de Camote' });
    await chipsLi.locator('[data-acc="nota"]').fill('Salsa aparte');
    await chipsLi.locator('[data-acc="nota"]').press('Enter');
    await p.fill('#pedido-mesa', '7');
    const total2 = total1 + grande.precio;
    ok('5  Total estimado del drawer', (await p.textContent('#pedido-total')) === dinero(total2), await p.textContent('#pedido-total'));
    await p.keyboard.press('Tab');
    await p.screenshot({ path: QA2 + 'v2-menu-390-drawer.png' });
    // Foco atrapado: Mayús+Tab desde el primer elemento va al último
    await p.focus('#pedido [data-cerrar]'); await p.keyboard.press('Shift+Tab');
    ok('5  Foco atrapado en el drawer', await p.evaluate(() => document.querySelector('#pedido').contains(document.activeElement)));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok('5  Esc cierra el drawer', !(await p.isVisible('#pedido')));
    // Recargar: persiste
    await p.reload(); await p.waitForSelector('#pedido-barra:not([hidden])');
    await p.click('#abrir-pedido'); await p.waitForSelector('#pedido[open]');
    const persist = await p.evaluate(() => ({
      n: document.querySelectorAll('#pedido-lineas > li').length,
      c: document.querySelector('#pedido-lineas > li .cant__v').textContent,
      nota: [...document.querySelectorAll('[data-acc="nota"]')].map((i) => i.value).filter(Boolean),
      mesa: document.querySelector('#pedido-mesa').value,
    }));
    ok('5  Recargar: pedido, cantidad, nota y mesa persisten', persist.n === 5 && persist.c === '2' && persist.nota.join() === 'Salsa aparte' && persist.mesa === '7', JSON.stringify(persist));
    // Mostrar al mesero
    await p.click('#pedido-mostrar'); await p.waitForSelector('#pedido-tarjeta[open]');
    const tarjeta = await p.evaluate(() => ({
      mesa: document.querySelector('#ptar-mesa').textContent,
      secciones: [...document.querySelectorAll('.ptar__sec')].map((s) => ({
        t: s.querySelector('.ptar__h').textContent,
        l: [...s.querySelectorAll('.ptar__lista > li')].map((li) => li.querySelector('.ptar__c').textContent + ' ' + li.querySelector('.vcard__n').textContent + ' ' + (li.querySelector('.vcard__e') ? li.querySelector('.vcard__e').textContent : '') + (li.querySelector('.ptar__nota') ? ' | ' + li.querySelector('.ptar__nota').textContent : '')),
      })),
      total: document.querySelector('#ptar-total').textContent,
      fine: document.querySelector('.ptar__fine').textContent,
      vuelo: [...document.querySelectorAll('.ptar__vuelo li')].length,
      ancho: document.querySelector('#pedido-tarjeta').getBoundingClientRect().width,
    }));
    const esperadoT = [
      { t: 'Bebidas', l: [`2× ¡Alarma! ${grande.medida}`, '1× ¡Alarma! 4 oz', '1× Vuelo del Cisne 4 × 4 oz', `1× ${lata.nombre} `] },
      { t: 'Comida', l: ['1× Chips de Camote 110 g | Nota: Salsa aparte'] },
    ];
    ok('5  Tarjeta: mesa, Bebidas (barril, vuelo, latas) y Comida con nota', tarjeta.mesa === 'Mesa 7' && JSON.stringify(tarjeta.secciones) === JSON.stringify(esperadoT) && tarjeta.vuelo === 4, JSON.stringify(tarjeta.secciones));
    ok('5  Tarjeta: total estimado y "El total final lo confirma tu mesero"', tarjeta.total === dinero(total2) && tarjeta.fine === 'El total final lo confirma tu mesero.');
    ok('5  Tarjeta a pantalla completa', tarjeta.ancho >= 389);
    ok('5  Wake Lock pedido al mostrar la tarjeta', (await p.evaluate(() => window.__wl)) === 1);
    await p.screenshot({ path: QA2 + 'v2-menu-390-tarjeta-mesero.png' });
    await p.click('#pedido-tarjeta [data-cerrar]'); await p.waitForTimeout(150);
    ok('5  "Volver" cierra la tarjeta, libera el Wake Lock y regresa al drawer', !(await p.isVisible('#pedido-tarjeta')) && (await p.evaluate(() => window.__wlRel)) === 1 && (await p.isVisible('#pedido')));
    await p.click('#pedido-mostrar'); await p.waitForSelector('#pedido-tarjeta[open]');
    await p.click('#ptar-listo'); await p.waitForTimeout(250);
    const vacio = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('cisne-pedido-v1') || '{"lineas":[]}').lineas.length; } catch (e) { return -1; } });
    ok('5  "Ya lo pedí" vacía el pedido y oculta la barra', vacio === 0 && !(await p.isVisible('#pedido-barra')) && !(await p.isVisible('#pedido')) && /Vaciamos tu pedido/.test(await textoAviso(p)));
    // Vaciar con confirmación
    await p.click('[data-agregar="lata"][data-id="lata-loba-negra"]');
    await p.click('#abrir-pedido'); await p.click('#pedido-vaciar');
    ok('5  "Vaciar" pide confirmación', (await p.isVisible('#pedido-confirma')) && (await p.$$('#pedido-lineas > li')).length === 1);
    await p.click('#pedido-confirma-si'); await p.waitForTimeout(150);
    ok('5  …y al confirmar vacía', (await p.isVisible('#pedido-vacio')) && !(await p.isVisible('#pedido-pie')));
    ok('—  Sin errores JS (Mi pedido)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
  }
  // Revalidación
  {
    const { ctx, p } = await nuevaPagina(b, MOV);
    await p.goto(BASE + '/menu/'); await p.waitForSelector('#barril:not([hidden])');
    await p.evaluate(() => localStorage.setItem('cisne-pedido-v1', JSON.stringify({ creado_at: new Date().toISOString(), mesa: '', lineas: [
      { tipo: 'barril', id: 'barril-que-roto', variante: '12 oz', cantidad: 1, nota: '', precio: 100, nombre: 'Barril de temporada', huella: '' },
      { tipo: 'lata', id: 'lata-loba-negra', variante: null, cantidad: 2, nota: '', precio: 1, nombre: 'Loba Negra', huella: '' },
      { tipo: 'comida', id: 'papas-cisne', variante: null, cantidad: 1, nota: '', precio: 75, nombre: 'Papas Cisne Negro', huella: '' },
    ] })));
    await p.reload(); await p.waitForSelector('#pedido-barra:not([hidden])');
    ok('5  Revalidación: la barra avisa que hay algo por revisar', /revisa/i.test(await p.getAttribute('#abrir-pedido', 'aria-label')));
    await p.click('#abrir-pedido'); await p.waitForSelector('#pedido[open]');
    const avisos = await p.$$eval('.pl__aviso p', (els) => els.map((e) => e.textContent.trim()));
    ok('5  Revalidación: "Ya no está en barril" y "Cambió el precio: $110"', avisos.length === 2 && avisos[0] === 'Ya no está en barril.' && avisos[1].startsWith('Cambió el precio: $110'), avisos.join(' | '));
    await p.screenshot({ path: QA2 + 'v2-menu-390-revalidacion.png' });
    await p.click('#pedido-mostrar');
    ok('5  Con avisos sin revisar no se muestra la tarjeta', !(await p.isVisible('#pedido-tarjeta')) && /Revisa los avisos/.test(await p.textContent('#pedido-err')));
    await p.click('.pl--aviso [data-acc="aceptar"]');
    await p.click('.pl--aviso [data-acc="quitar-aviso"]');
    ok('5  Aceptar precio y quitar lo agotado', (await p.$$('.pl--aviso')).length === 0 && (await p.textContent('#pedido-total')) === dinero(110 * 2 + 75));
    await p.click('#pedido-mostrar');
    ok('5  …después sí se muestra la tarjeta', await p.isVisible('#pedido-tarjeta'));
    ok('—  Sin errores JS (revalidación)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
  }
  // Escritorio 1440 con barra
  {
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: 1440, height: 900 } });
    await p.goto(BASE + '/menu/'); await p.waitForSelector('#barril:not([hidden])');
    await p.click('#barril-alarma [data-agregar]'); await p.click('#barril-henry-ix [data-agregar]');
    await p.click('#plato-papas-cisne [data-agregar]');
    await p.evaluate(() => document.querySelector('#barril-henry-ix').scrollIntoView({ block: 'center' })); await p.waitForTimeout(3500);
    ok('5  1440: botón Wi-Fi con texto visible', (await p.textContent('#abrir-wifi')).trim() === 'Wi-Fi' && (await p.$eval('.mbar__wifi-t', (e) => e.getBoundingClientRect().width > 20)));
    await p.screenshot({ path: QA2 + 'v2-menu-1440-barra.png' });
    await ctx.close();
  }


  // ── 6. QR del pedido para el mesero ────────────────────────────────────
  {
    const PEDIDO_QR = () => {
      if (location.pathname !== '/menu/' || localStorage.getItem('cisne-pedido-v1') || sessionStorage.getItem('qr-sembrado')) return;
      sessionStorage.setItem('qr-sembrado', '1');
      localStorage.setItem('cisne-pedido-v1', JSON.stringify({ creado_at: new Date().toISOString(), mesa: '7', lineas: [
        { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2, nota: 'Una sin espuma', precio: 100, nombre: '¡Alarma!', huella: '' },
        { tipo: 'comida', id: 'chips-camote', variante: '110g', cantidad: 1, nota: 'Salsa aparte, con piña', precio: 135, nombre: 'Chips de Camote', huella: '' },
      ] }));
    };
    const abrirQR = async (p) => {
      await p.goto(BASE + '/menu/'); await p.waitForSelector('#pedido-barra:not([hidden])');
      await p.click('#abrir-pedido'); await p.waitForSelector('#pedido[open]');
    };
    const contar = (p, re) => { const n = { v: 0 }; p.on('request', (r) => { if (re.test(r.url()) && (re.metodo ? r.method() === re.metodo : true)) n.v++; }); return n; };
    const PUERTO = new URL(BASE).port;
    // a) En línea: código real + QR legible con la URL ?p=
    const { ctx, p } = await nuevaPagina(b, MOV);
    await ctx.addInitScript(STUB_WAKELOCK); await ctx.addInitScript(PEDIDO_QR);
    const posts = contar(p, Object.assign(/\/api\/pedidos$/, { metodo: 'POST' }));
    const consultas = contar(p, /\/api\/pedidos\/[A-Z0-9]+\/estado$/);
    await abrirQR(p);
    await p.click('#pedido-mostrar'); await p.waitForSelector('#pedido-tarjeta[open]');
    const generando = await p.evaluate(() => document.querySelector('#ptar-qr').dataset.modo);
    await p.waitForSelector('#ptar-qr-img svg path'); await p.waitForSelector('#ptar-codigo:not([hidden])');
    const visto = (await p.textContent('#ptar-codigo')).trim();
    const codigoQR = visto.replace('-', '');
    ok('6  "Mostrar al mesero" genera un código en grupos de 4 (K7M2-Q9AB)', /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(visto) && posts.v === 1, `${visto} · modo inicial=${generando}`);
    const est = await (await admin.request.get(`${BASE}/api/pedidos/${codigoQR}/estado`)).json();
    ok('6  El código es un pedido real pendiente en /api/pedidos/<c>/estado', est.estado === 'pendiente', JSON.stringify(est));
    const leido = await leerQR(p, '#ptar-qr-img svg');
    ok('6  jsQR lee el QR del DOM: URL /equipo/?p=<código>', leido === `${BASE}/equipo/?p=${codigoQR}`, leido);
    const textos = await p.evaluate(() => ({ t: document.querySelector('#ptar-qr-t').textContent, n: document.querySelector('#ptar-qr-nota').textContent, fondo: document.querySelector('#ptar-qr-img rect').getAttribute('fill'), tinta: document.querySelector('#ptar-qr-img path').getAttribute('fill') }));
    ok('6  Textos y QR negro sobre crema', textos.t === 'Muéstrale este código a tu mesero' && textos.n === 'Tu mesero lo escanea con la app del equipo.' && textos.fondo === '#F3EDE2' && textos.tinta === '#0E0D0B', JSON.stringify(textos));
    const geo = await p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      return { cab: r('.ptar__cab').top, qr: r('#ptar-qr-img').bottom, codigo: r('#ptar-codigo').bottom, acc: r('.ptar__acc').top, alto: innerHeight, scroll: document.querySelector('#pedido-tarjeta').scrollTop };
    });
    ok('6  390×844: cabecera, QR y código visibles sin scroll (sin tapar con los botones)', geo.scroll === 0 && geo.cab >= 0 && geo.codigo <= geo.acc && geo.acc <= geo.alto, JSON.stringify(geo));
    ok('6  La tarjeta conserva el pedido y el Wake Lock', (await p.$$('.ptar__lista > li')).length === 2 && (await p.evaluate(() => window.__wl)) === 1);
    await p.screenshot({ path: QA2 + 'menu-qr-390.png' });
    // b) Reabrir sin cambios conserva el código; cambiar algo crea uno nuevo
    for (let k = 0; k < 40 && consultas.v < 1; k++) await p.waitForTimeout(200);   // primera consulta a los 5 s
    await p.click('#pedido-tarjeta [data-cerrar]'); await p.waitForTimeout(150);
    const tras = consultas.v; await p.waitForTimeout(6000);
    ok('6  Al cerrar la tarjeta deja de consultar el estado', consultas.v === tras && tras >= 1, `consultas=${tras}`);
    await p.click('#pedido-mostrar'); await p.waitForSelector('#ptar-codigo:not([hidden])');
    ok('6  Reabrir sin cambios conserva el mismo código (sin otro POST)', (await p.textContent('#ptar-codigo')).trim() === visto && posts.v === 1);
    await p.click('#pedido-tarjeta [data-cerrar]');
    await p.click('#pedido-lineas > li:nth-child(1) [data-acc="mas"]');
    await p.click('#pedido-mostrar'); await p.waitForFunction((v) => { const c = document.querySelector('#ptar-codigo'); return !c.hidden && c.textContent && c.textContent !== v; }, visto);
    const visto2 = (await p.textContent('#ptar-codigo')).trim();
    ok('6  Si cambió el pedido, crea un código nuevo', visto2 !== visto && posts.v === 2, `${visto} → ${visto2}`);
    // c) Pestaña oculta: pausa el sondeo; al volver consulta de inmediato
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(5600); const ocultas = consultas.v; await p.waitForTimeout(5600);
    const enPausa = consultas.v === ocultas;
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(400);
    ok('6  Con la pestaña oculta no consulta; al volver consulta enseguida', enPausa && consultas.v === ocultas + 1, `${ocultas} → ${consultas.v}`);
    // d) El mesero lo toma desde su app → "Pedido tomado por Luis" y el pedido local se vacía
    try {
      execFileSync('python3', ['backend/club_server.py', 'crear-staff', 'luis.demo', 'Luis Demo', 'mesero', '222222'], { cwd: RAIZ, env: { ...process.env, CLUB_DB: `backend/dev-${PUERTO}.db` }, stdio: 'pipe' });
    } catch (e) { /* ya existe (segunda corrida sobre la misma base) */ }
    const mesero = await b.newContext();
    const login = await mesero.request.post(BASE + '/api/equipo/login', { data: { usuario: 'luis.demo', pin: '222222' } });
    const tomar = await mesero.request.post(`${BASE}/api/equipo/pedidos/${visto2.replace('-', '')}/tomar`, { data: { mesa: '7' } });
    ok('6  El mesero inicia sesión y toma el pedido (API del equipo)', login.ok() && tomar.ok(), `login=${login.status()} tomar=${tomar.status()}`);
    await p.waitForSelector('#ptar-tomado:not([hidden])', { timeout: 9000 }).catch(() => {});
    const tomado = await p.evaluate(() => ({
      t: document.querySelector('#ptar-tomado-t').textContent,
      qr: !document.querySelector('#ptar-qr-img').hidden,
      lineas: JSON.parse(localStorage.getItem('cisne-pedido-v1') || '{"lineas":[]}').lineas.length,
      listo: !document.querySelector('#ptar-ok').hidden, ya: !document.querySelector('#ptar-listo').hidden, volver: !document.querySelector('#pedido-tarjeta [data-cerrar]').hidden,
      foco: document.activeElement.id,
    }));
    ok('6  La tarjeta muestra "✓ Pedido tomado por Luis" en lugar del QR', tomado.t === 'Pedido tomado por Luis' && !tomado.qr, JSON.stringify(tomado));
    ok('6  …el pedido local queda vacío y solo queda "Listo" (con el foco)', tomado.lineas === 0 && tomado.listo && !tomado.ya && !tomado.volver && tomado.foco === 'ptar-ok' && !(await p.isVisible('#pedido-barra')));
    await p.screenshot({ path: QA2 + 'menu-qr-tomado-390.png' });
    await p.click('#ptar-ok'); await p.waitForTimeout(250);
    ok('6  "Listo" cierra la tarjeta y el drawer, y suelta el Wake Lock', !(await p.isVisible('#pedido-tarjeta')) && !(await p.isVisible('#pedido')) && (await p.evaluate(() => window.__wlRel)) >= 1 && /tu pedido ya está con el equipo/i.test(await textoAviso(p)));
    ok('—  Sin errores JS (QR en línea)', p.errores.length === 0, p.errores.join(' / '));
    await mesero.close(); await ctx.close();
  }
  {
    // e) Sin internet o 5xx: el QR lleva el pedido completo (#d=) y no se consulta el estado
    for (const [nombre, falla] of [['sin internet', (r) => r.abort('internetdisconnected')], ['503', (r) => r.fulfill({ status: 503, body: '<html>503</html>' })]]) {
      const { ctx, p } = await nuevaPagina(b, MOV);
      await ctx.addInitScript(() => {
        if (location.pathname !== '/menu/' || localStorage.getItem('cisne-pedido-v1')) return;
        localStorage.setItem('cisne-pedido-v1', JSON.stringify({ creado_at: new Date().toISOString(), mesa: 'Terraza ñ', lineas: [
          { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 3, nota: 'Una sin espuma, ¿sí?', precio: 100, nombre: '¡Alarma!', huella: '' },
          { tipo: 'lata', id: 'lata-loba-negra', variante: null, cantidad: 1, nota: '', precio: 110, nombre: 'Negra', huella: '' },
          { tipo: 'comida', id: 'chips-camote', variante: '110g', cantidad: 1, nota: 'Piña y jalapeño', precio: 135, nombre: 'Chips de Camote', huella: '' },
        ] }));
      });
      let consultas = 0; p.on('request', (r) => { if (/\/estado$/.test(r.url())) consultas++; });
      await p.route('**/api/pedidos', falla);
      await p.goto(BASE + '/menu/'); await p.waitForSelector('#pedido-barra:not([hidden])');
      await p.click('#abrir-pedido'); await p.click('#pedido-mostrar');
      await p.waitForSelector('#ptar-qr[data-modo="offline"] #ptar-qr-img svg path', { timeout: 12000 });
      const url = await leerQR(p, '#ptar-qr-img svg');
      const datos = await p.evaluate((u) => window.CisnePedido.desdeQR(u), url);
      const aviso = (await p.textContent('#ptar-qr-aviso')).trim();
      ok(`6  ${nombre}: aviso "Sin conexión: el código lleva tu pedido completo" y sin código en texto`, aviso.startsWith('Sin conexión: el código lleva tu pedido completo') && !(await p.isVisible('#ptar-codigo')), aviso);
      ok(`6  ${nombre}: el QR offline es /equipo/#d=… (< 1,000 caracteres) y desdeQR recupera mesa y líneas`, !!url && url.startsWith(BASE + '/equipo/#d=') && url.length < 1000 && !!datos && datos.mesa === 'Terraza ñ'
        && JSON.stringify(datos.lineas) === JSON.stringify([
          { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 3, nota: 'Una sin espuma, ¿sí?' },
          { tipo: 'lata', id: 'lata-loba-negra', variante: null, cantidad: 1, nota: '' },
          { tipo: 'comida', id: 'chips-camote', variante: '110g', cantidad: 1, nota: 'Piña y jalapeño' },
        ]), `${url && url.length} caracteres · ${JSON.stringify(datos)}`);
      await p.waitForTimeout(5600);
      ok(`6  ${nombre}: deja de consultar el estado`, consultas === 0);
      if (nombre === 'sin internet') await p.screenshot({ path: QA2 + 'menu-qr-offline-390.png' });
      ok(`—  Sin errores JS (QR ${nombre})`, p.errores.length === 0, p.errores.join(' / '));
      await ctx.close();
    }
  }
  {
    // f) Código caducado → "Generar un código nuevo"; error 400 → mensaje del servidor y "Reintentar"
    const { ctx, p } = await nuevaPagina(b, MOV);
    await p.goto(BASE + '/menu/'); await p.waitForSelector('#barril:not([hidden])');
    await p.click('#barril-alarma [data-agregar]');
    await p.route('**/api/pedidos/*/estado', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ estado: 'caducado', mesero: null, tomado_at: null }) }));
    await p.click('#abrir-pedido'); await p.click('#pedido-mostrar');
    await p.waitForSelector('#ptar-nuevo:not([hidden])', { timeout: 9000 }).catch(() => {});
    const antes = (await p.textContent('#ptar-codigo')).trim();
    ok('6  Caducado: aviso y botón "Generar un código nuevo" (sin QR)', (await p.textContent('#ptar-nuevo')).trim() === 'Generar un código nuevo' && /caducó/.test(await p.textContent('#ptar-qr-aviso')) && !(await p.isVisible('#ptar-qr-img')), (await p.textContent('#ptar-qr-aviso')).trim());
    await p.unroute('**/api/pedidos/*/estado');
    await p.click('#ptar-nuevo');
    await p.waitForFunction((v) => { const c = document.querySelector('#ptar-codigo'); return !c.hidden && c.textContent && c.textContent !== v; }, antes);
    ok('6  "Generar un código nuevo" crea otro código y vuelve el QR', await p.isVisible('#ptar-qr-img svg'), `${antes} → ${(await p.textContent('#ptar-codigo')).trim()}`);
    await p.click('#pedido-tarjeta [data-cerrar]');
    await p.route('**/api/pedidos', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: '¡Alarma! está agotado.' }) }));
    await p.click('#pedido-lineas > li:nth-child(1) [data-acc="mas"]');
    await p.click('#pedido-mostrar'); await p.waitForSelector('#ptar-qr[data-modo="error"]');
    ok('6  Error 400: muestra el mensaje del servidor y "Reintentar"', (await p.textContent('#ptar-qr-aviso')).trim() === '¡Alarma! está agotado.' && (await p.textContent('#ptar-nuevo')).trim() === 'Reintentar');
    ok('—  Sin errores JS (QR caducado/error)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
  }
  {
    // g) Escritorio: el QR va en su columna junto al pedido
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: 1440, height: 900 } });
    await p.goto(BASE + '/menu/'); await p.waitForSelector('#barril:not([hidden])');
    await p.click('#barril-alarma [data-agregar]'); await p.click('#barril-henry-ix [data-agregar]');
    await p.click('#plato-papas-cisne [data-agregar]');
    await p.click('#abrir-pedido'); await p.fill('#pedido-mesa', '12');
    await p.click('#pedido-mostrar'); await p.waitForSelector('#ptar-qr-img svg path');
    const col = await p.evaluate(() => { const q = document.querySelector('#ptar-qr').getBoundingClientRect(); const s = document.querySelector('#ptar-secciones').getBoundingClientRect(); const a = document.querySelector('.ptar__acc').getBoundingClientRect(); return { qr: Math.round(q.right), lista: Math.round(s.left), arribaQR: Math.round(q.top), arribaLista: Math.round(s.top), botones: Math.round(a.bottom), alto: innerHeight }; });
    ok('6  1440: QR en una columna junto al pedido y botones a la vista', col.qr < col.lista && Math.abs(col.arribaQR - col.arribaLista) < 40 && col.botones <= col.alto, JSON.stringify(col));
    await p.screenshot({ path: QA2 + 'menu-qr-1440.png' });
    ok('—  Sin errores JS (QR 1440)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
  }

  // Wi-Fi público
  {
    const { ctx, p } = await nuevaPagina(b, { ...MOV, permissions: ['clipboard-read', 'clipboard-write'] });
    await p.goto(BASE + '/menu/'); await p.waitForSelector('#abrir-wifi:not([hidden])');
    ok('5  Wi-Fi: botón en la barra (solo ícono con aria-label en 390 px)', (await p.getAttribute('#abrir-wifi', 'aria-label')) === 'Wi-Fi' && (await p.$eval('.mbar__wifi-t', (e) => e.getBoundingClientRect().width <= 1)));
    ok('5  Wi-Fi: enlace en el pie', !(await p.$eval('#pie-wifi', (e) => e.hidden)));
    await p.click('#abrir-wifi'); await p.waitForSelector('#wifi-qr svg path');
    ok('5  Wi-Fi público: red y contraseña', (await p.textContent('#wifi-ssid')) === 'CisneNegro-Invitados' && (await p.textContent('#wifi-pass')) === 'CuentaloEnElCisne');
    const qr = await p.evaluate(() => ({ d: document.querySelector('#wifi-qr path').getAttribute('d').length, cadena: document.querySelector('#wifi-qr').dataset.cadena, fondo: document.querySelector('#wifi-qr rect').getAttribute('fill') }));
    ok('5  Wi-Fi público: QR en SVG (negro sobre crema) con la cadena WIFI:', qr.d > 500 && qr.cadena === 'WIFI:T:WPA;S:CisneNegro-Invitados;P:CuentaloEnElCisne;;' && qr.fondo === '#F3EDE2', qr.cadena);
    await p.click('[data-copiar="password"]'); await p.waitForTimeout(200);
    const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => null));
    ok('5  Wi-Fi público: "Copiar" copia la contraseña', (await p.textContent('#wifi-copiado')) === 'Copiamos la contraseña.' && (clip === null || clip === 'CuentaloEnElCisne'), `portapapeles=${clip}`);
    await p.screenshot({ path: QA2 + 'v2-menu-390-wifi.png' });
    await p.keyboard.press('Escape');
    ok('5  Wi-Fi: Esc cierra', !(await p.isVisible('#wifi-dlg')));
    await p.goto(BASE + '/menu/?app=1#wifi'); await p.waitForSelector('#wifi-dlg[open] #wifi-qr svg');
    ok('5  #wifi en la URL abre el diálogo (acceso directo del manifest)', await p.isVisible('#wifi-ssid'));
    ok('—  Sin errores JS (Wi-Fi público)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
  }
  // Wi-Fi sin red: mensaje discreto
  {
    const { ctx, p } = await nuevaPagina(b, MOV);
    await p.route('**/api/config', (r) => r.abort('internetdisconnected'));
    await p.goto(BASE + '/menu/'); await p.waitForSelector('#abrir-wifi:not([hidden])');
    await p.click('#abrir-wifi'); await p.waitForSelector('#wifi-error:not([hidden])');
    ok('5  Wi-Fi sin red: mensaje discreto y "Reintentar"', /Pregunta la contraseña en la barra/.test(await p.textContent('#wifi-error')) && (await p.isVisible('#wifi-reintentar')) && !(await p.isVisible('#wifi-datos')));
    await p.unroute('**/api/config');
    await p.click('#wifi-reintentar'); await p.waitForSelector('#wifi-qr svg path');
    ok('5  Wi-Fi: "Reintentar" recupera los datos', (await p.textContent('#wifi-ssid')) === 'CisneNegro-Invitados');
    await ctx.close();
  }
  // Wi-Fi solo socios
  const ajustar = (visibilidad, extra = {}) => admin.request.put(BASE + '/api/admin/ajustes', { data: { wifi: { ssid: 'CisneNegro-Invitados', password: 'CuentaloEnElCisne', seguridad: 'WPA', visibilidad, ...extra } } });
  {
    ok('5  PUT /api/admin/ajustes → solo socios', (await ajustar('socios')).ok());
    const { ctx, p } = await nuevaPagina(b, MOV);
    await p.goto(BASE + '/menu/#wifi'); await p.waitForSelector('#wifi-socios:not([hidden])');
    ok('5  Wi-Fi socios: el invitado ve el aviso y no la contraseña', /La contraseña del Wi-Fi es para socios del Pasaporte/.test(await p.textContent('#wifi-socios')) && !(await p.isVisible('#wifi-datos')) && !(await p.content()).includes('CuentaloEnElCisne'));
    await p.screenshot({ path: QA2 + 'v2-menu-390-wifi-socios.png' });
    await p.click('#wifi-pasaporte'); await p.waitForSelector('#pasaporte[open] #pase-invitado:not([hidden])');
    await p.fill('#r-nombre', 'Wendy Wifi'); await p.fill('#r-tel', '7716000001'); await p.fill('#r-pin', '2468'); await p.check('#r-priv');
    await p.click('#form-registro button[type=submit]'); await p.waitForSelector('#pase-socio:not([hidden])');
    await p.click('#pasaporte .pase__top [data-cerrar]');
    await p.waitForSelector('#wifi-dlg[open] #wifi-datos:not([hidden])', { timeout: 5000 }).catch(() => {});
    ok('5  Wi-Fi socios: al entrar al Pasaporte vuelve al Wi-Fi y ve la contraseña', (await p.isVisible('#wifi-pass')) && (await p.textContent('#wifi-pass')) === 'CuentaloEnElCisne');
    await p.screenshot({ path: QA2 + 'v2-menu-390-wifi-socio-con-sesion.png' });
    ok('—  Sin errores JS (Wi-Fi socios)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
    await ajustar('oculta');
    const g = await nuevaPagina(b, MOV);
    await g.p.goto(BASE + '/menu/'); await g.p.waitForSelector('#barril:not([hidden])'); await g.p.waitForTimeout(300);
    ok('5  Wi-Fi oculto: sin botón ni enlace', !(await g.p.isVisible('#abrir-wifi')) && (await g.p.$eval('#pie-wifi', (e) => e.hidden)));
    await g.ctx.close();
    await ajustar('publica');
  }

  // Tarjeta "Lleva el Cisne en tu inicio"
  {
    const IPHONE = { ...MOV, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' };
    const conSesion = async (opts, tel, init) => {
      const r = await nuevaPagina(b, opts);
      if (init) await r.ctx.addInitScript(init);
      await r.ctx.request.post(BASE + '/api/registro', { data: { nombre: 'Iris Instala', telefono: tel, pin: '1357', acepta_privacidad: true } });
      await r.ctx.request.post(BASE + '/api/login', { data: { telefono: tel, pin: '1357' } });
      await r.p.goto(BASE + '/menu/#pasaporte'); await r.p.waitForSelector('#pase-socio:not([hidden])'); await r.p.waitForTimeout(300);
      return r;
    };
    const ip = await conSesion(IPHONE, '7716000002');
    ok('5  Instalar: aparece con sesión (iPhone: pasos de Compartir + nota del PIN)', (await ip.p.isVisible('#instalar')) && (await ip.p.isVisible('#instalar-ios')) && /entra una vez con tu teléfono y PIN/.test(await ip.p.textContent('#instalar-ios')));
    await ip.p.locator('#instalar').scrollIntoViewIfNeeded();
    await ip.p.screenshot({ path: QA2 + 'v2-menu-390-instalar-iphone.png' });
    await ip.p.click('#instalar-no');
    ok('5  Instalar: "Ahora no" la oculta', !(await ip.p.isVisible('#instalar')));
    await ip.p.reload(); await ip.p.waitForSelector('#pase-socio:not([hidden])'); await ip.p.waitForTimeout(300);
    ok('5  Instalar: sigue oculta al recargar (30 días)', !(await ip.p.isVisible('#instalar')));
    ok('—  Sin errores JS (instalar iPhone)', ip.p.errores.length === 0, ip.p.errores.join(' / '));
    await ip.ctx.close();
    const inv = await nuevaPagina(b, IPHONE);
    await inv.p.goto(BASE + '/menu/#pasaporte'); await inv.p.waitForSelector('#pase-invitado:not([hidden])');
    ok('5  Instalar: no aparece sin sesión', !(await inv.p.isVisible('#instalar')));
    await inv.ctx.close();
    const app = await conSesion(IPHONE, '7716000003', () => {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } } : mm(q));
    });
    ok('5  Instalar: no aparece en display-mode standalone (emulado)', (await app.p.isVisible('#pase-socio')) && !(await app.p.isVisible('#instalar')));
    await app.ctx.close();
    const esc = await conSesion({ viewport: { width: 1280, height: 900 } }, '7716000004');
    ok('5  Instalar: Chrome de escritorio sin invitación nativa → no aparece', !(await esc.p.isVisible('#instalar')));
    await esc.p.evaluate(() => {
      const ev = new Event('beforeinstallprompt', { cancelable: true });
      ev.prompt = async () => { window.__prompt = true; };
      ev.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      window.dispatchEvent(ev);
    });
    ok('5  Instalar: con beforeinstallprompt muestra "Instalar app"', (await esc.p.isVisible('#instalar-btn')) && !(await esc.p.isVisible('#instalar-ios')));
    await esc.p.click('#instalar-btn'); await esc.p.waitForTimeout(200);
    ok('5  Instalar: "Instalar app" llama prompt() y oculta la tarjeta al aceptar', (await esc.p.evaluate(() => window.__prompt === true)) && !(await esc.p.isVisible('#instalar')));
    ok('—  Sin errores JS (instalar escritorio)', esc.p.errores.length === 0, esc.p.errores.join(' / '));
    await esc.ctx.close();
  }

  // Manifest y service worker
  {
    const r = await admin.request.get(BASE + '/manifest.webmanifest');
    let m = null; try { m = JSON.parse(await r.text()); } catch (e) { /* inválido */ }
    ok('5  /manifest.webmanifest 200 y JSON válido', r.status() === 200 && !!m && m.start_url === '/menu/?app=1#pasaporte' && m.scope === '/' && m.display === 'standalone' && m.icons.length === 3, r.headers()['content-type']);
    const { ctx, p } = await nuevaPagina(b, MOV);
    for (const ruta of ['/', '/privacidad/', '/menu/']) {
      await p.goto(BASE + ruta);
      const head = await p.evaluate(() => ({
        manifest: !!document.querySelector('link[rel="manifest"][href="/manifest.webmanifest"]'),
        apple: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content,
        icono: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
        tema: document.querySelector('meta[name="theme-color"]')?.content,
      }));
      ok(`5  ${ruta}: manifest, theme-color y metas de Apple`, head.manifest && head.apple === 'Cisne Negro' && head.icono === '/assets/img/marca/icono-192.png' && head.tema === '#0E0D0B', JSON.stringify(head));
    }
    const sw = await p.evaluate(async () => {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
      return reg ? { scope: reg.scope, url: (reg.active || reg.installing || reg.waiting).scriptURL } : null;
    });
    ok('5  Service worker registrado en localhost (scope /)', !!sw && sw.scope === BASE + '/' && sw.url === BASE + '/sw.js', JSON.stringify(sw));
    await p.reload(); await p.waitForTimeout(500);
    const conSw = await p.evaluate(async () => ({ controlado: !!navigator.serviceWorker.controller, api: (await fetch('/api/config', { cache: 'no-store' })).status }));
    const cacheApi = await p.evaluate(async () => { for (const k of await caches.keys()) { const c = await caches.open(k); if ((await c.keys()).some((r) => r.url.includes('/api/'))) return true; } return false; });
    ok('5  Con el SW activo /api/ responde y nunca se guarda en caché', conSw.controlado && conSw.api === 200 && !cacheApi, JSON.stringify(conSw));
    ok('—  Sin errores JS (manifest/SW)', p.errores.length === 0, p.errores.join(' / '));
    await ctx.close();
  }
  await b.close();
  const f = res.filter((r) => r[0] === 'FAIL');
  console.log(`\n${res.length - f.length}/${res.length} PASS`);
  if (f.length) console.log('FALLAS:', f);
})().catch((e) => { console.error(e); process.exit(1); });
