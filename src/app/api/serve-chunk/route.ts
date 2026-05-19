import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Serve Turbopack static chunks that the standalone server can't find
// This is a workaround for Next.js standalone mode + Turbopack not serving all chunks
export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get('file');

  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  // Check multiple possible locations for the chunk file
  // Standalone mode runs from .next/standalone/, so we need to check various paths
  const possiblePaths = [
    // When running from .next/standalone/ (PM2 cwd is project root)
    path.join(process.cwd(), '.next', 'static', 'chunks', filename),
    // When cwd is .next/standalone/ itself
    path.join(process.cwd(), '.next', 'standalone', '.next', 'static', 'chunks', filename),
    // Project root relative from standalone dir
    path.resolve(process.cwd(), '..', '..', '.next', 'static', 'chunks', filename),
    // Direct standalone static
    path.join(process.cwd(), '.next', 'standalone', '.next', 'static', 'chunks', filename),
    // Try absolute project path
    '/home/z/my-project/.next/static/chunks/' + filename,
    '/home/z/my-project/.next/standalone/.next/static/chunks/' + filename,
  ];

  for (const filePath of possiblePaths) {
    try {
      if (existsSync(filePath)) {
        const data = readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentTypes: Record<string, string> = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.map': 'application/json',
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        return new NextResponse(data, {
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

  // If we can't find it either, return 404
  return NextResponse.json({ error: 'Chunk not found', checked: possiblePaths.filter(p => !p.startsWith('/home')) }, { status: 404 });
}
