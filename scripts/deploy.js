#!/usr/bin/env node
/**
 * ORRA Deploy Script — Build, fix standalone, and restart server.
 * Uses webpack (not Turbopack) for stable production builds.
 * Starts with `next start` for proper chunk serving.
 *
 * Usage: node scripts/deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function run(cmd, options = {}) {
  console.log(`  $ ${cmd}`);
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'inherit', ...options });
  } catch (err) {
    console.error(`  ✗ Command failed: ${cmd}`);
    throw err;
  }
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'pipe' }).toString().trim();
  } catch {
    return '';
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║         ORRA Deploy Script               ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Step 1: Kill existing server
  console.log('[1/5] Stopping existing server...');
  try {
    const pids = runSilent('lsof -ti :3000');
    if (pids) {
      pids.split('\n').forEach(pid => {
        try { process.kill(parseInt(pid), 9); } catch {}
      });
      console.log('  ✓ Killed old server processes');
    } else {
      console.log('  ✓ No existing server found');
    }
  } catch {
    console.log('  ✓ No existing server found');
  }

  // Wait for port to be freed
  execSync('sleep 3', { stdio: 'pipe' });

  // Step 2: Clean build with webpack (Turbopack has chunk issues with standalone)
  console.log('\n[2/5] Building with webpack...');
  // Remove old build artifacts for clean slate
  try {
    fs.rmSync(path.join(PROJECT_ROOT, '.next'), { recursive: true, force: true });
    console.log('  ✓ Removed old .next directory');
  } catch {}

  run('npx next build --webpack');

  // Step 3: Set up standalone output
  console.log('\n[3/5] Setting up standalone output...');
  const standaloneDir = path.join(PROJECT_ROOT, '.next', 'standalone');
  const staticDir = path.join(PROJECT_ROOT, '.next', 'static');
  const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');

  // Symlink static files
  try {
    if (fs.existsSync(standaloneStaticDir)) {
      fs.unlinkSync(standaloneStaticDir);
    }
    fs.symlinkSync(staticDir, standaloneStaticDir);
    console.log('  ✓ Symlinked .next/static -> standalone/.next/static');
  } catch (err) {
    console.warn('  ⚠ Symlink failed:', err.message);
  }

  // Copy public assets
  try {
    const publicDir = path.join(PROJECT_ROOT, 'public');
    const standalonePublic = path.join(standaloneDir, 'public');
    runSilent(`cp -rn "${publicDir}/"* "${standalonePublic}/"`);
    console.log('  ✓ Copied public assets to standalone');
  } catch (err) {
    console.warn('  ⚠ Public copy failed:', err.message);
  }

  // Step 4: Verify build
  console.log('\n[4/5] Verifying build...');
  const buildId = fs.readFileSync(path.join(PROJECT_ROOT, '.next', 'BUILD_ID'), 'utf-8').trim();
  console.log(`  Build ID: ${buildId}`);
  const chunkCount = fs.readdirSync(path.join(PROJECT_ROOT, '.next', 'static', 'chunks')).length;
  console.log(`  Chunks: ${chunkCount}`);

  // Step 5: Start server with `next start` (most reliable for chunk serving)
  console.log('\n[5/5] Starting server...');
  const { spawn } = require('child_process');
  const server = spawn('npx', ['next', 'start'], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PORT: '3000' },
    detached: true,
    stdio: 'ignore',
  });
  server.unref();
  console.log(`  Server PID: ${server.pid}`);

  // Wait for server to start
  execSync('sleep 5', { stdio: 'pipe' });

  // Verify
  try {
    const status = runSilent('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/');
    if (status === '200') {
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║   ✅ Deploy complete! Server running     ║');
      console.log('║   http://localhost:3000                  ║');
      console.log('╚══════════════════════════════════════════╝');
    } else {
      console.warn(`\n⚠ Server returned status ${status}`);
    }
  } catch {
    console.warn('\n⚠ Could not verify server status');
  }
}

main().catch(err => {
  console.error('Deploy failed:', err.message);
  process.exit(1);
});
