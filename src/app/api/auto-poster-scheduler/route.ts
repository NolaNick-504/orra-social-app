import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.NEXTAUTH_SECRET || 'orra-super-secret-key-2025-production';

// Singleton scheduler state — persists as long as the Next.js server is running
let schedulerRunning = false;
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastRunTime = 0;
let runCount = 0;
let lastRunLog = '';

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

async function runAutoPoster() {
  try {
    // Use string concatenation to prevent Turbopack from trying to resolve this at build time
    const scriptPath = [process.cwd(), 'scripts', 'auto-poster.js'].join('/');

    return new Promise<void>((resolve) => {
      const nodeCmd = 'node';
      const proc = spawn(nodeCmd, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Timeout after 2 minutes
      const timeout = setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch {}
        resolve();
      }, 120000);

      proc.on('close', (code: number) => {
        clearTimeout(timeout);
        const log = stdout + stderr;
        lastRunLog = log.slice(-500);
        lastRunTime = Date.now();
        runCount++;
        console.log(`[auto-poster-scheduler] Run #${runCount} completed (code=${code}) at ${new Date().toISOString()}`);
        resolve();
      });

      proc.on('error', (err: Error) => {
        clearTimeout(timeout);
        console.error(`[auto-poster-scheduler] Spawn error: ${err.message}`);
        lastRunLog = `Spawn error: ${err.message}`;
        lastRunTime = Date.now();
        resolve();
      });
    });
  } catch (err: any) {
    console.error(`[auto-poster-scheduler] Error: ${err.message}`);
    lastRunLog = `Error: ${err.message}`;
    lastRunTime = Date.now();
  }
}

function startScheduler() {
  if (schedulerRunning) return;

  schedulerRunning = true;
  console.log(`[auto-poster-scheduler] Starting scheduler (every ${INTERVAL_MS / 1000}s)`);

  // Run immediately on start
  runAutoPoster();

  // Then schedule periodic runs
  schedulerInterval = setInterval(() => {
    runAutoPoster();
  }, INTERVAL_MS);
}

// GET — Start scheduler or check status
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get('action');

  if (action === 'start') {
    startScheduler();
    return NextResponse.json({
      success: true,
      message: 'Scheduler started',
      running: schedulerRunning,
      intervalMs: INTERVAL_MS,
      runCount,
      lastRunTime: lastRunTime ? new Date(lastRunTime).toISOString() : null,
    });
  }

  if (action === 'stop') {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
    schedulerRunning = false;
    return NextResponse.json({
      success: true,
      message: 'Scheduler stopped',
      running: false,
    });
  }

  if (action === 'run') {
    // Trigger a single run immediately (non-blocking)
    runAutoPoster();
    return NextResponse.json({
      success: true,
      message: 'Single run triggered',
      runCount,
    });
  }

  // Default: status check
  return NextResponse.json({
    running: schedulerRunning,
    intervalMs: INTERVAL_MS,
    runCount,
    lastRunTime: lastRunTime ? new Date(lastRunTime).toISOString() : null,
    lastRunLog: lastRunLog.slice(-200),
  });
}
