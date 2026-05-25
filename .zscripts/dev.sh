#!/bin/bash
# =============================================================================
# ORRA Simple Startup v8 - Stable Daemon
# =============================================================================
# Uses double-fork daemonization so the server survives process group cleanup.
# The supervisor gets adopted by PID 1 (tini), making it immune to kills.
# =============================================================================

PROJECT_DIR=/home/z/my-project
DB_FILE=$PROJECT_DIR/db/custom.db
DB_BACKUP=/home/sync/orra-db-backup/latest.db
BUILD_CACHE=/home/sync/orra-build-cache
LOG_FILE=$PROJECT_DIR/orra-supervisor.log

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

cd "$PROJECT_DIR"

# Step 1: Bun cache symlink
if [ ! -L /home/z/.bun/install/cache ] && [ -d /home/sync/orra-bun-cache ]; then
  rm -rf /home/z/.bun/install/cache 2>/dev/null
  ln -s /home/sync/orra-bun-cache /home/z/.bun/install/cache 2>/dev/null
fi

# Step 2: node_modules (NOT in repo.tar)
if [ ! -d "$PROJECT_DIR/node_modules/next" ]; then
  log "node_modules missing - installing with bun..."
  bun install 2>&1 | tail -3 | tee -a "$LOG_FILE"
  log "Dependencies installed"
fi

# Step 3: Restore .next build (essential files only, no webpack cache)
if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ] || [ ! -f "$PROJECT_DIR/.next/routes-manifest.json" ]; then
  if [ -f "$BUILD_CACHE/.next/BUILD_ID" ] && [ -f "$BUILD_CACHE/.next/routes-manifest.json" ]; then
    log "Restoring build from cache..."
    mkdir -p "$PROJECT_DIR/.next"
    cp -r "$BUILD_CACHE/.next/server" "$PROJECT_DIR/.next/" 2>/dev/null
    cp -r "$BUILD_CACHE/.next/static" "$PROJECT_DIR/.next/" 2>/dev/null
    cp -r "$BUILD_CACHE/.next/types" "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/BUILD_ID" "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/"*.json "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/"*.js "$PROJECT_DIR/.next/" 2>/dev/null
    cp "$BUILD_CACHE/.next/trace" "$PROJECT_DIR/.next/" 2>/dev/null
    log "Build restored"
  else
    log "No build cache - building now..."
    npx next build --webpack 2>&1 | tail -5 | tee -a "$LOG_FILE"
    mkdir -p "$BUILD_CACHE/.next"
    cp -r "$PROJECT_DIR/.next/server" "$BUILD_CACHE/.next/" 2>/dev/null
    cp -r "$PROJECT_DIR/.next/static" "$BUILD_CACHE/.next/" 2>/dev/null
    cp -r "$PROJECT_DIR/.next/types" "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/BUILD_ID" "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/"*.json "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/"*.js "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/trace" "$BUILD_CACHE/.next/" 2>/dev/null
    log "Build complete and cached"
  fi
fi

# Step 4: Restore DB
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  if [ -f "$DB_BACKUP" ] && [ -s "$DB_BACKUP" ]; then
    log "Restoring DB from backup..."
    mkdir -p "$PROJECT_DIR/db"
    cp "$DB_BACKUP" "$DB_FILE"
  fi
fi

# Prisma generate if client missing
if [ ! -d "$PROJECT_DIR/node_modules/.prisma/client" ]; then
  log "Generating Prisma client..."
  npx prisma generate 2>&1 | tail -1 | tee -a "$LOG_FILE"
fi

# Step 5: Patch Caddy config with keep-alive
if [ -w /app/Caddyfile ] 2>/dev/null; then
  if ! grep -q "keep_alive" /app/Caddyfile 2>/dev/null; then
    sed -i '/^:81 {/a\\tkeep_alive 30s' /app/Caddyfile 2>/dev/null
    caddy reload --config /app/Caddyfile --adapter caddyfile 2>/dev/null || true
    log "Patched Caddy with keep_alive 30s"
  fi
fi

# Step 6: Launch supervisor daemon (double-fork for PPID=1 survival)
pkill -f "node server.js" 2>/dev/null || true
sleep 0.5

log "Launching supervisor daemon..."

# Double-fork: creates new session, process gets adopted by PID 1
(
  setsid bash -c '
    cd /home/z/my-project
    export NODE_ENV=production
    export DATABASE_URL="file:/home/z/my-project/db/custom.db"
    export NEXTAUTH_SECRET="orra-s3cr3t-k3rman3nt-2024"
    export NEXTAUTH_URL="http://localhost:3000"
    export AUTH_TRUST_HOST=true
    export AUTOPOST_KEY="orra-internal-autopost-2026"
    LOG_FILE=/home/z/my-project/orra-supervisor.log
    DB_FILE=/home/z/my-project/db/custom.db

    echo "[$(date +%H:%M:%S)] Supervisor daemon started (PPID=$(ps -o ppid= -p $$))" >> "$LOG_FILE"

    while true; do
      node server.js >> "$LOG_FILE" 2>&1 &
      SERVER_PID=$!
      echo "[$(date +%H:%M:%S)] Server started (PID: $SERVER_PID)" >> "$LOG_FILE"

      # Wait for server to be ready
      for i in $(seq 1 15); do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200\|302"; then
          echo "[$(date +%H:%M:%S)] Server UP (${i}s)" >> "$LOG_FILE"
          break
        fi
        sleep 1
      done

      # Keep-alive + DB backup while server is alive
      LAST_BACKUP=$(date +%s)
      while kill -0 $SERVER_PID 2>/dev/null; do
        NOW=$(date +%s)

        # Self-ping every 15 seconds (keeps process active)
        curl -s -o /dev/null http://localhost:3000/api/health 2>/dev/null || true

        # Backup DB every 2 minutes
        if [ $((NOW - LAST_BACKUP)) -gt 120 ]; then
          if [ -f "$DB_FILE" ]; then
            mkdir -p /home/sync/orra-db-backup 2>/dev/null
            cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
          fi
          LAST_BACKUP=$NOW
        fi
        sleep 15
      done

      # Server died - restart
      wait $SERVER_PID 2>/dev/null
      EXIT_CODE=$?
      echo "[$(date +%H:%M:%S)] Server exited (code: $EXIT_CODE) - restarting in 5s..." >> "$LOG_FILE"
      sleep 5
    done
  ' &
) &

log "Supervisor daemon launched. dev.sh exiting."
