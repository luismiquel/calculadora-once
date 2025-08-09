// service-worker.js
const CACHE_NAME = "calc-once-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isAsset = ASSETS.some(a => url.pathname.endsWith(a.replace("./","/")));
  if (isAsset) {
    // Cache-first para assets
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  } else {
    // Network-first con fallback a index (modo SPA)
    e.respondWith(
      fetch(e.request).catch(() => caches.match("./index.html"))
    );
  }
});
