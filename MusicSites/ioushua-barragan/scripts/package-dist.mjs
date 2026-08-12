import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
const out = path.join(ROOT, `dist_${stamp}.zip`);

if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
  throw new Error('dist/index.html no existe. Ejecuta npm run build primero.');
}

// zip con el contenido de dist/ en la raíz del archivo y sin metadatos __MACOSX
// (el extractor de Hostinger falla con --keepParent y con los resource forks de ditto)
execFileSync('zip', ['-rqX', out, '.', '-x', '.DS_Store', '-x', '*/.DS_Store'], {
  cwd: path.join(ROOT, 'dist'),
  stdio: 'inherit'
});

console.log(`Package ready: ${out}`);
