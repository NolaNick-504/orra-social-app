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
            //    Instead of just unregistering (which requires the old SW to cooperate),
            //    we try to unregister them directly, and also clear all caches.
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

            // 4. KEEP-ALIVE: Ping the server every 25 seconds to prevent
            //    proxy/platform idle connection timeouts.
            var keepAliveUrl = '/api/build-id';
            var keepAliveInterval = 25000;

            function doKeepAlive() {
              fetch(keepAliveUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: { 'X-Keep-Alive': '1' }
              }).then(function(res) {}).catch(function() {});
            }

            setInterval(doKeepAlive, keepAliveInterval);

            // 5. GLOBAL FETCH ERROR RECOVERY
            //    Auto-retry failed API requests once before showing errors.
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
                if (url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/')) {
                  console.warn('ORRA: Fetch failed, retrying in 2s:', url, err.message || err);
                  return new Promise(function(resolve) {
                    setTimeout(function() {
                      originalFetch.apply(window, [input, init]).then(resolve).catch(function() {
                        resolve(originalFetch.apply(window, [input, init]));
                      });
                    }, 2000);
                  });
                }
                throw err;
              });
            };

            // 6. Prevent chunk load errors from crashing the app
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
