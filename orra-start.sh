#!/bin/bash
# =============================================================================
# ORRA Social App - UNIFIED Startup Script
# =============================================================================
# This is the ONE script to start ORRA. It replaces all other startup scripts:
#   supervisor.sh, watchdog.sh, start-production.sh, run-server.sh, etc.
#
# What it does:
#   1. Kills stale processes on port 3000
#   2. Verifies/repairs the database
#   3. Installs dependencies if needed
#   4. Builds if needed
#   5. Starts the server with PM2 (auto-restart on crash)
#   6. Starts the keepalive daemon
#   7. Verifies the server is responding
#
# Usage:
#   bash orra-start.sh          # Start the server
#   bash orra-start.sh rebuild  # Force rebuild before starting
#   bash orra-start.sh stop     # Stop the server
#   bash orra-start.sh restart  # Restart the server
#   bash orra-start.sh status   # Check server status
# =============================================================================
set -e

PROJECT_DIR="/home/z/my-project"
PORT=3000
LOG_DIR="${PROJECT_DIR}/logs"

# Create log dir if needed
mkdir -p "${LOG_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[ORRA]${NC} $(date '+%H:%M:%S') $1"; }
ok()   { echo -e "${GREEN}[ORRA] ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}[ORRA] ⚠ $1${NC}"; }
fail() { echo -e "${RED}[ORRA] ✗ $1${NC}"; exit 1; }

# =============================================================================
# STOP FUNCTION
# =============================================================================
stop_server() {
    log "Stopping ORRA server..."
    
    # Stop PM2 process
    pm2 delete orra 2>/dev/null || true
    pm2 delete orra-keepalive 2>/dev/null || true
    
    # Kill any stale processes on port 3000
    fuser -k ${PORT}/tcp 2>/dev/null || true
    
    # Kill any leftover node processes for this project
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "next start" 2>/dev/null || true
    pkill -f "keepalive-daemon" 2>/dev/null || true
    
    sleep 2
    
    # Verify port is free
    if fuser ${PORT}/tcp 2>/dev/null; then
        warn "Port ${PORT} still in use — force killing..."
        fuser -9 -k ${PORT}/tcp 2>/dev/null || true
        sleep 1
    fi
    
    ok "Server stopped"
}

# =============================================================================
# STATUS FUNCTION
# =============================================================================
check_status() {
    log "ORRA Server Status:"
    echo ""
    
    # Check PM2
    if pm2 describe orra &>/dev/null; then
        pm2 describe orra | grep -E "status|uptime|restarts|memory" || true
        ok "PM2 process running"
    else
        warn "PM2 process not found"
    fi
    
    echo ""
    
    # Check HTTP response
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/api/health 2>/dev/null || echo "000")
    if [ "${HTTP_CODE}" = "200" ]; then
        ok "Server responding (HTTP 200)"
    else
        fail "Server not responding (HTTP ${HTTP_CODE})"
    fi
    
    echo ""
    
    # Check database
    if [ -f "${PROJECT_DIR}/db/custom.db" ]; then
        DB_SIZE=$(stat -f%z "${PROJECT_DIR}/db/custom.db" 2>/dev/null || stat -c%s "${PROJECT_DIR}/db/custom.db" 2>/dev/null || echo "unknown")
        ok "Database exists (${DB_SIZE} bytes)"
    else
        warn "Database file missing"
    fi
    
    echo ""
    pm2 list 2>/dev/null || true
}

# =============================================================================
# START FUNCTION
# =============================================================================
start_server() {
    log "Starting ORRA server..."
    
    cd "${PROJECT_DIR}"
    
    # ---------------------------------------------------------------
    # Step 1: Kill stale processes
    # ---------------------------------------------------------------
    log "Step 1: Cleaning up stale processes..."
    fuser -k ${PORT}/tcp 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "keepalive-daemon" 2>/dev/null || true
    sleep 2
    
    # ---------------------------------------------------------------
    # Step 2: Check node_modules
    # ---------------------------------------------------------------
    if [ ! -d "node_modules" ]; then
        log "Step 2: Installing dependencies..."
        npm install 2>&1 | tail -3
    else
        log "Step 2: Dependencies already installed ✓"
    fi
    
    # ---------------------------------------------------------------
    # Step 3: Build if needed (or if --rebuild flag)
    # ---------------------------------------------------------------
    if [ "${FORCE_REBUILD}" = "1" ] || [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
        log "Step 3: Building application..."
        npm run build 2>&1 | tail -5
        if [ ! -f ".next/BUILD_ID" ]; then
            fail "Build failed — .next/BUILD_ID not found"
        fi
        ok "Build complete"
    else
        log "Step 3: Build already exists ✓"
    fi
    
    # ---------------------------------------------------------------
    # Step 4: Check database (NEVER auto-reset — that destroys user data!)
    # ---------------------------------------------------------------
    log "Step 4: Checking database..."
    if [ -f "db/custom.db" ]; then
        DB_SIZE=$(stat -c%s "db/custom.db" 2>/dev/null || echo "0")
        if [ "${DB_SIZE}" -lt 10000 ]; then
            warn "Database too small (${DB_SIZE} bytes) — needs manual reseed!"
            warn "Run: npx prisma db push --force-reset && bun prisma/seed.ts"
        else
            ok "Database exists (${DB_SIZE} bytes)"
        fi
    else
        warn "Database missing — creating fresh..."
        mkdir -p db
        npx prisma db push 2>&1 | tail -3
        bun prisma/seed.ts 2>&1 | tail -3
    fi
    
    # ---------------------------------------------------------------
    # Step 5: Generate Prisma client
    # ---------------------------------------------------------------
    log "Step 5: Generating Prisma client..."
    npx prisma generate 2>&1 | tail -2
    
    # ---------------------------------------------------------------
    # Step 6: Start server with PM2
    # ---------------------------------------------------------------
    log "Step 6: Starting server with PM2..."
    
    # Source .env for environment variables
    set -a
    source "${PROJECT_DIR}/.env" 2>/dev/null || true
    set +a
    
    # Delete old PM2 process if exists
    pm2 delete orra 2>/dev/null || true
    
    # Start the server
    pm2 start server.js --name orra \
        --cwd "${PROJECT_DIR}" \
        --env production \
        --max-memory-restart 500M \
        --max-restarts 10 \
        --restart-delay 5000 \
        --time \
        --log "${LOG_DIR}/pm2-out.log" \
        --error "${LOG_DIR}/pm2-error.log"
    
    pm2 save
    
    ok "PM2 started"
    
    # ---------------------------------------------------------------
    # Step 7: Wait for server to respond
    # ---------------------------------------------------------------
    log "Step 7: Waiting for server to respond..."
    for i in $(seq 1 30); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/api/health 2>/dev/null || echo "000")
        if [ "${HTTP_CODE}" = "200" ]; then
            ok "Server is UP and responding! (HTTP 200)"
            echo ""
            echo "=========================================="
            ok "ORRA IS LIVE!"
            echo "=========================================="
            echo "  URL:        http://localhost:${PORT}"
            echo "  Health:     http://localhost:${PORT}/api/health"
            echo "  PM2 Status: pm2 status"
            echo "  PM2 Logs:   pm2 logs orra"
            echo "  Stop:       bash orra-start.sh stop"
            echo "  Restart:    bash orra-start.sh restart"
            echo "=========================================="
            return 0
        fi
        sleep 1
    done
    
    fail "Server failed to start within 30 seconds. Check logs: pm2 logs orra"
}

# =============================================================================
# MAIN
# =============================================================================
case "${1}" in
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 2
        start_server
        ;;
    status)
        check_status
        ;;
    rebuild)
        FORCE_REBUILD=1 start_server
        ;;
    *)
        start_server
        ;;
esac
