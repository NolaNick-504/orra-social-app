import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';

// Auto-deploy endpoint — triggers safe-deploy.sh (stops server, builds, restarts)
// Manual trigger: visit /api/admin/deploy?key=orra504
// GitHub webhook: POST to /api/admin/deploy?key=orra504
// Status check: GET /api/admin/deploy?key=orra504&status=1

const DEPLOY_KEY = 'orra504';
const DEPLOY_LOCK = '/tmp/orra-deploying.lock';
const DEPLOY_LOG = '/home/ubuntu/orra/deploy-log.txt';

// Check if a deploy is already in progress
function isDeploying(): boolean {
  if (!fs.existsSync(DEPLOY_LOCK)) return false;
  try {
    const lockTime = parseInt(fs.readFileSync(DEPLOY_LOCK, 'utf8').trim());
    // Lock expires after 10 minutes (safety)
    if (Date.now() - lockTime > 10 * 60 * 1000) {
      fs.unlinkSync(DEPLOY_LOCK);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== DEPLOY_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  // Status check mode
  if (request.nextUrl.searchParams.get('status') === '1') {
    const deploying = isDeploying();
    let log = '';
    try { log = fs.readFileSync(DEPLOY_LOG, 'utf8'); } catch {}
    return NextResponse.json({ deploying, log: log.slice(-500) });
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

  if (isDeploying()) {
    return NextResponse.json({ success: false, message: 'Deploy already in progress. Try again later.' });
  }

  // Start deploy in background
  triggerDeploy().catch(err => console.error('Deploy error:', err));
  return NextResponse.json({ success: true, message: 'Deploy started! Server will be down for ~2 min during build. Check status: /api/admin/deploy?key=orra504&status=1' });
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== DEPLOY_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  // Status check mode
  if (request.nextUrl.searchParams.get('status') === '1') {
    const deploying = isDeploying();
    let log = '';
    try { log = fs.readFileSync(DEPLOY_LOG, 'utf8'); } catch {}
    return NextResponse.json({ deploying, log: log.slice(-500) });
  }

  if (isDeploying()) {
    return NextResponse.json({ success: false, message: 'Deploy already in progress. Try again later.' });
  }

  // Start deploy in background
  triggerDeploy().catch(err => console.error('Deploy error:', err));
  return NextResponse.json({ success: true, message: 'Deploy started! Server will be down for ~2 min during build. Check status: /api/admin/deploy?key=orra504&status=1' });
}

async function triggerDeploy() {
  // Create lock file
  fs.writeFileSync(DEPLOY_LOCK, Date.now().toString());

  try {
    console.log('[DEPLOY] Starting safe deploy at', new Date().toISOString());

    // Use nohup + bash to run the deploy script completely detached from this process.
    // This ensures the deploy continues even if this request's connection drops.
    // The script stops PM2 first (freeing memory), then builds, then restarts.
    const scriptPath = '/home/ubuntu/orra/aws/safe-deploy.sh';

    // Make sure script is executable
    exec(`chmod +x ${scriptPath}`, () => {
      // Run detached with nohup — build happens AFTER server stops
      exec(`nohup bash ${scriptPath} > /home/ubuntu/orra/deploy-output.txt 2>&1 &`, (err) => {
        if (err) {
          console.error('[DEPLOY] Failed to start deploy script:', err.message);
          try { fs.unlinkSync(DEPLOY_LOCK); } catch {}
        }
      });
    });
  } catch (err: any) {
    console.error('[DEPLOY] Error:', err.message);
    try { fs.unlinkSync(DEPLOY_LOCK); } catch {}
  }
}
