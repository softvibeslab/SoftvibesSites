import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildSite } from './build-site.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'content', 'site.json');
const ADMIN_DIR = path.join(ROOT, 'cms');
const PORT = Number(process.env.PORT || process.env.CMS_PORT || process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] || 4310);
const HAS_RUNTIME_PORT = process.env.PORT || process.env.CMS_PORT;
const HOST = process.env.CMS_HOST || process.env.HOST || (HAS_RUNTIME_PORT ? '0.0.0.0' : '127.0.0.1');
const BASE_PATHS = normalizeBasePaths(process.env.CMS_BASE_PATHS || process.env.CMS_BASE_PATH || '');
const USERNAME = process.env.CMS_USER || 'softvibes';
const PASSWORD = process.env.CMS_PASS;
if (!PASSWORD) {
  throw new Error('CMS_PASS es obligatorio para iniciar el CMS.');
}
const SESSION_TTL_MS = 1000 * 60 * 60 * 10;
const sessions = new Map();
const PUBLIC_DIRS = new Set(['assets', 'media', 'rhoman', 'analisis', 'alt-cultura', 'alternative']);
const PUBLIC_FILES = new Set(['hero-propuestas.html']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function normalizeBasePath(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function normalizeBasePaths(value) {
  return [...new Set(String(value || '')
    .split(',')
    .map(normalizeBasePath)
    .filter(Boolean))]
    .sort((a, b) => b.length - a.length);
}

function routePath(pathname) {
  for (const basePath of BASE_PATHS) {
    if (pathname === basePath) return '/';
    if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length) || '/';
  }
  return pathname;
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((cookie) => {
    const [key, ...rest] = cookie.trim().split('=');
    return [decodeURIComponent(key), decodeURIComponent(rest.join('='))];
  }));
}

function isAuthenticated(req) {
  const token = parseCookies(req).cms_session;
  if (!token) return false;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return true;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, payload, headers = {}) {
  send(res, status, `${JSON.stringify(payload, null, 2)}\n`, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  });
}

function readBody(req, maxBytes = 75 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload demasiado grande'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function safeJoin(base, requestPath) {
  const clean = decodeURIComponent(requestPath).replace(/^\/+/, '');
  const resolved = path.resolve(base, clean);
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
}

function writeContent(data) {
  const historyDir = path.join(ROOT, 'content', '.history');
  fs.mkdirSync(historyDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
  fs.copyFileSync(CONTENT_PATH, path.join(historyDir, `site_${stamp}.json`));
  fs.writeFileSync(CONTENT_PATH, `${JSON.stringify(data, null, 2)}\n`);
}

function allowedLegacyPages() {
  return readContent().legacyPages || [];
}

function resolveLegacyPage(pagePath) {
  const allowed = allowedLegacyPages();
  if (!allowed.includes(pagePath)) return null;
  return safeJoin(ROOT, pagePath);
}

function listFiles(rootDir, publicPrefix) {
  const result = [];
  if (!fs.existsSync(rootDir)) return result;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const stat = fs.statSync(full);
      const rel = path.relative(rootDir, full).split(path.sep).join('/');
      const publicPath = `${publicPrefix}/${rel}`;
      result.push({
        path: publicPath,
        name: entry.name,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        type: mediaType(entry.name)
      });
    }
  };
  walk(rootDir);
  return result.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

function mediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.m4a'].includes(ext)) return 'audio';
  return 'file';
}

function slugifyFilename(filename) {
  const ext = path.extname(filename).toLowerCase() || '.bin';
  const base = path.basename(filename, ext)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'media';
  return `${base}${ext}`;
}

function uniquePath(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${base}-${index}${ext}`);
    index += 1;
  }
  return candidate;
}

function serveFile(res, file, extraHeaders = {}) {
  if (!file || !fs.existsSync(file)) {
    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  if (fs.statSync(file).isDirectory()) {
    const indexFile = path.join(file, 'index.html');
    if (!fs.existsSync(indexFile)) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    file = indexFile;
  }
  const ext = path.extname(file).toLowerCase();
  send(res, 200, fs.readFileSync(file), {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    ...extraHeaders
  });
}

function resolvePublicFile(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!clean) return path.join(ROOT, 'index.html');
  if (PUBLIC_FILES.has(clean)) return safeJoin(ROOT, clean);

  const [topLevel] = clean.split('/');
  if (!PUBLIC_DIRS.has(topLevel)) return null;
  return safeJoin(ROOT, clean);
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/status') {
    sendJson(res, 200, { authenticated: isAuthenticated(req), user: USERNAME });
    return;
  }

  if (url.pathname === '/api/login' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    if (body.username === USERNAME && body.password === PASSWORD) {
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { user: USERNAME, expiresAt: Date.now() + SESSION_TTL_MS });
      sendJson(res, 200, { ok: true, user: USERNAME }, {
        'Set-Cookie': `cms_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
      });
    } else {
      sendJson(res, 401, { ok: false, error: 'Credenciales incorrectas' });
    }
    return;
  }

  if (!isAuthenticated(req)) {
    sendJson(res, 401, { error: 'No autenticado' });
    return;
  }

  if (url.pathname === '/api/logout' && req.method === 'POST') {
    const token = parseCookies(req).cms_session;
    if (token) sessions.delete(token);
    sendJson(res, 200, { ok: true }, {
      'Set-Cookie': 'cms_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    });
    return;
  }

  if (url.pathname === '/api/content' && req.method === 'GET') {
    sendJson(res, 200, readContent());
    return;
  }

  if (url.pathname === '/api/content' && req.method === 'PUT') {
    const body = JSON.parse(await readBody(req));
    writeContent(body);
    sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
    return;
  }

  if (url.pathname === '/api/build' && req.method === 'POST') {
    const report = buildSite();
    sendJson(res, 200, { ok: true, report });
    return;
  }

  if (url.pathname === '/api/media' && req.method === 'GET') {
    sendJson(res, 200, {
      assets: listFiles(path.join(ROOT, 'assets'), 'assets'),
      media: listFiles(path.join(ROOT, 'media'), 'media')
    });
    return;
  }

  if (url.pathname === '/api/upload' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const match = String(body.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      sendJson(res, 400, { error: 'Archivo inválido' });
      return;
    }
    const safeName = slugifyFilename(body.filename || 'media.bin');
    const buffer = Buffer.from(match[2], 'base64');
    const uploadDir = path.join(ROOT, 'media', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    const mediaFile = uniquePath(uploadDir, safeName);
    fs.writeFileSync(mediaFile, buffer);

    let assetPath = null;
    if (body.publishToAssets !== false) {
      const assetFile = uniquePath(path.join(ROOT, 'assets'), safeName);
      fs.writeFileSync(assetFile, buffer);
      assetPath = `assets/${path.basename(assetFile)}`;
    }

    sendJson(res, 200, {
      ok: true,
      mediaPath: `media/uploads/${path.basename(mediaFile)}`,
      assetPath
    });
    return;
  }

  if (url.pathname === '/api/page' && req.method === 'GET') {
    const pagePath = url.searchParams.get('path') || '';
    const file = resolveLegacyPage(pagePath);
    if (!file || !fs.existsSync(file)) {
      sendJson(res, 404, { error: 'Página no permitida o inexistente' });
      return;
    }
    sendJson(res, 200, { path: pagePath, content: fs.readFileSync(file, 'utf8') });
    return;
  }

  if (url.pathname === '/api/page' && req.method === 'PUT') {
    const body = JSON.parse(await readBody(req));
    const file = resolveLegacyPage(body.path || '');
    if (!file || !fs.existsSync(file)) {
      sendJson(res, 404, { error: 'Página no permitida o inexistente' });
      return;
    }
    const historyDir = path.join(ROOT, 'content', '.history', 'legacy');
    fs.mkdirSync(historyDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
    fs.copyFileSync(file, path.join(historyDir, `${body.path.replace(/[^a-zA-Z0-9]+/g, '_')}_${stamp}`));
    fs.writeFileSync(file, body.content || '');
    sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
    return;
  }

  sendJson(res, 404, { error: 'API no encontrada' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    url.pathname = routePath(url.pathname);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }

    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      serveFile(res, path.join(ADMIN_DIR, 'admin.html'), { 'Cache-Control': 'no-store' });
      return;
    }
    if (url.pathname.startsWith('/admin/')) {
      serveFile(res, safeJoin(ADMIN_DIR, url.pathname.replace('/admin/', '')), { 'Cache-Control': 'no-store' });
      return;
    }

    if (url.pathname === '/' || url.pathname === '/preview') {
      serveFile(res, path.join(ROOT, 'index.html'));
      return;
    }

    const publicFile = resolvePublicFile(url.pathname);
    if (publicFile) {
      serveFile(res, publicFile);
      return;
    }

    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;
  console.log(`CMS listo: http://${displayHost}:${PORT}/admin/`);
  console.log(`Preview:   http://${displayHost}:${PORT}/`);
  if (BASE_PATHS.length) console.log(`Base paths: ${BASE_PATHS.join(', ')}`);
  console.log(`Usuario:   ${USERNAME}`);
});
