// 泰坦之旅装备资料库 2.3.1 — offline copy for "Add to Home Screen"
const CACHE = 'tq-search-2.3.1-f42995b7';
// 2.0.3: the page that registers this worker passes its own file name (sw.js?p=de.html); only that page is stored up front,
// other language pages are stored the first time they are opened
const PAGES = ["zh.html", "index.html", "de.html", "fr.html", "es.html", "it.html", "br.html", "pl.html", "cz.html", "ru.html", "uk.html", "ja.html", "ko.html", "en.html"];
const PG = PAGES.includes(new URL(location).searchParams.get('p')) ? new URL(location).searchParams.get('p') : 'index.html';
const CORE = [PG, 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'img/s0.webp', 'img/s1.webp', 'img/s10.webp', 'img/s11.webp', 'img/s12.webp', 'img/s13.webp', 'img/s14.webp', 'img/s15.webp', 'img/s16.webp', 'img/s17.webp', 'img/s18.webp', 'img/s19.webp', 'img/s2.webp', 'img/s20.webp', 'img/s21.webp', 'img/s22.webp', 'img/s23.webp', 'img/s24.webp', 'img/s3.webp', 'img/s4.webp', 'img/s5.webp', 'img/s6.webp', 'img/s7.webp', 'img/s8.webp', 'img/s9.webp'];
// 2.1.1: install drops the older offline copies first and stores the files one by one, so a full storage quota or one failed download
// cannot make the install fail (a failed install used to leave the old worker in charge, serving an old version for good)
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tq-search-') && k !== CACHE).map(k => caches.delete(k))))
  .then(() => caches.open(CACHE)).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tq-search-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// 2.1.1: pages (and the manifest) are network-first: with a connection a refresh gets the new version at once (the server answers
// 304 "not modified" when nothing changed, so nothing big is downloaded); offline, the stored copy is used. Images stay cache-first.
const NET_WAIT = 4000;   // 2.2.7: ms the network gets before the stored copy of a page is shown
const FRESH = r => r.mode === 'navigate' || /\.(html|webmanifest)$/.test(new URL(r.url).pathname);
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // 2.2.7: a slow or stalled connection (github.io is often slow or stalls in some regions) kept the page waiting until the browser
  // gave up, because the stored copy was only used when the request failed outright. Now the network gets NET_WAIT for the whole
  // page: when a stored copy exists and the download has not finished by then, the stored copy is shown; the download carries on in
  // the background and replaces the stored copy for the next visit. Without a stored copy (first visit) it waits for the network as before.
  if (FRESH(r)) {
    const net = caches.open(CACHE).then(c => fetch(r, { cache: 'no-cache' }).then(res => !res.ok ? res : res.blob().then(b => {
      const out = new Response(b, { status: 200, headers: { 'Content-Type': res.headers.get('Content-Type') || 'text/html; charset=utf-8' } });
      return c.put(r, out.clone()).then(() => out, () => out); })));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || (r.mode === 'navigate' ? c.match(PG) : undefined))).then(hit => {
      if (!hit) return net.catch(() => Response.error());
      return Promise.race([net.catch(() => hit), new Promise(ok => setTimeout(() => ok(hit), NET_WAIT))]);
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; })
    .catch(() => Response.error()))));
});
