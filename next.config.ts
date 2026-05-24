import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        // No-cache for HTML pages only — ensures fresh HTML on every visit
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
      {
        // Static chunks have content-hash filenames — safe to cache forever
        // This is critical for performance: without caching, browsers re-download
        // ALL JavaScript on every page load, causing 5+ second white screens
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
