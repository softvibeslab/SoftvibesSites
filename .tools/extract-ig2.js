// v2: recolecta imágenes durante el scroll (lazy-loading) y las descarga
const { chromium } = require('playwright-core');
const fs = require('fs');
const https = require('https');

const PERFILES = ['vivemarrealestate', 'viridianamarrealtor'];
const SALIDA = '/tmp/vivemar-ig';

function descargar(url, destino) {
  return new Promise((resolve) => {
    const f = fs.createWriteStream(destino);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          f.close();
          fs.unlinkSync(destino);
          return resolve(false);
        }
        res.pipe(f);
        f.on('finish', () => f.close(() => resolve(true)));
      })
      .on('error', () => {
        f.close();
        resolve(false);
      });
  });
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());
  const resultado = {};

  for (const perfil of PERFILES) {
    console.log(`\n=== @${perfil} ===`);
    const dir = `${SALIDA}/${perfil}`;
    fs.mkdirSync(dir, { recursive: true });

    await page.goto(`https://www.instagram.com/${perfil}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForTimeout(5000);

    // Header: bio y contadores (antes de scrollear)
    const header = await page.evaluate(() => {
      const h = document.querySelector('header');
      return {
        texto: h ? h.innerText.split('\n').slice(0, 25) : [],
        avatar: h?.querySelector('img')?.src || null,
      };
    });
    console.log('header:', JSON.stringify(header.texto));

    // Recolectar imágenes en cada paso de scroll
    const imgs = new Map();
    for (let paso = 0; paso < 10; paso++) {
      const lote = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .map((img) => ({
            src: img.src,
            alt: (img.alt || '').slice(0, 200),
            ancho: img.naturalWidth,
          }))
          .filter(
            (i) =>
              /fbcdn\.net|cdninstagram|scontent/.test(i.src) &&
              i.ancho >= 400 &&
              !/Foto del perfil|historia destacada|Avatar del usuario/.test(i.alt)
          )
      );
      for (const i of lote) if (!imgs.has(i.src)) imgs.set(i.src, i);
      await page.evaluate(() => window.scrollBy(0, 2200));
      await page.waitForTimeout(1600);
    }
    console.log('imágenes únicas recolectadas:', imgs.size);

    // Descargar hasta 20
    const lista = Array.from(imgs.values()).slice(0, 30);
    let ok = 0;
    for (let i = 0; i < lista.length; i++) {
      const exito = await descargar(lista[i].src, `${dir}/post-${String(i).padStart(2, '0')}.jpg`);
      if (exito) ok++;
    }
    console.log(`descargadas: ${ok}/${lista.length} → ${dir}`);
    resultado[perfil] = { header, imagenes: lista.map((l) => ({ alt: l.alt, ancho: l.ancho })) };
  }

  fs.writeFileSync(`${SALIDA}/datos-v2.json`, JSON.stringify(resultado, null, 2));
  await browser.close();
  console.log('\nListo.');
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
