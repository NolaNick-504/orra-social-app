// ORRA Service Worker v7 - Cold-Start Resilient
// - Detects "sandbox is inactive" / platform proxy errors on navigation
// - Shows "Waking up..." page with auto-retry when sandbox is cold
// - Cache-first for /_next/static/ chunks (content-hashed, safe to cache)
// - Network-first for API calls and HTML pages
// - NEVER caches error responses or "sandbox is inactive" JSON
const STATIC_CACHE = 'orra-static-v7';
const IMAGE_CACHE = 'orra-images-v7';

// HTML page shown when the sandbox/platform is cold-starting
const WAKING_UP_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>ORRA - Waking Up...</title>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">O</div>
    <h2>Waking Up ORRA</h2>
    <p class="subtitle">The server is starting up. This takes a few seconds...</p>
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <p class="countdown" id="countdown">Retrying in 5s...</p>
    <p class="attempts" id="attempts"></p>
  </div>
  <script>
    (function() {
      var attempt = 0;
      var maxAttempts = 20;
      var countdownEl = document.getElementById('countdown');
      var progressEl = document.getElementById('progressFill');
      var attemptsEl = document.getElementById('attempts');

      function tryConnect() {
        attempt++;
        attemptsEl.textContent = 'Attempt ' + attempt + ' of ' + maxAttempts;
        progressEl.style.width = Math.min((attempt / maxAttempts) * 100, 95) + '%';

        var countdown = 5;
        var targetUrl = window.location.href;

        function tick() {
          countdownEl.textContent = 'Retrying in ' + countdown + 's...';
          if (countdown <= 0) {
            // Actually try to fetch the real page
            fetch(targetUrl, { cache: 'no-store', headers: { 'X-Wake-Up': '1' } })
              .then(function(res) {
                // Check if we got a real HTML page (not another error JSON)
                var ct = (res.headers.get('content-type') || '').toLowerCase();
                if (res.ok && (ct.includes('text/html') || ct.includes('document'))) {
                  // Server is alive! Load the real page
                  window.location.replace(targetUrl.split('?')[0] + '?_cb=' + Date.now());
                } else if (res.status === 403 || res.status === 502 || res.status === 503) {
                  // Platform proxy error — server still starting
                  countdown = 4;
                  tick();
                } else {
                  // Unexpected response — try to read it
                  return res.text().then(function(text) {
                    try {
                      var json = JSON.parse(text);
                      if (json.error && (json.error.includes('inactive') || json.error.includes('sandbox'))) {
                        // Still inactive — retry
                        countdown = 4;
                        tick();
                      } else {
                        // Some other error — just reload the page normally
                        window.location.replace(targetUrl.split('?')[0] + '?_cb=' + Date.now());
                      }
                    } catch(e) {
                      // Not JSON — could be HTML, just reload
                      window.location.replace(targetUrl.split('?')[0] + '?_cb=' + Date.now());
                    }
                  });
                }
              })
              .catch(function() {
                // Network error — server not up yet, retry
                if (attempt < maxAttempts) {
                  countdown = 4;
                  tick();
                } else {
                  countdownEl.textContent = 'Taking longer than expected. Tap to retry.';
                  countdownEl.style.cursor = 'pointer';
                  countdownEl.style.color = '#7c3aed';
                  countdownEl.onclick = function() {
                    attempt = 0;
                    tryConnect();
                  };
                }
              });
            return;
          }
          countdown--;
          setTimeout(tick, 1000);
        }

        tick();
      }

      // Start first attempt after a short delay
      setTimeout(tryConnect, 1000);
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
  // If it's JSON instead of HTML for a navigation request, it's likely a platform error
  return contentType.includes('application/json') || contentType.includes('text/plain');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // /api/health — NEVER intercept
  if (url.pathname === '/api/health') {
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
            console.log('[SW v7] Platform returned', response.status, '— container likely frozen, showing waking-up page');
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
                console.log('[SW v7] Platform error detected:', json.error, '— showing waking-up page');
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
              // Common errors: "404 page not found", "sandbox is inactive", etc.
              if (body.includes('inactive') || body.includes('sandbox') || body.includes('error') || body.includes('not found') || body.includes('404')) {
                console.log('[SW v7] Platform text error detected:', body.substring(0, 50), '— showing waking-up page');
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
          // Show the waking-up page so the user isn't stuck looking at a browser error
          console.log('[SW v7] Network error on navigation — showing waking-up page');
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
