#!/bin/bash
# ORRA Deployment Script - Ensures clean builds and proper static file sync
set -e

echo "🔧 ORRA Deploy Script"
echo "====================="

# 1. Kill everything on port 3000
echo "🛑 Stopping all servers on port 3000..."
pm2 delete orra 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# 2. Verify port is free
if ss -tlnp | grep -q ':3000'; then
  echo "⚠️  Port 3000 still in use, force killing..."
  PID=$(ss -tlnp | grep ':3000' | grep -oP 'pid=\K[0-9]+' | head -1)
  [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null
  sleep 2
fi

# 3. Clean build
echo "🧹 Cleaning old build..."
rm -rf .next

# 4. Build
echo "🏗️  Building..."
npm run build

# 5. Copy static files (CRITICAL - standalone doesn't include them)
echo "📦 Syncing static files to standalone..."
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static

# 6. Copy public folder
echo "📂 Syncing public folder..."
rm -rf .next/standalone/public
cp -r public .next/standalone/public

# 7. Verify chunks exist
CHUNK_COUNT=$(ls .next/standalone/.next/static/chunks/*.js 2>/dev/null | wc -l)
echo "📊 $CHUNK_COUNT chunk files synced"

if [ "$CHUNK_COUNT" -eq 0 ]; then
  echo "❌ ERROR: No chunk files found! Build may have failed."
  exit 1
fi

# 8. Start server
echo "🚀 Starting server..."
cd .next/standalone
pm2 start server.js --name orra --cwd "$(pwd)"
cd ../..

# 9. Wait and verify
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
CHUNK_TEST=$(curl -s -o /dev/null -w "%{http_code}" $(ls .next/static/chunks/*.js | head -1 | sed 's|.*/|http://localhost:3000/_next/static/chunks/|'))

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Server running! HTTP $HTTP_CODE"
else
  echo "❌ Server error! HTTP $HTTP_CODE"
  pm2 logs orra --lines 10 --nostream
fi

echo "🎉 Deploy complete!"
pm2 list
