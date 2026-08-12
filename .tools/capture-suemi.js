// Captura perfiles de Suemi García (IG + FB) usando el Chrome CON SESIÓN (CDP :9222)
// Requisito: Chrome abierto con --remote-debugging-port=9222
const { chromium } = require('playwright-core');
const fs = require('fs');
const https = require('https');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/suemi-garcia/fuentes';

function descargar(url, destino) {
  return new Promise((resolve) => {
    const f = fs.createWriteStream(destino);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) { f.close(); try { fs.unlinkSync(destino); } catch {} return resolve(false); }
      res.pipe(f);
      f.on('finish', () => f.close(() => resolve(true)));
    }).on('error', () => { try { f.close(); } catch {} resolve(false); });
  });
}

(async () => {
  fs.mkdirSync(`${OUT}/feed`, { recursive: true });
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = await context.newPage();
  const report = {};

  // ===== 1) Instagram: perfil (screenshot con encabezado) + bio + link-in-bio =====
  await page.goto('https://www.instagram.com/suemi_garcia_bienes_raices/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  report.ig = await page.evaluate(() => {
    const header = document.querySelector('header');
    const links = Array.from(document.querySelectorAll('header a'))
      .map((a) => ({ texto: (a.textContent || '').trim().slice(0, 120), href: a.href }))
      .filter((l) => /l\.instagram\.com|linktr|beacons|wa\.me|bit\.ly|taplink|linkin.bio|https?:\/\/(?!www\.instagram)/.test(l.href));
    return { bio: header ? header.innerText.slice(0, 1200) : '(sin header)', linksExternos: links, titulo: document.title };
  });
  await page.screenshot({ path: `${OUT}/ig-perfil.png`, fullPage: false });

  // ===== 2) Instagram: grid del feed (scroll + recolectar imágenes con caption) =====
  const items = new Map();
  for (let paso = 0; paso < 30; paso++) {
    const lote = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main a img'))
        .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 600), post: img.closest('a')?.href || '', w: img.naturalWidth }))
        .filter((i) => /fbcdn\.net|cdninstagram/.test(i.src) && (i.w === 0 || i.w >= 300) &&
          !/Foto del perfil|historia destacada|Avatar/i.test(i.alt))
    ).catch(() => []);
    for (const it of lote) if (it.src && !items.has(it.src)) items.set(it.src, it);
    await page.evaluate(() => window.scrollBy(0, 2400));
    await page.waitForTimeout(1500);
  }
  const lista = Array.from(items.values());
  console.log('IG grid items:', lista.length);
  const manifest = [];
  let ok = 0;
  for (let i = 0; i < lista.length; i++) {
    const it = lista[i];
    const nombre = `feed-${String(i).padStart(3, '0')}.jpg`;
    if (await descargar(it.src, `${OUT}/feed/${nombre}`)) {
      ok++;
      manifest.push({ archivo: `feed/${nombre}`, alt: it.alt, post: it.post });
    }
  }
  console.log('IG descargadas:', ok);

  // ===== 3) Facebook: perfil (screenshot + intro) =====
  await page.goto('https://www.facebook.com/suemi.garcia.5', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  report.fb = await page.evaluate(() => ({
    titulo: document.title,
    intro: (Array.from(document.querySelectorAll('div[role="main"]')).map((d) => d.innerText).join('\n') || '').slice(0, 2500),
  }));
  await page.screenshot({ path: `${OUT}/fb-perfil.png`, fullPage: false });
  await page.evaluate(() => window.scrollBy(0, 1200));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/fb-perfil-2.png`, fullPage: false });

  fs.writeFileSync(`${OUT}/feed-manifest.json`, JSON.stringify(manifest, null, 1));
  fs.writeFileSync(`${OUT}/captura-report.json`, JSON.stringify(report, null, 2));
  console.log('\nIG BIO:\n', report.ig.bio);
  console.log('\nIG LINKS EXTERNOS:', JSON.stringify(report.ig.linksExternos, null, 1));
  console.log('\nFB TITULO:', report.fb.titulo);
  // OJO: no llamar browser.close() sobre una conexión CDP — cerraría el Chrome del usuario.
  await page.close();
  console.log('\nListo. Archivos en', OUT);
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
