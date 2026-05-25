#!/bin/bash
# =============================================================================
# ORRA Container Entrypoint (start.sh)
# =============================================================================
# This is the script that Alibaba Cloud Function Compute runs when a container
# starts. It is the FIRST thing that runs on every cold start / container rebuild.
#
# CRITICAL: This script must handle:
# - Restoring the database from /home/sync/ (only persistent storage)
# - Starting the production server
# - Keeping the container alive
# - NOT losing any data
#
# This script delegates to .zscripts/dev.sh which handles all the details.
# =============================================================================

set -e

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/container-startup.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ORRA container entrypoint starting..." | tee -a "$LOG_FILE"

# If dev.sh exists, use it — it has all the DB restore, backup, and startup logic
if [ -f "$PROJECT_DIR/.zscripts/dev.sh" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting via dev.sh..." | tee -a "$LOG_FILE"
    exec bash "$PROJECT_DIR/.zscripts/dev.sh"
else
    # Fallback: minimal startup if dev.sh is missing (shouldn't happen)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: dev.sh not found, using fallback startup" | tee -a "$LOG_FILE"
    
    cd "$PROJECT_DIR"
    
    # Restore DB from persistent storage if available
    DB_FILE="$PROJECT_DIR/db/custom.db"
    PERSISTENT_BACKUP="/home/sync/orra-db-backup/latest.db"
    
    if [ -f "$PERSISTENT_BACKUP" ] && [ ! -f "$DB_FILE" ]; then
        echo "Restoring database from persistent backup..." | tee -a "$LOG_FILE"
        mkdir -p "$PROJECT_DIR/db"
        cp "$PERSISTENT_BACKUP" "$DB_FILE"
    fi
    
    # Generate Prisma client
    npx prisma generate 2>&1 | tee -a "$LOG_FILE"
    
    # Build if needed
    if [ ! -d "$PROJECT_DIR/.next" ] || [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
        echo "Building Next.js..." | tee -a "$LOG_FILE"
        npx next build --webpack 2>&1 | tee -a "$LOG_FILE"
    fi
    
    # Start server
    export NODE_ENV=production
    export DATABASE_URL="file:$DB_FILE"
    export NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024"
    export NEXTAUTH_URL="http://localhost:3000"
    export AUTH_TRUST_HOST=true
    export AUTOPOST_KEY="orra-internal-autopost-2026"
    
    node server.js &
    SERVER_PID=$!
    
    echo "Server started (PID: $SERVER_PID)" | tee -a "$LOG_FILE"
    
    # Keep container alive
    while kill -0 $SERVER_PID 2>/dev/null; do
        sleep 10
    done
fi
