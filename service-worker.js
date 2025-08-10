// service-worker.js
const CACHE_NAME = "calc-once-v7";
const ASSETS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  // Cache-first para los estáticos que declaramos arriba
  const url = new URL(e.request.url);
  const hit = ASSETS.some((a) => url.pathname.endsWith(a.replace("./", "/")));
  if (hit) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
    return;
  }
  // Red: si falla (offline), cae a index.html
  e.respondWith(
    fetch(e.request).catch(() => caches.match("./index.html"))
  );
});
