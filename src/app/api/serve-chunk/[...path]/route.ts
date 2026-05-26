import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat, access } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// In-memory LRU cache for static files — avoids hitting disk on every request.
// Chunks have content-hash filenames so cached entries are always valid.
const fileCache = new Map<string, { data: Buffer; contentType: string }>();
const MAX_CACHE_SIZE = 200; // Cache up to 200 files

// Serve Next.js static files that the standalone server can't find.
// Also serves as a 404-safe endpoint for missing static assets.
// The middleware rewrites /_next/static/* file requests here to prevent
// the catch-all route from returning 200-with-HTML for missing files.
//
// Path pattern: /api/serve-chunk/<subpath>/<filename>
// e.g., /api/serve-chunk/chunks/webpack-abc123.js
// e.g., /api/serve-chunk/css/style.css
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathParts } = await params;

  if (!pathParts || pathParts.length === 0) {
    return new NextResponse('Bad Request: path required', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Security: normalize each path segment to prevent directory traversal
  const safeParts = pathParts.map(segment => path.basename(segment));
  const relativePath = safeParts.join('/');
  const cacheKey = relativePath;

  // Check in-memory cache first
  const cached = fileCache.get(cacheKey);
  if (cached) {
    return new NextResponse(cached.data, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Content type mapping
  const ext = path.extname(safeParts[safeParts.length - 1]).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.map': 'application/json',
    '.wasm': 'application/wasm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
  };

  // Build possible paths under .next/static/
  const projectRoot = '/home/z/my-project';
  const possiblePaths = [
    path.join(process.cwd(), '.next', 'static', relativePath),
    path.resolve(process.cwd(), '..', '..', '.next', 'static', relativePath),
    path.join(projectRoot, '.next', 'static', relativePath),
    path.join(projectRoot, '.next', 'standalone', '.next', 'static', relativePath),
  ];

  for (const fp of possiblePaths) {
    try {
      await access(fp);
      const s = await stat(fp);
      if (!s.isFile()) continue;

      const data = await readFile(fp);
      const contentType = contentTypes[ext] || 'application/octet-stream';

      // Cache the file for future requests (evict oldest if cache is full)
      if (fileCache.size >= MAX_CACHE_SIZE) {
        const firstKey = fileCache.keys().next().value;
        if (firstKey) fileCache.delete(firstKey);
      }
      fileCache.set(cacheKey, { data, contentType });

      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      continue;
    }
  }

  // File not found — return proper 404 (NOT 200-with-HTML)
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store',
    },
  });
}
