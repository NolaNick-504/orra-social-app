import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Serves files from public/uploads/ with full HTTP Range request support.
 * This is required for video playback — browsers send Range headers to
 * stream and seek within video files, and expect 206 Partial Content responses.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const filename = slug.join('/');

    // Security: prevent path traversal
    if (!filename || filename.includes('..') || filename.startsWith('/') || filename.startsWith('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Find the file in upload directories
    let resolvedPath: string | null = null;

    for (const dir of PUBLIC_DIRS) {
      const candidate = path.join(dir, 'uploads', filename);
      if (existsSync(candidate)) {
        resolvedPath = candidate;
        break;
      }
    }

    if (!resolvedPath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileStat = statSync(resolvedPath);

    // Don't serve files larger than 100MB
    if (fileStat.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileSize = fileStat.size;

    // Parse Range header for video streaming support
    const rangeHeader = req.headers.get('range');

    if (rangeHeader) {
      // Parse "bytes=start-end" format
      const rangeMatch = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (!rangeMatch) {
        return NextResponse.json({ error: 'Invalid range' }, { status: 416 });
      }

      let start = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : 0;
      let end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;

      // Clamp values
      if (start >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      end = Math.min(end, fileSize - 1);
      const chunkSize = end - start + 1;

      // Create a read stream for the requested range
      const fileStream = createReadStream(resolvedPath, { start, end });
      const readable = Readable.toWeb(fileStream) as ReadableStream;

      return new NextResponse(readable, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': String(chunkSize),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // No Range header — serve the full file (for images, small files, etc.)
    // Use streaming to avoid loading large files into memory
    const fileStream = createReadStream(resolvedPath);
    const readable = Readable.toWeb(fileStream) as ReadableStream;

    return new NextResponse(readable, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Serve file error:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
