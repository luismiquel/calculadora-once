// service-worker.js
const CACHE_NAME = "calc-once-v12";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  // Iconos en raíz
  "./icon-144.png",
  "./icon-256.png",
  "./icon-384.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  // Icono en /icons/
  "./icons/icon-192.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});
const isNavigation = (req) =>
  req.mode === "navigate" || (req.destination === "" && req.headers.get("accept")?.includes("text/html"));
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (isNavigation(req)) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  const url = new URL(req.url);
  const hit = ASSETS.some((a) => url.pathname.endsWith(a.replace("./", "/")));
  if (hit) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
