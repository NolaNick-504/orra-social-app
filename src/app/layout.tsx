import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Dancing_Script, Great_Vibes } from "next/font/google";
import { AuthProvider } from "@/components/providers/session-provider";
import { KeepAliveProvider } from "@/components/providers/keep-alive-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "ORRA - Social Media Super App",
  description: "The next-gen social media experience. Pulse, Prism, Dance Challenges, and more.",
  keywords: ["ORRA", "Social Media", "Dance Challenge", "Reels", "Next.js"],
  authors: [{ name: "ORRA Team" }],
  icons: {
    icon: "/images/orra-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Bootstrap script — runs BEFORE React hydrates.
            1. Registers cold-start service worker (handles "sandbox is inactive")
            2. Clears stale Cache Storage from old SW versions
            3. Starts keep-alive pings to prevent proxy timeouts
            4. Adds global fetch error recovery with sandbox detection
            5. Catches chunk load errors
            6. Watchdog: if app is stuck on loading for 15s, force reload via clear-cache */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // 1. REGISTER SERVICE WORKER for cold-start resilience
            //    This SW detects "sandbox is inactive" errors and shows a
            //    "Waking up..." page with auto-retry instead of raw JSON.
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
                console.log('ORRA: Service Worker v7 registered for cold-start protection');
                // Force update check
                reg.update();
              }).catch(function(err) {
                console.warn('ORRA: SW registration failed (non-critical):', err.message);
              });
            }

            // 2. Clear OLD Cache Storage (from previous SW versions)
            if ('caches' in window) {
              caches.keys().then(function(names) {
                for (var i = 0; i < names.length; i++) {
                  // Only keep our current caches (orra-static-v7, orra-images-v7)
                  if (!names[i].includes('v7')) {
                    caches.delete(names[i]);
                  }
                }
              }).catch(function() {});
            }

            // 3. Clear stale aura-storage if it has broken data
            try {
              var s = localStorage.getItem('aura-storage');
              if (s) {
                var p = JSON.parse(s);
                if (p && p.state && p.state.currentUserId === 'user-me') {
                  localStorage.removeItem('aura-storage');
                }
              }
            } catch(e) {
              try { localStorage.removeItem('aura-storage'); } catch(x) {}
            }

            // 4. KEEP-ALIVE: Ping the server every 10 seconds to prevent
            //    proxy/platform idle connection timeouts.
            //    The server-side keep-alive daemon also pings localhost every 10s.
            //    Together, these keep the FC proxy from freezing the container.
            var keepAliveUrl = '/api/build-id';
            var lastKeepAliveOk = Date.now();
            var containerWasFrozen = false;

            function doKeepAlive() {
              fetch(keepAliveUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: { 'X-Keep-Alive': '1' }
              }).then(function(res) {
                if (res.ok) {
                  // Check for "sandbox is inactive" even in 200 responses
                  var ct = (res.headers.get('content-type') || '').toLowerCase();
                  if (!ct.includes('application/json')) {
                    // Got HTML or something instead of JSON — platform proxy error
                    containerWasFrozen = true;
                    return;
                  }
                  lastKeepAliveOk = Date.now();
                  if (containerWasFrozen) {
                    containerWasFrozen = false;
                    console.log('ORRA: Container is back online');
                    hideSandboxOverlay();
                  }
                } else if (res.status === 403 || res.status === 502 || res.status === 503) {
                  // FC proxy returns 403 (FCCommonError) when container is frozen
                  // or 502 when the server is down.
                  containerWasFrozen = true;
                  showSandboxOverlay();
                }
              }).catch(function() {
                // Network error — container might be frozen
                if (Date.now() - lastKeepAliveOk > 30000) {
                  containerWasFrozen = true;
                  showSandboxOverlay();
                }
              });
            }

            doKeepAlive();
            setInterval(doKeepAlive, 10000);

            // 5. VISIBILITY RECOVERY — when tab regains focus
            document.addEventListener('visibilitychange', function() {
              if (!document.hidden) {
                doKeepAlive();
                // Wait 2s then check if server is alive
                setTimeout(function() {
                  fetch('/api/health', { cache: 'no-store' })
                    .then(function(res) {
                      if (res.ok) {
                        // Server is alive — if we were frozen, reload to get fresh state
                        if (containerWasFrozen) {
                          console.log('ORRA: Server is back after freeze — reloading');
                          window.location.replace('/?_cb=' + Date.now());
                        }
                      } else {
                        throw new Error('bad status');
                      }
                    })
                    .catch(function() {
                      // Server unreachable — give it more time, don't reload yet
                      console.warn('ORRA: Health check failed on tab focus — server may be waking up');
                      // Try again in 5 seconds
                      setTimeout(function() {
                        fetch('/api/health', { cache: 'no-store' })
                          .then(function(res) {
                            if (res.ok) {
                              window.location.replace('/?_cb=' + Date.now());
                            }
                          }).catch(function() {});
                      }, 5000);
                    });
                }, 2000);
              }
            });

            // 6. ONLINE EVENT
            window.addEventListener('online', function() {
              console.log('ORRA: Back online — refreshing connection');
              doKeepAlive();
            });

            // 7. GLOBAL FETCH ERROR RECOVERY with sandbox detection
            //    - Retries API and chunk requests on failure
            //    - Detects "sandbox is inactive" responses from the platform proxy
            //    - Shows a "Waking up..." overlay when sandbox is cold
            var originalFetch = window.fetch;
            var sandboxInactiveOverlay = null;

            function showSandboxOverlay() {
              if (sandboxInactiveOverlay) return; // Already showing
              sandboxInactiveOverlay = document.createElement('div');
              sandboxInactiveOverlay.id = 'orra-sandbox-overlay';
              sandboxInactiveOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#050505;display:flex;align-items:center;justify-content:center;z-index:99999;';
              sandboxInactiveOverlay.innerHTML = '<div style="text-align:center;padding:20px;max-width:400px;">' +
                '<div style="width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#7c3aed,#d946ef);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;font-weight:bold;color:white;animation:logoPulse 2s ease-in-out infinite;box-shadow:0 0 40px rgba(124,58,237,0.3);">O</div>' +
                '<h2 style="color:white;font-size:22px;margin:0 0 8px;font-weight:700;">Waking Up ORRA</h2>' +
                '<p style="color:#94a3b8;font-size:14px;">Server is starting up. This takes a few seconds...</p>' +
                '<div style="width:200px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin:20px auto 0;overflow:hidden;"><div id="orra-wake-progress" style="height:100%;background:linear-gradient(90deg,#7c3aed,#d946ef);border-radius:2px;transition:width 0.5s;width:0%;"></div></div>' +
                '</div>';
              var style = document.createElement('style');
              style.textContent = '@keyframes logoPulse{0%,100%{transform:scale(1);box-shadow:0 0 40px rgba(124,58,237,0.3)}50%{transform:scale(1.05);box-shadow:0 0 60px rgba(124,58,237,0.5)}}';
              document.head.appendChild(style);
              document.body.appendChild(sandboxInactiveOverlay);
            }

            function hideSandboxOverlay() {
              if (sandboxInactiveOverlay) {
                sandboxInactiveOverlay.remove();
                sandboxInactiveOverlay = null;
              }
            }

            function checkForSandboxError(response) {
              // Check if the response is a platform error like "sandbox is inactive"
              var contentType = (response.headers.get('content-type') || '').toLowerCase();
              var sandboxHeader = response.headers.get('X-ORRA-Sandbox') || '';
              if (sandboxHeader === 'inactive') return true;
              // Also detect by status code for proxy errors
              if (response.status === 403) {
                var fcError = response.headers.get('X-Fc-Error-Type') || '';
                if (fcError.includes('FCCommonError')) return true;
              }
              return false;
            }

            window.fetch = function(input, init) {
              var url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));

              // Keep-alive and wake-up pings should not be retried
              if (init && init.headers && typeof init.headers === 'object') {
                try {
                  if (init.headers['X-Keep-Alive'] || init.headers['x-keep-alive'] ||
                      init.headers['X-Wake-Up'] || init.headers['x-wake-up']) {
                    return originalFetch.apply(this, arguments);
                  }
                } catch(e) {}
              }

              var isApi = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
              var isChunk = url.includes('/_next/static/') || url.includes('chunk');

              if (!isApi && !isChunk) {
                return originalFetch.apply(this, arguments);
              }

              var self = this;
              var args = arguments;

              function attemptFetch(retriesLeft) {
                return originalFetch.apply(self, args).then(function(response) {
                  // Check for platform/sandbox errors in the response
                  if (checkForSandboxError(response)) {
                    if (retriesLeft > 0) {
                      showSandboxOverlay();
                      var delay = (4 - retriesLeft) * 3000; // 3s, 6s, 9s
                      console.warn('ORRA: Sandbox inactive, retrying in ' + delay + 'ms (' + retriesLeft + ' left)');
                      return new Promise(function(resolve, reject) {
                        setTimeout(function() {
                          attemptFetch(retriesLeft - 1).then(resolve).catch(reject);
                        }, delay);
                      });
                    }
                    // All retries exhausted — the sandbox overlay is showing
                    // Auto-reload the whole page after a delay
                    setTimeout(function() {
                      window.location.replace('/?_cb=' + Date.now());
                    }, 5000);
                    return response;
                  }
                  // Success — hide sandbox overlay if showing
                  hideSandboxOverlay();
                  return response;
                }).catch(function(err) {
                  if (retriesLeft <= 0) {
                    throw err;
                  }
                  // Network error might mean sandbox is cold
                  showSandboxOverlay();
                  var delay = (4 - retriesLeft) * 2000;
                  console.warn('ORRA: Fetch failed, retrying in ' + delay + 'ms (' + retriesLeft + ' left):', url);
                  return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                      attemptFetch(retriesLeft - 1).then(resolve).catch(reject);
                    }, delay);
                  });
                });
              }

              return attemptFetch(3);
            };

            // 8. Prevent chunk load errors from crashing the app
            window.addEventListener('error', function(e) {
              var msg = (e.message || '').toLowerCase();
              if (msg.includes('loading chunk') || msg.includes('chunk load') ||
                  msg.includes('unexpected token') || msg.includes('failed to fetch dynamically imported module')) {
                e.preventDefault();
                if (!sessionStorage.getItem('orra_chunk_reload')) {
                  sessionStorage.setItem('orra_chunk_reload', '1');
                  window.location.replace('/?_cb=' + Date.now());
                }
              }
            });

            // Also catch unhandled promise rejections from dynamic imports
            window.addEventListener('unhandledrejection', function(e) {
              var msg = (e.reason && (e.reason.message || String(e.reason)) || '').toLowerCase();
              if (msg.includes('loading chunk') || msg.includes('chunk load') ||
                  msg.includes('failed to fetch') || msg.includes('dynamically imported module')) {
                e.preventDefault();
                if (!sessionStorage.getItem('orra_chunk_reload')) {
                  sessionStorage.setItem('orra_chunk_reload', '1');
                  window.location.replace('/?_cb=' + Date.now());
                }
              }
            });

            // 9. Clean up retry guard on successful navigation
            window.addEventListener('load', function() {
              try { sessionStorage.removeItem('orra_chunk_reload'); } catch(e) {}
            });

            // 10. LOADING SCREEN WATCHDOG
            //     If the app is still showing "Loading ORRA..." after 15 seconds,
            //     something is fundamentally broken (stale JS, blocked network, etc.)
            //     Redirect to clear-cache.html which will nuke everything and retry.
            setTimeout(function() {
              var root = document.getElementById('__next');
              if (root) {
                var text = root.innerText || root.textContent || '';
                if (text.includes('Loading ORRA') && !text.includes('Sign In') && !text.includes('Home')) {
                  console.warn('ORRA: App stuck on loading screen for 15s — redirecting to clear cache');
                  window.location.replace('/clear-cache.html');
                }
              }
            }, 15000);
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} ${greatVibes.variable} antialiased`}
      >
        <AuthProvider>
          <KeepAliveProvider>{children}</KeepAliveProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
