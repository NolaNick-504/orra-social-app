// ORRA Service Worker v101 - Force Cache Clear
// v101: Force-clears all previous caches to ensure fresh JS chunks after rebuilds.
const STATIC_CACHE = 'orra-static-v101';
const IMAGE_CACHE = 'orra-images-v101';

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately so the new SW takes control
  // Then DELETE ALL OLD CACHES from previous SW versions
  event.waitUntil(
    clients.claim().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== IMAGE_CACHE)
            .map((cacheName) => {
              console.log('[SW v101] Deleting stale cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER intercept the clear-cache.html page — it needs to work
  // even when the SW is in a bad state
  if (url.pathname === '/clear-cache.html') {
    return;
  }

  // For navigation requests (HTML pages), always fetch fresh from network.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return Response.redirect(url.origin + '/?_cb=' + Date.now(), 302);
        })
    );
    return;
  }

  // For API calls - network first, never cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // For /_next/static/ chunks - NETWORK FIRST strategy
  // This ensures fresh chunks after rebuilds instead of serving stale cached ones
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed — try cache as fallback
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('/* chunk not found */', {
              status: 404,
              headers: { 'Content-Type': 'application/javascript' }
            });
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
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
            { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }
          );
        });
      })
    );
    return;
  }

  // For CSS/JS not in /_next/static/ - network first
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
