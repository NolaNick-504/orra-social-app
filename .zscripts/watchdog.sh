#!/bin/bash
# ORRA Watchdog - keeps the node server alive
# Started by /start.sh, runs forever, restarts node if it dies
PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/next-supervisor.log

log() { echo "[$(date '+%H:%M:%S')] [watchdog] $1" >> "$LOG_FILE"; }

cd "$PROJECT_DIR"
export NODE_ENV=production
export DATABASE_URL="file:$PROJECT_DIR/db/custom.db"
export NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export AUTOPOST_KEY="orra-internal-autopost-2026"

log "Watchdog started"

while true; do
  # Check if server is responding
  if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    # Server not responding — kill any old one and start fresh
    pkill -f "node server.js" 2>/dev/null || true
    sleep 1
    node server.js >> "$LOG_FILE" 2>&1 &
    NODE_PID=$!
    log "Server started (PID: $NODE_PID)"
    
    # Wait for it to come up
    for i in $(seq 1 15); do
      if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
        log "Server UP (${i}s)"
        break
      fi
      sleep 1
    done
  fi
  
  # Backup DB every 2 minutes
  if [ -f "$PROJECT_DIR/db/custom.db" ]; then
    mkdir -p /home/sync/orra-db-backup
    cp "$PROJECT_DIR/db/custom.db" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
  fi
  
  sleep 30
done
