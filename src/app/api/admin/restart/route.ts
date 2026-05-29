import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { clearAllRateLimits } from '@/lib/rate-limit';

const execAsync = promisify(exec);

// Quick restart endpoint — just restarts PM2 without rebuilding
// Use this when the server is acting up but code hasn't changed
// Visit: /api/admin/restart?key=orra504

const RESTART_KEY = 'orra504';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== RESTART_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  try {
    clearAllRateLimits();
    await execAsync('pm2 restart orra-server');
    return NextResponse.json({ success: true, message: 'Server restarted! Rate limits cleared.' });
  } catch (err: any) {
    // If PM2 process doesn't exist, try starting it
    try {
      await execAsync('cd /home/ubuntu/orra && pm2 start server.js --name orra-server && pm2 save');
      return NextResponse.json({ success: true, message: 'Server started! (was not running)' });
    } catch (startErr: any) {
      return NextResponse.json({ success: false, error: startErr.message }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
