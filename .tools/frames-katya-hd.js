// Recaptura en alta resolución los fotogramas elegidos (video ampliado + deviceScaleFactor 2)
const { chromium } = require('playwright-core');
const fs = require('fs');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/katya-varela/fuentes/frames-gal';
const M = JSON.parse(fs.readFileSync(
  '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/katya-varela/fuentes/feed-manifest.json', 'utf8'));

// destino -> { índice del reel, fracción del video }
const ELEGIDOS = [
  { salida: 'g18-terraza',   i: 18, frac: 0.38 },
  { salida: 'g18-aerea',     i: 18, frac: 0.62 },
  { salida: 'g18-mar',       i: 18, frac: 0.88 },
  { salida: 'g13-cocina2',   i: 13, frac: 0.50 },
  { salida: 'g13-comedor',   i: 13, frac: 0.62 },
  { salida: 'g13-entrada',   i: 13, frac: 0.12 },
  { salida: 'g12-alberca2',  i: 12, frac: 0.62 },
  { salida: 'g12-amenidad',  i: 12, frac: 0.50 },
  { salida: 'g12-fachada',   i: 12, frac: 0.88 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1200, height: 2000, deviceScaleFactor: 2, mobile: false,
  });

  let urlActual = '';
  for (const e of ELEGIDOS) {
    const url = M[e.i]?.post;
    if (!url) { console.log(e.salida, '-> sin url'); continue; }
    try {
      if (url !== urlActual) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(6500);
        // Ampliar el video al máximo del viewport para ganar resolución
        // Ocultar TODA la interfaz de Instagram y dejar solo el video visible
        await page.addStyleTag({ content: `
          body * { visibility: hidden !important; }
          video { visibility: visible !important;
                  position: fixed !important; top: 0 !important; left: 0 !important;
                  width: 1200px !important; height: auto !important; max-height: none !important;
                  z-index: 2147483647 !important; object-fit: contain !important; }
          body { background: #000 !important; }
        ` });
        await page.evaluate(async () => {
          const v = document.querySelector('video');
          if (v) { v.muted = true; try { await v.play(); } catch {} }
          await new Promise((r) => setTimeout(r, 2500));
        });
        urlActual = url;
      }

      const dur = await page.evaluate(() => document.querySelector('video')?.duration || 0);
      if (!dur || !isFinite(dur)) { console.log(e.salida, '-> duración desconocida'); continue; }
      const t = +(dur * e.frac).toFixed(2);

      await page.evaluate(async (seg) => {
        const v = document.querySelector('video');
        v.pause(); v.currentTime = seg;
        await new Promise((r) => {
          const ok = () => { v.removeEventListener('seeked', ok); r(); };
          v.addEventListener('seeked', ok);
          setTimeout(r, 3000);
        });
      }, t);
      await page.waitForTimeout(900);

      const video = await page.$('video');
      await video.screenshot({ path: `${OUT}/${e.salida}.jpg`, type: 'jpeg', quality: 94 });
      const tam = fs.statSync(`${OUT}/${e.salida}.jpg`).size;
      console.log(`✓ ${e.salida.padEnd(18)} t=${t}s  ${Math.round(tam/1024)}KB`);
    } catch (err) {
      console.log(`✗ ${e.salida}: ${err.message.slice(0, 90)}`);
    }
  }

  await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  await page.close();
  console.log('\nHD en', OUT);
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
