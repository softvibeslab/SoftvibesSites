// Extrae fotogramas de los reels de propiedades de Katya (Chrome con sesión, CDP :9222)
const { chromium } = require('playwright-core');
const fs = require('fs');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/katya-varela/fuentes/frames';
const manifest = JSON.parse(fs.readFileSync(
  '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/katya-varela/fuentes/feed-manifest.json', 'utf8'));

// Índices del manifest que son reels de propiedades
const OBJETIVOS = [
  { i: 5,  etiqueta: 'depto-vista-mar' },   // Deptos PDC equipados, vista al mar desde 2.6 MDP
  { i: 12, etiqueta: 'aldea-zama' },        // Aldea Zamá, 12 amenidades
  { i: 13, etiqueta: 'frente-al-mar' },     // Tres ventajas depto frente al mar Caribe
  { i: 18, etiqueta: 'despertar-mar' },     // Despertar con el sonido del mar
  { i: 0,  etiqueta: 'municipio' },         // El municipio de mayor crecimiento
];

const TIEMPOS = [0.12, 0.25, 0.38, 0.5, 0.62, 0.75, 0.88];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1280, height: 1200 });

  for (const obj of OBJETIVOS) {
    const url = manifest[obj.i]?.post;
    if (!url) { console.log(obj.etiqueta, '-> sin url'); continue; }
    console.log(`\n=== ${obj.etiqueta} :: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(6000);

      const video = await page.$('video');
      if (!video) { console.log('  (sin <video>: es foto o carrusel)'); continue; }

      // Arrancar y silenciar para que cargue el buffer
      const dur = await page.evaluate(async () => {
        const v = document.querySelector('video');
        v.muted = true;
        try { await v.play(); } catch {}
        await new Promise((r) => setTimeout(r, 2500));
        return v.duration || 0;
      });
      console.log(`  duración: ${dur.toFixed(1)}s`);
      if (!dur || !isFinite(dur)) { console.log('  (duración desconocida)'); continue; }

      for (const frac of TIEMPOS) {
        const t = +(dur * frac).toFixed(2);
        await page.evaluate(async (seg) => {
          const v = document.querySelector('video');
          v.pause();
          v.currentTime = seg;
          await new Promise((r) => {
            const done = () => { v.removeEventListener('seeked', done); r(); };
            v.addEventListener('seeked', done);
            setTimeout(r, 2500);
          });
        }, t);
        await page.waitForTimeout(700);
        const nombre = `${obj.etiqueta}-t${String(Math.round(frac * 100)).padStart(2, '0')}.jpg`;
        try {
          await video.screenshot({ path: `${OUT}/${nombre}`, type: 'jpeg', quality: 92 });
          console.log(`  ✓ ${nombre} (t=${t}s)`);
        } catch (e) { console.log(`  ✗ ${nombre}: ${e.message.slice(0, 60)}`); }
      }
    } catch (e) {
      console.log('  error:', e.message.slice(0, 110));
    }
  }

  await page.close();
  console.log('\nFrames en', OUT);
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
