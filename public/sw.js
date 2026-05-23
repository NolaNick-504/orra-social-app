// ORRA Service Worker v4 - ULTRA AGGRESSIVE CACHE CLEAR + IMAGE CACHE BUSTING
// This version aggressively clears all caches, forces fresh loads, and busts image caches
const CACHE_VERSION = 'orra-v4-ultra-clear-' + Date.now();

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
        console.log('[SW v4] Clearing all caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW v4] Deleting cache:', cacheName);
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

  // For API uploads (avatar, cover, images) - NEVER cache, always fetch fresh
  // This is critical for Samsung Internet which aggressively caches these
  if (url.pathname.startsWith('/api/uploads') || url.pathname.includes('nick-avatar') || url.pathname.includes('profile-cover')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          // Return the response without caching
          return response;
        })
        .catch(() => {
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

  // For images (png, jpg, webp, etc.) - network first, no caching
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico)$/i)) {
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
