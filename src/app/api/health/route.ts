import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Lightweight health check endpoint
 *
 * Used by the KeepAliveProvider to:
 * 1. Keep the platform container alive (prevent idle freeze)
 * 2. Detect when the server is down/recovering
 *
 * Returns minimal JSON with a timestamp.
 * The X-Powered-By: Next.js header is added automatically,
 * which the client uses to distinguish real server responses
 * from platform proxy 404s.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    ts: Date.now(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Custom header so client can definitely identify this as a real server response
      'X-ORRA-Health': 'alive',
    },
  });
}
