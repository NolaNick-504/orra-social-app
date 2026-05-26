import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Serve Next.js static files that the standalone server can't find.
// Also serves as a 404-safe endpoint for missing static assets.
// The middleware rewrites /_next/static/* file requests here to prevent
// the catch-all route from returning 200-with-HTML for missing files.
//
// Query params:
//   file=<filename> - The filename (e.g., "webpack-abc123.js")
//   dir=<subpath>   - The subpath under .next/static/ (e.g., "chunks", "css", "orra-BUILDID")
export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get('file');
  const dir = req.nextUrl.searchParams.get('dir') || 'chunks';

  if (!filename) {
    return new NextResponse('Bad Request: file parameter required', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Security: normalize to prevent directory traversal
  const safeFile = path.basename(filename);
  const safeDir = dir.split('/').map(s => path.basename(s)).join('/');

  // Content type mapping
  const ext = path.extname(safeFile).toLowerCase();
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

  // Build the relative path under .next/static/
  const relativePath = path.join(safeDir, safeFile);

  // Check multiple possible locations for the static file.
  // Standalone mode changes the working directory, so we need multiple paths.
  const projectRoot = '/home/z/my-project';
  const possiblePaths = [
    // When cwd is project root
    path.join(process.cwd(), '.next', 'static', relativePath),
    // When running from .next/standalone/ (cwd could be standalone dir)
    path.resolve(process.cwd(), '..', '..', '.next', 'static', relativePath),
    // Direct absolute path
    path.join(projectRoot, '.next', 'static', relativePath),
    // Standalone server static directory
    path.join(projectRoot, '.next', 'standalone', '.next', 'static', relativePath),
  ];

  for (const fp of possiblePaths) {
    try {
      if (existsSync(fp)) {
        const stat = statSync(fp);
        // Only serve files, not directories
        if (!stat.isFile()) continue;

        const data = readFileSync(fp);
        const contentType = contentTypes[ext] || 'application/octet-stream';

        return new NextResponse(data, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
    } catch {
      continue;
    }
  }

  // File not found — return proper 404 (NOT 200-with-HTML)
  // This is critical: the catch-all route would return HTML for this path,
  // which would break the service worker and cause 404-on-refresh bugs.
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store',
    },
  });
}
