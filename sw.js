// 泰坦之旅装备资料库 2.0.8 — offline copy for "Add to Home Screen"
const CACHE = 'tq-search-2.0.8-a99cc801';
// 2.0.3: the page that registers this worker passes its own file name (sw.js?p=de.html); only that page is stored up front,
// other language pages are stored the first time they are opened
const PAGES = ["index.html", "en.html", "de.html", "fr.html", "es.html", "it.html", "br.html", "pl.html", "cz.html", "ru.html", "uk.html", "ja.html", "ko.html"];
const PG = PAGES.includes(new URL(location).searchParams.get('p')) ? new URL(location).searchParams.get('p') : 'index.html';
const CORE = [PG, 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'img/s0.webp', 'img/s1.webp', 'img/s10.webp', 'img/s11.webp', 'img/s12.webp', 'img/s13.webp', 'img/s14.webp', 'img/s15.webp', 'img/s16.webp', 'img/s17.webp', 'img/s18.webp', 'img/s19.webp', 'img/s2.webp', 'img/s20.webp', 'img/s21.webp', 'img/s22.webp', 'img/s3.webp', 'img/s4.webp', 'img/s5.webp', 'img/s6.webp', 'img/s7.webp', 'img/s8.webp', 'img/s9.webp'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tq-search-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; })
    .catch(() => r.mode === 'navigate' ? c.match(PG) : Response.error()))));
});
