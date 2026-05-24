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

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // CRITICAL FIX: Non-existent chunk/CSS requests fall through to the catch-all
    // route and return HTML with status 200. The browser then tries to parse the
    // HTML as JavaScript, causing a crash cascade. This is the #1 cause of the
    // "Something went wrong" error after idle timeouts.
    //
    // Fix: For /_next/static/chunks/*.js and /_next/static/css/*.css requests,
    // check if the file exists. If it does, serve it normally. If not, return 404.
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
  }).listen(port, () => {
    console.log(`> ORRA Server running on http://localhost:${port}`);
  });
});
