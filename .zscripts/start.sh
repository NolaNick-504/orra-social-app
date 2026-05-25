#!/bin/bash
# =============================================================================
# ORRA Container Entrypoint (start.sh)
# =============================================================================
# This is the FIRST thing Alibaba Cloud FC runs when a container starts.
# It must start the server FAST — under 3 seconds — to avoid FC proxy timeouts.
#
# Delegates to .zscripts/dev.sh which uses the "fast path" design:
#   1. Restore DB from /home/sync/ (if missing)
#   2. Start server IMMEDIATELY
#   3. Run all other tasks in background
# =============================================================================

set -e

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/container-startup.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ORRA container entrypoint starting..." | tee -a "$LOG_FILE"

# Use dev.sh — it has the fast-startup logic
if [ -f "$PROJECT_DIR/.zscripts/dev.sh" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting via dev.sh (fast path)..." | tee -a "$LOG_FILE"
    exec bash "$PROJECT_DIR/.zscripts/dev.sh"
else
    # Emergency fallback: start server directly with minimal setup
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] EMERGENCY: dev.sh not found, direct startup" | tee -a "$LOG_FILE"
    
    cd "$PROJECT_DIR"
    
    # Restore DB from persistent storage if needed
    DB_FILE="$PROJECT_DIR/db/custom.db"
    PERSISTENT_BACKUP="/home/sync/orra-db-backup/latest.db"
    
    if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
        if [ -f "$PERSISTENT_BACKUP" ] && [ -s "$PERSISTENT_BACKUP" ]; then
            mkdir -p "$PROJECT_DIR/db"
            cp "$PERSISTENT_BACKUP" "$DB_FILE"
        fi
    fi
    
    # Start server directly
    export NODE_ENV=production
    export DATABASE_URL="file:$DB_FILE"
    export NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024"
    export NEXTAUTH_URL="http://localhost:3000"
    export AUTH_TRUST_HOST=true
    export AUTOPOST_KEY="orra-internal-autopost-2026"
    
    # Start server — dev.sh's main loop handles supervision
    node server.js
fi
