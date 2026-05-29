const http = require('http');
const fs = require('fs');
const LOG_FILE = '/home/z/my-project/public-url.txt';

const server = http.createServer((req, res) => {
  const host = req.headers.host || '';
  const xfh = req.headers['x-forwarded-host'] || '';
  const xfp = req.headers['x-forwarded-proto'] || '';
  const ip = req.socket.remoteAddress || '';
  
  if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1') && !host.startsWith('21.0.')) {
    const line = `[${new Date().toISOString()}] host=${host} xfh=${xfh} xfp=${xfp} ip=${ip} url=${req.url}\n`;
    fs.appendFileSync(LOG_FILE, line);
    console.log('[HOST-CAPTURE]', line.trim());
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, host }));
});

server.listen(3099, '0.0.0.0', () => {
  console.log('[HOST-CAPTURE] Listening on port 3099');
});
