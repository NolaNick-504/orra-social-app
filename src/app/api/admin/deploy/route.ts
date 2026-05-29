import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { clearAllRateLimits } from '@/lib/rate-limit';

const execAsync = promisify(exec);

// Auto-deploy endpoint — triggers git pull + rebuild + restart
// Manual trigger: visit /api/admin/deploy?key=orra504
// GitHub webhook: POST to /api/admin/deploy?key=orra504

const DEPLOY_KEY = 'orra504';

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== DEPLOY_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  // Verify this is from GitHub (push to main)
  try {
    const body = await request.json();
    const ref = body?.ref || '';
    if (!ref.includes('main')) {
      return NextResponse.json({ success: true, message: 'Not main branch, skipping' });
    }
  } catch {
    // If can't parse body, still allow deploy (manual trigger via POST)
  }

  deployAsync().catch(err => console.error('Deploy error:', err));
  return NextResponse.json({ success: true, message: 'Deploy started!' });
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== DEPLOY_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  deployAsync().catch(err => console.error('Deploy error:', err));
  return NextResponse.json({ success: true, message: 'Deploy started! Takes 2-3 min.' });
}

async function deployAsync() {
  console.log('[DEPLOY] Starting at', new Date().toISOString());
  try {
    console.log('[DEPLOY] Pulling code...');
    await execAsync('cd /home/ubuntu/orra && git fetch origin && git reset --hard origin/main');
    
    console.log('[DEPLOY] Installing...');
    await execAsync('cd /home/ubuntu/orra && npm install --production=false 2>&1 | tail -1');
    
    console.log('[DEPLOY] Building...');
    await execAsync('cd /home/ubuntu/orra && rm -rf .next && npm run build 2>&1 | tail -5');
    
    clearAllRateLimits();
    
    console.log('[DEPLOY] Restarting...');
    await execAsync('pm2 restart orra-server');
    
    console.log('[DEPLOY] Complete at', new Date().toISOString());
  } catch (err: any) {
    console.error('[DEPLOY] Error:', err.message);
  }
}
