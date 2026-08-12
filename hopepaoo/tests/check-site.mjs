import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

const [datasetText, configText, landing, analysis, cms, siteData] = await Promise.all([
  read('data/2026-08-05_hopepaoo-instagram-analysis.json'),
  read('config.json'),
  read('landing.html'),
  read('analisis/index.html'),
  read('cms/index.html'),
  read('site-data.js')
]);

const dataset = JSON.parse(datasetText);
const config = JSON.parse(configText);

assert.equal(dataset.source.returned, 30, 'Apify debe documentar 30 resultados devueltos');
assert.equal(dataset.ownedPosts.length, 28, 'El análisis debe contener 28 publicaciones propias');
assert.equal(dataset.excludedItems.length, 2, 'Deben documentarse dos exclusiones');
assert(dataset.ownedPosts.every((post) => post.ownerUsername === 'hopepaoo'), 'No deben mezclarse autores en la muestra propia');

const sum = (field) => dataset.ownedPosts.reduce((total, post) => total + (Number(post[field]) || 0), 0);
const videos = dataset.ownedPosts.filter((post) => post.videoPlayCount != null);
const averagePlays = Math.round(sum('videoPlayCount') / videos.length);
const averageLikes = Math.round((sum('likesCount') / dataset.ownedPosts.length) * 10) / 10;
const averageComments = Math.round((sum('commentsCount') / dataset.ownedPosts.length) * 10) / 10;

assert.equal(sum('likesCount'), 2892);
assert.equal(sum('commentsCount'), 209);
assert.equal(videos.length, 8);
assert.equal(averagePlays, 4231);
assert.equal(averageLikes, config.research.averageLikes);
assert.equal(averageComments, config.research.averageComments);
assert.equal(averagePlays, config.research.averageVideoPlays);

assert.match(landing, /Una voz que habita la escena/);
assert.match(landing, /media\/paola-stage-purple\.jpg/);
assert.match(landing, /media\/paola-live-chic-cabaret\.mp4/);
assert.match(landing, /<video controls playsinline/);
assert.match(analysis, /Qué no afirmar todavía/);
assert.match(analysis, /Una identidad que ya se reconoce antes de leerla/);
for (const asset of [
  'paola-stage-purple.jpg',
  'paola-editorial-portrait.jpg',
  'paola-mirror-bw.jpg',
  'paola-siren-bw.webp',
  'paola-editorial-lean.jpg'
]) {
  assert(analysis.includes(`../media/${asset}`), `El análisis debe mostrar ${asset}`);
}
assert.match(cms, /CMS local · prototipo/);
assert.match(cms, /hopepaoo-site-v2|HOPEPAOO_STORAGE_KEY/);
assert.match(landing, /HOPEPAOO_STORAGE_KEY/);

for (const [label, content] of [['landing', landing], ['config', configText]]) {
  assert(!/wa\.me|mailto:|testimonio|terapia vocal|mini sesión|sesión profunda|paola@hopepaoo/i.test(content), `${label} contiene una afirmación no verificada`);
}

for (const asset of [
  'media/paola-editorial-lean.jpg',
  'media/paola-editorial-portrait.jpg',
  'media/paola-live-chic-cabaret-poster.jpg',
  'media/paola-live-chic-cabaret.mp4',
  'media/paola-mirror-bw.jpg',
  'media/paola-siren-bw.webp',
  'media/paola-stage-purple.jpg'
]) {
  const details = await stat(resolve(root, asset));
  assert(details.size > 0, `${asset} debe existir y tener contenido`);
}

assert(!/#d7ff3f|#7750ff|#ff5b48/i.test(landing), 'La landing no debe conservar la paleta anterior');
assert(!/#d7ff3f|#6547e8|#f15b49/i.test(analysis), 'El análisis no debe conservar la paleta anterior');
assert.match(analysis, /--acid:#d2ad72/);
assert.match(analysis, /--violet:#5d184f/);
assert.match(analysis, /--coral:#147d79/);

new Function(siteData);
for (const [label, html] of [['landing', landing], ['cms', cms]]) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert(scripts.length > 0, `${label} debe contener lógica inline`);
  scripts.forEach((script) => new Function(script));
}

console.log('OK: 28 posts propios, métricas verificadas y scripts válidos.');
