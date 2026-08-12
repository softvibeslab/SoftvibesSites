import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const script = readFileSync(resolve(root, 'script.js'), 'utf8');
const analysis = readFileSync(resolve(root, 'analisis/index.html'), 'utf8');

assert.match(html, /id="monica"/, 'Debe existir la sección de marca personal');
assert.match(html, /Mónica Arteaga/, 'Mónica debe ser la identidad principal');
assert.match(html, /DK del Karibe/, 'Debe conservarse la sinergia con DK');
assert.match(html, /\$3,037,500/, 'Debe conservarse el precio de referencia de DK44');
assert.match(script, /529841799401/, 'WhatsApp debe usar el contacto de Mónica');
assert.match(script, /personal_landing_form/, 'El formulario debe atribuir la landing personal');
assert.match(script, /qualified_whatsapp_lead/, 'Debe emitirse el evento de prospecto calificado');
assert.equal((analysis.match(/class="finding reveal/g) || []).length, 6, 'El análisis debe incluir seis hallazgos');
assert.match(analysis, /No es Mónica o DK/, 'El análisis debe explicar la arquitectura de marca');
assert.match(analysis, /HTTP 404/, 'El análisis debe documentar el estado del dominio');

for (const path of [...html.matchAll(/(?:src|href)="(assets\/[^"?#]+|analisis\/[^"?#]*)"/g)].map((match) => match[1])) {
  assert.ok(existsSync(resolve(root, path)), `Falta el recurso local: ${path}`);
}

console.log('Mónica Arteaga × DK del Karibe: smoke test OK');
