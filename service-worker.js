// service-worker.js
const CACHE_NAME = "calc-once-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  // añade aquí más estáticos si los tienes (css/js/img)
  // "./styles.css",
  // "./app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // activa la nueva versión sin esperar
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim(); // toma control de las páginas abiertas
});

// Utilidades
const isNavigation = (request) =>
  request.mode === "navigate" ||
  (request.destination === "" && request.headers.get("accept")?.includes("text/html"));

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1) HTML / navegaciones: network-first con fallback a cache y luego a index
  if (isNavigation(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() =>
          caches.match("./index.html").then((r) => r || new Response("Offline", { status: 503 }))
        )
    );
    return;
  }

  // 2) Estáticos listados en ASSETS: cache-first
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
    return;
  }

  // 3) Resto: red directa (sin capturar), para evitar comportamientos extraños
});
