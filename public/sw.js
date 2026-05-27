// ORRA Service Worker v9 - Recovery Bypass
// - Detects "sandbox is inactive" / platform proxy errors on navigation
// - Shows "Waking up..." page with INDEFINITE auto-retry
// - ★ CRITICAL FIX: Uses cookie bypass to avoid re-intercepting recovery navigations
// - When the waking-up page confirms server is alive, it sets a cookie
//   that tells this SW to pass through navigation requests without intercepting
// - This prevents the infinite loop where SW keeps showing the waking-up page
const STATIC_CACHE = 'orra-static-v9';
const IMAGE_CACHE = 'orra-images-v9';

// The bypass cookie name — when present, SW passes through all navigation
const BYPASS_COOKIE = 'orra_sw_bypass';

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
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 20px; line-height: 1.4; }
    .progress-bar { width: 200px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 auto 12px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #d946ef); border-radius: 2px; animation: progressSweep 3s ease-in-out infinite; }
    @keyframes progressSweep { 0% { width: 10%; margin-left: 0; } 50% { width: 70%; margin-left: 15%; } 100% { width: 10%; margin-left: 90%; } }
    .countdown { color: #64748b; font-size: 12px; margin-top: 4px; }
    .tap-hint { color: #7c3aed; font-size: 13px; margin-top: 16px; cursor: pointer; padding: 8px 16px; border: 1px solid rgba(124,58,237,0.3); border-radius: 12px; display: inline-block; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
    .tap-hint:hover, .tap-hint:active { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.5); }
    .status { color: #475569; font-size: 11px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">O</div>
    <h2 id="title">Waking Up ORRA</h2>
    <p class="subtitle" id="subtitle">The server is starting up. This takes a few seconds...</p>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    <p class="countdown" id="countdown">Connecting...</p>
    <p class="status" id="status"></p>
    <div class="tap-hint" onclick="manualRetry()">Tap here to try now</div>
  </div>
  <script>
    (function() {
      var attempt = 0;
      var titleEl = document.getElementById('title');
      var subtitleEl = document.getElementById('subtitle');
      var countdownEl = document.getElementById('countdown');
      var statusEl = document.getElementById('status');

      function tryConnect() {
        attempt++;
        statusEl.textContent = 'Attempt ' + attempt;
        countdownEl.textContent = 'Checking server...';

        // STEP 1: Check if server is alive via /api/health
        fetch('/api/health', { cache: 'no-store', headers: { 'X-Wake-Up': '1' } })
          .then(function(res) {
            if (res.ok) {
              var ct = (res.headers.get('content-type') || '').toLowerCase();
              if (ct.includes('application/json')) {
                // Server health check passed!
                // STEP 2: Now verify the actual HTML page loads too
                countdownEl.textContent = 'Server is up! Loading page...';
                subtitleEl.textContent = 'Almost there...';
                verifyPageLoads();
                return;
              }
            }
            // Server not healthy yet
            scheduleRetry();
          })
          .catch(function() {
            // Network error — server not up yet
            scheduleRetry();
          });
      }

      function verifyPageLoads() {
        var targetUrl = window.location.href.split('?')[0].split('#')[0];
        // Try to fetch the actual HTML page (not just the health endpoint)
        // This ensures the page rendering is working, not just the API
        fetch(targetUrl, { cache: 'no-store', headers: { 'X-Wake-Up': '1' } })
          .then(function(res) {
            var ct = (res.headers.get('content-type') || '').toLowerCase();
            if (res.ok && (ct.includes('text/html') || ct.includes('document'))) {
              // ★★★ THE KEY FIX ★★★
              // Set a BYPASS COOKIE before navigating.
              // The service worker checks for this cookie and will NOT intercept
              // the navigation request. This prevents the infinite loop where
              // the SW keeps showing the waking-up page on recovery.
              document.cookie = 'orra_sw_bypass=1; path=/; max-age=30; SameSite=Lax';
              countdownEl.textContent = 'Connected! Loading ORRA...';
              titleEl.textContent = 'Almost Ready!';
              subtitleEl.textContent = '';
              // Short delay to ensure cookie is saved
              setTimeout(function() {
                window.location.replace(targetUrl + '?_cb=' + Date.now());
              }, 300);
            } else {
              // Health check passed but page doesn't load properly yet
              // The server might still be initializing — retry
              statusEl.textContent = 'Server up but page not ready yet (attempt ' + attempt + ')';
              scheduleRetry();
            }
          })
          .catch(function() {
            // Page fetch failed even though health check passed
            statusEl.textContent = 'Page still loading (attempt ' + attempt + ')';
            scheduleRetry();
          });
      }

      function scheduleRetry() {
        // Exponential backoff: 2s, 2s, 3s, 3s, 5s, then every 5s
        var delay;
        if (attempt <= 2) delay = 2000;
        else if (attempt <= 4) delay = 3000;
        else delay = 5000;

        // After many attempts, increase delay to avoid hammering
        if (attempt > 20) delay = 10000;
        if (attempt > 50) delay = 15000;

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
          countdownEl.textContent = 'Connecting...';
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

// Check if the request has the bypass cookie (set by the waking-up page before recovery)
function hasBypassCookie(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.includes('orra_sw_bypass=1');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // /api/health and /api/build-id — NEVER intercept (keepalive endpoints)
  if (url.pathname === '/api/health' || url.pathname === '/api/build-id') {
    return;
  }

  // NAVIGATION REQUESTS — Handle sandbox inactive / cold starts
  if (event.request.mode === 'navigate') {
    // ★★★ CRITICAL FIX ★★★
    // If the waking-up page set the bypass cookie, pass through WITHOUT intercepting.
    // This prevents the infinite loop where SW keeps showing the waking-up page
    // on recovery navigation. The cookie is set for 30 seconds, so after the page
    // loads successfully and the app initializes, it clears the cookie.
    if (hasBypassCookie(event.request)) {
      console.log('[SW v9] Bypass cookie detected — passing through navigation without intercept');
      // Don't call event.respondWith() — let the browser handle it natively
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Check if the response is actually HTML (what we expect for navigation)
          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          const isHTML = contentType.includes('text/html') || contentType.includes('document');

          if (response.ok && isHTML) {
            // Normal HTML page — pass through and clear any stale bypass cookie
            return response;
          }

          // 404 from the platform proxy (plain text "404 page not found")
          // This happens when the container is frozen/sleeping
          if (response.status === 404 || response.status === 502 || response.status === 503) {
            console.log('[SW v9] Platform returned', response.status, '— showing waking-up page');
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
                console.log('[SW v9] Platform error detected:', json.error, '— showing waking-up page');
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
              if (body.includes('inactive') || body.includes('sandbox') || body.includes('error') || body.includes('not found') || body.includes('404')) {
                console.log('[SW v9] Platform text error detected:', body.substring(0, 50), '— showing waking-up page');
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
          console.log('[SW v9] Network error on navigation — showing waking-up page');
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
          if (response.status === 200) {
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('application/json')) {
              return response.clone().text().then((body) => {
                try {
                  const json = JSON.parse(body);
                  if (json.error && (
                    json.error.includes('inactive') ||
                    json.error.includes('sandbox') ||
                    json.error.includes('container')
                  )) {
                    return new Response(JSON.stringify({ ok: false, error: 'sandbox_inactive', retry: true }), {
                      status: 503,
                      headers: { 'Content-Type': 'application/json', 'X-ORRA-Sandbox': 'inactive' },
                    });
                  }
                } catch (e) {}
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
