// Pruebas de interacción. Uso: NODE_PATH=<playwright> node tools/qa_funcional.cjs <url-base>
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.argv[2] || "http://127.0.0.1:8917/";

(async () => {
  const b = await chromium.launch();
  const ok = (m) => console.log("✔", m);

  // 1. Calculadora: cambia salidas y el mensaje del CTA
  let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.fill("[name=leads]", "300");
  await p.locator("#atendidos").fill("5");
  assert.equal(await p.textContent("#o-espera"), "150");
  assert.equal(await p.textContent("#o-citas"), "30");
  assert.equal(await p.textContent("#o-cierres"), "36");
  let href = decodeURIComponent(await p.getAttribute("#calc-cta", "href"));
  assert.match(href, /recibimos 300 prospectos al mes y unos 150 no reciben/);
  ok("calculadora recalcula y arma el mensaje");
  await p.fill("[name=comision]", "0");
  assert.equal((await p.textContent("#o-dinero")).trim(), "");
  ok("sin comisión no muestra dinero");
  await p.fill("[name=leads]", "");
  assert.equal(await p.textContent("#o-espera"), "0");
  ok("campo vacío da cero");

  // 2. Formulario: valida y abre WhatsApp con el mensaje
  await p.fill("[name=leads]", "120");
  await p.click("#order-form button[type=submit]");
  assert.equal(await p.isVisible("#order-error"), true);
  assert.equal(await p.evaluate(() => document.activeElement.name), "nombre");
  ok("formulario vacío muestra error y enfoca el nombre");
  await p.fill("#order-form [name=nombre]", "Ana Pérez");
  await p.selectOption("#order-form [name=tipo]", "Inmobiliaria");
  const [popup] = await Promise.all([p.waitForEvent("popup"), p.click("#order-form button[type=submit]")]);
  const url = decodeURIComponent(popup.url().replace(/\+/g, " "));
  assert.match(url, /wa\.me\/529841362816|whatsapp/);
  assert.match(url, /soy Ana Pérez \(inmobiliaria\)/);
  assert.match(url, /aprox\. 120 prospectos al mes/);
  assert.equal(await p.isVisible("#order-error"), false);
  ok("formulario abre WhatsApp con nombre, tipo y volumen");
  await p.close();

  // 3. UTM: la campaña viaja en los mensajes
  p = await b.newPage();
  await p.goto(base + "?utm_source=linkedin&utm_campaign=lanzamiento", { waitUntil: "networkidle" });
  href = decodeURIComponent(await p.getAttribute(".hero .btn", "href"));
  assert.match(href, /Vengo de: inicio\. Campaña: lanzamiento \/ linkedin\./);
  href = decodeURIComponent(await p.getAttribute("#calc-cta", "href"));
  assert.match(href, /Campaña: lanzamiento \/ linkedin\./);
  ok("UTM se agrega a los mensajes");
  await p.close();

  // 4. Movimiento reducido: estaciones como botones
  p = await b.newPage({ reducedMotion: "reduce" });
  await p.goto(base, { waitUntil: "networkidle" });
  assert.equal(await p.evaluate(() => document.querySelector("#linea").classList.contains("is-scrolly")), false);
  await p.click(".station[data-i='2']");
  assert.equal(await p.textContent("[data-field=name]"), "Visita agendada");
  assert.equal(await p.locator(".stamps .seal.is-on").count(), 3);
  assert.equal(await p.getAttribute(".station[data-i='2']", "aria-pressed"), "true");
  ok("con movimiento reducido las estaciones cambian la orden y los sellos");
  await p.close();

  // 5. Scroll: la etapa sigue al progreso
  p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  for (const [frac, nombre] of [[0.02, "Nuevo contacto"], [0.3, "Prospecto interesado"], [0.55, "Visita agendada"], [0.98, "Propuesta en mesa"]]) {
    await p.evaluate((f) => { const l = document.querySelector("#linea"); scrollTo(0, l.getBoundingClientRect().top + scrollY + (l.offsetHeight - innerHeight) * f); }, frac);
    await p.waitForTimeout(250);
    assert.equal(await p.textContent("[data-field=name]"), nombre);
  }
  ok("el scroll recorre las cuatro estaciones");

  await b.close();
})().catch((e) => { console.error("✖", e.message); process.exit(1); });
