#!/usr/bin/env node
import PhpParser from 'php-parser';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const parser = new PhpParser.Engine({
  parser: { php7: true, suppressErrors: false },
  ast: { withPositions: true },
});
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(full);
    else if (entry.name.endsWith('.php')) files.push(full);
  }
}

await collect(path.join(root, 'public'));
const errors = [];
for (const file of files) {
  try {
    parser.parseCode(await readFile(file, 'utf8'), file);
  } catch (error) {
    errors.push(`${path.relative(root, file)}: ${error.message}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`${files.length} archivos PHP analizados sin errores de sintaxis.`);
