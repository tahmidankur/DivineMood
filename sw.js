// sw.js — offline support for Divine Mood
// Bump VERSION whenever you deploy so old caches get cleaned up.
const VERSION = 'v5';
const SHELL_CACHE = 'divine-mood-shell-' + VERSION;
const VERSE_CACHE = 'divine-mood-verses';   // kept across versions: verse text never changes
const FONT_CACHE  = 'divine-mood-fonts';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/api.js',
  './js/app.js',
  './js/pwa.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
];

const KEEP = [SHELL_CACHE, VERSE_CACHE, FONT_CACHE];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache =>
      // per-file so one missing asset doesn't block the whole install
      Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})))
    )
  );
  // don't skipWaiting here: the page shows an "update available" banner and
  // sends SKIP_WAITING when the user taps it, so nothing swaps mid-session
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Page loads: network first so deploys show up, cached shell when offline
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, SHELL_CACHE, './index.html'));
    return;
  }

  // Verse text: once fetched it never changes, so serve from cache when we have it.
  // This lets saved / previously seen verses load offline.
  if (url.hostname === 'api.alquran.cloud' && !url.pathname.includes('ar.alafasy')) {
    event.respondWith(cacheFirst(req, VERSE_CACHE));
    return;
  }
  if (url.hostname === 'bible-api.com') {
    event.respondWith(cacheFirst(req, VERSE_CACHE));
    return;
  }

  // Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
    return;
  }

  // Our own files: always fresh when online, cached copy when offline
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, SHELL_CACHE));
  }
  // anything else (audio streams etc.) goes straight to the network
});


async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    // 'no-cache' revalidates with the server (cheap 304) instead of trusting the HTTP cache,
    // so a fresh deploy is picked up on the next load
    const res = await fetch(req.mode === 'navigate' ? req : new Request(req, { cache: 'no-cache' }));
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true }))
        || (fallbackUrl && await cache.match(fallbackUrl))
        || Response.error();
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then(res => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached || Response.error());
  return cached || network;
}
