#!/bin/bash
# ORRA Runner - stays alive as long as possible

PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/orra-runner.log
DB_FILE=$PROJECT_DIR/db/custom.db
DB_BACKUP=/home/sync/orra-db-backup/latest.db

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

log "=== ORRA Runner starting ==="

cd "$PROJECT_DIR"

export NODE_ENV=production
export DATABASE_URL="file:$DB_FILE"
export NEXTAUTH_SECRET="orra-s3cr3t-k3rman3nt-2024"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export AUTOPOST_KEY="orra-internal-autopost-2026"

# Kill any existing server
pkill -f "node server.js" 2>/dev/null || true
sleep 1

log "Starting supervisor loop..."

# Supervisor loop
while true; do
  node server.js >> "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  log "Server exited (code: $EXIT_CODE) — restarting in 5s..."
  
  # Backup DB on crash
  if [ -f "$DB_FILE" ]; then
    mkdir -p /home/sync/orra-db-backup 2>/dev/null
    cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
  fi
  
  sleep 5
done
