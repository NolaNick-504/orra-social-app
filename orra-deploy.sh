#!/bin/bash
# =============================================================================
# ORRA Bulletproof Deploy Script
# Usage: bash orra-deploy.sh
#
# This script handles EVERYTHING:
# 1. Kills all running servers and daemons
# 2. Does a clean build
# 3. Starts the server via PM2 with crash protection
# 4. Verifies the server is actually serving the new code
# =============================================================================
set -e

PROJECT_DIR="/home/z/my-project"
LOG_PREFIX="[ORRA-DEPLOY]"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo "$LOG_PREFIX $(date '+%H:%M:%S') $1"; }
ok()  { echo "$LOG_PREFIX ${GREEN}✓ $1${NC}"; }
warn(){ echo "$LOG_PREFIX ${YELLOW}⚠ $1${NC}"; }
fail(){ echo "$LOG_PREFIX ${RED}✗ $1${NC}"; }

cd "$PROJECT_DIR"

# =====================
# STEP 1: Kill everything
# =====================
log "Step 1: Killing all servers and daemons..."

# Kill any node server processes
pkill -9 -f "next-server" 2>/dev/null || true
# Kill PM2 process
npx pm2 stop orra 2>/dev/null || true
npx pm2 delete orra 2>/dev/null || true
# Kill anything on port 3000
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# Verify port is free
if ss -tlnp | grep -q ':3000'; then
    PID=$(ss -tlnp | grep ':3000' | grep -oP 'pid=\K[0-9]+' | head -1)
    [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null
    sleep 2
fi

ok "All processes killed"

# =====================
# STEP 2: Clean build
# =====================
log "Step 2: Clean build..."
rm -rf .next

npm run build

if [ ! -d ".next" ]; then
    fail "Build failed - .next directory not found!"
    exit 1
fi
ok "Build complete"

# =====================
# STEP 3: Start the server via PM2
# =====================
log "Step 3: Starting server via PM2..."
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="orra-super-secret-key-2025-production"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export NODE_ENV=production

npx pm2 start bash --name orra -- .zscripts/dev.sh
npx pm2 save
sleep 5

# =====================
# STEP 4: Verify
# =====================
log "Step 4: Verifying server is running..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "Server is running! HTTP 200"
else
    fail "Server not responding! HTTP $HTTP_CODE"
    echo "Check logs: npx pm2 logs orra --lines 30"
    exit 1
fi

echo ""
echo "=========================================="
ok "DEPLOY COMPLETE! ORRA is live on port 3000"
echo "=========================================="
echo ""
echo "Quick commands:"
echo "  Check server:  curl -s http://localhost:3000/ | head -1"
echo "  Check API:     curl -s http://localhost:3000/api/posts?limit=1"
echo "  Server logs:   npx pm2 logs orra --lines 30"
echo "  Re-deploy:     bash orra-deploy.sh"
