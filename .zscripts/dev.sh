#!/bin/bash
# ORRA Custom Startup Script
# - Restores DB from backup if available, or seeds fresh (ONCE only)
# - NEVER re-seeds if data already exists (preserves user customizations)
# - Auto-backs up DB to persistent storage + git
# - Starts Next.js with auto-restart supervisor

set -e

PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/next-supervisor.log
DB_FILE=$PROJECT_DIR/db/custom.db
PERSISTENT_BACKUP=/home/sync/orra-db-backup/latest.db

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

# Step 3: Check for persistent backup FIRST (before creating any DB)
# The persistent backup at /home/sync/ survives container rebuilds
if [ -f "$PERSISTENT_BACKUP" ]; then
  log "Found persistent DB backup at $PERSISTENT_BACKUP"
  
  # Ensure db directory exists
  mkdir -p "$PROJECT_DIR/db"
  
  # Only restore if no current DB or current DB is empty
  SEED_NEEDED=false
  if [ -f "$DB_FILE" ]; then
    USER_COUNT=$(cd "$PROJECT_DIR" && node -e "
      const { PrismaClient } = require('@prisma/client');
      const db = new PrismaClient();
      db.user.count().then(c => { console.log(c); db.\$disconnect(); }).catch(() => { console.log('0'); db.\$disconnect(); });
    " 2>/dev/null || echo "0")
    
    if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
      log "Current DB has 0 users, restoring from backup..."
      cp "$PERSISTENT_BACKUP" "$DB_FILE"
      SEED_NEEDED=false
    else
      log "Current DB has $USER_COUNT users — keeping it (NOT overwriting with backup)!"
      SEED_NEEDED=false
    fi
  else
    log "No current DB, restoring from backup..."
    cp "$PERSISTENT_BACKUP" "$DB_FILE"
    SEED_NEEDED=false
  fi
  
  # Push schema to ensure it's up to date (adds any new columns)
  log "Pushing database schema (non-destructive)..."
  npx prisma db push 2>&1 | tee -a "$LOG_FILE"
  
else
  log "No persistent backup found, checking for existing DB..."
  
  # Push schema to create tables if needed
  log "Pushing database schema..."
  npx prisma db push 2>&1 | tee -a "$LOG_FILE"
  
  # Check if DB already has data
  USER_COUNT=$(cd "$PROJECT_DIR" && node -e "
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    db.user.count().then(c => { console.log(c); db.\$disconnect(); }).catch(() => { console.log('0'); db.\$disconnect(); });
  " 2>/dev/null || echo "0")
  
  if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    log "DB is empty, will seed with default data..."
    SEED_NEEDED=true
  else
    log "DB already has $USER_COUNT users — NOT seeding (preserving data)!"
    SEED_NEEDED=false
  fi
fi

# Step 4: Seed ONLY if DB is empty (never wipes existing data)
if [ "$SEED_NEEDED" = true ]; then
  log "Seeding database with founder + 25 bots + posts (safe mode)..."
  cd "$PROJECT_DIR"
  npm run db:seed 2>&1 | tee -a "$LOG_FILE"
  
  # Make initial backup so we have something for next time
  log "Creating initial backup..."
  mkdir -p /home/sync/orra-db-backup
  cp "$DB_FILE" /home/sync/orra-db-backup/latest.db
  log "Initial backup created"
fi

# ALWAYS ensure founder password is correct
log "Ensuring founder password is set..."
node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const db = new PrismaClient();
  async function main() {
    const hash = await bcrypt.hash('Weareone504', 12);
    try {
      await db.user.update({ where: { id: 'founder' }, data: { password: hash } });
      console.log('Founder password set');
    } catch {
      try {
        await db.user.update({ where: { email: 'nickjoseph8087@gmail.com' }, data: { password: hash } });
        console.log('Founder password set (by email)');
      } catch { console.log('No founder to update'); }
    }
  }
  main().catch(console.error).finally(() => db.\$disconnect());
" 2>&1 | tee -a "$LOG_FILE"

# Step 5: Build if .next doesn't exist
if [ ! -d "$PROJECT_DIR/.next" ]; then
  log "Building Next.js (first time)..."
  cd "$PROJECT_DIR"
  npx next build --webpack 2>&1 | tee -a "$LOG_FILE"
fi

# Step 6: Start auto-backup cron (backs up DB every 5 minutes)
log "Starting auto-backup daemon..."
(
  while true; do
    sleep 300  # 5 minutes
    if [ -f "$DB_FILE" ]; then
      mkdir -p /home/sync/orra-db-backup
      cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
      # Also create timestamped backup every hour
      MINUTE=$(date +%M)
      if [ "$MINUTE" -lt "5" ]; then
        TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
        cp "$DB_FILE" "/home/sync/orra-db-backup/orra-${TIMESTAMP}.db" 2>/dev/null || true
        # Keep only last 24 hourly backups
        ls -t /home/sync/orra-db-backup/orra-*.db 2>/dev/null | tail -n +25 | xargs -r rm 2>/dev/null || true
      fi
    fi
  done
) &
BACKUP_PID=$!
log "Auto-backup daemon started (PID: $BACKUP_PID)"

# Step 7: Start Next.js with auto-restart
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

  # Before restarting, back up the database
  log "Backing up database before restart..."
  mkdir -p /home/sync/orra-db-backup
  cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true

  # Wait before restarting
  log "Waiting 3 seconds before restart..."
  sleep 3
done

log "Supervisor exiting (max restarts reached or clean shutdown)"

# Kill backup daemon on exit
kill $BACKUP_PID 2>/dev/null || true
