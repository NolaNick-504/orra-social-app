// ORRA Service Worker - Network-only strategy to prevent stale caching
// This ensures Samsung Internet and other aggressive caches always fetch fresh content
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  event.waitUntil(clients.claim());
  // Clear all old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network-only: always fetch from server, never cache
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => {
      // If offline, try cache as fallback
      return caches.match(event.request);
    })
  );
});
