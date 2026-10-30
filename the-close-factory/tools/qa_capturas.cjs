// Capturas de QA. Uso:
//   NODE_PATH=<carpeta con playwright> node tools/qa_capturas.cjs <url-base> <carpeta-salida>
const { chromium } = require("playwright");

const base = process.argv[2] || "http://127.0.0.1:8790/";
const outDir = process.argv[3] || "qa";
const secciones = [".hero", ".problem", "#calculadora", "#como-funciona", "#solucion", "#para-quien", ".backing", ".metrics", "#preguntas", "#diagnostico"];

async function correr(nombre, opciones, extra = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...opciones, ...extra });
  const errores = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(String(e)));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });

  for (const sel of secciones) {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (s === ".hero" ? 999 : 60));
    }, sel);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/${nombre}-${sel.replace(/[#.]/g, "")}.png` });
  }

  // La línea: cuatro posiciones de scroll
  for (const [i, f] of [0.05, 0.32, 0.6, 0.95].entries()) {
    await page.evaluate((frac) => {
      const l = document.querySelector("#linea");
      const top = l.getBoundingClientRect().top + window.scrollY;
      const rec = Math.max(0, l.offsetHeight - window.innerHeight);
      window.scrollTo(0, top + rec * frac + (rec ? 0 : -60));
    }, f);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outDir}/${nombre}-linea-${i}.png` });
    if (extra.reducedMotion) break;
  }
  await browser.close();
  return errores;
}

(async () => {
  const errores = {
    escritorio: await correr("desk", { viewport: { width: 1440, height: 900 } }),
    movil: await correr("mob", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }),
    reducido: await correr("rm", { viewport: { width: 1440, height: 900 } }, { reducedMotion: "reduce" }),
  };
  console.log(JSON.stringify(errores, null, 1));
})();
