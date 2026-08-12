import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import parser from 'php-parser';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const content = JSON.parse(read('public/data/site-content.json'));
assert(content.brand.name === 'Malandra', 'La marca inicial debe ser Malandra.');
assert(content.contact.instagram === 'https://www.instagram.com/cerveceria.malandra/', 'El CTA debe apuntar al perfil oficial compartido.');
assert(content.contact.informationSource === 'https://www.instagram.com/valle.malandra/', 'La fuente informativa debe seguir separada.');
assert(Array.isArray(content.batches) && content.batches.length === 3, 'La primera versión debe contener tres lotes documentados.');
assert(new Set(content.batches.map((batch) => batch.id)).size === content.batches.length, 'Los IDs de lotes deben ser únicos.');
assert(content.batches.every((batch) => /^(?:[a-z0-9]+-)*[a-z0-9]+$/.test(batch.id)), 'Hay un ID de lote inválido.');
assert(content.batches.every((batch) => batch.sourceUrl.startsWith('https://www.instagram.com/p/')), 'Cada lote necesita una publicación fuente.');
assert(content.batches.every((batch) => batch.available === false), 'Ningún lote puede marcarse disponible sin confirmación.');
assert(content.batches.every((batch) => !('price' in batch) && !('stock' in batch)), 'La primera versión no debe inventar precio o stock.');
assert(content.faq.length >= 4 && content.process.length === 4 && content.timeline.length === 3, 'Faltan bloques editoriales requeridos.');
assert(existsSync(resolve(root, 'public/img/logo.jpg')), 'Falta el logo local.');
assert(content.media.clips.length === 3, 'Deben publicarse los tres videos de proceso de Malandra.');
assert(content.media.photos.length === 6, 'Deben publicarse seis fotografías dentro del archivo visual.');
for (const clip of content.media.clips) {
  assert(existsSync(resolve(root, `public${clip.src}`)), `Falta el video ${clip.src}.`);
  assert(existsSync(resolve(root, `public${clip.poster}`)), `Falta el póster ${clip.poster}.`);
}
for (const photo of content.media.photos) assert(existsSync(resolve(root, `public${photo.src}`)), `Falta la fotografía ${photo.src}.`);
for (const featuredPhoto of ['public/media/finished-beer.jpg', 'public/media/brewing-system.jpg']) assert(existsSync(resolve(root, featuredPhoto)), `Falta la fotografía destacada ${featuredPhoto}.`);

const landing = read('src/pages/index.astro');
const layout = read('src/layouts/BaseLayout.astro');
assert(landing.includes('data-batch-grid'), 'Falta la colección de lotes.');
assert(landing.includes('data-timeline-list'), 'Falta la bitácora cronológica.');
assert(landing.includes('data-process-video'), 'Falta el archivo de video del proceso.');
assert(landing.includes("fetch('/data/site-content.json'"), 'La landing debe leer los cambios del CMS sin recompilar.');
assert(layout.includes('noindex,nofollow'), 'El prototipo local debe permanecer fuera de índices de búsqueda.');

const projectText = [landing, read('src/styles/global.css'), read('README.md'), JSON.stringify(content)].join('\n').toLowerCase();
for (const foreignClient of ['diana velas', 'val madero', 'vivemar', 'emir24']) {
  assert(!projectText.includes(foreignClient), `Se detectó contaminación de otro cliente: ${foreignClient}.`);
}
assert(!projectText.includes('cervezanucali'), 'No debe publicarse material de una cerveza ajena como si fuera Malandra.');

const config = read('public/admin/config.php');
const editor = read('public/admin/editor.php');
assert(config.includes("getenv('MALANDRA_CMS_USER')"), 'El CMS debe leer el usuario desde el entorno.');
assert(config.includes("getenv('MALANDRA_CMS_PASSWORD_HASH')"), 'El CMS debe leer el hash desde el entorno.');
assert(config.includes("($batch['available'] ?? true) !== false"), 'Falta la guarda de disponibilidad comercial.');
assert(editor.includes("$batch['available'] = false"), 'El editor debe forzar disponibilidad falsa.');
assert(editor.includes('media[clips]'), 'El CMS debe permitir editar los textos del archivo multimedia.');

const phpEngine = new parser.Engine({ parser: { version: '8.3' }, ast: { withPositions: true } });
for (const file of readdirSync(resolve(root, 'public/admin')).filter((name) => name.endsWith('.php'))) {
  phpEngine.parseCode(read(`public/admin/${file}`), file);
}

console.log('OK: fuentes, lotes, guardas comerciales, CMS, cliente aislado y sintaxis PHP verificados.');
