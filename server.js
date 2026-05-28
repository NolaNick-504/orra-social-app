const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

// Build the project root path — works on any server (AWS, local, etc.)
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const DB_PATH = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.join(PROJECT_ROOT, 'db', 'custom.db');
const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups');

// ============================================================
// SELF-PING KEEP-ALIVE v3 — MAXIMUM AGGRESSION
// The platform freezes containers after ~3-5 min of idle.
// Strategy:
//   1. Ping localhost every 5s (keeps Node process alive)
//   2. Ping Caddy proxy every 5s (keeps proxy warm)
//   3. Auto-discover & ping the PUBLIC URL every 5s
//      (this is what actually prevents container freezing)
//   4. Capture Host headers from real visitors to discover
//      the public URL automatically
// ============================================================
const SELF_PING_INTERVAL = 5000; // 5 seconds — aggressive keep-alive
const PUBLIC_URL_FILE = path.join(PROJECT_ROOT, 'discovered-url.txt');
let discoveredPublicUrl = process.env.ORRA_PUBLIC_URL || '';

// Try to load previously discovered URL
try {
  if (!discoveredPublicUrl && existsSync(PUBLIC_URL_FILE)) {
    discoveredPublicUrl = readFileSync(PUBLIC_URL_FILE, 'utf-8').trim();
    if (discoveredPublicUrl) {
      console.log(`[KEEPALIVE] Loaded discovered URL: ${discoveredPublicUrl}`);
    }
  }
} catch {}

// Save discovered URL for next restart
function saveDiscoveredUrl(url) {
  if (url && url !== discoveredPublicUrl) {
    discoveredPublicUrl = url;
    try { writeFileSync(PUBLIC_URL_FILE, url, 'utf-8'); } catch {}
    console.log(`[KEEPALIVE] ★ DISCOVERED PUBLIC URL: ${url} — saved!`);
  }
}

let pingCount = 0;

function selfPing() {
  pingCount++;
  const verbose = (pingCount % 60 === 1); // Log details every 60th ping (~5 min)

  // 1. Ping localhost:3000 (direct Next.js)
  try {
    const req = require('http').get(`http://127.0.0.1:${port}/api/health`, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200) {
        if (verbose) console.log(`[KEEPALIVE] Direct OK (port ${port})`);
      }
      res.resume();
    });
    req.on('error', () => {});
    req.on('timeout', () => { req.destroy(); });
  } catch {}

  // 2. Ping Nginx on port 80 (AWS EC2 uses Nginx, not Caddy)
  try {
    const req = require('http').get('http://127.0.0.1:80/api/health', { timeout: 5000 }, (res) => {
      if (verbose) console.log(`[KEEPALIVE] Nginx OK (port 80)`);
      res.resume();
    });
    req.on('error', () => {});
    req.on('timeout', () => { req.destroy(); });
  } catch {}

  // 3. Ping the discovered/known public URL (THE CRITICAL ONE)
  const publicUrl = discoveredPublicUrl;
  if (publicUrl && publicUrl.startsWith('http')) {
    try {
      const urlObj = new URL('/api/health', publicUrl);
      const httpModule = urlObj.protocol === 'https:' ? require('https') : require('http');
      const req = httpModule.get(urlObj.toString(), { timeout: 10000 }, (res) => {
        if (verbose) console.log(`[KEEPALIVE] Public URL OK`);
        res.resume();
      });
      req.on('error', () => {});
      req.on('timeout', () => { req.destroy(); });
    } catch {}
  }
}

// ============================================================
// DATABASE RESILIENCE
// Only logs database status — NEVER auto-resets the database.
// The database is precious user data and should only be reset
// manually via: bash orra-start.sh rebuild
// ============================================================
function checkDatabase() {
  try {
    if (!existsSync(DB_PATH)) {
      console.log('[DB] WARNING: Database file missing — will be created by Prisma on first request');
      return;
    }

    const stat = require('fs').statSync(DB_PATH);
    if (stat.size < 10000) {
      console.log('[DB] WARNING: Database file is very small (' + stat.size + ' bytes) — may need manual reseed');
      console.log('[DB] Run: cd ' + PROJECT_ROOT + ' && npx prisma db push --force-reset && npx prisma db seed');
      // DO NOT auto-repair — this destroys user data!
      return;
    }

    console.log('[DB] Database exists (' + stat.size + ' bytes) — OK');
  } catch (e) {
    console.log('[DB] Database check error:', e.message);
  }
}

// repairDatabase() is DISABLED — it destroys user data!
// Only use manually: cd <project_dir> && npx prisma db push --force-reset && npx prisma db seed

// ============================================================
// PERIODIC DATABASE BACKUP
// ============================================================
let lastBackupTime = 0;
const BACKUP_INTERVAL = 300000; // 5 minutes

function backupDatabase() {
  try {
    if (!existsSync(DB_PATH)) return;
    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `auto-${ts}.db`);
    require('fs').copyFileSync(DB_PATH, backupPath);

    // Keep only last 5 backups
    const backups = require('fs').readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('auto-'))
      .sort();
    while (backups.length > 5) {
      require('fs').unlinkSync(path.join(BACKUP_DIR, backups.shift()));
    }

    console.log(`[DB] Backup created: auto-${ts}.db`);
    lastBackupTime = Date.now();
  } catch (e) {
    console.error('[DB] Backup failed:', e.message);
  }
}

// ============================================================
// START THE SERVER
// ============================================================
app.prepare().then(() => {
  // Check database on startup
  checkDatabase();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Auto-discover public URL from Host headers of real visitors
    try {
      const host = req.headers['host'] || req.headers[':authority'] || '';
      const proto = req.headers['x-forwarded-proto'] || (req.headers[':scheme'] ? 'https' : 'http');
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !discoveredPublicUrl.includes(host)) {
        const newUrl = `${proto}://${host}`;
        saveDiscoveredUrl(newUrl);
      }
    } catch {}

    // CRITICAL FIX: Non-existent chunk/CSS requests fall through to the catch-all
    // route and return HTML with status 200. The browser then tries to parse the
    // HTML as JavaScript, causing a crash cascade. This is the #1 cause of the
    // "Something went wrong" error after idle timeouts.
    const chunkMatch = pathname && pathname.match(/^\/_next\/static\/(chunks|css)\/(.+\.(js|css|map))$/);
    if (chunkMatch) {
      const subDir = chunkMatch[1]; // 'chunks' or 'css'
      const filename = chunkMatch[2]; // e.g., 'webpack-abc123.js'
      const filePath = path.join(PROJECT_ROOT, '.next', 'static', subDir, filename);

      if (existsSync(filePath)) {
        // File exists — serve it directly with proper content-type and immutable cache
        try {
          const data = readFileSync(filePath);
          const ext = path.extname(filename).toLowerCase();
          const contentTypes = {
            '.js': 'application/javascript; charset=UTF-8',
            '.css': 'text/css; charset=UTF-8',
            '.map': 'application/json',
          };
          const contentType = contentTypes[ext] || 'application/octet-stream';

          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
          });
          res.end(data);
          return;
        } catch (err) {
          // File read error — fall through to Next.js
        }
      } else {
        // File does NOT exist — return proper 404 instead of letting the
        // catch-all route return HTML (which crashes the browser's JS parser)
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, must-revalidate',
        });
        res.end(JSON.stringify({ error: 'Chunk not found', file: filename }));
        return;
      }
    }

    // For other /_next/static/ paths (fonts, media, etc.), override cache headers
    if (pathname && pathname.startsWith('/_next/static/')) {
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = function(name, value) {
        if (name.toLowerCase() === 'cache-control') {
          return originalSetHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        if (name.toLowerCase() === 'pragma') {
          return originalSetHeader('Pragma', '');
        }
        if (name.toLowerCase() === 'expires') {
          return originalSetHeader('Expires', '');
        }
        return originalSetHeader(name, value);
      };
    }

    handle(req, res, parsedUrl);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> ORRA Server running on http://0.0.0.0:${port}`);
    console.log(`> Public URL: ${discoveredPublicUrl || 'not set (will auto-discover from visitors)'}`);
    console.log(`> Self-ping interval: ${SELF_PING_INTERVAL / 1000}s`);
    console.log(`> Database: ${DB_PATH}`);
    console.log(`> Started at: ${new Date().toISOString()}`);

    // Start self-ping keep-alive
    selfPing(); // Initial ping immediately
    setInterval(selfPing, SELF_PING_INTERVAL);

    // Start periodic backups
    setInterval(backupDatabase, BACKUP_INTERVAL);
    // First backup after 1 minute
    setTimeout(backupDatabase, 60000);
  });

  // Handle server errors gracefully
  server.on('error', (error) => {
    console.error('[SERVER] Error:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`[SERVER] Port ${port} is already in use. Exiting.`);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received — shutting down gracefully');
    server.close(() => {
      console.log('[SERVER] Server closed');
      process.exit(0);
    });
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.log('[SERVER] Forced shutdown after timeout');
      process.exit(0);
    }, 10000);
  });

  process.on('SIGINT', () => {
    console.log('[SERVER] SIGINT received — shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000);
  });

  // Catch uncaught errors to prevent crashes
  process.on('uncaughtException', (error) => {
    console.error('[SERVER] Uncaught exception:', error.message);
    // Don't exit — try to keep the server running
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[SERVER] Unhandled rejection:', reason);
    // Don't exit — try to keep the server running
  });
}).catch((error) => {
  console.error('[SERVER] Failed to start:', error);
  process.exit(1);
});
