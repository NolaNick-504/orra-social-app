const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { existsSync, readFileSync } = require('fs');
const path = require('path');

const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

// Build the project root path
const PROJECT_ROOT = '/home/z/my-project';

// CRITICAL: Prevent unhandled errors from crashing the process
process.on('uncaughtException', (err) => {
  console.error('[ORRA] Uncaught exception (NOT crashing):', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ORRA] Unhandled rejection (NOT crashing):', reason);
});

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // CRITICAL FIX: Non-existent chunk/CSS requests fall through to the catch-all
    // route and return HTML with status 200. The browser then tries to parse the
    // HTML as JavaScript, causing a crash cascade.
    const chunkMatch = pathname && pathname.match(/^\/_next\/static\/(chunks|css)\/(.+\.(js|css|map))$/);
    if (chunkMatch) {
      const subDir = chunkMatch[1];
      const filename = chunkMatch[2];
      const filePath = path.join(PROJECT_ROOT, '.next', 'static', subDir, filename);

      if (existsSync(filePath)) {
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
  }).listen(port, () => {
    console.log(`> ORRA Server running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('[ORRA] Failed to prepare Next.js:', err.message);
  // Don't crash — the supervisor will restart us
});
