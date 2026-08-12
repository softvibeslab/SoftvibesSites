// Cosechador de media de las redes de Vive Mar — usa el Chrome con sesión (CDP :9222)
// Uso: node harvest-social.js <fuente>   (ig | tiktok | facebook | pinterest | linkedin)
const { chromium } = require('playwright-core');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const SALIDA = '/tmp/vivemar-media';
const FUENTE = process.argv[2] || 'ig';

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

async function scrollYRecolectar(page, extraer, maxPasos, quietudMax = 5) {
  const items = new Map();
  let quietud = 0;
  for (let paso = 0; paso < maxPasos && quietud < quietudMax; paso++) {
    const lote = await page.evaluate(extraer).catch(() => []);
    const antes = items.size;
    for (const it of lote) if (it.src && !items.has(it.src)) items.set(it.src, it);
    quietud = items.size === antes ? quietud + 1 : 0;
    await page.evaluate(() => window.scrollBy(0, 2400));
    await page.waitForTimeout(1400);
  }
  return Array.from(items.values());
}

// Extractores por red (corren en el contexto de la página)
const EXTRACTORES = {
  ig: () =>
    Array.from(document.querySelectorAll('main a img'))
      .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 500), post: img.closest('a')?.href || '', w: img.naturalWidth }))
      .filter((i) => /fbcdn\.net|cdninstagram/.test(i.src) && (i.w === 0 || i.w >= 300) &&
        !/Foto del perfil|historia destacada|Avatar/.test(i.alt)),
  tiktok: () =>
    Array.from(document.querySelectorAll('[data-e2e="user-post-item"] img, [class*="DivPlayerContainer"] img'))
      .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 500), post: img.closest('a')?.href || '' }))
      .filter((i) => i.src.startsWith('http')),
  facebook: () =>
    Array.from(document.querySelectorAll('a[href*="photo"] img, a[href*="/videos/"] img'))
      .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 500), post: img.closest('a')?.href || '', w: img.width }))
      .filter((i) => /fbcdn/.test(i.src) && (i.w === 0 || i.w >= 120)),
  pinterest: () =>
    Array.from(document.querySelectorAll('img[src*="pinimg"]'))
      .map((img) => {
        // usar la variante más grande del srcset
        let src = img.src;
        if (img.srcset) {
          const cand = img.srcset.split(',').map((s) => s.trim().split(' ')[0]).pop();
          if (cand) src = cand;
        }
        return { src, alt: (img.alt || '').slice(0, 500), post: img.closest('a')?.href || '' };
      }),
  linkedin: () =>
    Array.from(document.querySelectorAll('img[class*="update-components-image"], .feed-shared-update-v2 img'))
      .map((img) => ({ src: img.src, alt: (img.alt || '').slice(0, 500), post: '', w: img.width }))
      .filter((i) => /licdn/.test(i.src) && (i.w === 0 || i.w >= 200)),
};

const OBJETIVOS = {
  ig: [
    { cuenta: '@viridianamarrealtor', url: 'https://www.instagram.com/viridianamarrealtor/', pasos: 90 },
    { cuenta: '@vivemarrealestate', url: 'https://www.instagram.com/vivemarrealestate/', pasos: 40 },
  ],
  tiktok: [
    { cuenta: '@viridianamarrealtor', url: 'https://www.tiktok.com/@viridianamarrealtor', pasos: 50 },
    { cuenta: '@vivemarrealestate', url: 'https://www.tiktok.com/@vivemarrealestate', pasos: 20 },
  ],
  facebook: [
    { cuenta: 'vivemarrealestate', url: 'https://www.facebook.com/vivemarrealestate/photos', pasos: 40 },
  ],
  pinterest: [
    { cuenta: 'vivemarrealestate', url: 'https://mx.pinterest.com/vivemarrealestate/', pasos: 25 },
  ],
  linkedin: [
    { cuenta: 'vivemarrealestate', url: 'https://www.linkedin.com/company/vivemarrealestate/posts/', pasos: 25 },
  ],
};

(async () => {
  fs.mkdirSync(`${SALIDA}/${FUENTE}`, { recursive: true });
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());
  const manifest = [];

  for (const obj of OBJETIVOS[FUENTE]) {
    console.log(`\n=== ${FUENTE} ${obj.cuenta} ===`);
    try {
      await page.goto(obj.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000);
      const items = await scrollYRecolectar(page, EXTRACTORES[FUENTE], obj.pasos);
      console.log(`recolectados: ${items.length}`);

      let ok = 0;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const nombre = `${obj.cuenta.replace(/[@]/g, '')}-${String(i).padStart(3, '0')}.jpg`;
        const ruta = `${SALIDA}/${FUENTE}/${nombre}`;
        if (await descargar(it.src, ruta)) {
          ok++;
          const sha1 = crypto.createHash('sha1').update(fs.readFileSync(ruta)).digest('hex');
          manifest.push({ fuente: FUENTE, cuenta: obj.cuenta, archivo: `${FUENTE}/${nombre}`, alt: it.alt, post: it.post, sha1 });
        }
      }
      console.log(`descargados: ${ok}`);
    } catch (e) {
      console.log(`error en ${obj.cuenta}:`, e.message.slice(0, 120));
    }
  }

  const rutaManifest = `${SALIDA}/manifest-${FUENTE}.json`;
  fs.writeFileSync(rutaManifest, JSON.stringify(manifest, null, 1));
  console.log(`\nmanifest: ${rutaManifest} (${manifest.length} items)`);
  await browser.close();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
