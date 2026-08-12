#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const required = [
  'README.md',
  'src/config/site.ts',
  'src/pages/index.astro',
  'src/content.config.ts',
  'public/admin/config.example.php',
  'public/admin/index.php',
  'public/contact.php',
];
const forbidden = [/vivemar/i, /viridiana/i, /vivemarrealestate\.com/i, /corasol/i];
const extensions = new Set(['.ts', '.astro', '.css', '.php', '.json', '.mjs', '.txt']);
const issues = [];

for (const relative of required) {
  if (!existsSync(path.join(root, relative))) issues.push(`Falta ${relative}`);
}
if (existsSync(path.join(root, 'public/admin/config.local.php'))) {
  issues.push('config.local.php no debe formar parte de la plantilla');
}

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(full);
    } else if (extensions.has(path.extname(entry.name))) {
      const text = await readFile(full, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(text)) issues.push(`Dato de cliente detectado en ${path.relative(root, full)}: ${pattern}`);
      }
    }
  }
}

await scan(path.join(root, 'src'));
await scan(path.join(root, 'public'));

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('Auditoría aprobada: estructura completa, sin configuración local ni datos del cliente de referencia.');
