import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone mode: creates a minimal server bundle in .next/standalone/
  // that only includes necessary dependencies (not the full node_modules).
  // This speeds up cold starts on FC dramatically.
  output: 'standalone',
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
      {
        // Serve sw.js via API route so we can control Cache-Control headers
        // Static files in public/ get aggressive caching we can't override
        source: '/sw.js',
        destination: '/api/sw',
      },
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
