import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

// Quick restart endpoint — just restarts PM2 without rebuilding
// Use this when the server is acting up but code hasn't changed
// Visit: /api/admin/restart?key=orra504

const RESTART_KEY = 'orra504';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== RESTART_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  // Use nohup to run PM2 restart detached from this process
  // PM2 restart kills the current process (including this API route),
  // so if we await it, we get an error. Running detached avoids this.
  exec('nohup bash -c "sleep 1 && pm2 restart orra-server 2>/dev/null || (cd /home/ubuntu/orra && pm2 start server.js --name orra-server && pm2 save)" > /dev/null 2>&1 &');

  return NextResponse.json({ 
    success: true, 
    message: 'Server restarting in 1 second. Rate limits will be cleared.' 
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
