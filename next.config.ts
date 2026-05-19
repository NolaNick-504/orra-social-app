import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // Disabled - standalone mode breaks "next start", causing JS chunk 500 errors
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
  // Set headers to prevent caching of HTML pages (ensures fresh JS chunks after deploys)
  async headers() {
    return [
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
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
      {
        source: '/videos/:path*',
        destination: '/api/uploads?path=videos/:path*',
      },
    ];
  },
};

export default nextConfig;
