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
        {/* Minimal inline script: registers SW only.
            NO force-reload, NO hydration timeout, NO cache-clearing reloads.
            Those caused infinite reload loops and lost user data.
            When a new deploy happens, the new HTML has new chunk filenames,
            and the browser naturally loads them on the next navigation. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Register service worker for smart caching
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            }

            // CHUNK LOAD ERROR RECOVERY:
            // When the app rebuilds, old cached JS chunks become invalid.
            // The browser tries to load them, gets errors, and the app stays
            // stuck on "Loading ORRA...". This handler detects those failures,
            // clears ALL caches + unregisters the old service worker, and reloads.
            var _chunkFailCount = 0;
            window.addEventListener('error', function(e) {
              var src = (e.message || '') + ' ' + ((e.target && e.target.src) || '');
              if (src.indexOf('/_next/static/') !== -1 || src.indexOf('chunk') !== -1 || src.indexOf('Loading chunk') !== -1) {
                _chunkFailCount++;
                if (_chunkFailCount <= 2) {
                  console.warn('[ORRA] Chunk load error detected, clearing caches and reloading...');
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      regs.forEach(function(reg) { reg.unregister(); });
                    });
                  }
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      names.forEach(function(name) { caches.delete(name); });
                    });
                  }
                  setTimeout(function() {
                    window.location.replace('/?_rebuild=' + Date.now());
                  }, 300);
                }
              }
            }, true);

            // Also catch unhandled promise rejections from dynamic imports
            window.addEventListener('unhandledrejection', function(e) {
              var msg = (e.reason && (e.reason.message || String(e.reason))) || '';
              if (msg.indexOf('chunk') !== -1 || msg.indexOf('Loading') !== -1 || msg.indexOf('Failed to fetch') !== -1) {
                console.warn('[ORRA] Dynamic import failed, clearing caches and reloading...');
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(reg) { reg.unregister(); });
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) { caches.delete(name); });
                  });
                }
                setTimeout(function() {
                  window.location.replace('/?_rebuild=' + Date.now());
                }, 300);
              }
            });

            // SAFETY: If page is still showing "Loading ORRA..." after 6 seconds,
            // force clear caches and reload once
            setTimeout(function() {
              var bodyText = document.body && document.body.innerText || '';
              if (bodyText.indexOf('Loading ORRA') !== -1 && bodyText.indexOf('Echo') !== -1) {
                console.warn('[ORRA] App stuck on loading screen, force recovering...');
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(reg) { reg.unregister(); });
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) { caches.delete(name); });
                  });
                }
                setTimeout(function() {
                  window.location.replace('/?_rebuild=' + Date.now());
                }, 200);
              }
            }, 6000);
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
