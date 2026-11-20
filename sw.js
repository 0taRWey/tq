// 泰坦之旅资料库 3.1.1 — offline copy for "Add to Home Screen"
const CACHE = 'tq-search-3.1.1-c6fc7dbb';
// 2.0.3: the page that registers this worker passes its own file name (sw.js?p=de.html); only that page is stored up front,
// other language pages are stored the first time they are opened
const PAGES = ["zh.html", "index.html", "de.html", "fr.html", "es.html", "it.html", "br.html", "pl.html", "cz.html", "ru.html", "uk.html", "ja.html", "ko.html", "map/zh.html", "map/index.html", "map/de.html", "map/fr.html", "map/es.html", "map/it.html", "map/br.html", "map/pl.html", "map/cz.html", "map/ru.html", "map/uk.html", "map/ja.html", "map/ko.html"];
const PG = PAGES.includes(new URL(location).searchParams.get('p')) ? new URL(location).searchParams.get('p') : 'index.html';
const CORE = [PG, 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'img/s0.webp', 'img/s1.webp', 'img/s10.webp', 'img/s11.webp', 'img/s12.webp', 'img/s13.webp', 'img/s14.webp', 'img/s15.webp', 'img/s16.webp', 'img/s17.webp', 'img/s18.webp', 'img/s19.webp', 'img/s2.webp', 'img/s20.webp', 'img/s21.webp', 'img/s22.webp', 'img/s23.webp', 'img/s24.webp', 'img/s3.webp', 'img/s4.webp', 'img/s5.webp', 'img/s6.webp', 'img/s7.webp', 'img/s8.webp', 'img/s9.webp'];
// 2.1.1: install stores the files one by one, so one failed download cannot make the install fail (a failed install used to leave
// the old worker in charge, serving an old version for good)
// 3.0.13: files whose address carries their version (?v=: map pictures, monster data) are kept across versions in KEEP; the older
// versions' copies hand theirs over and are then deleted - after the new version has taken over, so no page waits for it
const KEEP = 'tq-keep';
const later = (e, p) => { try { e.waitUntil(p); } catch (x) {} };   // keeps the worker alive for a store started after the answer
const isV = u => new URL(u).searchParams.has('v') && !/\.html$/.test(new URL(u).pathname);
let migrating = null;
const migrate = () => migrating || (migrating = caches.keys().then(ks => ks.filter(k => k.startsWith('tq-search-') && k !== CACHE)
  .reduce((p, k) => p.then(() => caches.open(k).then(o => o.keys().then(rs => caches.open(KEEP).then(kp => Promise.all(rs.filter(q => isV(q.url)).map(q =>
    kp.match(q).then(h => h || o.match(q).then(x => x && kp.put(q, x))).catch(() => {}))))))
    .catch(() => {}).then(() => caches.delete(k))), Promise.resolve())).catch(() => {}));
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); migrate(); });
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
  if (FRESH(r)) {   // SW3013
    let done; e.waitUntil(new Promise(ok => { done = ok; }));
    e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: !new URL(r.url).searchParams.has('v') }).then(hit => hit || (r.mode === 'navigate' && r.destination === 'document' ? c.match(PG) : undefined)).then(hit => {
      const keep = out => c.put(r, out).then(() => { const u = new URL(r.url); if (u.searchParams.has('v')) return c.keys().then(ks => Promise.all(ks.map(k => { const x = new URL(k.url); return x.pathname === u.pathname && x.search !== u.search ? c.delete(k) : 0; }))); }).catch(() => {});
      const type = res => ({ status: 200, headers: { 'Content-Type': res.headers.get('Content-Type') || 'text/html; charset=utf-8' } });
      if (!hit) {
        // no stored copy (a first visit, a new version): the page as it arrives, stored on the way; a failed request once more plainly
        return fetch(r, { cache: 'no-cache' }).then(res => { if (!res.ok || !res.body) { done(); return res; }
          const out = new Response(res.body, type(res)); keep(out.clone()).then(done, done); return out; })
          .catch(() => fetch(r).finally(done));
      }
      // a stored copy: the network gets NET_WAIT for the whole page, else the stored copy (the download carries on for next time)
      const net = fetch(r, { cache: 'no-cache' }).then(res => !res.ok ? res : res.blob().then(b => { const out = new Response(b, type(res)); return keep(out.clone()).then(() => out); }));
      net.then(done, done);
      return Promise.race([net.catch(() => hit), new Promise(ok => setTimeout(() => ok(hit), NET_WAIT))]);
    })).catch(() => { done(); return fetch(r); }));
    return;
  }
  // 3.0.4: a picture whose address carries a version (map pictures: ?v=<file hash>) is matched with it, so a replaced picture is
  // downloaded again instead of the stored old one being shown
  // 3.0.13: those are kept across versions (KEEP; one not moved over yet is still found in an older copy); a stored file that
  // cannot be read, or a cache that cannot be opened, falls back to the network instead of an error
  if (isV(r.url)) {
    migrate();
    e.respondWith(caches.open(KEEP).then(c => c.match(r).then(hit => hit || caches.match(r)).then(hit => hit || fetch(r).then(res => {
      if (res.status === 200) { const cp = res.clone(); const u = new URL(r.url);
        later(e, c.put(r, cp).then(() => c.keys()).then(ks => Promise.all(ks.map(k => { const x = new URL(k.url); return x.pathname === u.pathname && x.search !== u.search ? c.delete(k) : 0; }))).catch(() => {})); }
      return res; }))).catch(() => fetch(r)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => { if (res.status === 200) c.put(r, res.clone()).catch(() => {}); return res; })))
    .catch(() => fetch(r)));
});
