#!/usr/bin/env node
/**
 * ORRA Keepalive Daemon — keeps the server alive and auto-recovers from crashes
 *
 * What this does:
 * 1. Pings /api/health every 5 seconds
 * 2. If the server is down, waits 3s and restarts it
 * 3. Rebuilds the database if it's corrupted
 * 4. Runs npm install + build if the server won't start
 * 5. Backs up the database periodically
 *
 * This is the LAST LINE OF DEFENSE — even if the container freezes,
 * when it thaws this daemon ensures the server comes back up.
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/home/z/my-project';
const HEALTH_URL = 'http://127.0.0.1:3000/api/health';
const PING_INTERVAL = 5000;       // 5 seconds between health checks
const MAX_CONSECUTIVE_FAILS = 3;  // After this many fails, restart server
const DB_BACKUP_INTERVAL = 300000; // 5 minutes between DB backups

let consecutiveFails = 0;
let lastBackupTime = 0;
let isRestarting = false;

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [KEEPALIVE] ${msg}`);
}

function healthCheck() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function restartServer() {
  if (isRestarting) return;
  isRestarting = true;
  
  log('🔧 Server is down — attempting recovery...');
  
  try {
    // Step 1: Kill any existing server processes
    try { execSync('pkill -f "node server.js" 2>/dev/null || true', { timeout: 5000 }); } catch {}
    try { execSync('pkill -f "next start" 2>/dev/null || true', { timeout: 5000 }); } catch {}
    
    // Step 2: Check if database is healthy
    try {
      const dbPath = path.join(PROJECT_DIR, 'db/custom.db');
      if (fs.existsSync(dbPath)) {
        const stat = fs.statSync(dbPath);
        if (stat.size < 1000) {
          log('⚠️ Database file is too small — reseeding...');
          execSync('cd ' + PROJECT_DIR + ' && npx prisma db push --force-reset 2>&1', { timeout: 30000 });
          execSync('cd ' + PROJECT_DIR + ' && npx prisma db seed 2>&1', { timeout: 60000 });
        }
      } else {
        log('⚠️ Database file missing — creating...');
        execSync('cd ' + PROJECT_DIR + ' && npx prisma db push 2>&1', { timeout: 30000 });
        execSync('cd ' + PROJECT_DIR + ' && npx prisma db seed 2>&1', { timeout: 60000 });
      }
    } catch (e) {
      log('⚠️ Database check failed: ' + e.message);
      try {
        execSync('cd ' + PROJECT_DIR + ' && npx prisma db push --force-reset 2>&1', { timeout: 30000 });
        execSync('cd ' + PROJECT_DIR + ' && npx prisma db seed 2>&1', { timeout: 60000 });
      } catch (e2) {
        log('❌ Database recovery failed: ' + e2.message);
      }
    }
    
    // Step 3: Check if build exists
    const buildDir = path.join(PROJECT_DIR, '.next');
    if (!fs.existsSync(buildDir) || !fs.existsSync(path.join(buildDir, 'BUILD_ID'))) {
      log('⚠️ Build missing — rebuilding...');
      try {
        execSync('cd ' + PROJECT_DIR + ' && npm install 2>&1', { timeout: 120000 });
        execSync('cd ' + PROJECT_DIR + ' && npm run build 2>&1', { timeout: 180000 });
      } catch (e) {
        log('❌ Build failed: ' + e.message);
        isRestarting = false;
        return;
      }
    }
    
    // Step 4: Check if node_modules exists
    if (!fs.existsSync(path.join(PROJECT_DIR, 'node_modules'))) {
      log('⚠️ node_modules missing — installing...');
      try {
        execSync('cd ' + PROJECT_DIR + ' && npm install 2>&1', { timeout: 120000 });
      } catch (e) {
        log('❌ npm install failed: ' + e.message);
        isRestarting = false;
        return;
      }
    }
    
    // Step 5: Start the server
    log('🚀 Starting ORRA server...');
    const server = spawn('node', ['server.js'], {
      cwd: PROJECT_DIR,
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3000',
      },
    });
    server.unref();
    
    // Step 6: Wait and verify
    setTimeout(async () => {
      const ok = await healthCheck();
      if (ok) {
        log('✅ Server is back online!');
        consecutiveFails = 0;
      } else {
        log('❌ Server failed to start — will retry next cycle');
      }
      isRestarting = false;
    }, 8000);
    
  } catch (e) {
    log('❌ Recovery error: ' + e.message);
    isRestarting = false;
  }
}

function backupDatabase() {
  try {
    const dbPath = path.join(PROJECT_DIR, 'db/custom.db');
    const backupDir = path.join(PROJECT_DIR, 'db/backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    if (fs.existsSync(dbPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `custom-${timestamp}.db`);
      fs.copyFileSync(dbPath, backupPath);
      
      // Keep only the last 5 backups
      const backups = fs.readdirSync(backupDir).sort();
      while (backups.length > 5) {
        fs.unlinkSync(path.join(backupDir, backups.shift()));
      }
      
      log('💾 Database backed up');
    }
  } catch (e) {
    log('⚠️ Backup failed: ' + e.message);
  }
}

async function main() {
  log('🐾 ORRA Keepalive Daemon started');
  log('   Pinging every ' + (PING_INTERVAL / 1000) + 's');
  log('   Max fails before restart: ' + MAX_CONSECUTIVE_FAILS);
  
  // Initial health check
  const initialOk = await healthCheck();
  if (initialOk) {
    log('✅ Server is already running');
    consecutiveFails = 0;
  } else {
    log('⚠️ Server not running — starting it now');
    restartServer();
  }
  
  // Main keepalive loop
  setInterval(async () => {
    const ok = await healthCheck();
    
    if (ok) {
      if (consecutiveFails > 0) {
        log('✅ Server recovered after ' + consecutiveFails + ' failed checks');
      }
      consecutiveFails = 0;
      
      // Periodic database backup
      const now = Date.now();
      if (now - lastBackupTime > DB_BACKUP_INTERVAL) {
        backupDatabase();
        lastBackupTime = now;
      }
    } else {
      consecutiveFails++;
      log('⚠️ Health check failed (' + consecutiveFails + '/' + MAX_CONSECUTIVE_FAILS + ')');
      
      if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
        log('🔴 Server is DOWN — triggering recovery');
        restartServer();
        consecutiveFails = 0; // Reset to avoid spamming restarts
      }
    }
  }, PING_INTERVAL);
}

main().catch(e => {
  log('Fatal error: ' + e.message);
  process.exit(1);
});
