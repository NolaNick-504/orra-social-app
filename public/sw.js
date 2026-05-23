// ORRA Service Worker v5 - Smart Caching Strategy
// - Cache-first for /_next/static/ chunks (content-hashed filenames, safe to cache)
// - Cache-first for images (avatars, covers, etc.)
// - Network-first for API calls and HTML pages (always fresh data)
const STATIC_CACHE = 'orra-static-v5';
const IMAGE_CACHE = 'orra-images-v5';

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately so the new SW takes control
  event.waitUntil(
    clients.claim().then(() => {
      // Delete OLD caches (previous versions only)
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== IMAGE_CACHE)
            .map((cacheName) => {
              console.log('[SW v5] Deleting old cache:', cacheName);
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
      fetch(event.request)
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

  // For API calls (including uploads) - network first, never cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For /_next/static/ chunks - CACHE FIRST strategy
  // These files have content-hash filenames, so cached versions are always valid.
  // Caching them prevents re-downloading MB of JS on every page load.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Not in cache — fetch from network and cache for next time
        return fetch(event.request).then((networkResponse) => {
          // Only cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Network failed and no cache — return offline page for navigations
          return new Response('Network error', { status: 503 });
        });
      })
    );
    return;
  }

  // For images - cache first, with network fallback
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          return caches.match(event.request);
        });
      })
    );
    return;
  }

  // For CSS/JS not in /_next/static/ (e.g. third-party) - network first
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
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
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
