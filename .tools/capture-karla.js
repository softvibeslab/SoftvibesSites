// Captura perfil IG + screenshots de sitios para Dra. Karla Duarte
const { chromium } = require('playwright-core');
const fs = require('fs');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/karla-duarte-cirujana/fuentes';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    viewport: { width: 1280, height: 1600 },
    locale: 'es-MX',
  });
  const page = await ctx.newPage();
  const report = {};

  // 1) Instagram — extraer og:description (seguidores/posts) + screenshot
  try {
    await page.goto('https://www.instagram.com/drakarladuarte/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    const meta = await page.evaluate(() => {
      const g = (p) => document.querySelector(`meta[property="${p}"]`)?.content || '';
      return {
        ogDesc: g('og:description'),
        ogTitle: g('og:title'),
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content || '',
      };
    });
    report.instagram = meta;
    await page.screenshot({ path: `${OUT}/ig-perfil.png`, fullPage: false });
    console.log('IG og:description =>', meta.ogDesc || meta.desc || '(vacío)');
  } catch (e) { console.log('IG error:', e.message.slice(0, 140)); report.instagram = { error: e.message.slice(0,140) }; }

  // 2) Screenshots de sus dos sitios (escena "Antes")
  for (const [name, url] of [['sitio1-cirujanocancun', 'https://cirujanocancun.com/'], ['sitio2-drakarladuarte', 'https://drakarladuarte.com/']]) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      console.log('screenshot OK:', name);
    } catch (e) { console.log(name, 'error:', e.message.slice(0, 120)); }
  }

  fs.writeFileSync(`${OUT}/captura-report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log('\nListo. Archivos en', OUT);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
