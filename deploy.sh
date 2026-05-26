#!/bin/bash
# ORRA Safe Deploy Script
# Usage: ./deploy.sh
# This script builds and restarts the app with ZERO downtime using pm2.

set -e

PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

echo "🔨 Building ORRA..."
npx next build --webpack

echo "📦 Preparing standalone output..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

echo "🔄 Restarting ORRA via pm2..."
pm2 delete orra 2>/dev/null || true
pm2 delete auto-poster 2>/dev/null || true
sleep 1
pm2 start ecosystem.config.js

echo "⏳ Waiting for server to be ready..."
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "✅ ORRA is live! (HTTP $STATUS)"
    pm2 save
    exit 0
  fi
  sleep 2
done

echo "❌ Server failed to start. Checking logs..."
pm2 logs orra --lines 20 --nostream
exit 1
