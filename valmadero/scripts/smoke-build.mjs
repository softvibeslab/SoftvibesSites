#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const htmlFiles = [];
const issues = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

function routeTarget(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '') return null;
  if (clean.endsWith('.php') || path.extname(clean)) return path.join(dist, clean.replace(/^\//, ''));
  return clean === '/' ? path.join(dist, 'index.html') : path.join(dist, clean.replace(/^\//, ''), 'index.html');
}

if (!existsSync(dist)) {
  console.error('No existe dist/. Ejecuta npm run build primero.');
  process.exit(1);
}
await collect(dist);

let cmsMarkers = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  cmsMarkers += (html.match(/data-cms=/g) ?? []).length;
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
    const target = routeTarget(href);
    if (target && !existsSync(target)) issues.push(`${path.relative(dist, file)} enlaza a una ruta inexistente: ${href}`);
  }
}

for (const required of ['index.html', 'propiedades/index.html', 'blog/index.html', 'contacto/index.html', 'contact.php', 'admin/index.php', 'sitemap-index.xml']) {
  const full = path.join(dist, required);
  if (!existsSync(full) || (await stat(full)).size === 0) issues.push(`Falta salida requerida: ${required}`);
}
if (cmsMarkers < 8) issues.push(`Se esperaban al menos 8 marcadores CMS y se encontraron ${cmsMarkers}.`);
if (existsSync(path.join(dist, 'admin/config.local.php'))) issues.push('El build contiene config.local.php.');

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log(`${htmlFiles.length} páginas revisadas; enlaces internos, salidas PHP y ${cmsMarkers} marcadores CMS válidos.`);
