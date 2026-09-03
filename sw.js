const CACHE_NAME = "pm-scheduler-v4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./pkg/pm_scheduler.js",
  "./pkg/pm_scheduler_bg.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(FILES_TO_CACHE)));
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // Network-first for pages: fresh when online, cached when offline.
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
    );
  } else {
    // Cache-first for assets (Wasm/JS): fast + offline, rarely change.
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
