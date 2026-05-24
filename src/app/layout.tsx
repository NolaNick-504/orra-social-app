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
        {/* NO SERVICE WORKER REGISTRATION.
            The old SW was caching stale chunks and causing users to get stuck
            on "Loading ORRA...". SW registration is completely removed.
            If we add SW back later, it MUST be a network-first strategy
            with aggressive timeout fallbacks. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // 1. Kill ALL service workers immediately on every page load
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(regs) {
                for (var i = 0; i < regs.length; i++) {
                  regs[i].unregister();
                }
              }).catch(function() {});
            }
            // 2. Clear ALL cache storage
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

            // 4. KEEP-ALIVE: Ping the server every 25 seconds to prevent
            //    proxy/platform idle connection timeouts.
            //    This is the fix for "works for a few minutes then 404s".
            var keepAliveUrl = '/api/build-id';
            var keepAliveInterval = 25000; // 25 seconds
            var keepAliveTimer = null;

            function doKeepAlive() {
              fetch(keepAliveUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: { 'X-Keep-Alive': '1' }
              }).then(function(res) {
                if (!res.ok) {
                  // Server responded but with error — schedule next ping
                }
              }).catch(function() {
                // Network error — don't crash, just try again next interval
              });
            }

            // Start keep-alive after initial page load
            keepAliveTimer = setInterval(doKeepAlive, keepAliveInterval);

            // 5. GLOBAL FETCH ERROR RECOVERY
            //    When a fetch fails due to network issues (timeout, connection reset),
            //    instead of letting the React error boundary crash the app,
            //    we intercept and retry automatically.
            var originalFetch = window.fetch;
            var retryableStatusCodes = [408, 429, 500, 502, 503, 504];

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
                // Network error (timeout, connection reset, etc.)
                // Only retry for same-origin API requests
                if (url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/')) {
                  console.warn('ORRA: Fetch failed, retrying in 2s:', url, err.message || err);
                  return new Promise(function(resolve) {
                    setTimeout(function() {
                      originalFetch.apply(window, [input, init]).then(resolve).catch(function() {
                        // Second retry failed — let the caller handle it
                        console.warn('ORRA: Retry also failed for:', url);
                        resolve(originalFetch.apply(window, [input, init]));
                      });
                    }, 2000);
                  });
                }
                throw err;
              });
            };

            // 6. Prevent chunk load errors from crashing the app
            //    When Next.js tries to load a chunk that's been invalidated
            //    (e.g., after a rebuild), catch the error and reload once.
            window.addEventListener('error', function(e) {
              var msg = (e.message || '').toLowerCase();
              if (msg.includes('loading chunk') || msg.includes('chunk load') ||
                  msg.includes('unexpected token') || msg.includes('failed to fetch dynamically imported module')) {
                e.preventDefault();
                // Only reload once per session to prevent loops
                if (!sessionStorage.getItem('orra_chunk_reload')) {
                  sessionStorage.setItem('orra_chunk_reload', '1');
                  window.location.replace('/?_cb=' + Date.now());
                }
              }
            });

            // 7. Clean up retry guard on successful navigation
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
