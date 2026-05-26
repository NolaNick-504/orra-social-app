#!/bin/bash
# ORRA Rebuild & Restart
# Uses proper rsync to ensure ALL static and public files are synced to standalone
set -e
cd /home/z/my-project

echo "🔨 Building ORRA..."
npx next build 2>&1 | tail -5

echo "📦 Syncing static chunks to standalone..."
# Remove old static and copy fresh (avoids stale chunks from previous builds)
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static
echo "✅ Static chunks synced: $(ls .next/standalone/.next/static/chunks/ 2>/dev/null | wc -l) files"

echo "📦 Syncing public assets to standalone..."
# Remove old public and copy fresh (ensures new images/banners are included)
rm -rf .next/standalone/public
cp -r public .next/standalone/public
echo "✅ Public assets synced: $(ls .next/standalone/public/ 2>/dev/null | wc -l) items"

echo "📦 Syncing database to standalone..."
mkdir -p .next/standalone/db
cp -f db/custom.db .next/standalone/db/custom.db
echo "✅ Database synced"

echo "🔄 Restarting server..."
fuser -k 3000/tcp 2>/dev/null || true
sleep 3
HOSTNAME=0.0.0.0 PORT=3000 nohup node .next/standalone/server.js >> logs/server-out.log 2>> logs/server-error.log &

echo "⏳ Waiting for server..."
for i in $(seq 1 20); do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
        echo "✅ ORRA is live! (PID: $!)"
        exit 0
    fi
    sleep 1
done
echo "❌ Server failed to start"
exit 1
