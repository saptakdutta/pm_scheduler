// Bump this version string whenever you change cached files,
// so the browser fetches fresh copies.
const CACHE_NAME = "pm-scheduler-v1";

// Files to cache. Paths are RELATIVE to this sw.js location.
// "./" is the app's index.html.
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./pkg/pm_scheduler.js",
  "./pkg/pm_scheduler_bg.wasm",
];

// On install: open the cache and store all app files.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Activate this new service worker immediately.
  self.skipWaiting();
});

// On activate: clean up any old caches from previous versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// On fetch: try the cache first; if it's not there, go to the network.
// This "cache-first" strategy is what makes the app work offline.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file if we have it, otherwise fetch from network.
      return cachedResponse || fetch(event.request);
    })
  );
});
