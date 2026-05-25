#!/bin/bash
# =============================================================================
# ORRA Simple Startup v5
# =============================================================================
# Cold start chain:
#   1. Restore bun cache symlink (instant)
#   2. Install node_modules if missing (~20-30s with bun cache)
#   3. Restore .next build from /home/sync/ cache (~2s, only 13MB)
#   4. Restore DB from /home/sync/ backup (~1s)
#   5. Start server IMMEDIATELY (~3s)
#   6. Background: rebuild .next if cache was incomplete
# =============================================================================

PROJECT_DIR=/home/z/my-project
DB_FILE=$PROJECT_DIR/db/custom.db
DB_BACKUP=/home/sync/orra-db-backup/latest.db
BUILD_CACHE=/home/sync/orra-build-cache
LOG_FILE=$PROJECT_DIR/next-supervisor.log

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

cd "$PROJECT_DIR"

# =============================================================================
# STEP 0: Bun cache — packages persist across rebuilds
# =============================================================================
if [ ! -L /home/z/.bun/install/cache ] && [ -d /home/sync/orra-bun-cache ]; then
  rm -rf /home/z/.bun/install/cache 2>/dev/null
  ln -s /home/sync/orra-bun-cache /home/z/.bun/install/cache 2>/dev/null
fi

# =============================================================================
# STEP 1: node_modules — NOT in repo.tar, must install on cold start
# =============================================================================
if [ ! -d "$PROJECT_DIR/node_modules/next" ]; then
  log "node_modules missing — installing with bun..."
  bun install 2>&1 | tail -3 | tee -a "$LOG_FILE"
  log "Dependencies installed"
fi

# =============================================================================
# STEP 2: Restore .next build from /home/sync/ cache (~2s for 13MB)
# =============================================================================
# Only the essential files are cached (no webpack cache = 13MB vs 268MB)
if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ] || [ ! -f "$PROJECT_DIR/.next/routes-manifest.json" ]; then
  if [ -f "$BUILD_CACHE/.next/BUILD_ID" ] && [ -f "$BUILD_CACHE/.next/routes-manifest.json" ]; then
    log "Restoring build from /home/sync/ cache..."
    mkdir -p "$PROJECT_DIR/.next"
    # Copy essential files (skip the 254MB cache/ dir)
    cp -r "$BUILD_CACHE/.next/server" "$PROJECT_DIR/.next/" 2>/dev/null
    cp -r "$BUILD_CACHE/.next/static" "$PROJECT_DIR/.next/" 2>/dev/null
    cp -r "$BUILD_CACHE/.next/types" "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/BUILD_ID" "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/"*.json "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/"*.js "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/trace" "$PROJECT_DIR/.next/" 2>/dev/null
    log "Build restored from cache"
  else
    log "WARNING: No build cache — will build after server starts"
  fi
fi

# =============================================================================
# STEP 3: Restore DB from /home/sync/ backup
# =============================================================================
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  if [ -f "$DB_BACKUP" ] && [ -s "$DB_BACKUP" ]; then
    log "Restoring DB from backup..."
    mkdir -p "$PROJECT_DIR/db"
    cp "$DB_BACKUP" "$DB_FILE"
  else
    log "No DB backup found"
  fi
fi

# Prisma generate if client missing
if [ ! -d "$PROJECT_DIR/node_modules/.prisma/client" ]; then
  log "Generating Prisma client..."
  npx prisma generate 2>&1 | tail -1 | tee -a "$LOG_FILE"
fi

# =============================================================================
# STEP 4: Start server IMMEDIATELY
# =============================================================================
export NODE_ENV=production
export DATABASE_URL="file:$DB_FILE"
export NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export AUTOPOST_KEY="orra-internal-autopost-2026"

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

  # Keep alive + backup DB every 2 minutes
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
# STEP 5: Background tasks — AFTER server is up
# =============================================================================
(
  # Wait for server
  for i in $(seq 1 30); do
    curl -s -o /dev/null http://localhost:3000/ 2>/dev/null && break
    sleep 1
  done

  # If build was incomplete, rebuild now
  if [ ! -f "$PROJECT_DIR/.next/routes-manifest.json" ]; then
    log "Build incomplete — rebuilding..."
    npx next build --webpack 2>&1 | tail -3 | tee -a "$LOG_FILE"
    log "Build done — restarting server"
    pkill -f "node server.js" 2>/dev/null || true
  fi

  # Update build cache if needed (only essential files, skip cache/ dir)
  if [ -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
    CACHED_ID=$(cat "$BUILD_CACHE/.next/BUILD_ID" 2>/dev/null || echo "")
    CURRENT_ID=$(cat "$PROJECT_DIR/.next/BUILD_ID" 2>/dev/null || echo "")
    if [ "$CACHED_ID" != "$CURRENT_ID" ] || [ ! -f "$BUILD_CACHE/.next/routes-manifest.json" ]; then
      log "Updating build cache on /home/sync/..."
      mkdir -p "$BUILD_CACHE/.next"
      cp -r "$PROJECT_DIR/.next/server" "$BUILD_CACHE/.next/" 2>/dev/null
      cp -r "$PROJECT_DIR/.next/static" "$BUILD_CACHE/.next/" 2>/dev/null
      cp -r "$PROJECT_DIR/.next/types" "$BUILD_CACHE/.next/" 2>/dev/null
      cp "$PROJECT_DIR/.next/BUILD_ID" "$BUILD_CACHE/.next/" 2>/dev/null
      cp "$PROJECT_DIR/.next/"*.json "$BUILD_CACHE/.next/" 2>/dev/null
      cp "$PROJECT_DIR/.next/"*.js "$BUILD_CACHE/.next/" 2>/dev/null
      cp "$PROJECT_DIR/.next/trace" "$BUILD_CACHE/.next/" 2>/dev/null
      log "Build cache updated"
    fi
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
