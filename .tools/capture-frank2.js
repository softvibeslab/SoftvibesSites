// Extrae bio completa + link-in-bio + grid del feed de @frank.rivieramaya (sin login)
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
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    viewport: { width: 1280, height: 2400 },
    locale: 'es-MX',
  });
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/frank.rivieramaya/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Cerrar modal de login si aparece
  try { await page.click('div[role="dialog"] svg[aria-label*="errar"], div[role="dialog"] button:has(svg)', { timeout: 3000 }); } catch {}
  await page.waitForTimeout(1500);

  // Bio completa + links externos
  const info = await page.evaluate(() => {
    const header = document.querySelector('header');
    const links = Array.from(document.querySelectorAll('header a[href*="l.instagram.com"], header a[rel*="nofollow"]'))
      .map((a) => ({ texto: a.textContent.trim(), href: a.href }));
    return { bioTexto: header ? header.innerText : '(sin header)', linksExternos: links };
  });

  // Expandir "más" de la bio si existe
  try {
    await page.click('header span[role="button"]:has-text("más")', { timeout: 2000 });
    await page.waitForTimeout(800);
    info.bioExpandida = await page.evaluate(() => document.querySelector('header')?.innerText || '');
  } catch {}

  // Grid del feed: scrollear y recolectar
  const items = new Map();
  for (let paso = 0; paso < 12; paso++) {
    const lote = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main a img'))
        .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 600), post: img.closest('a')?.href || '', w: img.naturalWidth }))
        .filter((i) => /fbcdn\.net|cdninstagram/.test(i.src) && (i.w === 0 || i.w >= 300))
    ).catch(() => []);
    for (const it of lote) if (it.src && !items.has(it.src)) items.set(it.src, it);
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(1600);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/ig-grid-sin-modal.png`, fullPage: false });

  const lista = Array.from(items.values());
  console.log('items en grid:', lista.length);
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

  fs.writeFileSync(`${OUT}/ig-bio.json`, JSON.stringify(info, null, 2));
  fs.writeFileSync(`${OUT}/feed-manifest.json`, JSON.stringify(manifest, null, 1));
  console.log('\nBIO:\n', (info.bioExpandida || info.bioTexto || '').slice(0, 800));
  console.log('\nLINKS EXTERNOS:', JSON.stringify(info.linksExternos));
  await browser.close();
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
