#!/usr/bin/env node
/**
 * ORRA Watchdog — Keeps the app alive, monitors health, auto-recovers.
 *
 * What it does:
 * 1. Checks if Next.js app is responding on port 3000
 * 2. Checks if auto-poster process is running
 * 3. Checks database has expected minimum data
 * 4. Checks AI images exist in uploads directory
 * 5. Auto-recovers anything that's broken
 * 6. Takes periodic backups
 *
 * Usage:
 *   node scripts/orra-watchdog.js              # Run once
 *   node scripts/orra-watchdog.js --daemon     # Run continuously (check every 5 min)
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_URL = process.env.ORRA_URL || 'http://localhost:3000';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BACKUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// ─── Health Checks ──────────────────────────────────────────────────

function checkAppResponding() {
  return new Promise((resolve) => {
    const req = http.get(`${APP_URL}/api/health`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404); // 404 means app is up, just no /health endpoint
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
  });
}

function checkAutoPosterRunning() {
  try {
    const output = execSync('ps aux', { encoding: 'utf-8' });
    return output.includes('auto-poster') && output.includes('--cron');
  } catch {
    return false;
  }
}

async function checkDatabaseHealth() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    try {
      const [users, posts, comments] = await Promise.all([
        db.user.count(),
        db.post.count(),
        db.comment.count(),
      ]);
      return { healthy: users >= 16 && posts >= 80 && comments >= 200, users, posts, comments };
    } finally {
      await db.$disconnect();
    }
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

function checkImagesExist() {
  const uploadDir = path.join(PROJECT_ROOT, 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) return { healthy: false, count: 0 };
  const aiImages = fs.readdirSync(uploadDir).filter(f => f.startsWith('ai-'));
  return { healthy: aiImages.length >= 30, count: aiImages.length };
}

// ─── Recovery Actions ──────────────────────────────────────────────

function restartApp() {
  console.log('[watchdog] Restarting Next.js app...');
  try {
    // Kill existing Next.js processes
    execSync('pkill -f "next start" 2>/dev/null || true');
    execSync('pkill -f "next dev" 2>/dev/null || true');
    execSync('sleep 2');

    // Start the app
    const isProduction = fs.existsSync(path.join(PROJECT_ROOT, '.next', 'standalone', 'server.js'));

    if (isProduction) {
      spawn('node', ['.next/standalone/server.js'], {
        cwd: PROJECT_ROOT,
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' },
      }).unref();
      console.log('[watchdog] Started Next.js in production mode');
    } else {
      spawn('npx', ['next', 'dev', '-p', '3000'], {
        cwd: PROJECT_ROOT,
        detached: true,
        stdio: 'ignore',
      }).unref();
      console.log('[watchdog] Started Next.js in dev mode');
    }
    return true;
  } catch (err) {
    console.error(`[watchdog] Failed to restart app: ${err.message}`);
    return false;
  }
}

function startAutoPoster() {
  console.log('[watchdog] Starting auto-poster...');
  try {
    const logFile = '/tmp/orra-auto-poster.log';
    const child = spawn('node', ['scripts/auto-poster.js', '--cron'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')],
    });
    child.unref();
    console.log('[watchdog] Auto-poster started');
    return true;
  } catch (err) {
    console.error(`[watchdog] Failed to start auto-poster: ${err.message}`);
    return false;
  }
}

async function restoreState() {
  console.log('[watchdog] Running state restore...');
  try {
    execSync('node scripts/orra-restore.js', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      timeout: 300000,
    });
    return true;
  } catch (err) {
    // Exit code 1 means it was restored (which is fine)
    if (err.status === 1) return true;
    console.error(`[watchdog] Restore failed: ${err.message}`);
    return false;
  }
}

function takeBackup() {
  console.log('[watchdog] Taking backup...');
  try {
    execSync('node -e "' +
      'const fs=require(\"fs\"),path=require(\"path\");' +
      'const BD=path.join(\"' + PROJECT_ROOT + '\",\"backups\",\"db\");' +
      'const UB=path.join(\"' + PROJECT_ROOT + '\",\"backups\",\"uploads\");' +
      'if(!fs.existsSync(BD))fs.mkdirSync(BD,{recursive:true});' +
      'if(!fs.existsSync(UB))fs.mkdirSync(UB,{recursive:true});' +
      'const ts=new Date().toISOString().replace(/[:.]/g,\"-\").substring(0,19);' +
      'fs.copyFileSync(path.join(\"' + PROJECT_ROOT + '\",\"prisma\",\"dev.db\"),path.join(BD,\"orra-snapshot-\"+ts+\".db\"));' +
      'const imgs=fs.readdirSync(path.join(\"' + PROJECT_ROOT + '\",\"public\",\"uploads\")).filter(f=>f.startsWith(\"ai-\"));' +
      'let c=0;for(const i of imgs){const s=path.join(\"' + PROJECT_ROOT + '\",\"public\",\"uploads\",i),d=path.join(UB,i);if(!fs.existsSync(d)){fs.copyFileSync(s,d);c++;}}' +
      'const bks=fs.readdirSync(BD).filter(f=>f.startsWith(\"orra-snapshot-\")&&f.endsWith(\".db\")).sort();' +
      'for(let i=0;i<bks.length-5;i++){try{fs.unlinkSync(path.join(BD,bks[i]));}catch{}}' +
      'console.log(\"Backup done:\"+imgs.length+\" images,\"+c+\" new backed up\");' +
    '"', {
      cwd: PROJECT_ROOT,
      timeout: 30000,
    });
    return true;
  } catch (err) {
    console.error(`[watchdog] Backup failed: ${err.message}`);
    return false;
  }
}

// ─── Main Watchdog Loop ─────────────────────────────────────────────

async function runChecks() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] Running health checks...`);

  const results = {
    app: false,
    autoPoster: false,
    database: false,
    images: false,
  };

  // Check 1: App responding
  results.app = await checkAppResponding();
  console.log(`  App:       ${results.app ? '✅ UP' : '❌ DOWN'}`);

  // Check 2: Auto-poster running
  results.autoPoster = checkAutoPosterRunning();
  console.log(`  Auto-post: ${results.autoPoster ? '✅ RUNNING' : '❌ STOPPED'}`);

  // Check 3: Database health
  const dbCheck = await checkDatabaseHealth();
  results.database = dbCheck.healthy;
  console.log(`  Database:  ${dbCheck.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'} ${dbCheck.users ? `(${dbCheck.users}u/${dbCheck.posts}p/${dbCheck.comments}c)` : dbCheck.error || ''}`);

  // Check 4: Images exist
  const imgCheck = checkImagesExist();
  results.images = imgCheck.healthy;
  console.log(`  Images:    ${imgCheck.healthy ? '✅ OK' : '⚠️ LOW'} (${imgCheck.count} AI images)`);

  // Recovery actions
  const allHealthy = results.app && results.autoPoster && results.database && results.images;

  if (allHealthy) {
    console.log('  → All systems healthy ✓');
    return true;
  }

  console.log('  → Issues detected, initiating recovery...');

  // Fix app
  if (!results.app) {
    console.log('  [RECOVER] Restarting Next.js app...');
    restartApp();
    // Wait for app to come up
    await new Promise(r => setTimeout(r, 10000));
    const appUp = await checkAppResponding();
    console.log(`  [RECOVER] App: ${appUp ? '✅ BACK UP' : '❌ STILL DOWN'}`);
  }

  // Fix auto-poster
  if (!results.autoPoster) {
    console.log('  [RECOVER] Starting auto-poster...');
    startAutoPoster();
    await new Promise(r => setTimeout(r, 3000));
    const posterUp = checkAutoPosterRunning();
    console.log(`  [RECOVER] Auto-poster: ${posterUp ? '✅ RUNNING' : '❌ FAILED TO START'}`);
  }

  // Fix database
  if (!results.database) {
    console.log('  [RECOVER] Restoring database state...');
    await restoreState();
    const dbRecheck = await checkDatabaseHealth();
    console.log(`  [RECOVER] Database: ${dbRecheck.healthy ? '✅ RESTORED' : '❌ COULD NOT RESTORE'}`);
  }

  // Fix images
  if (!results.images) {
    console.log('  [RECOVER] Restoring images from backup...');
    try {
      execSync('node scripts/orra-restore.js', {
        cwd: PROJECT_ROOT,
        timeout: 120000,
      });
    } catch {}
    const imgRecheck = checkImagesExist();
    console.log(`  [RECOVER] Images: ${imgRecheck.healthy ? '✅ RESTORED' : '⚠️ LOW'} (${imgRecheck.count})`);
  }

  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const daemon = args.includes('--daemon');

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║          ORRA Watchdog v1.0                  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  App URL: ${APP_URL}`);
  console.log(`  Mode: ${daemon ? 'DAEMON (continuous)' : 'ONCE'}`);
  console.log(`  Check interval: ${CHECK_INTERVAL / 1000}s`);
  console.log();

  // Run checks immediately
  await runChecks();

  if (!daemon) {
    process.exit(0);
  }

  // Continuous monitoring
  let lastBackup = Date.now();

  setInterval(async () => {
    try {
      await runChecks();

      // Periodic backup
      if (Date.now() - lastBackup >= BACKUP_INTERVAL) {
        takeBackup();
        lastBackup = Date.now();
      }
    } catch (err) {
      console.error(`[watchdog] Check failed: ${err.message}`);
    }
  }, CHECK_INTERVAL);

  console.log(`\n[watchdog] Next check in ${CHECK_INTERVAL / 1000}s. Process alive.`);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[watchdog] Shutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\n[watchdog] Shutting down...');
  process.exit(0);
});

main().catch(err => {
  console.error('[watchdog] Fatal:', err);
  process.exit(1);
});
