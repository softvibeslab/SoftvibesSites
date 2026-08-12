import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const script=readFileSync(resolve(root,'script.js'),'utf8');

assert.equal((script.match(/operation:'rent'/g)||[]).length,10,'Debe haber 10 rentas');
assert.equal((script.match(/operation:'sale'/g)||[]).length,6,'Debe haber 6 ventas');
assert.match(script,/529842390450/,'WhatsApp debe usar el contacto de Tania');
assert.match(html,/id="property-grid"/,'Debe existir el inventario dinámico');
assert.match(html,/id="property-modal"/,'Debe existir la ficha contextual');
assert.ok(existsSync(resolve(root,'analisis/index.html')),'Debe existir el análisis');
assert.ok(existsSync(resolve(root,'data/tania-go-inventario-publicado-2026-08-06.csv')),'Debe conservarse el CSV fuente');

for(const match of script.matchAll(/image:'(assets\/[^']+)'/g)) assert.ok(existsSync(resolve(root,match[1])),`Falta ${match[1]}`);

console.log('Tania G.O.: smoke test OK');
