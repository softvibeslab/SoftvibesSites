/* Batería funcional de la app del equipo (/equipo/): login, QR del pedido, cuentas por mesa, cobro con propina,
 * historial, CSV, corte, cierre del día, alta de meseros y escáner (BarcodeDetector simulado y jsQR con un QR real).
 * Escribe datos: NO la corras contra producción. Necesita una base recién creada (un corte por mesero y día).
 *
 * Uso:
 *   rm -f backend/dev-8110.db*; python3 backend/dev_server.py 8110 &
 *   CLUB_DB=backend/dev-8110.db python3 backend/club_server.py crear-staff admin.demo "Admin Demo" admin 111111
 *   CLUB_DB=backend/dev-8110.db python3 backend/club_server.py crear-staff luis.demo "Luis Demo" mesero 222222
 *   CLUB_DB=backend/dev-8110.db python3 backend/club_server.py crear-staff ana.demo "Ana Demo" mesero 333333
 *   NODE_PATH=/tmp/cn/rqa/node_modules BASE_URL=http://127.0.0.1:8110 node tests/funcional/equipo.cjs
 * Variables: BASE_URL (default http://127.0.0.1:8110), QA_DIR (capturas; default sitio/qa/).
 */
const { chromium, request } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8110';
if (/softvibes\.art|^https:/i.test(BASE)) { console.error('Esta batería escribe datos: no se corre contra producción ni https.'); process.exit(2); }
const QA = (process.env.QA_DIR || path.join(__dirname, '..', '..', 'sitio', 'qa')) + '/';
fs.mkdirSync(QA, { recursive: true });
const QRCODE_SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'sitio', 'assets', 'js', 'lib', 'qrcode.js'), 'utf8') + '\n;window.qrcode = qrcode;';

const res = [];
const ok = (nombre, cond, extra = '') => { res.push([cond ? 'PASS' : 'FAIL', nombre, extra]); console.log(cond ? 'PASS' : 'FAIL', nombre, extra); };
const MOV = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-MX', timezoneId: 'America/Mexico_City' };
const DESK = { viewport: { width: 1280, height: 900 }, locale: 'es-MX', timezoneId: 'America/Mexico_City' };
const fMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const c$ = (c) => fMXN.format(c / 100);
const LINEAS = [{ tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2 }, { tipo: 'comida', id: 'chips-camote', variante: '110g' },
  { tipo: 'vuelo', cervezas: ['alarma', 'henry-ix', 'a-poco-si-pa', 'agua-puerca'] }];
const LATA = [{ tipo: 'lata', id: 'lata-loba-negra' }];
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const errores = [];

async function nuevaPagina(b, opts, init) {
  const ctx = await b.newContext(opts);
  if (init) for (const s of [].concat(init)) await ctx.addInitScript(s);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(e.message));
  return { ctx, p };
}
const vista = (p, v, t = 8000) => p.waitForSelector('#v-' + v + ':not([hidden])', { timeout: t });
async function teclearPin(p, pin) { for (const d of pin) await p.click('#teclado [data-n="' + d + '"]'); }
async function login(p, usuario, pin) {
  await vista(p, 'login');
  await p.fill('#l-usuario', usuario);
  await p.fill('#l-pin', '');
  await teclearPin(p, pin); // con 6 números entra solo
}
const texto = (p, sel) => p.locator(sel).first().innerText();
const dlgBoton = (p, nombre) => p.locator('#dlg button', { hasText: nombre }).first();
const desborde = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
async function captura(p, nombre, full = true) {
  // Ventana del alto del contenido (en vez de fullPage) para que la barra inferior fija quede abajo y no encimada.
  await p.evaluate(() => { const t = document.getElementById('toast'); t.classList.remove('toast--on'); t.textContent = ''; });
  await p.waitForTimeout(250);
  const vp = p.viewportSize();
  if (full) {
    const alto = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewportSize({ width: vp.width, height: Math.max(vp.height, alto) });
    await p.waitForTimeout(150);
  }
  await p.screenshot({ path: QA + 'equipo-' + nombre + '.png' });
  if (full) await p.setViewportSize(vp);
}

// Cámara simulada: un <canvas> pintado como stream. Con window.__qrTexto pinta un QR real (para jsQR).
const CAMARA_FALSA = `
(() => {
  window.__stream = null;
  const md = navigator.mediaDevices || {};
  if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true });
  md.getUserMedia = async () => {
    if (window.__denegar) throw new DOMException('Permiso denegado', 'NotAllowedError');
    const c = document.createElement('canvas'); c.width = 640; c.height = 480;
    const g = c.getContext('2d');
    const pinta = () => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, 640, 480);
      if (window.__qrPintar && window.qrcode) {
        const q = window.qrcode(0, 'M'); q.addData(window.__qrPintar); q.make();
        const n = q.getModuleCount(), cel = Math.floor(400 / (n + 8)), x0 = (640 - n * cel) / 2, y0 = (480 - n * cel) / 2;
        g.fillStyle = '#000';
        for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect(x0 + k * cel, y0 + r * cel, cel, cel);
      }
    };
    pinta(); setInterval(pinta, 100);
    window.__stream = c.captureStream(15);
    return window.__stream;
  };
})();`;
const DETECTOR_FALSO = `
window.__qrTexto = null;
window.BarcodeDetector = class { static async getSupportedFormats() { return ['qr_code']; } async detect() { return window.__qrTexto ? [{ rawValue: window.__qrTexto }] : []; } };`;
const SIN_DETECTOR = 'try { delete window.BarcodeDetector; } catch (e) {} window.BarcodeDetector = undefined; delete window.BarcodeDetector;';

(async () => {
  const pub = await request.newContext({ baseURL: BASE });
  const crearPedido = async (lineas, mesa) => {
    const r = await pub.post('/api/pedidos', { data: { lineas, mesa } });
    if (r.status() !== 201) throw new Error('No se creó el pedido: ' + r.status() + ' ' + await r.text());
    return (await r.json());
  };
  const b = await chromium.launch();

  // ── 1. Login ─────────────────────────────────────────────────────────────
  const pedA = await crearPedido(LINEAS, '');
  const { ctx: ctxL, p: luis } = await nuevaPagina(b, MOV);
  await luis.goto(BASE + '/equipo/');
  await vista(luis, 'login');
  ok('1a Sin sesión se ve el login', await luis.isVisible('#teclado') && !(await luis.isVisible('#bnav')));
  await captura(luis, 'login', false);
  await login(luis, 'luis.demo', '000000');
  await luis.waitForFunction(() => document.getElementById('login-error').textContent.length > 0);
  ok('1b Login fallido muestra el error de la API', /incorrectos/.test(await texto(luis, '#login-error')), await texto(luis, '#login-error'));

  // ── 2. Abrir el QR (?p=) sin sesión → login → pedido ─────────────────────
  await luis.goto(BASE + '/equipo/?p=' + pedA.codigo);
  await vista(luis, 'login');
  ok('2a ?p= sin sesión pide login y anuncia el pedido', /Entra para abrir el pedido/.test(await texto(luis, '#login-sub')));
  await login(luis, 'luis.demo', '222222');
  await vista(luis, 'pedido');
  await luis.waitForSelector('#tomar');
  ok('2b Tras el login abre el pedido escaneado', (await luis.evaluate(() => location.hash)) === '#pedido/' + pedA.codigo);
  ok('2c Pedido: 3 líneas, vuelo con 4 cervezas y total $475', (await luis.locator('#pedido-cont .linea').count()) === 3
    && (await luis.locator('#pedido-cont .vuelo li').count()) === 4 && (await texto(luis, '#pedido-cont .total .mono')) === c$(47500));
  const cookies = await ctxL.cookies();
  ok('2d Cookie cn_equipo HttpOnly', cookies.some((c) => c.name === 'cn_equipo' && c.httpOnly));
  await captura(luis, 'pedido');

  // ── 3. Tomar con mesa ────────────────────────────────────────────────────
  await luis.click('#tomar');
  ok('3a Tomar sin mesa: la app la pide', /Indica la mesa/.test(await texto(luis, '#pedido-error')));
  await luis.fill('#p-mesa', '7');
  ok('3b Aviso: cuenta nueva para la mesa 7', /cuenta nueva para la mesa 7/.test(await texto(luis, '#aviso-mesa')));
  await luis.click('#tomar');
  await vista(luis, 'cuenta');
  await luis.waitForSelector('#cuenta-total');
  ok('3c Pedido tomado → cuenta de la mesa 7 por $475', (await texto(luis, '#t-cuenta')) === 'MESA 7' || /Mesa 7/i.test(await texto(luis, '#t-cuenta')));
  ok('3d Total de la cuenta $475', (await texto(luis, '#cuenta-total')) === c$(47500));

  // ── 4. Segunda ronda en la misma mesa (código escrito a mano) ────────────
  const pedB = await crearPedido(LATA, '7');
  await luis.goto(BASE + '/equipo/#inicio');
  await vista(luis, 'inicio');
  await luis.fill('#codigo-input', pedB.codigo.slice(0, 4).toLowerCase() + '-' + pedB.codigo.slice(4).toLowerCase());
  await luis.click('#f-codigo button[type=submit]');
  await vista(luis, 'pedido');
  await luis.waitForSelector('#aviso-mesa');
  ok('4a Aviso «Se agregará a la cuenta de la mesa 7 · ronda 2»', /Se agregará a la cuenta de la mesa 7 · ronda 2/.test(await texto(luis, '#aviso-mesa')), await texto(luis, '#aviso-mesa'));
  await luis.click('#tomar');
  await vista(luis, 'cuenta');
  await luis.waitForSelector('#cuenta-total');
  ok('4b Segunda ronda en la misma cuenta: 2 rondas, $585', (await luis.locator('.ronda').count()) === 2 && (await texto(luis, '#cuenta-total')) === c$(58500));
  const cuenta7 = Number((await luis.evaluate(() => location.hash)).split('/')[1]);

  // ── 5. Ajustar línea a 0 («no hay») ──────────────────────────────────────
  const det = await (await luis.request.get(BASE + '/api/equipo/cuentas/' + cuenta7)).json();
  const precioChips = det.cuenta.pedidos[0].lineas[1].precio;
  await luis.locator('.stepper button[aria-label^="Quitar uno de"]').nth(1).click();
  await luis.waitForSelector('#dlg[open]');
  ok('5a Bajar a 0 pide confirmación', /No hay/i.test(await texto(luis, '#dlg-t')));
  await dlgBoton(luis, 'Sí, no hay').click();
  await luis.waitForFunction((t) => document.getElementById('cuenta-total') && document.getElementById('cuenta-total').textContent === t, c$((585 - precioChips) * 100));
  ok('5b Línea en 0 marcada «No hay» y total recalculado', (await luis.locator('.linea--nohay').count()) === 1, 'total ' + c$((585 - precioChips) * 100));
  ok('5c El foco vuelve al stepper', await luis.evaluate(() => !!document.activeElement.closest('.stepper')));
  await luis.click('.bitacora summary');
  ok('5d Bitácora registra el ajuste', /→ no hay/.test(await texto(luis, '.bitacora ol')));
  await captura(luis, 'cuenta');

  // ── 6. Cobro mixto efectivo + débito con propina 10% ─────────────────────
  const totalC = (585 - precioChips) * 100;
  const propC = Math.round(totalC * 0.1);
  await luis.click('#cerrar-cuenta');
  await vista(luis, 'cobro');
  await luis.click('#propina-seg [data-p="10"]');
  ok('6a Propina 10% calculada sobre la cuenta', (await texto(luis, '#propina-txt')).includes(c$(propC)), await texto(luis, '#propina-txt'));
  ok('6b Sin pagos: «Cobrar» deshabilitado', await luis.isDisabled('#cobrar'));
  await luis.click('#pago-agregar');
  await luis.fill('#pago-monto-0', '300');
  await luis.fill('#pago-recibe-0', '500');
  ok('6c Efectivo: «¿Con cuánto paga?» → cambio $200', (await texto(luis, '#pago-cambio-0')).includes(c$(20000)));
  ok('6d «Resta por cobrar» en vivo', (await texto(luis, '#resta-v')) === c$(totalC + propC - 30000) && await luis.isDisabled('#cobrar'));
  await luis.click('#rapidos [data-m="tarjeta_debito"]');
  ok('6e «Resta en Débito» completa el cobro', (await texto(luis, '#resta-k')) === 'Todo cubierto' && !(await luis.isDisabled('#cobrar'))
    && (await luis.inputValue('#pago-monto-1')) === ((totalC + propC - 30000) / 100).toFixed(2));
  await captura(luis, 'cobro');
  await luis.click('#cobrar');
  await vista(luis, 'inicio');
  const cerr = (await (await luis.request.get(BASE + '/api/equipo/cuentas/' + cuenta7)).json()).cuenta;
  ok('6f Cuenta cerrada con pago mixto y propina 10%', cerr.estado === 'cerrada' && Math.round(cerr.propina * 100) === propC
    && cerr.pagos.length === 2 && cerr.pagos[0].metodo === 'efectivo' && cerr.pagos[0].monto === 300 && cerr.pagos[1].metodo === 'tarjeta_debito',
  JSON.stringify(cerr.pagos) + ' propina ' + cerr.propina);
  ok('6g Toast de confirmación', /Mesa 7 cerrada/.test(await texto(luis, '#toast')));

  // ── 7. Otro mesero recibe el 409 ─────────────────────────────────────────
  const pedC = await crearPedido(LATA, '5');
  const { p: ana, ctx: ctxA } = await nuevaPagina(b, MOV, 'navigator.share = async (d) => { window.__compartido = d.text; };');
  await ana.goto(BASE + '/equipo/?p=' + pedC.codigo);
  await login(ana, 'ana.demo', '333333');
  await vista(ana, 'pedido');
  await ana.waitForSelector('#tomar');
  const rL = await luis.request.post(BASE + '/api/equipo/pedidos/' + pedC.codigo + '/tomar', { data: { mesa: '5' } });
  await ana.click('#tomar');
  await ana.waitForFunction(() => document.getElementById('pedido-error').textContent.length > 0);
  ok('7a Ana ve «ya lo tomó Luis Demo» (409)', rL.status() === 200 && /ya lo tomó Luis Demo/.test(await texto(ana, '#pedido-error')), await texto(ana, '#pedido-error'));
  ok('7b Tras el 409 se oculta «Tomar»', !(await ana.isVisible('#tomar')));

  // ── 8. Pedido sin internet (#d=) ─────────────────────────────────────────
  const d = b64url({ mesa: '3', lineas: [{ tipo: 'lata', id: 'lata-loba-negra' }] });
  await ana.goto(BASE + '/equipo/#d=' + d);
  await ana.waitForSelector('#pedido-cont .nota-ok');
  const hashImp = await ana.evaluate(() => location.hash);
  ok('8a #d= se importa y queda con código del servidor', /^#pedido\/[A-Z0-9]{8}$/.test(hashImp) && /registrado con el código/.test(await texto(ana, '#pedido-cont .nota-ok')), hashImp);
  ok('8b Precio del servidor ($110) y origen «sin internet»', (await texto(ana, '#pedido-cont .total .mono')) === c$(11000) && await ana.isVisible('text=Llegó sin internet'));
  await ana.click('#tomar');
  await vista(ana, 'cuenta');
  await ana.waitForSelector('#cuenta-total');
  ok('8c Ana toma el pedido importado → mesa 3', /Mesa 3/i.test(await texto(ana, '#t-cuenta')));
  await ana.goto(BASE + '/equipo/#d=' + d);
  await ana.waitForSelector('#pedido-cont .nota-info');
  ok('8d Reabrir el mismo QR no duplica el pedido', (await ana.evaluate(() => location.hash)) === hashImp && /Tú tomaste/.test(await texto(ana, '#pedido-cont .nota-info')));

  // ── 9–10. Historial, indicadores, filtro por método y CSV ────────────────
  await luis.goto(BASE + '/equipo/#historial');
  await vista(luis, 'historial');
  await luis.waitForSelector('#h-kpis');
  const api = (await (await luis.request.get(BASE + '/api/equipo/historial?rango=hoy')).json()).indicadores;
  const kpis = await luis.locator('#h-kpis .kpi__v').allInnerTexts();
  ok('9a Indicadores de hoy = API y = lo cobrado', kpis[0] === c$(totalC) && kpis[1] === '1' && kpis[2] === c$(totalC) && kpis[3] === c$(propC)
    && Math.round(api.total * 100) === totalC && Math.round(api.propinas * 100) === propC, kpis.join(' | '));
  ok('9b Gráficas: por método, top productos y por hora', (await luis.locator('.graf').count()) === 3 && (await luis.locator('.colgraf .col').count()) >= 1
    && (await luis.locator('.barras').first().locator('.barra__fill').count()) === 2);
  ok('9c Lista con la cuenta de la mesa 7', (await luis.locator('#h-lista .hcard').count()) === 1 && /Mesa 7/.test(await texto(luis, '#h-lista .hcard')));
  await luis.selectOption('#h-metodo', 'tarjeta_credito');
  await luis.waitForSelector('#h-lista .vacio');
  ok('9d Filtro «Tarjeta de crédito» → 0 cuentas', (await luis.locator('#h-kpis .kpi__v').nth(1).innerText()) === '0');
  await luis.selectOption('#h-metodo', 'tarjeta_debito');
  await luis.waitForSelector('#h-lista .hcard');
  ok('9e Filtro «Tarjeta de débito» → 1 cuenta', (await luis.locator('#h-lista .hcard').count()) === 1);
  await luis.selectOption('#h-metodo', '');
  await luis.waitForSelector('#h-lista .hcard');
  await luis.click('#rango-chips [data-r="personalizado"]');
  await luis.check('#h-hora');
  await luis.waitForFunction(() => /–/.test(document.getElementById('h-rango-txt').textContent));
  ok('9f Rango personalizado con hora exacta', /\d{2}:\d{2} – .*\d{2}:\d{2}/.test(await texto(luis, '#h-rango-txt')) && (await luis.locator('#h-lista .hcard').count()) === 1, await texto(luis, '#h-rango-txt'));
  await luis.uncheck('#h-hora');
  await luis.click('#rango-chips [data-r="hoy"]');
  await luis.waitForSelector('#h-lista .hcard');
  await captura(luis, 'historial');
  const [descarga] = await Promise.all([luis.waitForEvent('download'), luis.click('#h-csv')]);
  const csv = fs.readFileSync(await descarga.path(), 'utf8');
  ok('10 CSV descargado con la cuenta de Luis', /tarjeta_debito/.test(csv) && /Luis Demo/.test(csv) && /\.csv$/.test(descarga.suggestedFilename()), descarga.suggestedFilename());
  await luis.click('#h-lista .hcard');
  await vista(luis, 'cuenta');
  await luis.waitForSelector('#t-pago');
  ok('9g Tocar una cuenta del historial abre su detalle con el pago', /Total cobrado/i.test(await texto(luis, '#cuenta-cont')) && /Historial/.test(await texto(luis, '#cuenta-cont .volver')));

  // ── 11. Corte bloqueado → transferir → corte ─────────────────────────────
  await ana.goto(BASE + '/equipo/#corte');
  await vista(ana, 'corte');
  await ana.waitForSelector('#hacer-corte');
  ok('11a Corte bloqueado con cuenta abierta', await ana.isVisible('#corte-bloqueo') && await ana.isDisabled('#hacer-corte'));
  await captura(ana, 'corte-bloqueado');
  await ana.click('#corte-cont button:has-text("Transferir")');
  await ana.waitForSelector('#dlg[open]');
  await ana.click('#dlg label.opcion:has-text("Luis Demo")');
  await dlgBoton(ana, 'Transferir').click();
  await ana.waitForFunction(() => { const x = document.getElementById('hacer-corte'); return x && !x.disabled; });
  ok('11b Transferida a Luis: ya se puede cortar', /transferida a Luis Demo/.test(await texto(ana, '#toast')));
  await ana.click('#hacer-corte');
  await dlgBoton(ana, 'Sí, hacer mi corte').click();
  await ana.waitForSelector('#corte-hecho');
  ok('11c Corte hecho con hora', /Corte hecho a las \d{2}:\d{2}/.test(await texto(ana, '#corte-hecho')));
  await ana.click('#corte-compartir');
  await ana.waitForFunction(() => !!window.__compartido);
  ok('11d «Compartir» envía el resumen (Web Share)', /Corte de Ana Demo/.test(await ana.evaluate(() => window.__compartido)));
  await captura(ana, 'corte');

  // ── 14. El mesero no ve Admin ────────────────────────────────────────────
  ok('14a Mesero: sin pestaña Admin', !(await luis.isVisible('#nav-admin')));
  await luis.goto(BASE + '/equipo/#cierre');
  await vista(luis, 'inicio');
  ok('14b Mesero que entra a #cierre vuelve al inicio', (await luis.evaluate(() => location.hash)) === '#inicio');

  // ── 15. Escáner ──────────────────────────────────────────────────────────
  ok('15a interpretar(): URL ?p=, #d=, código suelto y basura', await luis.evaluate((dd) => {
    const I = window.CNEquipo.interpretar;
    return I('https://cisnenegro.softvibes.art/equipo/?p=K7M2Q9AB').codigo === 'K7M2Q9AB'
      && I('https://x.mx/v2/equipo/?p=k7m2-q9ab').codigo === 'K7M2Q9AB'
      && I('http://x/equipo/#d=' + dd).d === dd && I('k7m2-q9ab').codigo === 'K7M2Q9AB' && I('K7M2Q9AB').codigo === 'K7M2Q9AB'
      && I('https://google.com') === null && I('') === null
      && window.CNEquipo.decodificarDatos(dd).mesa === '3';
  }, d));
  {
    const pedD = await crearPedido(LATA, '8');
    const { p: esc } = await nuevaPagina(b, MOV, [CAMARA_FALSA, DETECTOR_FALSO]);
    await esc.goto(BASE + '/equipo/');
    await login(esc, 'luis.demo', '222222');
    await vista(esc, 'inicio');
    await esc.evaluate(() => { window.__denegar = true; });
    await esc.click('#escanear');
    await esc.waitForSelector('#dlg-escaner.sin-camara');
    ok('15b Sin permiso de cámara: explica y deja escribir el código', /permiso/.test(await texto(esc, '#esc-estado')) && await esc.isVisible('#esc-ayuda'));
    await esc.click('#esc-cerrar');
    await esc.evaluate(() => { window.__denegar = false; window.__qrTexto = 'https://google.com/'; });
    await esc.click('#escanear');
    await esc.waitForFunction(() => /no es de un pedido/.test(document.getElementById('esc-estado').textContent));
    ok('15c BarcodeDetector: un QR ajeno no abre nada', await esc.isVisible('#dlg-escaner'));
    await esc.evaluate((u) => { window.__qrTexto = u; }, BASE + '/equipo/?p=' + pedD.codigo);
    await vista(esc, 'pedido');
    await esc.waitForSelector('#tomar');
    ok('15d BarcodeDetector: el QR abre el pedido', (await esc.evaluate(() => location.hash)) === '#pedido/' + pedD.codigo);
    ok('15e La cámara se libera al cerrar', await esc.evaluate(() => !document.getElementById('dlg-escaner').open && document.getElementById('esc-video').srcObject === null
      && window.__stream.getTracks().every((t) => t.readyState === 'ended')));
  }
  {
    const pedE = await crearPedido(LATA, '9');
    const { p: esc2 } = await nuevaPagina(b, MOV, [SIN_DETECTOR, QRCODE_SRC, CAMARA_FALSA]);
    await esc2.goto(BASE + '/equipo/');
    await login(esc2, 'luis.demo', '222222');
    await vista(esc2, 'inicio');
    await esc2.evaluate((u) => { window.__qrPintar = u; }, BASE + '/equipo/?p=' + pedE.codigo);
    await esc2.click('#escanear');
    await vista(esc2, 'pedido', 15000);
    ok('15f jsQR (sin BarcodeDetector) lee un QR real en el video', (await esc2.evaluate(() => location.hash)) === '#pedido/' + pedE.codigo && await esc2.evaluate(() => !!window.jsQR));
    const dE = b64url({ mesa: '12', lineas: [{ tipo: 'lata', id: 'lata-loba-negra', cantidad: 2 }] });
    await esc2.goto(BASE + '/equipo/#inicio');
    await vista(esc2, 'inicio');
    await esc2.evaluate((u) => { window.__qrPintar = u; }, BASE + '/equipo/#d=' + dE);
    await esc2.click('#escanear');
    await esc2.waitForSelector('#pedido-cont .nota-ok', { timeout: 15000 });
    ok('15g jsQR: un QR sin internet (#d=) se importa', /Mesa 12/i.test(await texto(esc2, '#t-pedido')) && (await texto(esc2, '#pedido-cont .total .mono')) === c$(22000));
  }

  // ── 12–13. Admin: cierre del día y equipo (1280 px) ─────────────────────
  const { p: adm } = await nuevaPagina(b, DESK);
  await adm.goto(BASE + '/equipo/');
  await login(adm, 'admin.demo', '111111');
  await vista(adm, 'inicio');
  await adm.waitForSelector('#lista-todas .ccard');
  ok('12a Admin ve las cuentas abiertas del equipo con el mesero', /Luis Demo/.test(await texto(adm, '#lista-todas')) && await adm.isVisible('#nav-admin'));
  await adm.click('#nav-admin');
  await vista(adm, 'cierre');
  await adm.waitForSelector('#cerrar-dia');
  ok('12b Cierre: tabla por mesero con Luis «Sin corte»', /Luis Demo/i.test(await texto(adm, '.tabla')) && (await adm.locator('.tabla tr:has-text("Luis Demo") .chip--alerta').count()) === 1);
  await adm.click('#cerrar-dia');
  await dlgBoton(adm, 'Cerrar día').click();
  await adm.waitForFunction(() => /Faltan pendientes/.test((document.getElementById('dlg-t') || {}).textContent || ''));
  ok('12c Cierre bloqueado: explica quién no tiene corte', /Luis Demo/.test(await texto(adm, '#dlg')) && /siguen abiertas|sigue abierta/.test(await texto(adm, '#dlg')));
  await dlgBoton(adm, 'Forzar cierre').click();
  ok('12d Forzar exige motivo', /motivo/.test(await texto(adm, '#dlg .error')));
  await adm.fill('#dlg-forzar', 'Prueba: Luis se fue sin corte');
  await dlgBoton(adm, 'Forzar cierre').click();
  await adm.waitForSelector('#reabrir-dia');
  ok('12e Día cerrado (forzado) con motivo', /cierre forzado/.test(await texto(adm, '#cierre-estado')) && /Luis se fue/.test(await texto(adm, '#cierre-cont')));
  await captura(adm, 'cierre');
  await adm.click('#reabrir-dia');
  await adm.fill('#dlg-motivo', 'Corrección de una cuenta');
  await dlgBoton(adm, 'Reabrir día').click();
  await adm.waitForSelector('#cerrar-dia');
  ok('12f Reabrir con motivo', /reabierto/.test(await texto(adm, '#cierre-estado')) && /Corrección/.test(await texto(adm, '#cierre-estado')));

  await adm.click('.subnav a[href="#equipo"]');
  await vista(adm, 'equipo');
  await adm.waitForSelector('#staff-lista li');
  const usuario = 'pepe.' + (Date.now() % 100000);
  await adm.fill('#a-nombre', 'Pepe Demo');
  await adm.fill('#a-usuario', usuario);
  await adm.click('#f-alta button[type=submit]');
  await adm.waitForSelector('#pin-mostrado');
  const pin = (await texto(adm, '#pin-mostrado')).trim();
  ok('13a Alta: el PIN se muestra una vez, grande', /^\d{6}$/.test(pin), pin);
  await captura(adm, 'equipo-pin', false);
  await dlgBoton(adm, 'Ya lo anoté').click();
  await adm.waitForSelector('#staff-lista li:has-text("Pepe Demo")');
  await captura(adm, 'equipo');
  const { p: pepe } = await nuevaPagina(b, MOV);
  await pepe.goto(BASE + '/equipo/');
  await login(pepe, usuario, pin);
  await vista(pepe, 'inicio');
  ok('13b El mesero nuevo entra con su PIN', /Hola, Pepe/i.test(await texto(pepe, '#t-inicio')) && !(await pepe.isVisible('#nav-admin')));
  await adm.click('#staff-lista li:has-text("Pepe Demo") button:has-text("Desactivar")');
  await dlgBoton(adm, 'Desactivar').click();
  await adm.waitForSelector('#staff-lista li.inactivo:has-text("Pepe Demo")');
  await pepe.reload();
  await vista(pepe, 'login');
  ok('13c Desactivar corta su sesión', await pepe.isVisible('#teclado'));

  // ── Capturas de inicio y responsivo (sin desbordes a 320/390/768) ────────
  await luis.goto(BASE + '/equipo/#inicio');
  await vista(luis, 'inicio');
  await luis.waitForSelector('#lista-mias .ccard');
  await captura(luis, 'inicio');
  const abiertasL = (await (await luis.request.get(BASE + '/api/equipo/cuentas?estado=abierta')).json()).cuentas;
  const rutasMov = ['#inicio', '#pedido/' + pedA.codigo, '#cuenta/' + cuenta7, '#cobro/' + abiertasL[0].id, '#historial', '#corte'];
  const rutasAdm = ['#cierre', '#equipo', '#historial'];
  const anchos = [];
  for (const w of [320, 390, 768]) {
    for (const [pg, rutas] of [[luis, rutasMov], [adm, rutasAdm]]) {
      await pg.setViewportSize({ width: w, height: 800 });
      for (const r of rutas) {
        await pg.goto(BASE + '/equipo/' + r);
        await pg.waitForTimeout(500);
        const dx = await desborde(pg);
        if (dx > 0) anchos.push(w + 'px ' + r + ' +' + dx);
      }
    }
    const { p: anon, ctx } = await nuevaPagina(b, { viewport: { width: w, height: 760 } });
    await anon.goto(BASE + '/equipo/');
    await vista(anon, 'login');
    const dx = await desborde(anon);
    if (dx > 0) anchos.push(w + 'px login +' + dx);
    await ctx.close();
  }
  ok('16 Sin desborde horizontal a 320, 390 y 768 px', anchos.length === 0, anchos.join(', '));
  ok('17 Sin errores de JavaScript', errores.length === 0, errores.join(' | '));

  await b.close();
  await pub.dispose();
  const fallas = res.filter((r) => r[0] === 'FAIL');
  console.log(`\n${res.length - fallas.length}/${res.length} PASS` + (fallas.length ? '\nFALLAS:\n' + fallas.map((f) => ' - ' + f[1] + ' ' + f[2]).join('\n') : ''));
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
