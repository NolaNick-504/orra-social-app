#!/bin/bash
# ORRA Custom Startup Script
# - Restores DB from backup if available, or seeds fresh (ONCE only)
# - NEVER re-seeds if data already exists (preserves user customizations)
# - NEVER deletes the database — always tries recovery first
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

# Step 0: Check persistent storage availability
log "Checking persistent storage mount..."
SYNC_DIR=/home/sync/orra-db-backup
if [ ! -d "$SYNC_DIR" ]; then
  log "WARNING: /home/sync/orra-db-backup not found — creating it"
  mkdir -p "$SYNC_DIR" 2>/dev/null || log "Cannot create sync dir — backups will be local only"
fi

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
# IMPORTANT: We NEVER delete the DB file. We always try to recover or restore.
log "Running database integrity check and WAL checkpoint..."
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const DB_PATH = '$DB_FILE';
const BACKUP_PATH = '$PERSISTENT_BACKUP';

// NEVER delete the database file. Always try to recover or restore.
// The user's data is sacred — even a corrupted DB may be partially recoverable.

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
    try { db.close(); } catch(e) {}
    
    // Strategy 1: Try SQLite .recover to salvage data
    console.log('Attempting SQLite .recover to salvage data...');
    const { execSync } = require('child_process');
    const dumpPath = DB_PATH + '.recover.db';
    let recovered = false;
    try {
      execSync('sqlite3 \"' + DB_PATH + '\" .recover | sqlite3 \"' + dumpPath + '\"', {stdio: 'pipe'});
      const recoveredStats = fs.statSync(dumpPath);
      if (recoveredStats.size > 0) {
        // Keep the corrupted file as backup just in case
        fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak');
        fs.renameSync(dumpPath, DB_PATH);
        console.log('Database RECOVERED via .recover (corrupted backup saved as .corrupted.bak)');
        recovered = true;
      } else {
        fs.unlinkSync(dumpPath);
      }
    } catch(e) {
      console.warn('SQLite .recover failed:', e.message);
      // Clean up failed recovery attempt
      try { fs.unlinkSync(dumpPath); } catch(e2) {}
    }
    
    // Strategy 2: Restore from persistent backup
    if (!recovered && fs.existsSync(BACKUP_PATH)) {
      const backupStats = fs.statSync(BACKUP_PATH);
      if (backupStats.size > 0) {
        console.log('Restoring from persistent backup (' + backupStats.size + ' bytes)...');
        // Keep corrupted file as backup
        try { fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); } catch(e) {}
        fs.copyFileSync(BACKUP_PATH, DB_PATH);
        console.log('Database restored from persistent backup');
        recovered = true;
      }
    }
    
    // Strategy 3: Try to open with better-sqlite3 in recovery mode
    if (!recovered) {
      console.log('All recovery attempts failed — DB will be re-seeded on next step');
      // We do NOT delete the DB. We just let it be.
      // The seed script's safe mode will handle this — it checks if users exist.
      // If the DB is truly unusable, prisma db push will recreate it.
      console.log('Keeping corrupted DB file — it may still be partially usable');
    }
  }
  
  try { db.close(); } catch(e) {}
} catch(e) {
  console.error('DB open error:', e.message);
  // DB might be totally broken — try restoring from backup
  // We NEVER delete the DB file
  
  if (fs.existsSync(BACKUP_PATH)) {
    const backupStats = fs.statSync(BACKUP_PATH);
    if (backupStats.size > 0) {
      console.log('Restoring from persistent backup due to open error...');
      try { fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); } catch(e2) {}
      fs.copyFileSync(BACKUP_PATH, DB_PATH);
      console.log('Database restored from backup');
    }
  } else {
    console.log('No backup available. DB file remains in place — will be handled by prisma/seed.');
    // Do NOT delete. Let prisma handle it.
  }
}
" 2>&1 | tee -a "$LOG_FILE"

# Step 4: Check for persistent backup (for restore if DB was wiped or missing)
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

# Step 5: Push schema — SAFE mode
# This only ADDS new columns/tables. It NEVER drops data.
# We use --accept-data-loss=false equivalent by checking the output.
# If prisma db push wants to drop something, we log a WARNING and skip it.
cd "$PROJECT_DIR"
log "Pushing database schema (safe — adds new columns only)..."

# First, ensure no server is running (to avoid WAL conflicts)
pkill -f "node server.js" 2>/dev/null || true
sleep 2

# Flush WAL before schema push
node -e "
try {
  const Database = require('better-sqlite3');
  const db = new Database('$DB_FILE');
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  console.log('WAL flushed before schema push');
} catch(e) { console.warn('WAL flush warning:', e.message); }
" 2>/dev/null || true

# Run prisma db push with --skip-generate (we already generated above)
PUSH_OUTPUT=$(npx prisma db push --skip-generate 2>&1) || true
echo "$PUSH_OUTPUT" | tee -a "$LOG_FILE"

# Check if prisma wanted to drop data
if echo "$PUSH_OUTPUT" | grep -qi "data loss\|dropping\|deleting\|cannot.*without.*data"; then
  log "WARNING: prisma db push may require data loss — SKIPPING destructive changes"
  log "You may need to run 'prisma migrate dev' manually to handle schema changes"
fi

# Step 6: Check if DB needs seeding
USER_COUNT=$(cd "$PROJECT_DIR" && node -e "
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  db.user.count().then(c => { console.log(c); db.\$disconnect(); }).catch(() => { console.log('0'); db.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  log "DB is empty, seeding with default data (safe mode — won't overwrite existing)..."
  cd "$PROJECT_DIR"
  npm run db:seed 2>&1 | tee -a "$LOG_FILE"
  
  # Make initial backup
  mkdir -p /home/sync/orra-db-backup
  cp "$DB_FILE" /home/sync/orra-db-backup/latest.db
  log "Initial backup created"
else
  log "DB already has $USER_COUNT users — NOT seeding (preserving data)!"
fi

# Step 7: Ensure founder account exists (only set password if user has no password)
# We do NOT force-reset the password on every startup — that would override
# any password changes the founder made.
log "Ensuring founder account exists..."
node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const db = new PrismaClient();
  async function main() {
    // Only set the password if the founder has NO password set (first-time setup)
    const founder = await db.user.findFirst({ where: { OR: [{ id: 'founder' }, { email: 'nickjoseph8087@gmail.com' }] } });
    if (!founder) {
      console.log('No founder account found — will be created by seed');
      return;
    }
    if (!founder.password || founder.password === '') {
      const hash = await bcrypt.hash('Weareone504', 12);
      await db.user.update({ where: { id: founder.id }, data: { password: hash } });
      console.log('Founder password set (first time)');
    } else {
      console.log('Founder password already set — not overriding');
    }
  }
  main().catch(console.error).finally(() => db.\$disconnect());
" 2>&1 | tee -a "$LOG_FILE"

# Step 8: Build if .next doesn't exist OR if build is stale
BUILD_NEEDED=false
if [ ! -d "$PROJECT_DIR/.next" ] || [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
  BUILD_NEEDED=true
  log "No build found — building Next.js..."
else
  # Check if source files are newer than the build
  SRC_NEWER=$(find "$PROJECT_DIR/src/" -name "*.tsx" -newer "$PROJECT_DIR/.next/BUILD_ID" 2>/dev/null | head -1)
  if [ -n "$SRC_NEWER" ]; then
    BUILD_NEEDED=true
    log "Source files newer than build — rebuilding..."
  fi
fi

if [ "$BUILD_NEEDED" = true ]; then
  cd "$PROJECT_DIR"
  # Try to restore from build cache first
  python3 "$PROJECT_DIR/.zscripts/build-preserver.py" --restore 2>/dev/null || true
  # Check if cache restore worked
  if [ -f "$PROJECT_DIR/.next/BUILD_ID" ]; then
    log "Build restored from cache!"
  else
    log "Building Next.js from scratch..."
    npx next build --webpack 2>&1 | tee -a "$LOG_FILE"
    # Cache the new build
    python3 "$PROJECT_DIR/.zscripts/build-preserver.py" --sync 2>/dev/null || true
  fi
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

# Step 9b: Start the keep-alive daemon (pings Next.js every 10s to prevent
# the Alibaba Cloud FC proxy from freezing the container)
KEEPALIVE_DAEMON=$PROJECT_DIR/.zscripts/keep-alive.py
log "Starting keep-alive daemon..."
python3 "$KEEPALIVE_DAEMON" --stop 2>/dev/null || true
sleep 1
python3 "$KEEPALIVE_DAEMON" 2>&1 | tee -a "$LOG_FILE" &
log "Keep-alive daemon started"

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
