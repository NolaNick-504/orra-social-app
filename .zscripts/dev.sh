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

log "ORRA Fast Startup v3.3 (PUBLIC URL keep-alive — container stays alive!)"
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

# =============================================================================
# DISCOVER & SET THE PUBLIC URL — THIS IS WHAT KEEPS THE CONTAINER ALIVE!
# The platform freezes containers after ~3-5 min of no external traffic.
# Pinging localhost does NOT count as external traffic.
# We MUST ping the public URL so the platform sees real incoming requests.
# =============================================================================
ORRA_PUBLIC_URL=""

# Method 1: Check if already set in environment
if [ -n "$ORRA_PUBLIC_URL_ENV" ] && [ "$ORRA_PUBLIC_URL_ENV" != "" ]; then
  ORRA_PUBLIC_URL="$ORRA_PUBLIC_URL_ENV"
  log "Public URL from env: $ORRA_PUBLIC_URL"
fi

# Method 2: Check discovered-url.txt (saved from previous discovery)
if [ -z "$ORRA_PUBLIC_URL" ] && [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
  SAVED_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
  if [ -n "$SAVED_URL" ] && [[ "$SAVED_URL" == https://* ]]; then
    ORRA_PUBLIC_URL="$SAVED_URL"
    log "Public URL from saved discovery: $ORRA_PUBLIC_URL"
  fi
fi

# Method 3: Probe candidate URLs based on FC_FUNCTION_NAME and hostname
if [ -z "$ORRA_PUBLIC_URL" ]; then
  log "Probing for public URL..."
  FC_NAME="${FC_FUNCTION_NAME:-}"
  HOSTNAME_ID="$(hostname 2>/dev/null)"
  
  # Build candidate list from various env vars
  CANDIDATES=()
  
  # From FC_FUNCTION_NAME (workspace ID)
  if [ -n "$FC_NAME" ]; then
    CANDIDATES+=("https://preview-${FC_NAME}.space.chatglm.site")
    CANDIDATES+=("https://${FC_NAME}.space.chatglm.site")
    # Try without ws- prefix
    NO_WS="${FC_NAME#ws-}"
    CANDIDATES+=("https://preview-chat-${NO_WS}.space.chatglm.site")
    CANDIDATES+=("https://chat-${NO_WS}.space.chatglm.site")
  fi
  
  # From hostname
  if [ -n "$HOSTNAME_ID" ]; then
    CANDIDATES+=("https://preview-${HOSTNAME_ID}.space.chatglm.site")
    CANDIDATES+=("https://${HOSTNAME_ID}.space.chatglm.site")
  fi
  
  # Probe each candidate
  for URL in "${CANDIDATES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL/api/health" 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
      ORRA_PUBLIC_URL="$URL"
      log "★ DISCOVERED PUBLIC URL: $URL"
      echo -n "$URL" > "$PROJECT_DIR/discovered-url.txt"
      break
    fi
  done
fi

# Method 4: Hard-coded fallback (the known working URL for this container)
if [ -z "$ORRA_PUBLIC_URL" ]; then
  FALLBACK_URL="https://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.chatglm.site"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$FALLBACK_URL/api/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    ORRA_PUBLIC_URL="$FALLBACK_URL"
    log "Using fallback public URL: $ORRA_PUBLIC_URL"
    echo -n "$ORRA_PUBLIC_URL" > "$PROJECT_DIR/discovered-url.txt"
  fi
fi

if [ -n "$ORRA_PUBLIC_URL" ]; then
  export ORRA_PUBLIC_URL
  export NEXTAUTH_URL="$ORRA_PUBLIC_URL"
  log "★ PUBLIC URL SET: $ORRA_PUBLIC_URL"
  log "★ NEXTAUTH_URL SET: $ORRA_PUBLIC_URL"
  log "★ Container will be kept alive by pinging this URL!"
else
  log "⚠ WARNING: Could not discover public URL — container may freeze after idle!"
  log "⚠ Self-ping will use localhost only (may not prevent platform freeze)"
fi

# Kill any existing server and old external keep-alive
pkill -f "node server.js" 2>/dev/null || true
pkill -f "external-keepalive.sh" 2>/dev/null || true
sleep 0.5

# Start the EXTERNAL keep-alive daemon (pings the public URL from a separate process)
# This is a belt-and-suspenders approach — even if the server's internal keep-alive
# fails, this separate process will keep pinging the public URL
if [ -n "$ORRA_PUBLIC_URL" ] && [ -f "$PROJECT_DIR/external-keepalive.sh" ]; then
  nohup "$PROJECT_DIR/external-keepalive.sh" >> "$PROJECT_DIR/external-keepalive.log" 2>&1 &
  log "★ External keep-alive daemon started (PID: $!) — pinging $ORRA_PUBLIC_URL every 30s"
fi

log "Starting server..."

# =============================================================================
# PRE-START CHECKS — Verify node_modules and .next are ready before starting
# =============================================================================

# Wait for node_modules to be available (the platform may wipe it on container restart)
MAX_WAIT=120  # Wait up to 2 minutes for node_modules
WAITED=0
while [ ! -d "$PROJECT_DIR/node_modules/next" ] || [ ! -f "$PROJECT_DIR/node_modules/next/package.json" ]; do
  if [ $WAITED -eq 0 ]; then
    log "node_modules not ready — waiting... (will run npm install if needed)"
  fi
  
  # Try running npm install if node_modules is missing
  if [ $WAITED -eq 5 ] || [ $WAITED -eq 30 ] || [ $WAITED -eq 60 ]; then
    log "Running npm install (attempt at ${WAITED}s)..."
    cd "$PROJECT_DIR" && npm install --production 2>&1 | tail -3 | tee -a "$LOG_FILE"
  fi
  
  sleep 5
  WAITED=$((WAITED + 5))
  
  if [ $WAITED -ge $MAX_WAIT ]; then
    log "FATAL: node_modules still not available after ${MAX_WAIT}s — cannot start server"
    log "Will keep retrying..."
    WAITED=0  # Reset and keep trying
  fi
done

if [ $WAITED -gt 0 ]; then
  log "node_modules ready after ${WAITED}s"
else
  log "node_modules OK"
fi

# Wait for .next build to be available
MAX_WAIT=120
WAITED=0
while [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; do
  if [ $WAITED -eq 0 ]; then
    log ".next build not found — checking cache..."
  fi
  
  # Try to restore from build cache
  if [ $WAITED -eq 0 ]; then
    python3 "$PROJECT_DIR/.zscripts/build-preserver.py" --restore 2>/dev/null || true
  fi
  
  # If still no build, run next build
  if [ $WAITED -eq 10 ]; then
    log "Running next build..."
    cd "$PROJECT_DIR" && npx next build --webpack 2>&1 | tail -5 | tee -a "$LOG_FILE"
    python3 "$PROJECT_DIR/.zscripts/build-preserver.py" --sync 2>/dev/null || true
  fi
  
  sleep 5
  WAITED=$((WAITED + 5))
  
  if [ $WAITED -ge $MAX_WAIT ]; then
    log "FATAL: .next build still not available after ${MAX_WAIT}s"
    WAITED=0
  fi
done

if [ $WAITED -gt 0 ]; then
  log ".next build ready after ${WAITED}s"
else
  log ".next build OK"
fi

# =============================================================================
# SUPERVISOR LOOP — with exponential backoff and crash protection
# =============================================================================

LAST_BACKUP=$(date +%s)
CONSECUTIVE_CRASHES=0  # Track crash count for backoff
MAX_FAST_CRASHES=5     # After this many fast crashes, enter cooldown
COOLDOWN_SECONDS=60    # Cooldown period after crash loop

while true; do
  # Kill any zombie processes on port 3000 before starting
  ZOMBIE_PID=$(lsof -ti:3000 2>/dev/null || true)
  if [ -n "$ZOMBIE_PID" ]; then
    log "Killing zombie process on port 3000 (PID: $ZOMBIE_PID)"
    kill -9 $ZOMBIE_PID 2>/dev/null || true
    sleep 1
  fi
  
  node server.js 2>>"$LOG_FILE" &
  SERVER_PID=$!
  
  # Wait for server to become ready (up to 20 seconds)
  SERVER_READY=false
  for i in $(seq 1 20); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
      SERVER_READY=true
      log "Server is UP (${i}s) PID: $SERVER_PID"
      CONSECUTIVE_CRASHES=0  # Reset crash counter on successful start
      break
    fi
    sleep 1
  done
  
  if [ "$SERVER_READY" = false ]; then
    # Server started but never became ready — likely a crash during init
    wait $SERVER_PID 2>/dev/null
    EXIT_CODE=$?
    CONSECUTIVE_CRASHES=$((CONSECUTIVE_CRASHES + 1))
    log "Server PID $SERVER_PID failed to become ready (exit: $EXIT_CODE) — crash #$CONSECUTIVE_CRASHES"
    
    # Exponential backoff on repeated crashes
    if [ $CONSECUTIVE_CRASHES -ge $MAX_FAST_CRASHES ]; then
      log "⚠ $CONSECUTIVE_CRASHES consecutive crashes — entering ${COOLDOWN_SECONDS}s cooldown"
      log "⚠ This usually means node_modules or .next is broken. Will try to fix..."
      
      # Try to fix common issues during cooldown
      if [ ! -d "$PROJECT_DIR/node_modules/next" ]; then
        log "Fixing: Running npm install..."
        cd "$PROJECT_DIR" && npm install --production 2>&1 | tail -3 | tee -a "$LOG_FILE"
      fi
      
      if [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
        log "Fixing: Running next build..."
        cd "$PROJECT_DIR" && npx next build --webpack 2>&1 | tail -3 | tee -a "$LOG_FILE"
        python3 "$PROJECT_DIR/.zscripts/build-preserver.py" --sync 2>/dev/null || true
      fi
      
      sleep $COOLDOWN_SECONDS
      CONSECUTIVE_CRASHES=0  # Reset after cooldown
    else
      sleep 5  # Short delay between crashes
    fi
    continue
  fi

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
    
    # ============================================================
    # KEEP-ALIVE PINGS — THE MOST CRITICAL PART!
    # ============================================================
    
    # 1. Ping localhost:3000 (keeps Node process responsive)
    curl -s -o /dev/null http://localhost:3000/api/health 2>/dev/null || true
    
    # 2. Ping localhost:81 (keeps Caddy proxy warm)
    curl -s -o /dev/null http://localhost:81/api/health 2>/dev/null || true
    
    # 3. ★★★ PING THE PUBLIC URL — THIS IS WHAT KEEPS THE CONTAINER ALIVE! ★★★
    if [ -z "$ORRA_PUBLIC_URL" ] && [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
      ORRA_PUBLIC_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
    fi
    
    if [ -n "$ORRA_PUBLIC_URL" ]; then
      PUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$ORRA_PUBLIC_URL/api/health" 2>/dev/null || echo "000")
      if [ "$PUB_STATUS" = "200" ]; then
        : # All good
      else
        log "⚠ Public URL ping returned $PUB_STATUS"
      fi
    fi
    
    sleep 10
  done

  # Server died after being healthy — this is a real crash, not a startup failure
  CONSECUTIVE_CRASHES=$((CONSECUTIVE_CRASHES + 1))
  log "Server PID $SERVER_PID died after being healthy — crash #$CONSECUTIVE_CRASHES"
  
  if [ $CONSECUTIVE_CRASHES -ge $MAX_FAST_CRASHES ]; then
    log "⚠ Entering ${COOLDOWN_SECONDS}s cooldown after $CONSECUTIVE_CRASHES crashes"
    sleep $COOLDOWN_SECONDS
    CONSECUTIVE_CRASHES=0
  else
    sleep 5
  fi
done
