// ORRA Service Worker v103 - Self-Destruct
// v103: Unregisters itself immediately to clear all cached data from previous SW versions.
// This fixes the "stuck on Loading ORRA" issue caused by old SW caching stale chunks.

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete ALL caches and unregister this service worker
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete every single cache
      return Promise.all(cacheNames.map(name => caches.delete(name)));
    }).then(() => {
      // Claim all clients so they get the clean state
      return clients.claim();
    }).then(() => {
      // Unregister THIS service worker so the browser has NO SW at all
      // The next page load will register sw-stable.js (if it exists)
      // or just work without a service worker
      return self.registration.unregister();
    })
  );
});

// Pass-through: don't intercept any requests
self.addEventListener('fetch', (event) => {
  // Do nothing - let the browser handle all requests normally
  // This is just a self-destructing SW
});
