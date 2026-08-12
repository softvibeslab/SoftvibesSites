import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const script = readFileSync(resolve(root, 'script.js'), 'utf8');
const analysis = readFileSync(resolve(root, 'analisis/index.html'), 'utf8');
const catalog = readFileSync(resolve(root, '../index.html'), 'utf8');

assert.match(html, /529841674704/, 'WhatsApp debe usar el contacto profesional de Laura');
assert.match(html, /12221312HDAABFFS008000765/, 'Debe mostrarse la matrícula oficial');
assert.match(html, /Histórica · vigencia no confirmada/, 'Lantana debe identificarse como referencia histórica');
assert.match(html, /data-lead-form/, 'Debe existir el formulario contextual');
assert.match(script, /qualified_whatsapp_lead/, 'Debe emitirse el evento de prospecto calificado');
assert.match(script, /personal_landing_form/, 'El formulario debe atribuir la landing personal');
assert.match(analysis, /No hub de inventario/, 'El análisis debe justificar la arquitectura');
assert.match(analysis, /no se contactó a Laura Luna/i, 'Debe documentarse la no intervención');
assert.match(catalog, /laura-luna-broker\/index\.html/, 'El proyecto debe estar registrado en el catálogo');

for (const path of [...html.matchAll(/(?:src|href)="(assets\/[^"?#]+|data\/[^"?#]+|analisis\/[^"?#]*)"/g)].map((match) => match[1])) {
  assert.ok(existsSync(resolve(root, path)), `Falta el recurso local: ${path}`);
}

console.log('Laura Luna Broker: smoke test OK');
