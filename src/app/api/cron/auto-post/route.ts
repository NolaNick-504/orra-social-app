import { NextRequest, NextResponse } from 'next/server';
import { execFileSync } from 'child_process';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.NEXTAUTH_SECRET || 'orra-super-secret-key-2025-production';

export async function POST(req: NextRequest) {
  // Verify API key
  const key = req.headers.get('x-autopost-key');
  if (key !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Use string concatenation to prevent Turbopack from resolving at build time
    const scriptPath = [process.cwd(), 'scripts', 'auto-poster.js'].join('/');
    const output = execFileSync('node', [scriptPath], {
      timeout: 120000, // 2 min timeout
      maxBuffer: 1024 * 1024,
      cwd: process.cwd(),
      env: { ...process.env },
    });

    const log = output.toString();
    console.log('[cron/auto-post] Output:', log.slice(-500));

    return NextResponse.json({
      success: true,
      log: log.slice(-500),
    });
  } catch (err: any) {
    console.error('[cron/auto-post] Error:', err.message);
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Health check / manual trigger
  const key = req.headers.get('x-autopost-key') || req.nextUrl.searchParams.get('key');
  if (key !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scriptPath = [process.cwd(), 'scripts', 'auto-poster.js'].join('/');
    const output = execFileSync('node', [scriptPath], {
      timeout: 120000,
      maxBuffer: 1024 * 1024,
      cwd: process.cwd(),
      env: { ...process.env },
    });

    const log = output.toString();

    return NextResponse.json({
      success: true,
      log: log.slice(-500),
    });
  } catch (err: any) {
    console.error('[cron/auto-post] Error:', err.message);
    return NextResponse.json({
      success: false,
      error: err.message,
      stderr: err.stderr?.toString().slice(-500),
    }, { status: 500 });
  }
}
