#!/bin/bash
# ORRA Custom Startup Script
# This runs automatically when the container starts (called by /start.sh)
# It builds and starts Next.js in production mode with auto-restart.

set -e

PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/next-supervisor.log

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ORRA-Startup] $1" | tee -a "$LOG_FILE"
}

log "ORRA custom startup script running..."

# Step 1: Install dependencies if needed
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  log "Installing dependencies..."
  cd "$PROJECT_DIR"
  npm install 2>&1 | tee -a "$LOG_FILE"
fi

# Step 2: Generate Prisma client
cd "$PROJECT_DIR"
log "Generating Prisma client..."
npx prisma generate 2>&1 | tee -a "$LOG_FILE"

# Step 3: Push database schema
log "Pushing database schema..."
npx prisma db push 2>&1 | tee -a "$LOG_FILE"

# Step 4: Build if .next doesn't exist
if [ ! -d "$PROJECT_DIR/.next" ]; then
  log "Building Next.js (first time)..."
  npx next build --webpack 2>&1 | tee -a "$LOG_FILE"
fi

# Step 5: Start Next.js with auto-restart
log "Starting Next.js in production mode with supervisor..."

MAX_RESTARTS=10
RESTART_COUNT=0
LAST_START=0
RESTART_WINDOW=300  # Reset counter after 5 minutes of uptime

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
  NOW=$(date +%s)

  # Reset restart counter if running for more than 5 minutes
  if [ $((NOW - LAST_START)) -gt $RESTART_WINDOW ] && [ $RESTART_COUNT -gt 0 ]; then
    log "Process ran for $RESTART_WINDOW+ seconds, resetting restart counter"
    RESTART_COUNT=0
  fi

  LAST_START=$NOW
  RESTART_COUNT=$((RESTART_COUNT + 1))

  log "Starting Next.js (attempt $RESTART_COUNT/$MAX_RESTARTS)..."

  cd "$PROJECT_DIR"
  npx next start -p 3000 2>&1 | tee -a "$LOG_FILE"

  EXIT_CODE=${PIPESTATUS[0]}
  log "Next.js exited with code $EXIT_CODE"

  # Clean shutdown
  if [ $EXIT_CODE -eq 0 ]; then
    log "Clean shutdown, not restarting"
    break
  fi

  # Wait before restarting
  log "Waiting 3 seconds before restart..."
  sleep 3
done

log "Supervisor exiting (max restarts reached or clean shutdown)"
