import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Dancing_Script, Great_Vibes } from "next/font/google";
import { AuthProvider } from "@/components/providers/session-provider";
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

            // 4. KEEP-ALIVE: Ping the server every 15 seconds to prevent
            //    proxy/platform idle connection timeouts.
            var keepAliveUrl = '/api/build-id';
            var lastKeepAliveOk = Date.now();

            function doKeepAlive() {
              fetch(keepAliveUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: { 'X-Keep-Alive': '1' }
              }).then(function(res) {
                if (res.ok) {
                  lastKeepAliveOk = Date.now();
                }
              }).catch(function() {
                if (Date.now() - lastKeepAliveOk > 60000) {
                  console.warn('ORRA: No successful keep-alive in 60s — connection likely dead');
                }
              });
            }

            doKeepAlive();
            setInterval(doKeepAlive, 15000);

            // 5. VISIBILITY RECOVERY
            document.addEventListener('visibilitychange', function() {
              if (!document.hidden) {
                doKeepAlive();
                setTimeout(function() {
                  fetch('/api/build-id', { cache: 'no-store' })
                    .then(function(res) {
                      if (!res.ok) throw new Error('bad status');
                    })
                    .catch(function() {
                      console.warn('ORRA: Health check failed on tab focus — reloading');
                      window.location.replace('/?_cb=' + Date.now());
                    });
                }, 1000);
              }
            });

            // 6. ONLINE EVENT
            window.addEventListener('online', function() {
              console.log('ORRA: Back online — refreshing connection');
              doKeepAlive();
            });

            // 7. GLOBAL FETCH ERROR RECOVERY
            var originalFetch = window.fetch;

            window.fetch = function(input, init) {
              var url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));

              if (init && init.headers && typeof init.headers === 'object') {
                try {
                  if (init.headers['X-Keep-Alive'] || init.headers['x-keep-alive']) {
                    return originalFetch.apply(this, arguments);
                  }
                } catch(e) {}
              }

              return originalFetch.apply(this, arguments).catch(function(err) {
                var isApi = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
                var isChunk = url.includes('/_next/static/') || url.includes('chunk');

                if (isApi || isChunk) {
                  console.warn('ORRA: Fetch failed, retrying in 2s:', url, err.message || err);
                  return new Promise(function(resolve) {
                    setTimeout(function() {
                      originalFetch.apply(window, [input, init]).then(resolve).catch(function() {
                        setTimeout(function() {
                          originalFetch.apply(window, [input, init]).then(resolve).catch(function(finalErr) {
                            resolve(originalFetch.apply(window, [input, init]));
                          });
                        }, 3000);
                      });
                    }, 2000);
                  });
                }
                throw err;
              });
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
            //     If the app is still showing "Loading ORRA..." after 10 seconds,
            //     something is fundamentally broken (stale JS, blocked network, etc.)
            //     Redirect to clear-cache.html which will nuke everything and retry.
            setTimeout(function() {
              // Check if the React root has any real content (not just the loading spinner)
              var root = document.getElementById('__next');
              if (root) {
                var text = root.innerText || root.textContent || '';
                // If we're still showing the loading message after 10s, bail out
                if (text.includes('Loading ORRA') && !text.includes('Sign In') && !text.includes('Home')) {
                  console.warn('ORRA: App stuck on loading screen for 10s — redirecting to clear cache');
                  window.location.replace('/clear-cache.html');
                }
              }
            }, 10000);
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} ${greatVibes.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
