#!/bin/bash
# =============================================================================
# ORRA Simple Startup
# =============================================================================
# Start the server FAST. Nothing else blocks it.
# - Restore DB + build from /home/sync/ if missing
# - Start server IMMEDIATELY
# - Background tasks (backup, cache) run AFTER server is up
# =============================================================================

PROJECT_DIR=/home/z/my-project
DB_FILE=$PROJECT_DIR/db/custom.db
DB_BACKUP=/home/sync/orra-db-backup/latest.db
BUILD_CACHE=/home/sync/orra-build-cache
LOG_FILE=$PROJECT_DIR/next-supervisor.log

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

cd "$PROJECT_DIR"

# =============================================================================
# STEP 1: Quick restore — only if something is missing
# =============================================================================

# Restore DB if missing (~1s)
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  if [ -f "$DB_BACKUP" ] && [ -s "$DB_BACKUP" ]; then
    log "Restoring DB from backup..."
    mkdir -p "$PROJECT_DIR/db"
    cp "$DB_BACKUP" "$DB_FILE"
  else
    log "No DB backup found"
  fi
fi

# Restore build if missing — from /home/sync/ which SURVIVES container rebuilds
if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
  if [ -f "$BUILD_CACHE/.next/BUILD_ID" ]; then
    log "Restoring build from /home/sync/ cache..."
    tar -xf - -C "$PROJECT_DIR" < <(cd "$BUILD_CACHE" && tar -cf - .next) 2>/dev/null || \
      cp -r "$BUILD_CACHE/.next" "$PROJECT_DIR/.next" 2>/dev/null
    log "Build restored"
  else
    log "WARNING: No build cache — app may show errors until background build completes"
  fi
fi

# =============================================================================
# STEP 2: Start server IMMEDIATELY
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

# Supervisor loop
while true; do
  node server.js 2>>"$LOG_FILE" &
  SERVER_PID=$!
  log "Server started (PID: $SERVER_PID)"

  # Wait for server to be ready
  for i in $(seq 1 15); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200\|302"; then
      log "Server UP (${i}s)"
      break
    fi
    sleep 1
  done

  # Keep server alive, backup DB periodically
  LAST_BACKUP=$(date +%s)
  while kill -0 $SERVER_PID 2>/dev/null; do
    NOW=$(date +%s)
    if [ $((NOW - LAST_BACKUP)) -gt 120 ]; then
      if [ -f "$DB_FILE" ]; then
        mkdir -p /home/sync/orra-db-backup
        cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
      fi
      LAST_BACKUP=$NOW
    fi
    sleep 10
  done

  log "Server died — restarting in 3s..."
  sleep 3
done &

# =============================================================================
# STEP 3: Background tasks (AFTER server is up)
# =============================================================================
(
  # Wait for server
  for i in $(seq 1 30); do
    curl -s -o /dev/null http://localhost:3000/ 2>/dev/null && break
    sleep 1
  done

  # Cache build to /home/sync/ if not already cached
  if [ -f "$PROJECT_DIR/.next/BUILD_ID" ] && [ ! -f "$BUILD_CACHE/.next/BUILD_ID" ]; then
    log "Caching build to /home/sync/ (background)..."
    mkdir -p "$BUILD_CACHE"
    (cd "$PROJECT_DIR" && tar -cf - .next) | (cd "$BUILD_CACHE" && tar -xf -) 2>/dev/null
    log "Build cached"
  fi

  # If no build at all, build now (server already running — will restart after)
  if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
    log "Building app in background..."
    npx next build --webpack 2>&1 | tail -3 | tee -a "$LOG_FILE"
    log "Build done — restarting server"
    pkill -f "node server.js" 2>/dev/null || true
    # Cache the new build
    mkdir -p "$BUILD_CACHE"
    (cd "$PROJECT_DIR" && tar -cf - .next) | (cd "$BUILD_CACHE" && tar -xf -) 2>/dev/null
  fi

  # Prisma migrate (usually a no-op)
  npx prisma migrate deploy 2>&1 | tail -1 | tee -a "$LOG_FILE" || true

  # Seed DB if empty
  USER_COUNT=$(node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); const r = db.prepare('SELECT count(*) as c FROM User').get(); console.log(r.c); db.close(); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
  if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    log "Seeding DB..."
    npm run db:seed 2>&1 >> "$LOG_FILE" || true
    mkdir -p /home/sync/orra-db-backup
    cp "$DB_FILE" /home/sync/orra-db-backup/latest.db
  fi
) &

log "Startup complete"

# Keep script alive
wait
