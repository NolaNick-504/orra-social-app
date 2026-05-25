#!/bin/bash
# ORRA Custom Startup Script v2.0
# - Uses prisma migrate deploy (SAFE) instead of prisma db push (DESTRUCTIVE)
# - Restores DB from backup if available, or seeds fresh (ONCE only)
# - NEVER re-seeds if data already exists (preserves user customizations)
# - NEVER deletes the database — always tries recovery first
# - Runs DB integrity check + WAL checkpoint to prevent corruption
# - Stops aura-daemon before schema operations to prevent race conditions
# - Starts aura-daemon.py as the SOLE supervisor for Next.js
# - Backs up DB every 2 minutes (was 5) for better crash recovery
# - Adds shutdown hook to backup DB immediately on SIGTERM

set -e

PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/next-supervisor.log
DB_FILE=$PROJECT_DIR/db/custom.db
PERSISTENT_BACKUP=/home/sync/orra-db-backup/latest.db
AURA_DAEMON=$PROJECT_DIR/.zscripts/aura-daemon.py
LOCK_FILE=/tmp/orra-startup.lock

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ORRA-Startup] $1" | tee -a "$LOG_FILE"
}

# Prevent concurrent startup scripts
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null)
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    log "Another startup script is already running (PID $LOCK_PID). Exiting."
    exit 0
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Shutdown hook: backup DB immediately when container is shutting down
cleanup() {
  log "Shutdown signal received — backing up database immediately..."
  if [ -f "$DB_FILE" ]; then
    node -e "
    try {
      const Database = require('better-sqlite3');
      const db = new Database('$DB_FILE');
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
    } catch(e) {}
    " 2>/dev/null || true
    mkdir -p /home/sync/orra-db-backup
    cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
    log "Emergency backup complete!"
  fi
  # Stop aura-daemon cleanly
  python3 "$AURA_DAEMON" --stop 2>/dev/null || true
  rm -f "$LOCK_FILE"
}
trap cleanup SIGTERM SIGINT

log "ORRA custom startup script v2.0 running..."

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

# Step 3: STOP aura-daemon BEFORE any DB operations (fixes race condition - Audit #5)
log "Stopping aura-daemon to prevent race conditions during DB operations..."
python3 "$AURA_DAEMON" --stop 2>/dev/null || true
sleep 2

# Also kill any Node server processes
pkill -f "node server.js" 2>/dev/null || true
sleep 1

# Step 4: Database integrity check + WAL checkpoint
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
    
    // Strategy 1: Try SQLite .recover to salvage data (Audit #3 fix)
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
    
    // Strategy 3: If nothing worked, keep the corrupted DB in place
    // We do NOT delete it. prisma/seed will handle it.
    if (!recovered) {
      console.log('All recovery attempts failed — keeping corrupted DB in place');
      console.log('The seed script will detect this and handle appropriately');
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

# Step 5: Check for persistent backup (for restore if DB was wiped or missing)
if [ -f "$PERSISTENT_BACKUP" ]; then
  log "Found persistent DB backup at $PERSISTENT_BACKUP"
  mkdir -p "$PROJECT_DIR/db"
  
  SEED_NEEDED=false
  if [ -f "$DB_FILE" ]; then
    USER_COUNT=$(cd "$PROJECT_DIR" && node -e "
      const Database = require('better-sqlite3');
      try {
        const db = new Database('./db/custom.db');
        const result = db.prepare('SELECT count(*) as cnt FROM User').get();
        console.log(result.cnt);
        db.close();
      } catch(e) { console.log('0'); }
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

# Step 6: Apply schema changes — SAFE mode using prisma migrate deploy (Audit #1 fix)
# prisma migrate deploy is NON-DESTRUCTIVE:
#   - Only applies pending migrations (never rolls back)
#   - Never drops columns or data
#   - If a migration would be destructive, it must be created manually
#   - Falls back to prisma db push ONLY for first-time setup (no existing _prisma_migrations)
cd "$PROJECT_DIR"

# Flush WAL before any schema operations
node -e "
try {
  const Database = require('better-sqlite3');
  const db = new Database('$DB_FILE');
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  console.log('WAL flushed before schema operation');
} catch(e) { console.warn('WAL flush warning:', e.message); }
" 2>/dev/null || true

# Check if _prisma_migrations table exists (indicates migrate is set up)
HAS_MIGRATIONS=$(cd "$PROJECT_DIR" && node -e "
const Database = require('better-sqlite3');
try {
  const db = new Database('./db/custom.db');
  const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'\").all();
  console.log(tables.length > 0 ? 'yes' : 'no');
  db.close();
} catch(e) { console.log('no'); }
" 2>/dev/null || echo "no")

if [ "$HAS_MIGRATIONS" = "yes" ]; then
  log "Applying schema changes via prisma migrate deploy (SAFE — non-destructive)..."
  MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1) || true
  echo "$MIGRATE_OUTPUT" | tee -a "$LOG_FILE"
  
  if echo "$MIGRATE_OUTPUT" | grep -qi "error\|failed"; then
    log "WARNING: Migration had errors. Falling back to safe prisma db push..."
    # Fallback: use prisma db push but ONLY if it doesn't require data loss
    PUSH_OUTPUT=$(npx prisma db push --skip-generate 2>&1) || true
    echo "$PUSH_OUTPUT" | tee -a "$LOG_FILE"
    if echo "$PUSH_OUTPUT" | grep -qi "data loss\|dropping\|deleting"; then
      log "WARNING: Schema change requires data loss — SKIPPING destructive changes!"
      log "Run 'prisma migrate dev' manually to create a proper migration"
    fi
  fi
else
  log "No migration history found — using prisma db push for initial setup..."
  PUSH_OUTPUT=$(npx prisma db push --skip-generate 2>&1) || true
  echo "$PUSH_OUTPUT" | tee -a "$LOG_FILE"
  
  if echo "$PUSH_OUTPUT" | grep -qi "data loss\|dropping\|deleting"; then
    log "WARNING: Schema change requires data loss — SKIPPING destructive changes!"
    log "Run 'prisma migrate dev' manually to create a proper migration"
  fi
  
  # Register the baseline migration so future starts use migrate deploy
  log "Registering baseline migration for future use..."
  node -e "
  const Database = require('better-sqlite3');
  try {
    const db = new Database('./db/custom.db');
    const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'\").all();
    if (tables.length === 0) {
      db.exec(\`
        CREATE TABLE \"_prisma_migrations\" (
          \"id\"                    TEXT NOT NULL PRIMARY KEY,
          \"checksum\"              TEXT NOT NULL,
          \"finished_at\"           DATETIME,
          \"migration_name\"        TEXT NOT NULL,
          \"logs\"                  TEXT,
          \"rolled_back_at\"        DATETIME,
          \"started_at\"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \"applied_steps_count\"   INTEGER NOT NULL DEFAULT 0
        );
      \`);
      db.exec(\`
        INSERT INTO \"_prisma_migrations\" (\"id\", \"checksum\", \"finished_at\", \"migration_name\", \"logs\", \"rolled_back_at\", \"started_at\", \"applied_steps_count\")
        VALUES ('00000000-0000-0000-0000-000000000000', 'baseline', datetime('now'), '00000000000000_init', NULL, NULL, datetime('now'), 1);
      \`);
      console.log('Baseline migration registered');
    } else {
      console.log('Migration table already exists');
    }
    db.close();
  } catch(e) { console.warn('Migration setup warning:', e.message); }
  " 2>&1 | tee -a "$LOG_FILE"
fi

# Step 7: Check if DB needs seeding
USER_COUNT=$(cd "$PROJECT_DIR" && node -e "
  const Database = require('better-sqlite3');
  try {
    const db = new Database('./db/custom.db');
    const result = db.prepare('SELECT count(*) as cnt FROM User').get();
    console.log(result.cnt);
    db.close();
  } catch(e) { console.log('0'); }
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

# Step 8: Ensure founder account exists (only set password if user has no password)
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

# Step 9: Update data metadata for backup tracking (Audit #4 fix)
log "Updating data metadata..."
cat > /tmp/orra-metadata.js << 'METADATA_SCRIPT'
const Database = require('better-sqlite3');
try {
  const db = new Database(process.env.ORRA_DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS "_orra_meta" (
      "key"   TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  const userCount = db.prepare("SELECT count(*) as cnt FROM User WHERE id != 'founder' AND id NOT LIKE 'bot%'").get();
  const lastPost = db.prepare('SELECT max(createdAt) as latest FROM Post').get();
  const lastComment = db.prepare('SELECT max(createdAt) as latest FROM Comment').get();
  
  const metaUpsert = db.prepare('INSERT OR REPLACE INTO "_orra_meta" (key, value, updated_at) VALUES (?, ?, datetime("now"))');
  
  var existingStartup = db.prepare('SELECT value FROM _orra_meta WHERE key = ?').get('startup_count');
  var startupNum = (existingStartup ? parseInt(existingStartup.value) : 0) + 1;
  metaUpsert.run('startup_count', String(startupNum));
  metaUpsert.run('real_user_count', String(userCount.cnt));
  metaUpsert.run('last_post_at', (lastPost && lastPost.latest) ? lastPost.latest : 'never');
  metaUpsert.run('last_comment_at', (lastComment && lastComment.latest) ? lastComment.latest : 'never');
  metaUpsert.run('backup_version', '2.0');
  
  console.log('Metadata updated: real_users=' + userCount.cnt + ', last_post=' + ((lastPost && lastPost.latest) ? lastPost.latest : 'never'));
  db.close();
} catch(e) { console.warn('Metadata warning:', e.message); }
METADATA_SCRIPT
cd "$PROJECT_DIR" && NODE_PATH="$PROJECT_DIR/node_modules" ORRA_DB_PATH="$DB_FILE" node /tmp/orra-metadata.js 2>&1 | tee -a "$LOG_FILE"
rm -f /tmp/orra-metadata.js

# Step 10: Build if .next doesn't exist OR if build is stale
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

# Step 11: Auto-backup is now handled by aura-daemon.py (every 2 minutes)
# No separate backup subshell needed — avoids redundant I/O and SQLite locking
# aura-daemon.py also does hourly timestamped backups
log "Auto-backup handled by aura-daemon.py (every 2 minutes) — no separate backup daemon needed"

# Step 11b: Start the keep-alive daemon
KEEPALIVE_DAEMON=$PROJECT_DIR/.zscripts/keep-alive.py
log "Starting keep-alive daemon..."
python3 "$KEEPALIVE_DAEMON" --stop 2>/dev/null || true
sleep 1
python3 "$KEEPALIVE_DAEMON" 2>&1 | tee -a "$LOG_FILE" &
log "Keep-alive daemon started"

# Step 12: Start the AURA daemon as the SOLE supervisor
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

# Immediate backup after successful startup
if [ -f "$DB_FILE" ]; then
  mkdir -p /home/sync/orra-db-backup
  cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
  log "Post-startup backup complete"
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
