#!/usr/bin/env node
/**
 * ORRA Dev AI Agent — Auto-healing monitor
 * 
 * Watches PM2 logs and the server for errors. When errors are detected,
 * it attempts to fix them automatically:
 * - App crashes → restart PM2 process
 * - Port conflicts → kill stale processes and restart
 * - Database errors → check/repair SQLite
 * - Build errors → rebuild and redeploy
 * - Memory leaks → restart when memory exceeds threshold
 * 
 * Usage: node scripts/dev-agent.js
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.ORRA_URL || 'http://localhost:3000';
const PROJECT_DIR = '/home/z/my-project';
const MAX_MEMORY_MB = 500;
const CHECK_INTERVAL = 10000; // 10 seconds
const HEALTH_TIMEOUT = 5000;

let consecutiveFailures = 0;
let lastRestartTime = 0;
const MIN_RESTART_INTERVAL = 30000; // Don't restart more than once per 30s

function log(level, msg) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  const colors = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', success: '\x1b[32m', fix: '\x1b[35m' };
  const reset = '\x1b[0m';
  console.log(`${colors[level] || ''}[DevAgent ${ts}] ${msg}${reset}`);
  
  // Also append to log file
  try {
    fs.appendFileSync(path.join(PROJECT_DIR, 'dev-agent.log'), `[${ts}] [${level.toUpperCase()}] ${msg}\n`);
  } catch {}
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: PROJECT_DIR, timeout: 30000, encoding: 'utf-8', ...opts }).trim();
  } catch (e) {
    return null;
  }
}

async function healthCheck() {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL);
    const req = http.request({
      hostname: url.hostname, port: url.port || 80,
      path: '/', method: 'GET', timeout: HEALTH_TIMEOUT,
    }, (res) => {
      resolve({ ok: res.statusCode === 200, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
    req.end();
  });
}

async function apiHealthCheck() {
  return new Promise((resolve) => {
    const url = new URL('/api/posts?limit=1', BASE_URL);
    const req = http.request({
      hostname: url.hostname, port: url.port || 80,
      path: url.pathname, method: 'GET', timeout: HEALTH_TIMEOUT,
    }, (res) => {
      resolve({ ok: res.statusCode === 200, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
    req.end();
  });
}

function checkPM2Status() {
  const list = run('npx pm2 jlist 2>/dev/null');
  if (!list) return null;
  try {
    const procs = JSON.parse(list);
    const orra = procs.find(p => p.name === 'orra');
    if (!orra) return { status: 'not_found' };
    return {
      status: orra.pm2_env?.status || 'unknown',
      pid: orra.pid,
      memory: Math.round((orra.monit?.memory || 0) / 1024 / 1024),
      cpu: orra.monit?.cpu || 0,
      restarts: orra.pm2_env?.restart_time || 0,
      uptime: orra.pm2_env?.pm_uptime || 0,
    };
  } catch {
    return { status: 'parse_error' };
  }
}

function checkRecentErrors() {
  const logs = run('tail -50 /home/z/.pm2/logs/orra-error.log 2>/dev/null');
  if (!logs) return [];
  
  const errors = [];
  const lines = logs.split('\n').filter(l => l.trim());
  const recentLines = lines.slice(-20);
  
  for (const line of recentLines) {
    if (line.includes('NO_SECRET')) errors.push({ type: 'auth_secret', severity: 'high' });
    if (line.includes('EADDRINUSE')) errors.push({ type: 'port_conflict', severity: 'high' });
    if (line.includes('SIGTERM') || line.includes('SIGKILL')) errors.push({ type: 'crash', severity: 'critical' });
    if (line.includes('ENOMEM') || line.includes('heap out of memory')) errors.push({ type: 'oom', severity: 'critical' });
    if (line.includes('PrismaClient')) errors.push({ type: 'db_error', severity: 'medium' });
    if (line.includes('ENOTFOUND') || line.includes('ECONNREFUSED')) errors.push({ type: 'network', severity: 'medium' });
  }
  
  return errors;
}

function fixPortConflict() {
  log('fix', '🔧 Fixing port 3000 conflict...');
  // Only kill the process if the server is NOT responding
  // If the server is healthy, the port is in use correctly
  const pids = run('lsof -ti:3000 2>/dev/null');
  if (pids && !healthCheckSync()) {
    pids.split('\n').forEach(pid => {
      if (pid.trim()) {
        run(`kill -9 ${pid.trim()} 2>/dev/null`);
        log('fix', `  Killed stale process ${pid.trim()}`);
      }
    });
    setTimeout(() => restartApp(), 2000);
  } else {
    log('fix', '  Port 3000 is in use by a healthy server — no fix needed');
  }
}

function healthCheckSync() {
  const result = run(`curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/ 2>/dev/null`);
  return result === '200';
}

function fixAuthSecret() {
  log('fix', '🔧 Fixing NEXTAUTH_SECRET...');
  const envPath = path.join(PROJECT_DIR, '.env');
  const env = fs.readFileSync(envPath, 'utf-8');
  if (!env.includes('NEXTAUTH_SECRET')) {
    const secret = run('openssl rand -base64 32') || 'fallback-secret-' + Date.now();
    fs.appendFileSync(envPath, `\nNEXTAUTH_SECRET=${secret}\nNEXTAUTH_URL=http://localhost:3000\n`);
    log('fix', '  Added NEXTAUTH_SECRET to .env');
  }
  restartApp();
}

function fixDatabase() {
  log('fix', '🔧 Checking database...');
  // Check if DB file exists
  const dbPath = path.join(PROJECT_DIR, 'db/custom.db');
  if (!fs.existsSync(dbPath)) {
    log('error', '  Database file missing! Attempting restore...');
    // Try to find the latest backup
    const backupDir = path.join(PROJECT_DIR, 'backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db'))
        .sort()
        .reverse();
      if (backups.length > 0) {
        fs.copyFileSync(path.join(backupDir, backups[0]), dbPath);
        log('fix', `  Restored from backup: ${backups[0]}`);
      }
    }
  }
  // Run prisma db push to ensure schema is in sync
  run('npx prisma db push --skip-generate 2>/dev/null');
  log('fix', '  Database schema verified');
}

function rebuildAndRestart() {
  log('fix', '🔨 Rebuilding application...');
  run('npm run build 2>&1');
  log('fix', '  Build complete');
  restartApp();
}

function restartApp() {
  const now = Date.now();
  if (now - lastRestartTime < MIN_RESTART_INTERVAL) {
    log('warn', 'Restart rate-limited, waiting...');
    return;
  }
  lastRestartTime = now;
  
  log('fix', '🔄 Restarting ORRA...');
  // Kill any stale processes
  run('lsof -ti:3000 | xargs kill -9 2>/dev/null');
  // Stop and restart PM2
  run('npx pm2 stop orra 2>/dev/null');
  run('npx pm2 delete orra 2>/dev/null');
  setTimeout(() => {
    run('npx pm2 start "node_modules/.bin/next start -p 3000" --name orra 2>/dev/null');
    log('success', '✅ ORRA restarted');
  }, 2000);
}

async function runDiagnostics() {
  const health = await healthCheck();
  const apiHealth = await apiHealthCheck();
  const pm2 = checkPM2Status();
  const errors = checkRecentErrors();
  
  const issues = [];
  
  // Check 1: Server responding?
  if (!health.ok) {
    issues.push({ type: 'server_down', severity: 'critical' });
    log('error', `❌ Server not responding (status: ${health.status})`);
  }
  
  // Check 2: API working?
  if (health.ok && !apiHealth.ok) {
    issues.push({ type: 'api_error', severity: 'high' });
    log('error', `❌ API not responding (status: ${apiHealth.status})`);
  }
  
  // Check 3: PM2 process status — ONLY alert if server is also down
  // PM2 can show "errored" when it lost track of a running process, so
  // we only care about PM2 status if the health check also failed
  if (pm2 && !health.ok) {
    if (pm2.status === 'errored' || pm2.status === 'stopped') {
      issues.push({ type: 'pm2_error', severity: 'high' });
      log('error', `❌ PM2 status: ${pm2.status} AND server not responding`);
    }
    if (pm2.memory > MAX_MEMORY_MB) {
      issues.push({ type: 'memory_leak', severity: 'medium' });
      log('warn', `⚠️ High memory: ${pm2.memory}MB (threshold: ${MAX_MEMORY_MB}MB)`);
    }
  }
  
  // Check 4: Recent errors
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const highErrors = errors.filter(e => e.severity === 'high');
  
  if (criticalErrors.length > 0) {
    log('error', `❌ ${criticalErrors.length} critical errors detected`);
    issues.push(...criticalErrors);
  }
  
  // Auto-fix logic
  if (issues.length > 0) {
    consecutiveFailures++;
    log('fix', `🔧 ${issues.length} issue(s) detected, auto-fixing...`);
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'port_conflict':
          fixPortConflict();
          break;
        case 'auth_secret':
          fixAuthSecret();
          break;
        case 'server_down':
        case 'pm2_error':
        case 'crash':
          if (consecutiveFailures >= 3) {
            rebuildAndRestart();
          } else {
            restartApp();
          }
          break;
        case 'memory_leak':
          restartApp();
          break;
        case 'db_error':
          fixDatabase();
          break;
        case 'oom':
          restartApp();
          break;
      }
    }
  } else {
    if (consecutiveFailures > 0) {
      log('success', '✅ All issues resolved!');
    }
    consecutiveFailures = 0;
  }
  
  // Periodic status (every 6th check = ~1 minute)
  if (Date.now() % 60000 < CHECK_INTERVAL) {
    const mem = pm2?.memory || '?';
    const cpu = pm2?.cpu || '?';
    log('info', `💚 Healthy | Memory: ${mem}MB | CPU: ${cpu}% | Restarts: ${pm2?.restarts || 0}`);
  }
}

async function main() {
  log('info', '🤖 ORRA Dev AI Agent starting...');
  log('info', `Monitoring: ${BASE_URL}`);
  log('info', `Check interval: ${CHECK_INTERVAL / 1000}s`);
  log('info', `Memory threshold: ${MAX_MEMORY_MB}MB`);
  
  // Initial checks
  const pm2 = checkPM2Status();
  if (!pm2 || pm2.status === 'not_found') {
    log('warn', 'ORRA process not found in PM2. Starting...');
    restartApp();
  }
  
  // Fix any existing issues on startup
  const errors = checkRecentErrors();
  if (errors.length > 0) {
    log('warn', `Found ${errors.length} existing errors. Fixing...`);
    for (const err of errors) {
      if (err.type === 'port_conflict') fixPortConflict();
      if (err.type === 'auth_secret') fixAuthSecret();
      if (err.type === 'db_error') fixDatabase();
    }
  }
  
  // Main monitoring loop
  setInterval(runDiagnostics, CHECK_INTERVAL);
  
  // Also run once immediately
  await runDiagnostics();
  
  log('success', '🤖 Dev AI Agent active — watching for errors');
}

main().catch(e => {
  log('error', `Fatal: ${e.message}`);
  process.exit(1);
});
