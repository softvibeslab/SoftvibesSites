import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import parser from 'php-parser';

const root = resolve(import.meta.dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const content = readJson('public/data/site-content.json');
const research = readJson('data/2026-08-05_diana-velas-love-instagram-analysis.json');

assert(content.brand.name === 'Diana Velas Love', 'La marca inicial cambió inesperadamente.');
assert(Array.isArray(content.products) && content.products.length === 12, 'El catálogo inicial debe contener 12 productos.');
assert(new Set(content.products.map((product) => product.id)).size === content.products.length, 'Los IDs de producto deben ser únicos.');
assert(content.products.every((product) => /^(?:[a-z0-9]+-)*[a-z0-9]+$/.test(product.id)), 'Hay un ID de producto inválido.');
assert(content.products.every((product) => existsSync(resolve(root, `public${product.image}`))), 'Falta una imagen local de producto.');
assert(content.products.every((product) => product.sourceUrl.startsWith('https://www.instagram.com/p/')), 'Cada producto necesita una fuente de Instagram.');
assert(content.products.every((product) => product.message.toLocaleLowerCase('es').includes(product.name.toLocaleLowerCase('es'))), 'Cada mensaje debe mencionar su producto.');
assert(content.contact.whatsappNumber === '' || /^\d{10,15}$/.test(content.contact.whatsappNumber), 'WhatsApp debe quedar vacío o usar 10–15 dígitos.');
assert(!JSON.stringify(content).includes('529841234567'), 'El número de ejemplo no debe convertirse en contacto real.');
assert(content.faq.length >= 4, 'La landing necesita preguntas frecuentes suficientes.');

assert(research.sample.items === 26, 'La muestra de investigación debe conservar 26 posts.');
assert(research.posts.length === 26, 'El dataset limpio debe conservar los 26 registros.');
assert(research.posts.every((post) => post.url.includes('instagram.com/p/')), 'Hay una fuente de publicación inválida.');
assert(research.metrics.playsTotal === research.posts.reduce((total, post) => total + (post.videoPlayCount || 0), 0), 'El total de reproducciones no coincide.');
assert(research.metrics.likesTotal === research.posts.reduce((total, post) => total + (post.likesCount || 0), 0), 'El total de Me gusta no coincide.');
assert(research.metrics.commentsTotal === research.posts.reduce((total, post) => total + (post.commentsCount || 0), 0), 'El total de comentarios no coincide.');

const sourceCodes = new Set(research.posts.map((post) => post.shortCode));
assert(content.products.every((product) => sourceCodes.has(new URL(product.sourceUrl).pathname.split('/').filter(Boolean).at(-1))), 'Un producto no existe en el dataset de investigación.');

const landing = readFileSync(resolve(root, 'src/components/Landing.astro'), 'utf8');
const analysis = readFileSync(resolve(root, 'src/pages/analisis/index.astro'), 'utf8');
assert(landing.includes('data-wa-product'), 'Falta el CTA individual de WhatsApp.');
assert(landing.includes('data-filter-list'), 'Faltan filtros del catálogo.');
assert(analysis.includes('no equivale a demanda'), 'El análisis debe conservar el límite de interpretación.');

const phpEngine = new parser.Engine({ parser: { version: '8.3' }, ast: { withPositions: true } });
const phpDirectory = resolve(root, 'public/admin');
for (const file of readdirSync(phpDirectory).filter((name) => name.endsWith('.php'))) {
  phpEngine.parseCode(readFileSync(resolve(phpDirectory, file), 'utf8'), file);
}

console.log('OK: catálogo, trazabilidad, métricas, guardas de WhatsApp y sintaxis PHP verificados.');
