#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const requested = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.join(root, 'public/admin/storage/content.json');
const fallback = path.join(root, 'public/admin/storage/content.example.json');
const source = existsSync(requested) ? requested : fallback;
const content = JSON.parse(await readFile(source, 'utf8'));

function validSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function scalar(value) {
  return JSON.stringify(value ?? '');
}

function list(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

const propertyDir = path.join(root, 'src/content/propiedades');
const blogDir = path.join(root, 'src/content/blog');
await mkdir(propertyDir, { recursive: true });
await mkdir(blogDir, { recursive: true });

let written = 0;
for (const [slug, item] of Object.entries(content.properties ?? {})) {
  if (!validSlug(slug) || !item || typeof item !== 'object') throw new Error(`Propiedad inválida: ${slug}`);
  const frontmatter = [
    '---',
    `titulo: ${scalar(item.title)}`,
    `resumen: ${scalar(item.summary)}`,
    `precio: ${Number(item.price)}`,
    `moneda: ${scalar(item.currency ?? 'MXN')}`,
    `tipo: ${scalar(item.type ?? 'propiedad')}`,
    `zona: ${scalar(item.zone ?? 'general')}`,
    `ubicacion: ${scalar(item.location ?? '')}`,
    ...(item.area === null || item.area === undefined || item.area === '' ? [] : [`m2: ${Number(item.area)}`]),
    ...(item.bedrooms === null || item.bedrooms === undefined ? [] : [`recamaras: ${Number(item.bedrooms)}`]),
    ...(item.bathrooms === null || item.bathrooms === undefined ? [] : [`banos: ${Number(item.bathrooms)}`]),
    `imagen: ${scalar(item.image ?? '/img/demo/property.svg')}`,
    `destacada: ${Boolean(item.featured)}`,
    `demostracion: ${Boolean(item.demo)}`,
    `estatus: ${scalar(item.status ?? 'venta')}`,
    `caracteristicas: ${list(item.features)}`,
    `formasPago: ${list(item.payment)}`,
    '---',
    '',
    String(item.body ?? '').trim(),
    '',
  ].join('\n');
  await writeFile(path.join(propertyDir, `${slug}.md`), frontmatter);
  written++;
}

for (const [slug, item] of Object.entries(content.blog ?? {})) {
  if (!validSlug(slug) || !item || typeof item !== 'object') throw new Error(`Artículo inválido: ${slug}`);
  const frontmatter = [
    '---',
    `titulo: ${scalar(item.title)}`,
    `descripcion: ${scalar(item.description)}`,
    `fecha: ${scalar(item.date)}`,
    `imagen: ${scalar(item.image ?? '')}`,
    `borrador: ${Boolean(item.draft)}`,
    '---',
    '',
    String(item.body ?? '').trim(),
    '',
  ].join('\n');
  await writeFile(path.join(blogDir, `${slug}.md`), frontmatter);
  written++;
}

console.log(`${written} archivos de contenido sincronizados desde ${source}`);
