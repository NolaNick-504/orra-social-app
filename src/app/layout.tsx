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
            // Only detect actual JS chunk errors (stale chunks after deploy)
            // DO NOT proactively check build IDs — that causes infinite reload loops
            // when the browser has cached HTML with an old build ID.
            // The middleware's no-cache headers ensure fresh HTML on each visit.
            var MAX_RETRIES = 1;
            var alreadyRetried = sessionStorage.getItem('orra_chunk_retry');

            function orraForceReload() {
              if (alreadyRetried === '1') {
                // Already tried once — stop retrying to prevent infinite loops
                sessionStorage.removeItem('orra_chunk_retry');
                return;
              }
              sessionStorage.setItem('orra_chunk_retry', '1');
              window.location.replace('/?_cb=' + Date.now());
            }

            // Detect stale JS chunks — when old chunk filenames no longer exist
            window.addEventListener('error', function(e) {
              var msg = (e.message || '').toLowerCase();
              var isChunkError = (
                msg.indexOf('unexpected token') !== -1 ||
                msg.indexOf('loading chunk') !== -1 ||
                msg.indexOf('chunk load failed') !== -1 ||
                (e.filename && e.filename.indexOf('/_next/static/chunks/') !== -1)
              );
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
