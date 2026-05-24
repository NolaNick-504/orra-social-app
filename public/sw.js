// ORRA Service Worker v105 - Nuclear Self-Destruct
// This SW exists ONLY to kill any previously cached SW and clear all storage.
// It activates immediately, deletes everything, and unregisters itself.

// On install: skip waiting so we activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// On activate: nuke everything and unregister
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete ALL caches
      caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))),
      // Claim all clients immediately
      clients.claim(),
    ]).then(() => {
      // Unregister THIS service worker
      return self.registration.unregister();
    })
  );
});

// NEVER intercept any fetch requests - always pass through
self.addEventListener('fetch', (event) => {});
