// ORRA Service Worker v104 - Self-Destruct
// Unregisters itself and clears ALL caches on activate.
// This fixes the "stuck on Loading ORRA" issue caused by old SW caching stale chunks.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map(n => caches.delete(n))))
      .then(() => clients.claim())
      .then(() => self.registration.unregister())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through — let the browser handle all requests normally
});
