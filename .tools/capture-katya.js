// Captura perfiles de Katya Varela (IG + FB) usando el Chrome CON SESIÓN (CDP :9222)
const { chromium } = require('playwright-core');
const fs = require('fs');
const https = require('https');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/katya-varela/fuentes';
const IG = 'https://www.instagram.com/katyavarela.inversiones/';
const FB = 'https://www.facebook.com/profile.php?id=61557004452446';

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
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 1500 });
  const rep = {};

  // ===== 1) Instagram: perfil, bio, link-in-bio, retrato =====
  await page.goto(IG, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${OUT}/ig-perfil.png` });
  rep.ig = await page.evaluate(() => {
    const header = document.querySelector('header');
    const links = Array.from(document.querySelectorAll('header a'))
      .map((a) => ({ texto: (a.textContent || '').trim().slice(0, 140), href: a.href }))
      .filter((l) => /l\.instagram\.com|linktr|beacons|wa\.me|bit\.ly|taplink|linkin\.bio|https?:\/\/(?!www\.instagram)/.test(l.href));
    const img = document.querySelector('header img');
    return {
      bio: header ? header.innerText.slice(0, 1400) : '(sin header)',
      linksExternos: links,
      retrato: img ? img.src : '',
      titulo: document.title,
    };
  });
  if (rep.ig.retrato) await descargar(rep.ig.retrato, `${OUT}/retrato-katya.jpg`);

  // ===== 2) Instagram: grid del feed =====
  const items = new Map();
  for (let paso = 0; paso < 30; paso++) {
    const lote = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main a img'))
        .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 700), post: img.closest('a')?.href || '', w: img.naturalWidth }))
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

  // ===== 3) Facebook: perfil + about =====
  await page.goto(FB, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${OUT}/fb-perfil.png` });
  rep.fb = await page.evaluate(() => ({
    titulo: document.title,
    texto: (document.querySelector('div[role="main"]')?.innerText || '').slice(0, 3500),
  }));
  await page.evaluate(() => window.scrollBy(0, 1400));
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/fb-perfil-2.png` });

  try {
    await page.goto(FB + '&sk=about', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(7000);
    rep.fbAbout = (await page.evaluate(() => document.querySelector('div[role="main"]')?.innerText || '')).slice(0, 2500);
    await page.screenshot({ path: `${OUT}/fb-about.png` });
  } catch (e) { rep.fbAbout = 'error: ' + e.message.slice(0, 90); }

  // ===== 4) Google =====
  try {
    await page.goto('https://www.google.com/search?q=%22Katya+Varela%22+inversiones&hl=es', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    rep.google = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a h3')).slice(0, 10).map((h) => ({
        titulo: h.innerText, url: (h.closest('a')?.href || '').slice(0, 120),
      }))
    );
    await page.screenshot({ path: `${OUT}/google-katya.png` });
  } catch (e) { rep.google = { error: e.message.slice(0, 100) }; }

  fs.writeFileSync(`${OUT}/feed-manifest.json`, JSON.stringify(manifest, null, 1));
  fs.writeFileSync(`${OUT}/captura-report.json`, JSON.stringify(rep, null, 2));
  console.log('\n=== IG BIO ===\n', rep.ig.bio);
  console.log('\n=== IG LINKS ===', JSON.stringify(rep.ig.linksExternos, null, 1));
  console.log('\n=== FB ===\n', (rep.fb.texto || '').slice(0, 700));
  console.log('\n=== GOOGLE ===', JSON.stringify(rep.google, null, 1).slice(0, 700));
  await page.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
