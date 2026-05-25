#!/bin/bash
# =============================================================================
# ORRA Simple Startup v4
# =============================================================================
# Handles the #1 cold start problem: node_modules is NOT in repo.tar
# So on every container rebuild, we need to restore it.
#
# Priority order:
#   1. Symlink from /home/sync/orra-node-modules (instant, ~0s)
#   2. Run bun install (~20-30s)
# Then: restore DB + build, start server, background tasks
# =============================================================================

PROJECT_DIR=/home/z/my-project
DB_FILE=$PROJECT_DIR/db/custom.db
DB_BACKUP=/home/sync/orra-db-backup/latest.db
BUILD_CACHE=/home/sync/orra-build-cache
NODE_MODULES_CACHE=/home/sync/orra-node-modules
LOG_FILE=$PROJECT_DIR/next-supervisor.log

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

cd "$PROJECT_DIR"

# =============================================================================
# STEP 0: Bun cache — ensure package downloads persist across rebuilds
# =============================================================================
if [ ! -L /home/z/.bun/install/cache ] && [ -d /home/sync/orra-bun-cache ]; then
  rm -rf /home/z/.bun/install/cache 2>/dev/null
  ln -s /home/sync/orra-bun-cache /home/z/.bun/install/cache 2>/dev/null
fi

# =============================================================================
# STEP 1: node_modules — THE #1 COLD START KILLER
# =============================================================================
# On cold start, repo.tar does NOT include node_modules (too big).
# Without this, the server crashes: "Cannot find module 'next'"

if [ ! -d "$PROJECT_DIR/node_modules/next" ]; then
  log "node_modules missing — checking /home/sync/ cache..."

  # Option A: Symlink from persistent cache (instant!)
  if [ -d "$NODE_MODULES_CACHE/next" ]; then
    log "Restoring node_modules via symlink (instant)..."
    rm -rf "$PROJECT_DIR/node_modules" 2>/dev/null
    ln -s "$NODE_MODULES_CACHE" "$PROJECT_DIR/node_modules"
    log "node_modules restored via symlink"
  else
    # Option B: Install from scratch (~20-30s with cache, ~60s without)
    log "No cache — installing dependencies with bun..."
    bun install 2>&1 | tail -3 | tee -a "$LOG_FILE"
    log "Dependencies installed"
  fi
fi

# =============================================================================
# STEP 2: Restore DB + Build from /home/sync/ (~1-5s)
# =============================================================================

# Restore DB if missing
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  if [ -f "$DB_BACKUP" ] && [ -s "$DB_BACKUP" ]; then
    log "Restoring DB from backup..."
    mkdir -p "$PROJECT_DIR/db"
    cp "$DB_BACKUP" "$DB_FILE"
  else
    log "No DB backup found"
  fi
fi

# Restore build if missing
if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
  if [ -f "$BUILD_CACHE/.next/BUILD_ID" ]; then
    log "Restoring build from /home/sync/ cache..."
    (cd "$BUILD_CACHE" && tar -cf - .next) | (cd "$PROJECT_DIR" && tar -xf -) 2>/dev/null || \
      cp -r "$BUILD_CACHE/.next" "$PROJECT_DIR/.next" 2>/dev/null
    log "Build restored"
  else
    log "WARNING: No build cache — will build after server starts"
  fi
fi

# Prisma generate if client missing (usually already in node_modules)
if [ ! -d "$PROJECT_DIR/node_modules/.prisma/client" ]; then
  log "Generating Prisma client..."
  npx prisma generate 2>&1 | tail -1 | tee -a "$LOG_FILE"
fi

# =============================================================================
# STEP 3: Start server IMMEDIATELY
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

# Supervisor loop — keeps server alive, backs up DB periodically
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

  # Keep server alive, backup DB every 2 minutes
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
# STEP 4: Background tasks (AFTER server is up)
# =============================================================================
(
  # Wait for server
  for i in $(seq 1 30); do
    curl -s -o /dev/null http://localhost:3000/ 2>/dev/null && break
    sleep 1
  done

  # Cache build to /home/sync/ if not already cached
  if [ -f "$PROJECT_DIR/.next/BUILD_ID" ] && [ ! -f "$BUILD_CACHE/.next/BUILD_ID" ]; then
    log "Caching build to /home/sync/..."
    mkdir -p "$BUILD_CACHE"
    (cd "$PROJECT_DIR" && tar -cf - .next) | (cd "$BUILD_CACHE" && tar -xf -) 2>/dev/null
    log "Build cached"
  fi

  # If no build at all, build now then restart server
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
