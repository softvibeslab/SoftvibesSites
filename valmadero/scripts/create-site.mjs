#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function argsToObject(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--')) continue;
    result[key.slice(2)] = args[index + 1] && !args[index + 1].startsWith('--') ? args[++index] : true;
  }
  return result;
}

function projectSlug(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const options = argsToObject(process.argv.slice(2));
if (!options.target || !options.name || !options.domain) {
  console.error('Uso: npm run create-site -- --target ../cliente --name "Nombre" --domain https://dominio.com');
  process.exit(1);
}

let domain;
try {
  domain = new URL(String(options.domain));
  if (!['http:', 'https:'].includes(domain.protocol)) throw new Error('protocol');
} catch {
  console.error('El dominio debe ser una URL HTTP o HTTPS válida.');
  process.exit(1);
}

const source = path.resolve(import.meta.dirname, '..');
const target = path.resolve(process.cwd(), String(options.target));
if (target === source || target.startsWith(source + path.sep)) {
  console.error('La carpeta destino debe estar fuera de la plantilla original.');
  process.exit(1);
}
if (existsSync(target)) {
  console.error(`La carpeta destino ya existe: ${target}`);
  process.exit(1);
}

const excluded = new Set(['node_modules', 'dist', '.astro', '.ua', '.git', 'config.local.php']);
await mkdir(path.dirname(target), { recursive: true });
await cp(source, target, {
  recursive: true,
  filter: (entry) => {
    if (entry.split(path.sep).some((part) => excluded.has(part)) || entry.endsWith('.json.tmp')) return false;
    const relative = path.relative(source, entry);
    const inCmsStorage = relative.startsWith(path.join('public', 'admin', 'storage') + path.sep);
    if (inCmsStorage && entry.endsWith('.json') && !entry.endsWith('.example.json')) return false;
    return true;
  },
});

const name = String(options.name).trim();
const shortName = String(options.short ?? name.split(/\s+/)[0]).trim();
const configPath = path.join(target, 'src/config/site.ts');
let config = await readFile(configPath, 'utf8');
config = config
  .replace("nombre: 'Horizonte Inmobiliario'", `nombre: ${JSON.stringify(name)}`)
  .replace("nombreCorto: 'Horizonte'", `nombreCorto: ${JSON.stringify(shortName)}`)
  .replace("dominio: 'https://example.com'", `dominio: ${JSON.stringify(domain.origin)}`);
await writeFile(configPath, config);

const packagePath = path.join(target, 'package.json');
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
const packageName = projectSlug(name) || 'sitio-inmobiliario';
pkg.name = packageName;
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');
const lockPath = path.join(target, 'package-lock.json');
if (existsSync(lockPath)) {
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  lock.name = packageName;
  if (lock.packages?.['']) lock.packages[''].name = packageName;
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n');
}
const robotsPath = path.join(target, 'public/robots.txt');
const robots = (await readFile(robotsPath, 'utf8')).replaceAll('https://example.com', domain.origin);
await writeFile(robotsPath, robots);
await writeFile(path.join(target, '.env'), `SITE_URL=${domain.origin}\n`);

console.log(`Sitio creado en ${target}`);
console.log('Siguiente paso: revisa src/config, configura public/admin/config.local.php e instala dependencias.');
