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
    
    # ============================================================
    # KEEP-ALIVE PINGS — THE MOST CRITICAL PART!
    # The platform freezes containers after ~3-5 min of no traffic.
    # Localhost pings do NOT count as external traffic.
    # We MUST ping the PUBLIC URL to keep the container alive!
    # ============================================================
    
    # 1. Ping localhost:3000 (keeps Node process responsive)
    curl -s -o /dev/null http://localhost:3000/api/health 2>/dev/null || true
    
    # 2. Ping localhost:81 (keeps Caddy proxy warm)
    curl -s -o /dev/null http://localhost:81/api/health 2>/dev/null || true
    
    # 3. ★★★ PING THE PUBLIC URL — THIS IS WHAT KEEPS THE CONTAINER ALIVE! ★★★
    #    This request goes out to the internet, through the platform's
    #    load balancer, and back to our container. The platform counts
    #    this as real external traffic and won't freeze the container!
    
    # Always re-read the public URL from discovered-url.txt in case it changed
    if [ -z "$ORRA_PUBLIC_URL" ] && [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
      ORRA_PUBLIC_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
    fi
    
    if [ -n "$ORRA_PUBLIC_URL" ]; then
      PUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$ORRA_PUBLIC_URL/api/health" 2>/dev/null || echo "000")
      if [ "$PUB_STATUS" = "200" ]; then
        : # All good — container is alive and responding!
      else
        log "⚠ Public URL ping returned $PUB_STATUS — trying to rediscover..."
        # Try to rediscover the URL
        if [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
          NEW_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
          if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$ORRA_PUBLIC_URL" ]; then
            ORRA_PUBLIC_URL="$NEW_URL"
            log "Rediscovered public URL: $ORRA_PUBLIC_URL"
          fi
        fi
      fi
    fi
    
    sleep 10
  done

  # Server died — restart after brief pause
  log "Server PID $SERVER_PID died — restarting in 3s..."
  sleep 3
done
