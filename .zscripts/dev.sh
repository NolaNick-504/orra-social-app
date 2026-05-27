#!/bin/bash
# =============================================================================
# ORRA Fast Startup Script v3.1
# =============================================================================
# Server starts in ~4 seconds. Simple, reliable supervisor loop.
#
# KEY LESSONS:
# - prisma migrate deploy LOCKS SQLite — must run BEFORE server starts
# - aura-daemon kills the server that dev.sh started — don't use both
# - Simple supervisor loop is more reliable than complex health checks
# =============================================================================

PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/next-supervisor.log
DB_FILE=$PROJECT_DIR/db/custom.db
PERSISTENT_BACKUP=/home/sync/orra-db-backup/latest.db

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ORRA] $1" | tee -a "$LOG_FILE"
}

# Prevent concurrent startups
LOCK_FILE=/tmp/orra-startup.lock
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null)
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    log "Another startup is running (PID $LOCK_PID). Exiting."
    exit 0
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Shutdown hook: backup DB
cleanup() {
  log "Shutdown — backing up DB..."
  if [ -f "$DB_FILE" ]; then
    node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); db.pragma('wal_checkpoint(TRUNCATE)'); db.close(); } catch(e) {}" 2>/dev/null || true
    mkdir -p /home/sync/orra-db-backup
    cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
  fi
  rm -f "$LOCK_FILE"
}
trap cleanup SIGTERM SIGINT

log "ORRA Fast Startup v3.2 (aggressive keep-alive)"
cd "$PROJECT_DIR"

# =============================================================================
# PRE-START — Must complete before server starts (~8 seconds)
# =============================================================================

# 1. Restore DB from persistent backup if missing
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  if [ -f "$PERSISTENT_BACKUP" ] && [ -s "$PERSISTENT_BACKUP" ]; then
    log "DB missing — restoring from backup..."
    mkdir -p "$PROJECT_DIR/db"
    cp "$PERSISTENT_BACKUP" "$DB_FILE"
  fi
else
  USER_COUNT=$(node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); const r = db.prepare('SELECT count(*) as c FROM User').get(); console.log(r.c); db.close(); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
  if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    if [ -f "$PERSISTENT_BACKUP" ] && [ -s "$PERSISTENT_BACKUP" ]; then
      log "DB has 0 users — restoring from backup..."
      cp "$PERSISTENT_BACKUP" "$DB_FILE"
    fi
  else
    log "DB OK ($USER_COUNT users)"
  fi
fi

# 2. WAL checkpoint
node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); db.pragma('wal_checkpoint(TRUNCATE)'); db.close(); } catch(e) {}" 2>/dev/null || true

# 3. Prisma generate if needed
if [ ! -d "$PROJECT_DIR/node_modules/.prisma/client" ]; then
  log "Generating Prisma client..."
  npx prisma generate 2>&1 | tail -1 | tee -a "$LOG_FILE"
fi

# 4. Schema changes BEFORE server (MUST — locks DB)
HAS_MIGRATIONS=$(node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); const t = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'\").all(); console.log(t.length > 0 ? 'yes' : 'no'); db.close(); } catch(e) { console.log('no'); }" 2>/dev/null || echo "no")
if [ "$HAS_MIGRATIONS" = "yes" ]; then
  npx prisma migrate deploy 2>&1 | tail -2 | tee -a "$LOG_FILE"
else
  npx prisma db push --skip-generate 2>&1 | tail -2 | tee -a "$LOG_FILE"
fi

# 5. Build if missing
if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
  python3 "$PROJECT_DIR/.zscripts/build-preserver.py" --restore 2>/dev/null || true
  if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
    log "Building (takes ~30s)..."
    npx next build --webpack 2>&1 | tail -3 | tee -a "$LOG_FILE"
    python3 "$PROJECT_DIR/.zscripts/build-preserver.py" --sync 2>/dev/null || true
  fi
fi

# 6. Seed if empty
USER_COUNT=$(node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); const r = db.prepare('SELECT count(*) as c FROM User').get(); console.log(r.c); db.close(); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  log "Seeding DB..."
  npm run db:seed 2>&1 >> "$LOG_FILE"
  mkdir -p /home/sync/orra-db-backup
  cp "$DB_FILE" /home/sync/orra-db-backup/latest.db
fi

# =============================================================================
# START SERVER + SIMPLE SUPERVISOR
# =============================================================================

export NODE_ENV=production
export DATABASE_URL="file:$DB_FILE"
export NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export AUTOPOST_KEY="orra-internal-autopost-2026"

# Kill any existing server
pkill -f "node server.js" 2>/dev/null || true
sleep 0.5

log "Starting server..."

# Simple, reliable supervisor loop
# - Starts the server
# - If it crashes, restarts after 3 seconds
# - Backs up DB every 2 minutes
# - Pings keep-alive every 10 seconds

LAST_BACKUP=$(date +%s)

while true; do
  node server.js 2>>"$LOG_FILE" &
  SERVER_PID=$!
  log "Server started (PID: $SERVER_PID)"

  # Wait for server to become ready
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
      log "Server is UP (${i}s)"
      break
    fi
    sleep 1
  done

  # Wait for server to die, doing periodic tasks
  while kill -0 $SERVER_PID 2>/dev/null; do
    NOW=$(date +%s)
    
    # Backup DB every 2 minutes
    if [ $((NOW - LAST_BACKUP)) -gt 120 ]; then
      node -e "try { const Database = require('better-sqlite3'); const db = new Database('$DB_FILE'); db.pragma('wal_checkpoint(TRUNCATE)'); db.close(); } catch(e) {}" 2>/dev/null || true
      mkdir -p /home/sync/orra-db-backup
      cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
      LAST_BACKUP=$NOW
    fi
    
    # Keep-alive pings (prevents FC idle timeout)
    # Ping BOTH port 3000 (direct) AND port 81 (Caddy proxy) to keep the full chain warm
    curl -s -o /dev/null http://localhost:3000/api/health 2>/dev/null || true
    curl -s -o /dev/null http://localhost:81/api/health 2>/dev/null || true
    
    sleep 10
  done

  # Server died — restart after brief pause
  log "Server PID $SERVER_PID died — restarting in 3s..."
  sleep 3
done
