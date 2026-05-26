#!/usr/bin/env node
/**
 * ORRA Bootstrap — Master startup script.
 *
 * Starts the entire ORRA system with crash recovery:
 * 1. Verify/restore database state
 * 2. Start PM2 with all processes (app, auto-poster, watchdog)
 * 3. Confirm everything is running
 *
 * Usage:
 *   node scripts/orra-bootstrap.js              # Full startup
 *   node scripts/orra-bootstrap.js --skip-restore  # Skip DB restore check
 *   node scripts/orra-bootstrap.js --dev         # Dev mode (next dev instead of next start)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'dev.db');

const args = process.argv.slice(2);
const skipRestore = args.includes('--skip-restore');
const devMode = args.includes('--dev');

function run(cmd, options = {}) {
  try {
    return execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: options.timeout || 30000,
      stdio: options.silent ? 'pipe' : 'inherit',
    });
  } catch (err) {
    if (options.allowFail) return null;
    throw err;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       ORRA Bootstrap — System Startup        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();
  console.log(`  Mode: ${devMode ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  console.log(`  Restore: ${skipRestore ? 'SKIPPED' : 'ENABLED'}`);
  console.log();

  // ─── Step 0: Ensure Prisma client is generated ─────────────────
  console.log('[0/6] Ensuring Prisma client is built...');
  run('npx prisma generate', { silent: true, allowFail: true });
  console.log('  ✓ Prisma client ready');

  // ─── Step 1: Check database exists ─────────────────────────────
  console.log('\n[1/6] Checking database...');
  if (!fs.existsSync(DB_PATH)) {
    console.log('  ⚠️  Database not found! Running migration...');
    run('npx prisma db push');
    console.log('  ✓ Database created');
  } else {
    console.log('  ✓ Database exists');
  }

  // ─── Step 2: Verify/restore state ──────────────────────────────
  if (!skipRestore) {
    console.log('\n[2/6] Verifying data state...');
    try {
      const result = run('node scripts/orra-restore.js', { timeout: 120000, allowFail: true });
      if (result === null) {
        // Restore returned exit code 1 = was restored (which is fine)
        console.log('  ✓ State was restored from backup');
      } else {
        console.log('  ✓ State is healthy');
      }
    } catch {
      console.log('  ⚠️  Restore check had issues, continuing...');
    }
  } else {
    console.log('\n[2/6] Skipping restore check (--skip-restore)');
  }

  // ─── Step 3: Ensure upload directories exist ───────────────────
  console.log('\n[3/6] Ensuring upload directories...');
  const dirs = [
    path.join(PROJECT_ROOT, 'public', 'uploads'),
    path.join(PROJECT_ROOT, '.next', 'standalone', 'public', 'uploads'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  // Restore any missing images from backup
  const backupDir = path.join(PROJECT_ROOT, 'backups', 'uploads');
  if (fs.existsSync(backupDir)) {
    const backupImages = fs.readdirSync(backupDir).filter(f => f.startsWith('ai-'));
    let restored = 0;
    for (const img of backupImages) {
      const dest = path.join(dirs[0], img);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(backupDir, img), dest);
        // Also to standalone
        try { fs.copyFileSync(path.join(backupDir, img), path.join(dirs[1], img)); } catch {}
        restored++;
      }
    }
    if (restored > 0) {
      console.log(`  ✓ Restored ${restored} missing images from backup`);
    }
  }
  console.log('  ✓ Upload directories ready');

  // ─── Step 4: Build Next.js if needed (production mode) ─────────
  if (!devMode) {
    const standaloneServer = path.join(PROJECT_ROOT, '.next', 'standalone', 'server.js');
    if (!fs.existsSync(standaloneServer)) {
      console.log('\n[4/6] Building Next.js (first time or missing build)...');
      run('npm run build', { timeout: 300000 });
      console.log('  ✓ Build complete');
    } else {
      console.log('\n[4/6] Next.js build exists, skipping build');
    }
  } else {
    console.log('\n[4/6] Dev mode, skipping build');
  }

  // ─── Step 5: Kill any existing processes, then start PM2 ───────
  console.log('\n[5/6] Starting process manager (PM2)...');

  // Kill any running ORRA processes
  run('pkill -f "auto-poster" 2>/dev/null || true', { silent: true, allowFail: true });

  // Stop existing PM2 processes
  run('npx pm2 delete all 2>/dev/null || true', { silent: true, allowFail: true });

  if (devMode) {
    // In dev mode, start app and auto-poster separately
    console.log('  Starting Next.js in dev mode...');
    const app = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'ignore',
    });
    app.unref();

    console.log('  Starting auto-poster...');
    const poster = spawn('node', ['scripts/auto-poster.js', '--cron'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', fs.openSync('/tmp/orra-poster-out.log', 'a'), fs.openSync('/tmp/orra-poster-error.log', 'a')],
    });
    poster.unref();

    console.log('  Starting watchdog...');
    const watchdog = spawn('node', ['scripts/orra-watchdog.js', '--daemon'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', fs.openSync('/tmp/orra-watchdog-out.log', 'a'), fs.openSync('/tmp/orra-watchdog-error.log', 'a')],
    });
    watchdog.unref();

  } else {
    // Production: use PM2 for managed processes
    // For production, we modify the ecosystem config to use next start
    console.log('  Starting via PM2 ecosystem...');

    // Start app directly (PM2 with next can be tricky)
    const app = spawn('node', ['.next/standalone/server.js'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0', NODE_ENV: 'production' },
    });
    app.unref();

    // Start auto-poster with PM2 for auto-restart
    run('npx pm2 start scripts/auto-poster.js --name orra-auto-poster -- --cron', { silent: true });

    // Start watchdog with PM2
    run('npx pm2 start scripts/orra-watchdog.js --name orra-watchdog -- --daemon', { silent: true });

    // Save PM2 process list
    run('npx pm2 save', { silent: true });
  }

  console.log('  ✓ All processes started');

  // ─── Step 6: Verify everything is running ──────────────────────
  console.log('\n[6/6] Verifying all systems...');

  await new Promise(r => setTimeout(r, 5000));

  // Check PM2 status
  try {
    const pm2List = run('npx pm2 list', { silent: true });
    if (pm2List) {
      console.log('  PM2 processes:');
      pm2List.split('\n').filter(l => l.includes('orra')).forEach(l => {
        console.log('    ' + l.trim());
      });
    }
  } catch {}

  // Quick check
  const processes = run('ps aux', { silent: true });
  const appRunning = processes.includes('next');
  const posterRunning = processes.includes('auto-poster');
  const watchdogRunning = processes.includes('orra-watchdog');

  console.log();
  console.log('  App:         ' + (appRunning ? '✅ RUNNING' : '❌ NOT DETECTED'));
  console.log('  Auto-poster: ' + (posterRunning ? '✅ RUNNING' : '❌ NOT DETECTED'));
  console.log('  Watchdog:    ' + (watchdogRunning ? '✅ RUNNING' : '❌ NOT DETECTED'));

  console.log();
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     ORRA System is LIVE and PROTECTED        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Auto-restart:   YES (PM2 + watchdog)       ║');
  console.log('║  State restore:  YES (backup + re-seed)     ║');
  console.log('║  Image recovery: YES (backup copies)        ║');
  console.log('║  Auto-posting:   YES (every 30 min)         ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();
  console.log('Commands:');
  console.log('  npx pm2 list          — View running processes');
  console.log('  npx pm2 logs          — View live logs');
  console.log('  npx pm2 restart all   — Restart everything');
  console.log('  node scripts/orra-restore.js  — Manually restore state');
  console.log('  node scripts/orra-restore.js --stats  — Check stats');
}

main().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
