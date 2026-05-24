import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Dancing_Script, Great_Vibes } from "next/font/google";
import { AuthProvider } from "@/components/providers/session-provider";
import "./globals.css";

// Use Next.js default static generation — no force-dynamic.
// force-dynamic caused SSR on every request, making TTFB slow.
// Next.js will generate HTML at build time and revalidate as needed.

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
        {/* Minimal inline script: only catches stale chunk errors and registers SW.
            No build ID comparison or force-reload logic — that caused infinite reload loops.
            When a new deploy happens, the new HTML references new chunk filenames (content hashes),
            and the browser naturally loads the new chunks on the next navigation. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // ========== HYDRATION SAFETY NET ==========
            // If React doesn't hydrate within 6 seconds, force a hard reload
            // with cache busting. This catches cases where the browser has
            // stale JS from a previous build that can't hydrate the new HTML.
            var HYDRATION_TIMEOUT = 6000;
            var hydrationCheckInterval = setInterval(function() {
              // React adds data-reactroot or __next attributes when hydrated
              var body = document.body;
              var reactRoot = body.querySelector('[data-reactroot]') ||
                              body.querySelector('#__next') ||
                              body.querySelector('[data-orra-hydrated]');
              if (reactRoot || window.__ORRA_HYDRATED) {
                clearInterval(hydrationCheckInterval);
                return;
              }
            }, 500);

            setTimeout(function() {
              clearInterval(hydrationCheckInterval);
              if (!window.__ORRA_HYDRATED) {
                console.warn('ORRA: Hydration timeout — forcing hard reload with cache bust');
                // Unregister ALL service workers first to clear cached assets
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(reg) { reg.unregister(); });
                  });
                }
                // Clear all caches
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) { caches.delete(name); });
                  });
                }
                // Hard reload with cache bust
                window.location.replace('/?_force=' + Date.now());
              }
            }, HYDRATION_TIMEOUT);

            // ========== STALE CHUNK DETECTION ==========
            var MAX_RETRIES = 1;
            var alreadyRetried = sessionStorage.getItem('orra_chunk_retry');

            function orraForceReload() {
              if (alreadyRetried === '1') {
                sessionStorage.removeItem('orra_chunk_retry');
                return;
              }
              sessionStorage.setItem('orra_chunk_retry', '1');
              // Clear caches before reload
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  names.forEach(function(name) { caches.delete(name); });
                });
              }
              window.location.replace('/?_cb=' + Date.now());
            }

            // Detect stale JS chunks — when old chunk filenames no longer exist
            window.addEventListener('error', function(e) {
              var msg = (e.message || '').toLowerCase();
              var isChunkError = (
                msg.indexOf('unexpected token') !== -1 ||
                msg.indexOf('loading chunk') !== -1 ||
                msg.indexOf('chunk load failed') !== -1 ||
                msg.indexOf('failed to fetch dynamically imported module') !== -1
              );
              // Only reload for actual chunk loading errors, NOT runtime errors in chunk files
              if (isChunkError) {
                console.warn('ORRA: Stale chunk detected, reloading once');
                orraForceReload();
              }
            }, true);

            // Catch unhandled promise rejections from chunk loading
            window.addEventListener('unhandledrejection', function(e) {
              var msg = (e.reason && (e.reason.message || e.reason.stack || String(e.reason))).toLowerCase();
              if (
                msg.indexOf('loading chunk') !== -1 ||
                msg.indexOf('failed to fetch dynamically imported module') !== -1
              ) {
                console.warn('ORRA: Chunk import failed, reloading once');
                orraForceReload();
              }
            });

            // Clear retry flag on successful load
            window.addEventListener('load', function() {
              sessionStorage.removeItem('orra_chunk_retry');
              try {
                sessionStorage.removeItem('orra_error_retry_count');
                sessionStorage.removeItem('orra_global_error_retry_count');
              } catch {}
            });

            // Register service worker for smart caching
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            }
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
