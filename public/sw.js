// ORRA Service Worker v6 - Platform-Aware Caching
// - Cache-first for /_next/static/ chunks (content-hashed filenames, safe to cache)
// - Cache-first for images (avatars, covers, etc.)
// - Network-first for API calls and HTML pages (always fresh data)
// - NEVER cache error responses (404, 502, etc.) — they might be from a frozen container
// - /api/health is NEVER cached — used for keep-alive pings
const STATIC_CACHE = 'orra-static-v6';
const IMAGE_CACHE = 'orra-images-v6';

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
              console.log('[SW v6] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // /api/health — NEVER intercept, always pass through
  // This is the keep-alive endpoint and must never be cached
  if (url.pathname === '/api/health') {
    return;
  }

  // For navigation requests (HTML pages), always fetch fresh from network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // NEVER cache non-OK responses — they might be platform proxy errors
          if (!response.ok) {
            return response;
          }
          return response;
        })
        .catch(() => {
          // Network error — server is likely down (frozen container)
          // Don't try cache for navigation — let the client show the reconnecting overlay
          return new Response('', {
            status: 503,
            statusText: 'Server Unavailable',
            headers: { 'X-ORRA-Proxy': 'sw-offline' },
          });
        })
    );
    return;
  }

  // For API calls - network first, NEVER cache error responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // NEVER cache non-OK API responses
          return response;
        })
        .catch(() => {
          // Network error — let the client handle it
          return new Response(JSON.stringify({ ok: false, error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // For /_next/static/ chunks - CACHE FIRST strategy
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
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

  // For everything else - network first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
