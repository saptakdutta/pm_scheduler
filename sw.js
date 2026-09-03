// Bumped to v3 to force fresh index.html after edit-mode + Gantt scaling changes.
const CACHE_NAME = "pm-scheduler-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./pkg/pm_scheduler.js",
  "./pkg/pm_scheduler_bg.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
