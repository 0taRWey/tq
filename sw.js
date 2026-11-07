// 泰坦之旅装备资料库 2.1.2 — offline copy for "Add to Home Screen"
const CACHE = 'tq-search-2.1.2-cfd9cc53';
// 2.0.3: the page that registers this worker passes its own file name (sw.js?p=de.html); only that page is stored up front,
// other language pages are stored the first time they are opened
const PAGES = ["index.html", "en.html", "de.html", "fr.html", "es.html", "it.html", "br.html", "pl.html", "cz.html", "ru.html", "uk.html", "ja.html", "ko.html"];
const PG = PAGES.includes(new URL(location).searchParams.get('p')) ? new URL(location).searchParams.get('p') : 'index.html';
const CORE = [PG, 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'img/s0.webp', 'img/s1.webp', 'img/s10.webp', 'img/s11.webp', 'img/s12.webp', 'img/s13.webp', 'img/s14.webp', 'img/s15.webp', 'img/s16.webp', 'img/s17.webp', 'img/s18.webp', 'img/s19.webp', 'img/s2.webp', 'img/s20.webp', 'img/s21.webp', 'img/s22.webp', 'img/s3.webp', 'img/s4.webp', 'img/s5.webp', 'img/s6.webp', 'img/s7.webp', 'img/s8.webp', 'img/s9.webp'];
// 2.1.1: install drops the older offline copies first and stores the files one by one, so a full storage quota or one failed download
// cannot make the install fail (a failed install used to leave the old worker in charge, serving an old version for good)
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tq-search-') && k !== CACHE).map(k => caches.delete(k))))
  .then(() => caches.open(CACHE)).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tq-search-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// 2.1.1: pages (and the manifest) are network-first: with a connection a refresh gets the new version at once (the server answers
// 304 "not modified" when nothing changed, so nothing big is downloaded); offline, the stored copy is used. Images stay cache-first.
const FRESH = r => r.mode === 'navigate' || /\.(html|webmanifest)$/.test(new URL(r.url).pathname);
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (FRESH(r)) {
    e.respondWith(caches.open(CACHE).then(c => fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok) c.put(r, res.clone()); return res; })
      .catch(() => c.match(r, { ignoreSearch: true }).then(hit => hit || (r.mode === 'navigate' ? c.match(PG) : Response.error())))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; })
    .catch(() => Response.error()))));
});
