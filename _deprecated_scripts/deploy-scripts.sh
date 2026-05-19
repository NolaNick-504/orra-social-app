#!/bin/bash
# ORRA Deploy Script — Build, fix standalone, and restart
# Usage: bash scripts/deploy.sh

set -e
cd "$(dirname "$0")/.."

echo "=== ORRA Deploy ==="

# Kill existing server
echo "[1/5] Stopping server..."
kill $(lsof -ti :3000) 2>/dev/null || true
sleep 2

# Build
echo "[2/5] Building Next.js..."
npx next build

# Fix standalone: symlink static files
echo "[3/5] Fixing standalone output..."
ln -sf "$(pwd)/.next/static" "$(pwd)/.next/standalone/.next/static"

# Copy public assets to standalone
echo "[4/5] Copying public assets..."
cp -rn "$(pwd)/public/"* "$(pwd)/.next/standalone/public/" 2>/dev/null || true

# Start server
echo "[5/5] Starting server..."
PORT=3000 nohup node .next/standalone/server.js > server.log 2>&1 &
sleep 4

# Verify
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/")
if [ "$STATUS" = "200" ]; then
  echo "=== Deploy complete! Server running on port 3000 ==="
else
  echo "=== WARNING: Server returned status $STATUS ==="
  tail -20 server.log
fi
