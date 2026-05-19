#!/bin/bash
# ORRA Safe Deploy Script
# Handles build + server restart atomically
# Usage: bash scripts/deploy.sh

set -e
cd "$(dirname "$0")/.."

echo "🔧 ORRA Deploy Starting..."

# Step 1: Build
echo "  Building..."
npx next build 2>&1 | tail -3

# Step 2: Restart the server via PM2
echo "  Restarting server via PM2..."
npx pm2 restart orra 2>/dev/null || {
  echo "  PM2 process not found, starting fresh..."
  npx pm2 start npm --name orra -- run start
}
sleep 5

# Step 3: Verify
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Deploy complete — app is live (HTTP 200)"
  
  # Quick chunk test
  FIRST_CHUNK=$(curl -s http://localhost:3000/ | grep -o '/_next/static/chunks/[^"]*\.js' | head -1)
  if [ -n "$FIRST_CHUNK" ]; then
    CHUNK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$FIRST_CHUNK" 2>/dev/null || echo "000")
    if [ "$CHUNK_CODE" = "200" ]; then
      echo "✅ JS chunks loading correctly"
    else
      echo "⚠️  WARNING: JS chunks returning $CHUNK_CODE — users may see loading screen"
    fi
  fi
else
  echo "❌ Deploy failed — server returned HTTP $HTTP_CODE"
  echo "   Check logs: npx pm2 logs orra --lines 20"
fi
