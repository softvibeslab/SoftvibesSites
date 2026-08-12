import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const script = readFileSync(resolve(root, 'script.js'), 'utf8');

assert.equal((html.match(/class="gallery-item/g) || []).length, 12, 'La galería debe contener 12 fotografías');
assert.match(html, /\$35,800,000/, 'Debe mostrarse el precio de venta observado');
assert.match(html, /\$220,000/, 'Debe mostrarse la renta observada');
assert.match(html, /730 m²\*/, 'La medida observada debe conservar la nota de discrepancia');
assert.match(script, /525537044360/, 'WhatsApp debe apuntar al teléfono de Ocean Caribbean Mexico');

for (const path of [...html.matchAll(/(?:src|href)="(assets\/[^"?#]+|data\/[^"?#]+|analisis\/[^"?#]*)"/g)].map((match) => match[1])) {
  assert.ok(existsSync(resolve(root, path)), `Falta el recurso local: ${path}`);
}

console.log('Ocean Caribbean Mexico: smoke test OK');
