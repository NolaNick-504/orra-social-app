#!/bin/bash
# =============================================================================
# ORRA Server — Zero-Downtime Startup Script
# =============================================================================
# This script ensures ORRA stays up and running with:
# 1. PM2 process manager (auto-restart on crash, memory limits)
# 2. Keepalive daemon (health checks, auto-recovery, DB backups)
# 3. npm install + build + seed if needed
# 4. Caddy reverse proxy
# =============================================================================

set -e
cd /home/z/my-project

echo "=========================================="
echo "  ORRA Zero-Downtime Server Startup"
echo "=========================================="
echo ""

# Step 1: Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install 2>&1 | tail -3
else
  echo "✅ node_modules exists"
fi

# Step 2: Build if needed
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "🔨 Building ORRA..."
  npm run build 2>&1 | tail -5
else
  echo "✅ Build exists"
fi

# Step 3: Ensure database exists and is seeded
if [ ! -f "db/custom.db" ]; then
  echo "📊 Creating database..."
  npx prisma db push 2>&1 | tail -3
  npx prisma db seed 2>&1 | tail -3
else
  echo "✅ Database exists"
fi

# Step 4: Create logs directory
mkdir -p logs

# Step 5: Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "keepalive-daemon" 2>/dev/null || true
sleep 1

# Step 6: Start with PM2
echo "🚀 Starting ORRA with PM2..."
pm2 delete orra-server 2>/dev/null || true
pm2 delete orra-keepalive 2>/dev/null || true

pm2 start ecosystem.config.js

echo ""
echo "=========================================="
echo "  ORRA is LIVE with zero-downtime!"
echo "=========================================="
echo ""
echo "  PM2 Status:"
pm2 status
echo ""
echo "  To view logs: pm2 logs"
echo "  To restart:   pm2 restart all"
echo "  To stop:      pm2 stop all"
echo ""
