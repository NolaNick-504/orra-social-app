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
            1. Kills old service workers by registering a "killer" SW that self-destructs
            2. Clears all Cache Storage
            3. Starts keep-alive pings to prevent proxy timeouts
            4. Adds global fetch error recovery
            5. Catches chunk load errors */}
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
            //    Uses a dedicated endpoint that's fast and lightweight.
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
                // Keep-alive failed — connection might be dead.
                // If we haven't had a successful ping in 60+ seconds,
                // the proxy has likely dropped us. Try a fresh connection.
                if (Date.now() - lastKeepAliveOk > 60000) {
                  console.warn('ORRA: No successful keep-alive in 60s — connection likely dead');
                }
              });
            }

            // Start keep-alive immediately, then every 15 seconds
            doKeepAlive();
            setInterval(doKeepAlive, 15000);

            // 5. VISIBILITY RECOVERY: When user comes back to the tab after
            //    being away, the proxy may have dropped the connection.
            //    Force a keep-alive ping immediately and check health.
            document.addEventListener('visibilitychange', function() {
              if (!document.hidden) {
                // Tab became visible — immediately ping
                doKeepAlive();
                // If we've been hidden for more than 2 minutes, do a health check
                // and auto-recover if the connection is dead
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

            // 6. ONLINE EVENT: When browser reports we're back online,
            //    auto-refresh the page to get a fresh connection
            window.addEventListener('online', function() {
              console.log('ORRA: Back online — refreshing connection');
              doKeepAlive();
            });

            // 7. GLOBAL FETCH ERROR RECOVERY
            //    Auto-retry failed requests (API + dynamic imports) before showing errors
            var originalFetch = window.fetch;

            window.fetch = function(input, init) {
              var url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));

              // Don't retry keep-alive pings
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
                        // Second retry failed too — wait longer and try once more
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

            // 9. Clean up retry guard on successful navigation
            window.addEventListener('load', function() {
              try { sessionStorage.removeItem('orra_chunk_reload'); } catch(e) {}
            });
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
