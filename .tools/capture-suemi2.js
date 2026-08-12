// Segunda pasada Suemi: screenshots limpios de IG/FB + retrato + auditoría de 307realtors.com
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
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 1500 });
  const rep = {};

  // 1) IG perfil — screenshot limpio + retrato
  await page.goto('https://www.instagram.com/suemi_garcia_bienes_raices/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${OUT}/ig-perfil.png` });
  const retrato = await page.evaluate(() => {
    const img = document.querySelector('header img, img[alt*="foto del perfil" i], img[alt*="profile picture" i]');
    return img ? img.src : '';
  });
  if (retrato) { await descargar(retrato, `${OUT}/retrato-suemi.jpg`); console.log('retrato:', retrato.slice(0, 70)); }

  // 2) FB perfil con sesión
  await page.goto('https://www.facebook.com/suemi.garcia.5', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${OUT}/fb-perfil.png` });
  rep.fb = await page.evaluate(() => {
    const main = document.querySelector('div[role="main"]');
    return { titulo: document.title, texto: (main ? main.innerText : '').slice(0, 3000) };
  });
  await page.evaluate(() => window.scrollBy(0, 1400));
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/fb-perfil-2.png` });

  // 3) FB "Información" (intro, trabajo, contacto)
  try {
    await page.goto('https://www.facebook.com/suemi.garcia.5/about', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(7000);
    rep.fbAbout = await page.evaluate(() => (document.querySelector('div[role="main"]')?.innerText || '').slice(0, 2500));
    await page.screenshot({ path: `${OUT}/fb-about.png` });
  } catch (e) { rep.fbAbout = 'error: ' + e.message.slice(0, 80); }

  // 4) 307realtors.com — ¿aparece Suemi? ¿tiene ficha propia?
  try {
    await page.goto('https://307realtors.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    rep.sitio307 = await page.evaluate(() => ({
      titulo: document.title,
      mencionaSuemi: /suemi/i.test(document.body.innerText),
      tieneWa: Array.from(document.querySelectorAll('a')).filter((a) => /wa\.me|whatsapp/i.test(a.href)).map((a) => a.href).slice(0, 5),
      texto: document.body.innerText.slice(0, 1200),
    }));
    await page.screenshot({ path: `${OUT}/sitio-307realtors.png`, fullPage: false });
  } catch (e) { rep.sitio307 = { error: e.message.slice(0, 100) }; }

  // 5) Google: ¿aparece ella?
  try {
    await page.goto('https://www.google.com/search?q=%22Suemi+Garcia%22+bienes+raices+Playa+del+Carmen&hl=es', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    rep.google = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a h3')).slice(0, 10).map((h) => ({
        titulo: h.innerText,
        url: (h.closest('a')?.href || '').slice(0, 110),
      }))
    );
    await page.screenshot({ path: `${OUT}/google-suemi.png` });
  } catch (e) { rep.google = { error: e.message.slice(0, 100) }; }

  fs.writeFileSync(`${OUT}/auditoria-report.json`, JSON.stringify(rep, null, 2));
  console.log('\n=== FB ABOUT ===\n', (rep.fbAbout || '').slice(0, 900));
  console.log('\n=== 307REALTORS ===\n', JSON.stringify(rep.sitio307, null, 1).slice(0, 900));
  console.log('\n=== GOOGLE ===\n', JSON.stringify(rep.google, null, 1).slice(0, 900));
  await page.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
