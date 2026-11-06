// 泰坦之旅装备资料库 2.0.2 — offline copy for "Add to Home Screen"
const CACHE = 'tq-search-2.0.2-e011b398';
const CORE = ['index.html', 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'img/s0.webp', 'img/s1.webp', 'img/s10.webp', 'img/s11.webp', 'img/s12.webp', 'img/s13.webp', 'img/s14.webp', 'img/s15.webp', 'img/s16.webp', 'img/s17.webp', 'img/s18.webp', 'img/s19.webp', 'img/s2.webp', 'img/s20.webp', 'img/s21.webp', 'img/s22.webp', 'img/s3.webp', 'img/s4.webp', 'img/s5.webp', 'img/s6.webp', 'img/s7.webp', 'img/s8.webp', 'img/s9.webp'];   // en.html is stored the first time it is opened
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tq-search-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; })
    .catch(() => r.mode === 'navigate' ? c.match('index.html') : Response.error()))));
});
