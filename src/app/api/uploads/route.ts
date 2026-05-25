import { NextRequest, NextResponse } from 'next/server';
import { stat, createReadStream } from 'fs';
import { existsSync, statSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Resolve public directories: standalone mode runs from .next/standalone/
// so we check both the CWD and the project root (two levels up from standalone)
const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public'),
  path.resolve(process.cwd(), '..', '..', 'public'),
];

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

// Serve files from public/ directory via query parameter:
// - /api/uploads?file=filename.ext (for /uploads/ files)
// - /api/uploads?path=images/avatars/jess-avatar.jpg (for /images/ files)
export async function GET(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get('file');
    const filePath = req.nextUrl.searchParams.get('path');

    if (!filename && !filePath) {
      return NextResponse.json({ error: 'File or path parameter required' }, { status: 400 });
    }

    let resolvedPath: string | null = null;

    if (filePath) {
      // Serve any file from public/ by relative path (e.g., images/avatars/jess.jpg)
      const normalized = path.normalize(filePath);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }

      for (const dir of PUBLIC_DIRS) {
        const candidate = path.join(dir, normalized);
        if (existsSync(candidate)) {
          resolvedPath = candidate;
          break;
        }
      }
    } else if (filename) {
      // Serve file from uploads/ directory (backward compatible)
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
      }

      for (const dir of PUBLIC_DIRS) {
        const candidate = path.join(dir, 'uploads', filename);
        if (existsSync(candidate)) {
          resolvedPath = candidate;
          break;
        }
      }
    }

    if (!resolvedPath || !existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileStat = statSync(resolvedPath);

    // Don't serve files larger than 20MB — stream instead of loading into RAM
    if (fileStat.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Stream the file instead of loading it all into memory
    const stream = createReadStream(resolvedPath);
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('Serve file error:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
