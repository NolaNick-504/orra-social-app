// ORRA Service Worker v100 - Robust Navigation Handling
// v100: Fixed 404 issue where navigation fallback to empty cache left users stranded.
// Now: navigation fetch failures redirect to home instead of showing a blank 404.
const STATIC_CACHE = 'orra-static-v100';
const IMAGE_CACHE = 'orra-images-v100';

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
              console.log('[SW v100] Deleting stale cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For navigation requests (HTML pages), always fetch fresh from network.
  // If network fails, redirect to home page instead of showing a blank 404.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If server returns a valid response (even 404), pass it through.
          // The not-found.tsx will handle 404s by redirecting to /.
          return response;
        })
        .catch(() => {
          // Network completely failed — redirect to home with cache-bust
          // instead of showing a blank error page
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

  // For /_next/static/ chunks - CACHE FIRST strategy
  // These files have content-hash filenames, so cached versions are always valid.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('/* chunk not found */', {
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
          // Return a 1x1 transparent pixel instead of a broken image
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
