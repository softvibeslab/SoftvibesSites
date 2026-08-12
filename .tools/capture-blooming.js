// Captura el perfil de @blooming_skincare_ usando el Chrome CON SESIÓN (CDP :9222)
const { chromium } = require('playwright-core');
const fs = require('fs');
const https = require('https');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/blooming-skincare/fuentes';
const IG = 'https://www.instagram.com/blooming_skincare_/';

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
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1280, height: 1500 });
  const rep = {};

  // ===== 1) Perfil: bio, link-in-bio, retrato, destacados =====
  await page.goto(IG, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${OUT}/ig-perfil.png` });

  // Expandir la bio si tiene "más"
  try {
    await page.click('header span[role="button"]:has-text("más"), header button:has-text("más")', { timeout: 2500 });
    await page.waitForTimeout(1000);
  } catch {}

  rep.ig = await page.evaluate(() => {
    const header = document.querySelector('header');
    const links = Array.from(document.querySelectorAll('header a'))
      .map((a) => ({ texto: (a.textContent || '').trim().slice(0, 160), href: a.href }))
      .filter((l) => /l\.instagram\.com|linktr|beacons|wa\.me|bit\.ly|taplink|linkin\.bio|api\.whatsapp|https?:\/\/(?!www\.instagram)/.test(l.href));
    const img = document.querySelector('header img');
    // Categoría profesional y botones de acción (Reservar, Contactar, etc.)
    const botones = Array.from(document.querySelectorAll('header div[role="button"], header button'))
      .map((b) => (b.textContent || '').trim()).filter((t) => t && t.length < 40);
    return {
      bio: header ? header.innerText.slice(0, 1600) : '(sin header)',
      linksExternos: links,
      retrato: img ? img.src : '',
      botones: Array.from(new Set(botones)).slice(0, 12),
      titulo: document.title,
    };
  });
  if (rep.ig.retrato) await descargar(rep.ig.retrato, `${OUT}/retrato.jpg`);

  // ===== 2) Grid del feed =====
  const items = new Map();
  for (let paso = 0; paso < 32; paso++) {
    const lote = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main a img'))
        .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 800), post: img.closest('a')?.href || '', w: img.naturalWidth }))
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

  // ===== 3) Google =====
  try {
    await page.goto('https://www.google.com/search?q=%22blooming+skincare%22&hl=es', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    rep.google = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a h3')).slice(0, 10).map((h) => ({
        titulo: h.innerText, url: (h.closest('a')?.href || '').slice(0, 130),
      }))
    );
    await page.screenshot({ path: `${OUT}/google.png` });
  } catch (e) { rep.google = { error: e.message.slice(0, 100) }; }

  fs.writeFileSync(`${OUT}/feed-manifest.json`, JSON.stringify(manifest, null, 1));
  fs.writeFileSync(`${OUT}/captura-report.json`, JSON.stringify(rep, null, 2));
  console.log('\n=== BIO ===\n' + rep.ig.bio);
  console.log('\n=== LINKS ===', JSON.stringify(rep.ig.linksExternos, null, 1));
  console.log('\n=== BOTONES ===', JSON.stringify(rep.ig.botones));
  console.log('\n=== GOOGLE ===', JSON.stringify(rep.google, null, 1).slice(0, 800));
  await page.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
