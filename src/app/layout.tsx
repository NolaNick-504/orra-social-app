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
            // This runs BEFORE React hydrates, so it will clean up any old SW
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(regs) {
                for (var i = 0; i < regs.length; i++) {
                  regs[i].unregister();
                }
              }).catch(function() {});
              // Do NOT register any new SW
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
                // If currentUserId is user-me (deleted account), clear it
                if (p && p.state && p.state.currentUserId === 'user-me') {
                  localStorage.removeItem('aura-storage');
                }
              }
            } catch(e) {
              // Corrupted localStorage — remove it
              try { localStorage.removeItem('aura-storage'); } catch(x) {}
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
