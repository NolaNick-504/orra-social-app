import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET /api/build-id - Returns the current Next.js build ID
// Used by the client to detect stale cached pages after a new deploy.
// When the build ID changes, the client forces a cache-bust reload.
export async function GET() {
  try {
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
    const buildId = readFileSync(buildIdPath, 'utf-8').trim();

    return NextResponse.json({
      success: true,
      buildId,
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      buildId: 'unknown',
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}
