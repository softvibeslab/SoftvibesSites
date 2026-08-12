// Extrae info y fotos de perfiles de Instagram usando el Chrome del usuario (CDP :9222)
const { chromium } = require('playwright-core');
const fs = require('fs');

const PERFILES = ['viridianamarrealtor', 'vivemarrealestate'];
const SALIDA = '/tmp/vivemar-ig';

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());
  const resultado = {};

  for (const perfil of PERFILES) {
    console.log(`\n=== @${perfil} ===`);
    await page.goto(`https://www.instagram.com/${perfil}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForTimeout(5000);

    const hayLogin = await page
      .locator('input[name="username"]')
      .count()
      .catch(() => 0);
    if (hayLogin > 0) {
      console.log('BLOQUEADO: aún pide login');
      continue;
    }

    // Scroll para cargar más posts
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 1800);
      await page.waitForTimeout(1800);
    }

    const datos = await page.evaluate(() => {
      const texto = (sel) => document.querySelector(sel)?.textContent?.trim() || null;
      // Estadísticas del header (posts, seguidores, seguidos)
      const stats = Array.from(document.querySelectorAll('header li')).map((li) =>
        li.textContent.trim()
      );
      // Bio: section del header
      const headerSection = document.querySelector('header section');
      const bio = headerSection ? headerSection.innerText : null;
      // Imágenes de posts con su alt (descripción)
      const imgs = Array.from(document.querySelectorAll('main article img, main a img'))
        .map((img) => ({ src: img.src, alt: img.alt || '' }))
        .filter((i) => i.src.includes('scontent'));
      // Avatar
      const avatar =
        document.querySelector('header img')?.src || null;
      return { titulo: document.title, stats, bio, avatar, imgs };
    });

    console.log('título:', datos.titulo);
    console.log('stats:', datos.stats);
    console.log('posts encontrados:', datos.imgs.length);
    resultado[perfil] = datos;

    await page.screenshot({
      path: `${SALIDA}/perfil-${perfil}.png`,
      fullPage: false,
    });
  }

  fs.writeFileSync(`${SALIDA}/datos.json`, JSON.stringify(resultado, null, 2));
  console.log(`\nGuardado en ${SALIDA}/datos.json`);
  await browser.close();
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
