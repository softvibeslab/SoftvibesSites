import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '../dist');
const port = 4387;
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || '/', `http://127.0.0.1:${port}`).pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = normalize(join(root, relative));
  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
});

await new Promise((resolveListen) => server.listen(port, '127.0.0.1', resolveListen));
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    const journalImages = page.locator('.journal-photo img');
    for (let index = 0; index < await journalImages.count(); index += 1) {
      await journalImages.nth(index).scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    if (!(await page.locator('h1').getByText(/Aprender el oficio/i).isVisible())) throw new Error(`${viewport.name}: hero no visible`);
    if (await page.locator('.batch-card').count() !== 3) throw new Error(`${viewport.name}: deben verse tres lotes`);
    if (await page.locator('[data-process-video]').count() !== 3) throw new Error(`${viewport.name}: deben verse tres videos de proceso`);
    if (await page.locator('.journal-photo').count() !== 6) throw new Error(`${viewport.name}: el archivo fotográfico está incompleto`);
    if (await page.locator('.faq-list details').count() !== 4) throw new Error(`${viewport.name}: FAQ incompleta`);
    if ((await page.locator('meta[name="robots"]').getAttribute('content')) !== 'noindex,nofollow') throw new Error(`${viewport.name}: falta noindex`);
    if (!(await page.locator('img[alt*="Logotipo"]').evaluate((image) => image.complete && image.naturalWidth > 0))) throw new Error(`${viewport.name}: logo no cargó`);
    if (!(await page.locator('.hero-photo-card img').evaluate((image) => image.complete && image.naturalWidth > 0))) throw new Error(`${viewport.name}: fotografía principal no cargó`);
    if (!(await journalImages.evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)))) throw new Error(`${viewport.name}: hay fotografías del archivo sin cargar`);
    if (!(await page.locator('[data-instagram]').first().getAttribute('href'))?.includes('instagram.com/cerveceria.malandra')) throw new Error(`${viewport.name}: CTA de Instagram inválido`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) throw new Error(`${viewport.name}: overflow horizontal de ${overflow}px`);
    if (errors.length) throw new Error(`${viewport.name}: errores del navegador: ${errors.join(' | ')}`);
    await page.screenshot({ path: resolve(import.meta.dirname, `../qa/media-${viewport.name}.png`), fullPage: true });
    await page.close();
  }
  console.log('OK: landing verificada en 1440px y 390px sin errores, overflow ni recursos faltantes.');
} finally {
  await browser.close();
  server.close();
}
