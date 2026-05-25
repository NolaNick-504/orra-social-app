// ORRA Service Worker v8 - Cold-Start Resilient
// - Detects 404/502/platform proxy errors on navigation
// - Shows "Reconnecting..." page with auto-retry when server is down
// - Cache-first for /_next/static/ chunks (content-hashed, safe to cache)
// - Network-first for API calls and HTML pages
// - NEVER caches error responses
// - "Try now" button stays in SW scope (never navigates to a raw 404)
const STATIC_CACHE = 'orra-static-v8';
const IMAGE_CACHE = 'orra-images-v8';

// HTML page shown when the server is down / container is frozen
const RECONNECT_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>ORRA - Reconnecting...</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    body { background: #050505; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; overflow: hidden; }
    .container { text-align: center; padding: 20px; max-width: 400px; }
    .logo { width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, #7c3aed, #d946ef); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; font-weight: bold; color: white; animation: logoPulse 2s ease-in-out infinite; box-shadow: 0 0 40px rgba(124,58,237,0.3); }
    @keyframes logoPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(124,58,237,0.3); } 50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(124,58,237,0.5); } }
    h2 { color: white; font-size: 22px; margin: 0 0 8px; font-weight: 700; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
    .progress-bar { width: 200px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 auto 12px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #d946ef); border-radius: 2px; transition: width 0.5s ease; width: 0%; }
    .countdown { color: #64748b; font-size: 12px; }
    .attempts { color: #475569; font-size: 11px; margin-top: 8px; }
    .try-btn { margin-top: 16px; padding: 8px 20px; border-radius: 12px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border: none; font-size: 12px; cursor: pointer; transition: background 0.2s; }
    .try-btn:hover { background: rgba(255,255,255,0.2); }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">O</div>
    <h2>Reconnecting...</h2>
    <p class="subtitle">ORRA is waking back up. This usually takes a few seconds.</p>
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <p class="countdown" id="countdown">Retrying in 5s...</p>
    <p class="attempts" id="attempts"></p>
    <button class="try-btn" id="tryBtn">Try now</button>
  </div>
  <script>
    (function() {
      var attempt = 0;
      var maxAttempts = 40;
      var countdownEl = document.getElementById('countdown');
      var progressEl = document.getElementById('progressFill');
      var attemptsEl = document.getElementById('attempts');
      var tryBtn = document.getElementById('tryBtn');

      function tryConnect() {
        attempt++;
        attemptsEl.textContent = 'Attempt ' + attempt + ' of ' + maxAttempts;
        progressEl.style.width = Math.min((attempt / maxAttempts) * 100, 95) + '%';

        var countdown = 5;

        function tick() {
          countdownEl.textContent = 'Retrying in ' + countdown + 's...';
          if (countdown <= 0) {
            doFetch();
            return;
          }
          countdown--;
          setTimeout(tick, 1000);
        }

        function doFetch() {
          // Use fetch with cache-bust — this stays in service worker scope
          var targetUrl = window.location.origin + '/?_cb=' + Date.now();
          fetch(targetUrl, { cache: 'no-store', headers: { 'X-Wake-Up': '1' } })
            .then(function(res) {
              var ct = (res.headers.get('content-type') || '').toLowerCase();
              if (res.ok && (ct.includes('text/html') || ct.includes('document'))) {
                // Server is alive! Navigate to the real page
                window.location.replace(targetUrl);
              } else if (res.status === 403 || res.status === 502 || res.status === 503 || res.status === 404) {
                // Platform proxy error or server down — keep retrying
                countdown = 4;
                tick();
              } else {
                // Unexpected — try reading the body
                return res.text().then(function(text) {
                  try {
                    var json = JSON.parse(text);
                    if (json.error && (json.error.includes('inactive') || json.error.includes('sandbox'))) {
                      countdown = 4;
                      tick();
                    } else {
                      window.location.replace(targetUrl);
                    }
                  } catch(e) {
                    // Not JSON — if it looks like HTML, try loading it
                    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                      window.location.replace(targetUrl);
                    } else {
                      countdown = 4;
                      tick();
                    }
                  }
                });
              }
            })
            .catch(function() {
              // Network error — server not up yet
              if (attempt < maxAttempts) {
                countdown = 4;
                tick();
              } else {
                countdownEl.textContent = 'Taking longer than expected. Tap Try now to retry.';
              }
            });
        }

        tick();
      }

      // "Try now" button — retries immediately without navigating away
      tryBtn.addEventListener('click', function() {
        attempt = 0;
        countdownEl.textContent = 'Checking...';
        doFetchImmediate();
      });

      function doFetchImmediate() {
        var targetUrl = window.location.origin + '/?_cb=' + Date.now();
        fetch(targetUrl, { cache: 'no-store', headers: { 'X-Wake-Up': '1' } })
          .then(function(res) {
            var ct = (res.headers.get('content-type') || '').toLowerCase();
            if (res.ok && (ct.includes('text/html') || ct.includes('document'))) {
              window.location.replace(targetUrl);
            } else {
              // Still down — restart the auto-retry loop
              tryConnect();
            }
          })
          .catch(function() {
            // Still down — restart the auto-retry loop
            tryConnect();
          });
      }

      // Start first attempt after a short delay
      setTimeout(tryConnect, 1500);
    })();
  </script>
</body>
</html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== IMAGE_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        );
      });
    })
  );
});

// Check if a response indicates the server is down
function isServerError(response) {
  if (!response) return true;
  // 404, 502, 503 all mean the server/container is down
  if (response.status === 404 || response.status === 502 || response.status === 503) return true;
  return false;
}

// Check if a response body looks like a platform error
function isPlatformErrorResponse(response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return contentType.includes('application/json') || contentType.includes('text/plain');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // /api/health — NEVER intercept
  if (url.pathname === '/api/health') {
    return;
  }

  // NAVIGATION REQUESTS — handle server down / cold starts
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          const isHTML = contentType.includes('text/html') || contentType.includes('document');

          if (response.ok && isHTML) {
            // Normal HTML page — pass through
            return response;
          }

          // Got a non-OK or non-HTML response
          // This could be: 404 from platform proxy, 502 from Caddy, JSON error, etc.
          if (isServerError(response)) {
            // Server is down — show reconnect page
            return new Response(RECONNECT_HTML, {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-ORRA-Reconnect': '1',
                'Cache-Control': 'no-store',
              },
            });
          }

          // Check for platform error in the response body
          return response.clone().text().then((body) => {
            try {
              const json = JSON.parse(body);
              if (json.error && (
                json.error.includes('inactive') ||
                json.error.includes('sandbox') ||
                json.error.includes('starting') ||
                json.error.includes('cold') ||
                json.error.includes('timeout') ||
                json.error.includes('container')
              )) {
                return new Response(RECONNECT_HTML, {
                  status: 200,
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-ORRA-Reconnect': '1',
                    'Cache-Control': 'no-store',
                  },
                });
              }
            } catch (e) {
              // Not JSON — check for plain text errors
              if (body.includes('inactive') || body.includes('sandbox') || body.includes('404 page not found')) {
                return new Response(RECONNECT_HTML, {
                  status: 200,
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-ORRA-Reconnect': '1',
                    'Cache-Control': 'no-store',
                  },
                });
              }
            }
            // Some other response — pass through
            return response;
          });
        })
        .catch(() => {
          // Network error — server is down
          return new Response(RECONNECT_HTML, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-ORRA-Reconnect': '1',
              'Cache-Control': 'no-store',
            },
          });
        })
    );
    return;
  }

  // API calls — network first, detect platform errors
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            return response;
          }
          // 404 from API when server is down
          if (isServerError(response)) {
            return new Response(JSON.stringify({ ok: false, error: 'server_down', retry: true }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return response;
        })
        .catch(() => {
          return new Response(JSON.stringify({ ok: false, error: 'Network error', retry: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // Static chunks — network first with cache fallback
  // This fixes the "stale cache" issue in main browser
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Update cache with fresh version
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          }
          // Non-200 response (e.g., 404 for old chunks) — DON'T cache, try cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || networkResponse;
          });
        })
        .catch(() => {
          // Network failed — try cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Network error', { status: 503 });
          });
        })
    );
    return;
  }

  // Images — cache first with network fallback
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico|mp3)$/i)) {
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

  // Everything else — network first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
