// Reintento: extraer grid IG de @frank.rivieramaya con diagnóstico (sin tocar el modal)
const { chromium } = require('playwright-core');
const fs = require('fs');
const https = require('https');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/frank-hernandez/fuentes';

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
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
    viewport: { width: 1440, height: 2600 },
    locale: 'es-MX',
  });
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/frank.rivieramaya/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  const diag = await page.evaluate(() => ({
    titulo: document.title,
    imgsTotal: document.querySelectorAll('img').length,
    imgsCdn: Array.from(document.querySelectorAll('img')).filter((i) => /cdninstagram|fbcdn/.test(i.src)).length,
    tieneHeader: !!document.querySelector('header'),
    tieneMain: !!document.querySelector('main'),
    headerTexto: (document.querySelector('header section')?.innerText || '').slice(0, 900),
    linksExternos: Array.from(document.querySelectorAll('a')).filter((a) => /l\.instagram\.com/.test(a.href)).map((a) => ({ t: a.textContent.trim(), h: a.href })),
  }));
  console.log('DIAG:', JSON.stringify({ ...diag, headerTexto: undefined, linksExternos: undefined }));
  console.log('\nHEADER:\n', diag.headerTexto);
  console.log('\nLINKS EXTERNOS:', JSON.stringify(diag.linksExternos));

  const items = new Map();
  for (let paso = 0; paso < 10; paso++) {
    const lote = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 600), post: img.closest('a')?.href || '', w: img.naturalWidth, cw: img.width }))
        .filter((i) => /cdninstagram|fbcdn/.test(i.src) && i.post.includes('/p/'))
    ).catch(() => []);
    for (const it of lote) if (it.src && !items.has(it.src)) items.set(it.src, it);
    await page.evaluate(() => window.scrollBy(0, 2200));
    await page.waitForTimeout(1800);
  }

  const lista = Array.from(items.values());
  console.log('\nitems del grid con /p/:', lista.length);
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
  console.log('descargadas:', ok);
  fs.writeFileSync(`${OUT}/feed-manifest.json`, JSON.stringify(manifest, null, 1));
  fs.writeFileSync(`${OUT}/ig-bio.json`, JSON.stringify(diag, null, 2));
  await browser.close();
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
