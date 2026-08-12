import { chromium } from 'playwright';

const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:4323';
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  assert(await page.locator('[data-product-id]').count() === 12, 'La landing debe mostrar 12 productos al iniciar.');
  await page.getByRole('button', { name: 'Jabones', exact: true }).click();
  assert(await page.locator('[data-product-id]').count() === 2, 'El filtro Jabones debe mostrar 2 productos.');
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  assert(await page.locator('[data-product-id]').count() === 12, 'El filtro Todos debe restaurar el catálogo.');

  const firstProduct = page.locator('[data-product-id="rosa-manana"]');
  const productHref = await firstProduct.locator('[data-wa-product]').getAttribute('href');
  assert(productHref?.startsWith('https://wa.me/?text='), 'Sin número configurado, el CTA debe abrir el selector de WhatsApp.');
  assert(decodeURIComponent(productHref || '').includes('Rosa de mañana'), 'El CTA debe mencionar el producto seleccionado.');
  assert(await page.locator('[data-preview-notice]').getByText('Número de WhatsApp pendiente de confirmar', { exact: false }).count() === 1, 'La demo debe advertir que falta WhatsApp.');

  await page.goto(`${baseUrl}/analisis/`, { waitUntil: 'networkidle' });
  assert(await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex,nofollow', 'El análisis debe permanecer noindex.');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `La landing móvil tiene ${overflow}px de desbordamiento horizontal.`);
  assert(errors.length === 0, `Errores de navegador: ${errors.join(' | ')}`);
  console.log('OK: filtros, CTA por producto, noindex, consola y responsive verificados.');
} finally {
  await browser.close();
}
