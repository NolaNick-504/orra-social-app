#!/bin/bash
# ORRA Rebuild & Restart
set -e
cd /home/z/my-project

echo "🔨 Building ORRA..."
npx next build 2>&1 | tail -5

echo "📦 Syncing database and static files..."
mkdir -p .next/standalone/db
cp -f db/custom.db .next/standalone/db/custom.db 2>/dev/null || true
cp -rn .next/static .next/standalone/.next/static 2>/dev/null || true

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
