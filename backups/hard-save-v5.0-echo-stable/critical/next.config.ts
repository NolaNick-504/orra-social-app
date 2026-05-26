import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Increase API body size limit for file uploads (images up to 10MB, videos up to 50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Set headers to prevent aggressive caching (ensures fresh content after deploys)
  async headers() {
    return [
      // All HTML pages must never cache — this is the key to "changes show up first try"
      // Without this, browsers cache the old HTML which references old JS chunk hashes
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      // JS/CSS chunks with content hashes CAN be cached long-term
      // (they get new filenames when code changes, so stale cache is impossible)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Allow images to cache but revalidate frequently
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
    ];
  },
  // Rewrite /uploads/ and /images/ requests to the API route that serves files
  // This is needed because Next.js standalone mode doesn't serve files from public/
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
    ];
  },
};

export default nextConfig;
