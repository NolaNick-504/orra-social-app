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
            1. Kills old service workers
            2. Clears all Cache Storage
            3. Starts keep-alive pings to prevent proxy timeouts
            4. Adds global fetch error recovery
            5. Catches chunk load errors
            10. Watchdog: if app is stuck on loading for 10s, force reload via clear-cache */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // 1. KILL OLD SERVICE WORKERS
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(regs) {
                for (var i = 0; i < regs.length; i++) {
                  regs[i].unregister();
                }
              }).catch(function() {});
            }

            // 2. Clear ALL Cache Storage
            if ('caches' in window) {
              caches.keys().then(function(names) {
                for (var i = 0; i < names.length; i++) {
                  caches.delete(names[i]);
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
                  lastKeepAliveOk = Date.now();
                  if (containerWasFrozen) {
                    containerWasFrozen = false;
                    console.log('ORRA: Container is back online');
                  }
                } else if (res.status === 403 || res.status === 502 || res.status === 503) {
                  // FC proxy returns 403 (FCCommonError) when container is frozen
                  // or 502 when the server is down. Don't treat as fatal — just
                  // note that the container is likely cold-starting.
                  containerWasFrozen = true;
                }
              }).catch(function() {
                // Network error — container might be frozen
                if (Date.now() - lastKeepAliveOk > 30000) {
                  containerWasFrozen = true;
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

            // 7. GLOBAL FETCH ERROR RECOVERY with proper error propagation
            //    Fixes bug: the old 3rd retry called originalFetch without .catch(),
            //    creating an unhandled promise rejection that could crash the app.
            var originalFetch = window.fetch;

            window.fetch = function(input, init) {
              var url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));

              // Keep-alive pings should not be retried (they have their own error handling)
              if (init && init.headers && typeof init.headers === 'object') {
                try {
                  if (init.headers['X-Keep-Alive'] || init.headers['x-keep-alive']) {
                    return originalFetch.apply(this, arguments);
                  }
                } catch(e) {}
              }

              var isApi = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
              var isChunk = url.includes('/_next/static/') || url.includes('chunk');

              if (!isApi && !isChunk) {
                // Not an API or chunk request — don't retry
                return originalFetch.apply(this, arguments);
              }

              // For API and chunk requests, retry on failure (up to 3 times)
              var self = this;
              var args = arguments;

              function attemptFetch(retriesLeft) {
                return originalFetch.apply(self, args).catch(function(err) {
                  if (retriesLeft <= 0) {
                    // All retries exhausted — throw the original error
                    throw err;
                  }
                  var delay = (4 - retriesLeft) * 2000; // 2s, 4s, 6s
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
