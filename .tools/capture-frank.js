// Captura perfiles IG/FB + posts específicos de Frank Hernandez (Riviera Maya)
const { chromium } = require('playwright-core');
const fs = require('fs');

const OUT = '/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/frank-hernandez/fuentes';

const OBJETIVOS = [
  { nombre: 'ig-perfil', url: 'https://www.instagram.com/frank.rivieramaya/', full: false },
  { nombre: 'ig-post-DNmauqFtHDR', url: 'https://www.instagram.com/p/DNmauqFtHDR/', full: false },
  { nombre: 'ig-post-CQfLKHpDMMX', url: 'https://www.instagram.com/p/CQfLKHpDMMX/', full: false },
  { nombre: 'fb-perfil', url: 'https://www.facebook.com/frankhernandezriviera', full: false },
  { nombre: 'fb-grupo-playarentals', url: 'https://www.facebook.com/groups/Playarentalsmx/posts/4298962407021170/', full: false },
];

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

  for (const obj of OBJETIVOS) {
    try {
      await page.goto(obj.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4500);
      const meta = await page.evaluate(() => {
        const g = (p) => document.querySelector(`meta[property="${p}"]`)?.content || '';
        return {
          ogDesc: g('og:description'),
          ogTitle: g('og:title'),
          ogImage: g('og:image'),
          title: document.title,
          desc: document.querySelector('meta[name="description"]')?.content || '',
          url: location.href,
        };
      });
      report[obj.nombre] = meta;
      await page.screenshot({ path: `${OUT}/${obj.nombre}.png`, fullPage: obj.full });
      console.log(`${obj.nombre} =>`, (meta.ogDesc || meta.desc || meta.ogTitle || '(vacío)').slice(0, 220));
    } catch (e) {
      console.log(`${obj.nombre} error:`, e.message.slice(0, 140));
      report[obj.nombre] = { error: e.message.slice(0, 140) };
    }
  }

  fs.writeFileSync(`${OUT}/captura-report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log('\nListo. Archivos en', OUT);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
