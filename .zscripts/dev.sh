#!/bin/bash
# ORRA Custom Startup Script
# - Restores DB from backup if available, or seeds fresh (ONCE only)
# - NEVER re-seeds if data already exists (preserves user customizations)
# - Runs DB integrity check + WAL checkpoint to prevent corruption
# - Starts aura-daemon.py as the SOLE supervisor for Next.js
#   (NO more supervisor conflicts between dev.sh and aura-daemon)

set -e

PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/next-supervisor.log
DB_FILE=$PROJECT_DIR/db/custom.db
PERSISTENT_BACKUP=/home/sync/orra-db-backup/latest.db
AURA_DAEMON=$PROJECT_DIR/.zscripts/aura-daemon.py

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

# Step 3: Database integrity check + WAL checkpoint
# This is CRITICAL — if the container froze mid-write, the DB may be corrupted
log "Running database integrity check and WAL checkpoint..."
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const DB_PATH = '$DB_FILE';
const BACKUP_PATH = '$PERSISTENT_BACKUP';

try {
  // First, try to open and checkpoint the WAL
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  
  // Force WAL checkpoint to flush any pending writes
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
    console.log('WAL checkpoint completed');
  } catch(e) {
    console.warn('WAL checkpoint warning:', e.message);
  }
  
  // Check integrity
  const integrity = db.pragma('integrity_check');
  const status = integrity[0]?.integrity_check;
  
  if (status === 'ok') {
    console.log('Database integrity: OK');
  } else {
    console.error('Database CORRUPTED! Attempting recovery...');
    db.close();
    
    // Try to recover from persistent backup
    if (fs.existsSync(BACKUP_PATH)) {
      console.log('Restoring from persistent backup...');
      fs.copyFileSync(BACKUP_PATH, DB_PATH);
      console.log('Database restored from backup');
    } else {
      // Last resort: dump and re-import
      console.log('No backup available, attempting SQLite recovery...');
      const { execSync } = require('child_process');
      const dumpPath = DB_PATH + '.recover.db';
      // Use .recover if available, otherwise just remove the corrupted DB
      try {
        execSync('sqlite3 ' + DB_PATH + ' .recover | sqlite3 ' + dumpPath, {stdio: 'pipe'});
        fs.renameSync(dumpPath, DB_PATH);
        console.log('Database recovered via dump');
      } catch(e) {
        console.error('Recovery failed, removing corrupted DB:', e.message);
        fs.unlinkSync(DB_PATH);
      }
    }
  }
  
  try { db.close(); } catch(e) {}
} catch(e) {
  console.error('DB open error:', e.message);
  // DB might be totally broken — try restoring from backup
  const fs = require('fs');
  if (fs.existsSync(BACKUP_PATH)) {
    console.log('Restoring from persistent backup due to open error...');
    fs.copyFileSync(BACKUP_PATH, DB_PATH);
    console.log('Database restored from backup');
  } else if (fs.existsSync(DB_PATH)) {
    console.log('No backup, removing corrupted DB file');
    fs.unlinkSync(DB_PATH);
  }
}
" 2>&1 | tee -a "$LOG_FILE"

# Step 4: Check for persistent backup (for restore if DB was wiped)
if [ -f "$PERSISTENT_BACKUP" ]; then
  log "Found persistent DB backup at $PERSISTENT_BACKUP"
  mkdir -p "$PROJECT_DIR/db"
  
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
    else
      log "Current DB has $USER_COUNT users — keeping it!"
    fi
  else
    log "No current DB, restoring from backup..."
    cp "$PERSISTENT_BACKUP" "$DB_FILE"
  fi
else
  log "No persistent backup found, checking for existing DB..."
fi

# Step 5: Push schema (non-destructive — adds any new columns)
cd "$PROJECT_DIR"
log "Pushing database schema (non-destructive)..."
npx prisma db push 2>&1 | tee -a "$LOG_FILE"

# Step 6: Check if DB needs seeding
USER_COUNT=$(cd "$PROJECT_DIR" && node -e "
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  db.user.count().then(c => { console.log(c); db.\$disconnect(); }).catch(() => { console.log('0'); db.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  log "DB is empty, seeding with default data..."
  cd "$PROJECT_DIR"
  npm run db:seed 2>&1 | tee -a "$LOG_FILE"
  
  # Make initial backup
  mkdir -p /home/sync/orra-db-backup
  cp "$DB_FILE" /home/sync/orra-db-backup/latest.db
  log "Initial backup created"
else
  log "DB already has $USER_COUNT users — NOT seeding (preserving data)!"
fi

# Step 7: ALWAYS ensure founder password is correct
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

# Step 8: Build if .next doesn't exist
if [ ! -d "$PROJECT_DIR/.next" ]; then
  log "Building Next.js (first time)..."
  cd "$PROJECT_DIR"
  npx next build --webpack 2>&1 | tee -a "$LOG_FILE"
fi

# Step 9: Start auto-backup daemon (backs up DB every 5 minutes)
log "Starting auto-backup daemon..."
(
  while true; do
    sleep 300  # 5 minutes
    if [ -f "$DB_FILE" ]; then
      # WAL checkpoint before backup to ensure consistency
      node -e "
        try {
          const Database = require('better-sqlite3');
          const db = new Database('$DB_FILE');
          db.pragma('wal_checkpoint(TRUNCATE)');
          db.close();
        } catch(e) { console.error('checkpoint error:', e.message); }
      " 2>/dev/null || true
      
      mkdir -p /home/sync/orra-db-backup
      cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
      
      # Timestamped backup every hour
      MINUTE=$(date +%M)
      if [ "$MINUTE" -lt "5" ]; then
        TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
        cp "$DB_FILE" "/home/sync/orra-db-backup/orra-${TIMESTAMP}.db" 2>/dev/null || true
        ls -t /home/sync/orra-db-backup/orra-*.db 2>/dev/null | tail -n +25 | xargs -r rm 2>/dev/null || true
      fi
    fi
  done
) &
log "Auto-backup daemon started (PID: $!)"

# Step 10: Start the AURA daemon as the SOLE supervisor
# aura-daemon.py handles:
#   - Health checking every 10 seconds
#   - Auto-restarting Next.js if it crashes
#   - Auto-rebuilding if the build is missing
#   - Killing stale processes on port 3000
# We do NOT start Next.js ourselves — that's aura-daemon's job.

log "Stopping any existing aura-daemon..."
python3 "$AURA_DAEMON" --stop 2>/dev/null || true
sleep 2

log "Starting AURA daemon (sole supervisor for Next.js)..."
python3 "$AURA_DAEMON" 2>&1 | tee -a "$LOG_FILE" &

# Wait for the server to come up (max 60 seconds)
log "Waiting for Next.js to start..."
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    log "Next.js is UP and responding (attempt $i)"
    break
  fi
  sleep 2
done

# Final verification
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$STATUS" != "200" ]; then
  log "WARNING: Next.js may not have started properly (status: $STATUS)"
else
  log "ORRA is fully operational!"
fi

# Keep this script alive so the container doesn't think it exited
# The aura-daemon handles everything — we just wait here
log "dev.sh now waiting (aura-daemon is the supervisor)..."
while true; do
  sleep 60
  # Periodic health check
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
  if [ "$STATUS" != "200" ]; then
    log "Health check failed (status: $STATUS), aura-daemon should handle restart..."
  fi
done
