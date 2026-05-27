// ORRA Service Worker v8 - Indefinite Recovery
// - Detects "sandbox is inactive" / platform proxy errors on navigation
// - Shows "Waking up..." page with INDEFINITE auto-retry
// - Auto-reloads when the server comes back
// - Cache-first for /_next/static/ chunks (content-hashed, safe to cache)
// - Network-first for API calls and HTML pages
// - NEVER caches error responses or "sandbox is inactive" JSON
const STATIC_CACHE = 'orra-static-v8';
const IMAGE_CACHE = 'orra-images-v8';

// HTML page shown when the sandbox/platform is cold-starting
const WAKING_UP_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>ORRA - Waking Up...</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    body { background: #050505; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; overflow: hidden; -webkit-tap-highlight-color: transparent; }
    .container { text-align: center; padding: 20px; max-width: 400px; }
    .logo { width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, #7c3aed, #d946ef); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; font-weight: bold; color: white; animation: logoPulse 2s ease-in-out infinite; box-shadow: 0 0 40px rgba(124,58,237,0.3); }
    @keyframes logoPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(124,58,237,0.3); } 50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(124,58,237,0.5); } }
    h2 { color: white; font-size: 22px; margin: 0 0 8px; font-weight: 700; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
    .progress-bar { width: 200px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 auto 12px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #d946ef); border-radius: 2px; animation: progressSweep 3s ease-in-out infinite; }
    @keyframes progressSweep { 0% { width: 10%; margin-left: 0; } 50% { width: 70%; margin-left: 15%; } 100% { width: 10%; margin-left: 90%; } }
    .countdown { color: #64748b; font-size: 12px; }
    .attempts { color: #475569; font-size: 11px; margin-top: 8px; }
    .tap-hint { color: #7c3aed; font-size: 13px; margin-top: 16px; cursor: pointer; padding: 8px 16px; border: 1px solid rgba(124,58,237,0.3); border-radius: 12px; display: inline-block; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
    .tap-hint:hover, .tap-hint:active { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.5); }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">O</div>
    <h2>Waking Up ORRA</h2>
    <p class="subtitle">The server is starting up. This takes a few seconds...</p>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    <p class="countdown" id="countdown">Connecting...</p>
    <p class="attempts" id="attempts"></p>
    <div class="tap-hint" id="tapRetry" onclick="manualRetry()">Tap here to try now</div>
  </div>
  <script>
    (function() {
      var attempt = 0;
      var countdownEl = document.getElementById('countdown');
      var attemptsEl = document.getElementById('attempts');

      function tryConnect() {
        attempt++;
        attemptsEl.textContent = 'Attempt ' + attempt;
        countdownEl.textContent = 'Connecting...';

        var targetUrl = window.location.href.split('?')[0].split('#')[0];

        // Use /api/health to check if server is alive (lightweight, won't trigger SW intercept issues)
        fetch('/api/health', { cache: 'no-store', headers: { 'X-Wake-Up': '1' } })
          .then(function(res) {
            if (res.ok) {
              var ct = (res.headers.get('content-type') || '').toLowerCase();
              if (ct.includes('application/json')) {
                // Server is alive! Redirect to the actual page
                countdownEl.textContent = 'Connected! Loading ORRA...';
                window.location.replace(targetUrl + '?_cb=' + Date.now());
                return;
              }
            }
            // Server responded but not healthy — retry
            scheduleRetry();
          })
          .catch(function() {
            // Network error — server not up yet, retry
            scheduleRetry();
          });
      }

      function scheduleRetry() {
        // Exponential backoff: 2s, 2s, 3s, 3s, 5s, then every 5s
        var delay;
        if (attempt <= 2) delay = 2000;
        else if (attempt <= 4) delay = 3000;
        else delay = 5000;

        var remaining = Math.ceil(delay / 1000);
        function tick() {
          if (remaining <= 0) {
            tryConnect();
            return;
          }
          countdownEl.textContent = 'Retrying in ' + remaining + 's...';
          remaining--;
          setTimeout(tick, 1000);
        }
        tick();
      }

      // Manual retry on tap
      window.manualRetry = function() {
        attempt = 0;
        countdownEl.textContent = 'Connecting...';
        tryConnect();
      };

      // Start first attempt quickly
      setTimeout(tryConnect, 500);

      // Also try on visibility change (when user switches back to this tab)
      document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
          attempt = 0;
          tryConnect();
        }
      });
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

// Check if a response body looks like a platform error (JSON with sandbox error)
function isPlatformErrorResponse(response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return contentType.includes('application/json') || contentType.includes('text/plain');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // /api/health and /api/build-id — NEVER intercept (keepalive endpoints)
  if (url.pathname === '/api/health' || url.pathname === '/api/build-id') {
    return;
  }

  // NAVIGATION REQUESTS — Handle sandbox inactive / cold starts
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Check if the response is actually HTML (what we expect for navigation)
          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          const isHTML = contentType.includes('text/html') || contentType.includes('document');

          if (response.ok && isHTML) {
            // Normal HTML page — pass through
            return response;
          }

          // 404 from the platform proxy (plain text "404 page not found")
          // This happens when the container is frozen/sleeping
          if (response.status === 404 || response.status === 502 || response.status === 503) {
            console.log('[SW v8] Platform returned', response.status, '— container likely frozen, showing waking-up page');
            return new Response(WAKING_UP_HTML, {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-ORRA-Wake-Up': '1',
                'Cache-Control': 'no-store',
              },
            });
          }

          // Got a non-HTML response (likely platform error JSON like "sandbox is inactive")
          // Clone and read the body to check
          return response.clone().text().then((body) => {
            try {
              const json = JSON.parse(body);
              // Platform errors: "sandbox is inactive", "container starting", etc.
              if (json.error && (
                json.error.includes('inactive') ||
                json.error.includes('sandbox') ||
                json.error.includes('starting') ||
                json.error.includes('cold') ||
                json.error.includes('timeout') ||
                json.error.includes('container')
              )) {
                console.log('[SW v8] Platform error detected:', json.error, '— showing waking-up page');
                return new Response(WAKING_UP_HTML, {
                  status: 200,
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-ORRA-Wake-Up': '1',
                    'Cache-Control': 'no-store',
                  },
                });
              }
            } catch (e) {
              // Not valid JSON — could be a plain text error from the platform proxy
              if (body.includes('inactive') || body.includes('sandbox') || body.includes('error') || body.includes('not found') || body.includes('404')) {
                console.log('[SW v8] Platform text error detected:', body.substring(0, 50), '— showing waking-up page');
                return new Response(WAKING_UP_HTML, {
                  status: 200,
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-ORRA-Wake-Up': '1',
                    'Cache-Control': 'no-store',
                  },
                });
              }
            }

            // Some other non-HTML response — return as-is
            return response;
          });
        })
        .catch(() => {
          // Network error — server is down or unreachable
          console.log('[SW v8] Network error on navigation — showing waking-up page');
          return new Response(WAKING_UP_HTML, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-ORRA-Wake-Up': '1',
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
          // Check for platform error in API response
          if (response.status === 200) {
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            // If API returns JSON, check for sandbox errors
            if (contentType.includes('application/json')) {
              return response.clone().text().then((body) => {
                try {
                  const json = JSON.parse(body);
                  if (json.error && (
                    json.error.includes('inactive') ||
                    json.error.includes('sandbox') ||
                    json.error.includes('container')
                  )) {
                    // Platform intercepted the API call — return 503 so client retries
                    return new Response(JSON.stringify({ ok: false, error: 'sandbox_inactive', retry: true }), {
                      status: 503,
                      headers: { 'Content-Type': 'application/json', 'X-ORRA-Sandbox': 'inactive' },
                    });
                  }
                } catch (e) {}
                // Normal API response — return as-is
                return new Response(body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                });
              });
            }
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

  // Static chunks — cache first
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
          return new Response('Network error', { status: 503 });
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
