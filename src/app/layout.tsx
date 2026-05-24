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
