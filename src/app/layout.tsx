import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Dancing_Script, Great_Vibes } from "next/font/google";
import { AuthProvider } from "@/components/providers/session-provider";
import { readFileSync } from "fs";
import path from "path";
import "./globals.css";

// Force dynamic rendering — prevents Next.js from caching stale HTML after deploys
// This ensures mobile browsers always get fresh JS chunk references
export const dynamic = 'force-dynamic';

// Read build ID at render time for stale cache detection
let orraBuildId = '';
try {
  orraBuildId = readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf-8').trim();
} catch {
  orraBuildId = 'dev';
}

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
        {/* Inline script that runs BEFORE any React/Next.js JS loads.
            This catches stale chunk errors at the earliest possible moment
            and forces a cache-bust reload before the user sees a broken page. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var ORRA_BUILD_ID = '${orraBuildId}';
            var MAX_RETRIES = 2;

            // 1. Detect stale JS chunks — when the browser has old HTML cached
            //    that references chunk filenames that no longer exist on the server.
            //    Next.js returns HTML (the page) for missing chunk URLs, which
            //    causes "Unexpected token" errors when the browser tries to execute
            //    HTML as JavaScript.
            window.addEventListener('error', function(e) {
              var msg = (e.message || '').toLowerCase();
              var isChunkError = (
                msg.indexOf('unexpected token') !== -1 ||
                msg.indexOf('expected expression') !== -1 ||
                msg.indexOf('unexpected identifier') !== -1 ||
                msg.indexOf('unexpected end of input') !== -1 ||
                msg.indexOf('syntaxerror') !== -1 ||
                msg.indexOf('loading chunk') !== -1 ||
                msg.indexOf('loading css chunk') !== -1 ||
                msg.indexOf('chunk load failed') !== -1 ||
                (e.filename && e.filename.indexOf('/_next/static/chunks/') !== -1)
              );

              if (isChunkError) {
                console.warn('ORRA: Stale chunk detected, forcing cache-bust reload');
                orraForceReload();
              }
            }, true);

            // 2. Catch unhandled promise rejections (dynamic imports / chunk loading)
            window.addEventListener('unhandledrejection', function(e) {
              var msg = (e.reason && (e.reason.message || e.reason.stack || String(e.reason))).toLowerCase();
              if (
                msg.indexOf('loading chunk') !== -1 ||
                msg.indexOf('chunk load') !== -1 ||
                msg.indexOf('failed to fetch dynamically imported module') !== -1 ||
                msg.indexOf('importing a module') !== -1
              ) {
                console.warn('ORRA: Chunk import failed, forcing cache-bust reload');
                orraForceReload();
              }
            });

            // 3. Intercept script load errors via performance observer
            if (typeof PerformanceObserver !== 'undefined') {
              try {
                var po = new PerformanceObserver(function(list) {
                  list.getEntries().forEach(function(entry) {
                    if (entry.entryType === 'resource' && entry.name.indexOf('/_next/static/chunks/') !== -1) {
                      // Check if the chunk response was HTML instead of JS (stale chunk indicator)
                      if (entry.transferSize > 0 && entry.decodedBodySize > 5000) {
                        // Large response for a chunk file is suspicious — might be HTML
                        // We verify by checking if it's a valid JS response
                      }
                    }
                  });
                });
                po.observe({ entryTypes: ['resource'] });
              } catch(e) {}
            }

            function orraForceReload() {
              var retries = parseInt(sessionStorage.getItem('orra_reload_retries') || '0', 10);
              if (retries >= MAX_RETRIES) {
                // Too many retries — clear everything and do a hard reload
                console.warn('ORRA: Max retries reached, clearing cache and reloading');
                sessionStorage.removeItem('orra_reload_retries');
                try { localStorage.removeItem('aura-storage'); } catch(e) {}
                window.location.replace('/?_nocache=' + Date.now());
                return;
              }
              sessionStorage.setItem('orra_reload_retries', String(retries + 1));
              window.location.replace('/?_cb=' + Date.now());
            }

            // 4. Proactive stale check: fetch the server's build ID and compare
            //    This catches the case where the browser has old HTML cached
            //    (with old chunk references) but no JS errors occur yet.
            //    By checking the build ID, we can force a reload BEFORE the
            //    user sees broken content.
            (function checkBuildId() {
              // Compare the build ID embedded in this HTML with the server's current build ID
              // If they differ, the browser has stale HTML cached and needs a reload
              if (!ORRA_BUILD_ID) return;
              fetch('/api/build-id', { cache: 'no-store' })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                  if (data.buildId && ORRA_BUILD_ID && data.buildId !== ORRA_BUILD_ID) {
                    console.warn('ORRA: Build ID mismatch (cached=' + ORRA_BUILD_ID + ', server=' + data.buildId + '), forcing reload');
                    orraForceReload();
                  }
                })
                .catch(function() {
                  // Network error — don't force reload
                });
            })();

            // 5. Clear retry counter on successful load
            window.addEventListener('load', function() {
              sessionStorage.removeItem('orra_reload_retries');
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
