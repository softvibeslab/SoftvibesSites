/* Service worker de Cisne Negro (app instalable del Pasaporte).
 * Reglas para no repetir problemas de caché:
 * - Páginas (navegación) y /data/: red primero; la copia guardada solo se usa sin conexión.
 * - /api/: nunca se toca (siempre red; sesiones, visitas y NPS no se guardan aquí).
 * - Assets versionados (?v=): caché primero (su URL cambia con cada versión).
 * Al cambiar VERSION se borran las cachés anteriores.
 */
const VERSION = 'cn-20261006c';
const ESENCIAL = ['/menu/', '/data/menu.json', '/offline.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ESENCIAL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.includes('/api/') || url.pathname.includes('/admin/')) return;
  const guardar = (res) => { if (res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); } return res; };
  if (req.mode === 'navigate' || url.pathname.includes('/data/')) {
    e.respondWith(fetch(req).then(guardar).catch(() => caches.match(req).then((r) => r || caches.match('/offline.html'))));
  } else if (url.search.includes('v=')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then(guardar)));
  }
});
