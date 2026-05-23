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
            var MAX_RETRIES = 1;
            var alreadyRetried = sessionStorage.getItem('orra_chunk_retry');

            function orraForceReload() {
              if (alreadyRetried === '1') {
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
              // Also clear error retry counters from error.tsx / global-error.tsx
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
