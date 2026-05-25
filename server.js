const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { existsSync, createReadStream, statSync } = require('fs');
const path = require('path');
const { pipeline } = require('stream');

const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

// Build the project root path
const PROJECT_ROOT = '/home/z/my-project';

// The PUBLIC URL of the app (e.g., https://orra.cn-hangzhou.fc.aliyuncs.com)
// This is CRITICAL for keeping the FC container alive.
// Pings to this URL go through the FC load balancer, which counts as
// external traffic and prevents container freezing.
// Auto-detect the preview URL if ORRA_PUBLIC_URL isn't set
// This platform uses preview-chat-<id>.space.chatglm.site
const PUBLIC_URL = process.env.ORRA_PUBLIC_URL || 'https://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.chatglm.site';

// Recoverable errors that should NOT crash the server
const RECOVERABLE_ERRORS = [
  'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED',
  'socket hang up', 'request aborted', 'aborted',
  'write EPIPE', 'read ECONNRESET',
];

function isRecoverable(err) {
  const msg = err?.message || String(err);
  const code = err?.code || '';
  return RECOVERABLE_ERRORS.some(e => msg.includes(e) || code.includes(e));
}

// Only catch TRULY recoverable errors — let real crashes kill the process
// so the supervisor can restart it cleanly.
process.on('uncaughtException', (err) => {
  console.error('[ORRA] Uncaught exception:', err.message);
  if (!isRecoverable(err)) {
    console.error('[ORRA] Unrecoverable error — exiting for clean restart');
    process.exit(1);
  }
});

// Unhandled rejections: LOG but DON'T exit.
// In production, an unhandled rejection from a single API route should not
// kill the entire server. The health check and supervisor handle recovery.
process.on('unhandledRejection', (reason) => {
  console.error('[ORRA] Unhandled rejection (non-fatal):', reason);
});

// =========================================================================
// SERVER-SIDE KEEP-ALIVE — pings the PUBLIC URL every 10 seconds
//
// This is the #1 fix for FC container freezing.
// FC freezes containers when there's no external traffic for ~3 minutes.
// Client-side KeepAliveProvider works only when the browser tab is active.
// This server-side ping goes through the FC load balancer → counts as
// external traffic → keeps the container alive 24/7.
//
// It also acts as a "wake-up" mechanism: when the container is frozen,
// the ping is also frozen, but when external traffic (user) wakes the
// container, the pings resume and keep it alive.
// =========================================================================
let selfPingInterval = null;
let pingInProgress = false;

function startSelfPing() {
  if (!PUBLIC_URL) {
    console.warn('[ORRA] ORRA_PUBLIC_URL not set — server-side keep-alive DISABLED');
    console.warn('[ORRA] Set ORRA_PUBLIC_URL to your app\'s public URL to prevent FC freezing');
    return;
  }

  const pingUrl = PUBLIC_URL.replace(/\/+$/, '') + '/api/health';
  console.log(`[ORRA] Server-side keep-alive ENABLED — pinging ${pingUrl} every 10s`);

  selfPingInterval = setInterval(async () => {
    if (pingInProgress) return; // Don't pile up pings
    pingInProgress = true;

    try {
      const http = pingUrl.startsWith('https') ? require('https') : require('http');
      const req = http.get(pingUrl, { timeout: 8000 }, (res) => {
        res.resume(); // Consume the response body
        pingInProgress = false;
      });

      req.on('error', (err) => {
        // Don't log every failure — just track consecutive failures
        pingInProgress = false;
      });

      req.on('timeout', () => {
        req.destroy();
        pingInProgress = false;
      });
    } catch (err) {
      pingInProgress = false;
    }
  }, 10_000); // Every 10 seconds
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Request timeout — kill hanging requests after 30 seconds
    const timeout = setTimeout(() => {
      if (!res.writableEnded) {
        console.error('[ORRA] Request timeout:', req.url);
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request timeout' }));
      }
    }, 30_000);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Non-existent chunk/CSS requests — return proper 404 (not HTML)
    const chunkMatch = pathname && pathname.match(/^\/_next\/static\/(chunks|css)\/(.+\.(js|css|map))$/);
    if (chunkMatch) {
      const subDir = chunkMatch[1];
      const filename = chunkMatch[2];
      const filePath = path.join(PROJECT_ROOT, '.next', 'static', subDir, filename);

      if (existsSync(filePath)) {
        try {
          const stat = statSync(filePath);
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
            'Content-Length': stat.size,
          });

          const stream = createReadStream(filePath);
          pipeline(stream, res, (err) => {
            if (err && err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
              console.error('[ORRA] Stream error for', filename, err.message);
            }
          });
          return;
        } catch (err) {
          // File read error — fall through to Next.js
        }
      } else {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, must-revalidate',
        });
        res.end(JSON.stringify({ error: 'Chunk not found', file: filename }));
        return;
      }
    }

    // For other /_next/static/ paths — override cache headers
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

  // Server timeouts tuned for Alibaba Cloud FC environment
  server.timeout = 120_000;             // 2 min idle timeout
  server.requestTimeout = 120_000;      // 2 min max request duration
  server.headersTimeout = 65_000;       // 65s to receive headers (> keepAliveTimeout)
  server.keepAliveTimeout = 60_000;     // 60s keep-alive (must be > Caddy's 30s)

  server.listen(port, () => {
    console.log(`> ORRA Server running on http://localhost:${port}`);

    // Start the self-ping AFTER the server is listening
    startSelfPing();
  });
}).catch((err) => {
  console.error('[ORRA] Failed to prepare Next.js:', err.message);
  process.exit(1);
});
