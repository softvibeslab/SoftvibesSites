/* Batería funcional del menú, Pasaporte, NPS, ranking y panel (Playwright + Chromium).
 * No la corras contra producción: crea socios, visitas y NPS.
 * Uso recomendado: tests/funcional/correr.sh  (levanta un servidor con base desechable).
 * Variables: BASE_URL (default http://127.0.0.1:8095), QA_DIR (capturas; default sitio/qa/funcional/).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
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
  await b.close();
  const f = res.filter((r) => r[0] === 'FAIL');
  console.log(`\n${res.length - f.length}/${res.length} PASS`);
  if (f.length) console.log('FALLAS:', f);
})().catch((e) => { console.error(e); process.exit(1); });
