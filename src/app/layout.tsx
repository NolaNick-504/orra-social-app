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
        {/* Minimal bootstrap script — runs BEFORE React hydrates.
            Only does what MUST happen before React mounts:
            1. Register service worker (for cold-start resilience)
            2. Clean up stale cache storage
            3. Clean up stale localStorage
            4. Loading screen watchdog (15s timeout)

            REMOVED from previous version (they were causing the death spiral):
            - Duplicate keep-alive system (KeepAliveProvider handles this now)
            - Global fetch monkey-patch (was intercepting ALL fetches and showing
              "Waking Up ORRA" overlay on any transient error, conflicting with
              KeepAliveProvider's own error handling)
            - Aggressive chunk error reload (was reloading the page on any chunk
              load failure instead of letting the retry logic in page.tsx handle it)

            The old script had THREE overlapping error/recovery systems:
            1. This inline script's fetch monkey-patch + sandbox overlay
            2. KeepAliveProvider's health check + reconnect overlay
            3. Service worker's reconnect page
            They fought each other and caused the "Loading ORRA..." freeze.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // 1. Register service worker for cold-start resilience
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
                console.log('ORRA: Service Worker registered');
                reg.update();
              }).catch(function(err) {
                console.warn('ORRA: SW registration failed (non-critical):', err.message);
              });
            }

            // 2. Clean up OLD Cache Storage from previous SW versions
            //    The current SW uses v8 caches. Delete anything older.
            if ('caches' in window) {
              caches.keys().then(function(names) {
                for (var i = 0; i < names.length; i++) {
                  // Keep v8 and v9+ caches. Delete v1-v7 and unversioned caches.
                  var ver = names[i].match(/v(\\d+)/);
                  if (ver && parseInt(ver[1]) < 8) {
                    caches.delete(names[i]);
                  }
                }
              }).catch(function() {});
            }

            // 3. Clean up stale aura-storage
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

            // REMOVED: 15-second loading screen watchdog.
            // This was redirecting to /clear-cache.html which nukes ALL data,
            // then redirects to /join.html → / which re-triggers the same loading
            // screen → infinite redirect loop. The KeepAliveProvider and SW
            // reconnect page handle recovery properly now.
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
