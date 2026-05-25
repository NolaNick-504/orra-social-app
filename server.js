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
// so the supervisor can restart it cleanly. Masking all errors keeps the
// server alive in a broken state, which is worse than a clean restart.
process.on('uncaughtException', (err) => {
  console.error('[ORRA] Uncaught exception:', err.message);
  if (!isRecoverable(err)) {
    console.error('[ORRA] Unrecoverable error — exiting for clean restart');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('[ORRA] Unhandled rejection:', reason);
  if (!isRecoverable(reason)) {
    console.error('[ORRA] Unrecoverable rejection — exiting for clean restart');
    process.exit(1);
  }
});

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Request timeout — kill hanging requests after 30 seconds
    // This prevents a single stuck request from blocking the entire server
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

    // Non-existent chunk/CSS requests fall through to the catch-all
    // route and return HTML with status 200. The browser then tries to parse the
    // HTML as JavaScript, causing a crash cascade.
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

          // STREAM the file instead of readFileSync — doesn't block the event loop
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

  // Server timeouts tuned for Alibaba Cloud FC environment:
  // - FC proxy (Caddy) has keep_alive 30s, so our keepAliveTimeout must be > 30s
  //   Otherwise Node closes connections that Caddy is trying to reuse → ECONNRESET errors
  // - headersTimeout must be > keepAliveTimeout (Node.js requirement)
  // - requestTimeout is generous because some API routes (upload, etc.) take time
  server.timeout = 120_000;             // 2 min idle timeout
  server.requestTimeout = 120_000;      // 2 min max request duration
  server.headersTimeout = 65_000;       // 65s to receive headers (> keepAliveTimeout)
  server.keepAliveTimeout = 60_000;     // 60s keep-alive (must be > Caddy's 30s)

  server.listen(port, () => {
    console.log(`> ORRA Server running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('[ORRA] Failed to prepare Next.js:', err.message);
  process.exit(1); // Exit so supervisor restarts us
});
