// ORRA Service Worker v3 - FORCE CACHE CLEAR
// This version aggressively clears all caches and forces fresh loads
const CACHE_VERSION = 'orra-v3-force-clear-' + Date.now();

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately so the new SW takes control
  event.waitUntil(
    clients.claim().then(() => {
      // Delete ALL caches - not just named ones
      return caches.keys().then((cacheNames) => {
        console.log('[SW v3] Clearing all caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW v3] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For navigation requests (HTML pages), always fetch fresh from network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Offline fallback - try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For JS/CSS chunks - NEVER cache, always fetch fresh
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For everything else - network first
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => {
      return caches.match(event.request);
    })
  );
});
