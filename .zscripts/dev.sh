#!/bin/bash
# =============================================================================
# ORRA Simple Startup
# =============================================================================
# Start the server FAST. That's it.
# - Restore DB + build from /home/sync/ if missing (~2-5s)
# - Start server IMMEDIATELY
# - Background tasks (backup, migrate) run AFTER server is up
# =============================================================================

PROJECT_DIR=/home/z/my-project
DB_FILE=$PROJECT_DIR/db/custom.db
DB_BACKUP=/home/sync/orra-db-backup/latest.db
BUILD_CACHE=/home/sync/orra-build-cache/next
LOG_FILE=$PROJECT_DIR/next-supervisor.log

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

cd "$PROJECT_DIR"

# =============================================================================
# STEP 1: Quick restore (~1-5s) — only if something is missing
# =============================================================================

# Restore DB if missing
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  if [ -f "$DB_BACKUP" ] && [ -s "$DB_BACKUP" ]; then
    log "Restoring DB from backup..."
    mkdir -p "$PROJECT_DIR/db"
    cp "$DB_BACKUP" "$DB_FILE"
  else
    log "No DB backup found — will seed after server starts"
  fi
fi

# Restore build if missing — this is the KEY fix
# Cache on /home/sync/ which SURVIVES container rebuilds
if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
  if [ -d "$BUILD_CACHE" ] && [ -f "$BUILD_CACHE/BUILD_ID" ]; then
    log "Restoring build from /home/sync/ cache..."
    cp -r "$BUILD_CACHE" "$PROJECT_DIR/.next"
    log "Build restored"
  else
    log "No build cache — will build after server starts"
  fi
fi

# =============================================================================
# STEP 2: Start server IMMEDIATELY (~3s to respond)
# =============================================================================

export NODE_ENV=production
export DATABASE_URL="file:$DB_FILE"
export NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export AUTOPOST_KEY="orra-internal-autopost-2026"

# Kill any old server
pkill -f "node server.js" 2>/dev/null || true
sleep 0.5

log "Starting server..."

# Start server in foreground — supervisor loop
while true; do
  node server.js 2>>"$LOG_FILE" &
  SERVER_PID=$!
  log "Server started (PID: $SERVER_PID)"

  # Wait for server to be ready (up to 15s)
  for i in $(seq 1 15); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200\|302"; then
      log "Server UP (${i}s)"
      break
    fi
    sleep 1
  done

  # Wait for server to die, with periodic DB backup
  LAST_BACKUP=$(date +%s)
  while kill -0 $SERVER_PID 2>/dev/null; do
    NOW=$(date +%s)
    # Backup DB every 2 minutes
    if [ $((NOW - LAST_BACKUP)) -gt 120 ]; then
      if [ -f "$DB_FILE" ]; then
        mkdir -p /home/sync/orra-db-backup
        cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
      fi
      LAST_BACKUP=$NOW
    fi
    sleep 10
  done

  # Server died — restart
  log "Server died — restarting in 3s..."
  sleep 3
done &
SERVER_LOOP_PID=$!

# =============================================================================
# STEP 3: Background tasks — AFTER server is up
# =============================================================================

(
  # Wait for server to be serving requests
  for i in $(seq 1 30); do
    curl -s -o /dev/null http://localhost:3000/ 2>/dev/null && break
    sleep 1
  done

  # Save build to persistent cache (so next cold start is fast)
  if [ -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
    mkdir -p /home/sync/orra-build-cache
    if [ ! -f "/home/sync/orra-build-cache/.build-sig" ]; then
      log "Saving build to /home/sync/ cache..."
      rm -rf /home/sync/orra-build-cache/next
      cp -r "$PROJECT_DIR/.next" /home/sync/orra-build-cache/next
      echo "cached" > /home/sync/orra-build-cache/.build-sig
      log "Build cached"
    fi
  fi

  # If no build exists at all, build now (server shows error page but at least it responds)
  if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
    log "Building app (server is already running with error page)..."
    npx next build --webpack 2>&1 | tail -3 | tee -a "$LOG_FILE"
    log "Build done — restart server to pick it up"
    pkill -f "node server.js" 2>/dev/null || true

    # Save to cache
    mkdir -p /home/sync/orra-build-cache
    rm -rf /home/sync/orra-build-cache/next
    cp -r "$PROJECT_DIR/.next" /home/sync/orra-build-cache/next
    echo "cached" > /home/sync/orra-build-cache/.build-sig
  fi

  # Prisma migrate (only if needed — usually a no-op)
  npx prisma migrate deploy 2>&1 | tail -1 | tee -a "$LOG_FILE" || true

  # Seed DB if empty
  USER_COUNT=$(node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); const r = db.prepare('SELECT count(*) as c FROM User').get(); console.log(r.c); db.close(); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
  if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    log "Seeding DB..."
    npm run db:seed 2>&1 >> "$LOG_FILE" || true
    mkdir -p /home/sync/orra-db-backup
    cp "$DB_FILE" /home/sync/orra-db-backup/latest.db
  fi

  # Save Prisma client to persistent cache too
  if [ -d "$PROJECT_DIR/node_modules/.prisma" ] && [ ! -d "/home/sync/orra-build-cache/prisma-client" ]; then
    cp -r "$PROJECT_DIR/node_modules/.prisma" /home/sync/orra-build-cache/prisma-client
  fi
) &

log "Startup complete — server running, background tasks started"

# Wait for the supervisor loop
wait $SERVER_LOOP_PID
