/* Diet Plan Calculator service worker
   - Precache: app shell, jQuery, fonts, icons (sab kuch offline chalta hai)
   - Runtime: stale-while-revalidate (cache se foran, background mein update)
   - Naya deploy karte waqt VERSION badal dein taake precache dobara ban jaye */
const VERSION = "v1";
const CACHE = "dietplan-" + VERSION;

const PRECACHE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "vendor/jquery.min.js",
  "fonts/fonts.css",
  "fonts/bricolage-grotesque-latin-500-normal.woff2",
  "fonts/bricolage-grotesque-latin-700-normal.woff2",
  "fonts/bricolage-grotesque-latin-800-normal.woff2",
  "fonts/source-sans-3-latin-400-normal.woff2",
  "fonts/source-sans-3-latin-600-normal.woff2",
  "fonts/source-sans-3-latin-700-normal.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/favicon-64.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("dietplan-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // bahar ki cheezein browser par chhor dein

  // Page navigation: cache wala index.html, warna network, warna offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("index.html").then((cached) => {
        const net = fetch(req).then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("index.html", copy)); }
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  // Baaqi same-origin files: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
