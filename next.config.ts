import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: output:'standalone' is NOT compatible with our custom server.js
  // (which uses next({ dev: false }) — "next start" doesn't work in standalone mode).
  // To use standalone mode, we'd need to rewrite server.js to use .next/standalone/server.js
  // and move chunk handling to Next.js middleware. Keeping this disabled for now.
  // output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Use a FIXED build ID — never changes between deploys.
  // Next.js chunk filenames already include content hashes, so caching is safe.
  // A changing BUILD_ID causes stale chunk mismatches and 404s after deploys.
  generateBuildId: async () => 'orra-v2-stable',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async headers() {
    return [
      {
        // Service Worker — MUST never be cached, browsers must always revalidate
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Join/test page — no-cache so testers always get the latest
        source: '/join.html',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // Clear-cache page — also no-cache
        source: '/clear-cache.html',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // HTML pages — no-cache to ensure fresh HTML on every visit
        // NOTE: Do NOT use Clear-Site-Data here — it clears ALL HTTP cache
        // including static JS chunks, which causes React hydration failures.
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
      {
        // Static chunks have content-hash filenames — safe to cache forever
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // NOTE: Removed /sw.js → /api/sw rewrite.
      // The rewrite was replacing the useful v8 SW (public/sw.js) with a
      // self-destruct SW that cleared all caches and unregistered itself.
      // This caused loading screen freezes because:
      // 1. Cached JS chunks were nuked on every SW update
      // 2. No SW was active to show reconnect page during cold starts
      // 3. The 15s watchdog triggered redirect loops via clear-cache.html
      // The v8 SW in public/sw.js is now served directly, and the headers()
      // config above ensures it gets no-cache headers.
      {
        source: '/uploads/:path*',
        destination: '/api/uploads?file=:path*',
      },
      {
        source: '/images/:path*',
        destination: '/api/uploads?path=images/:path*',
      },
      {
        source: '/videos/:path*',
        destination: '/api/uploads?path=videos/:path*',
      },
    ];
  },
};

export default nextConfig;
