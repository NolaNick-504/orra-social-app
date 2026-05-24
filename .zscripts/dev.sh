#!/bin/bash
# ORRA Custom Startup Script
# This runs automatically when the container starts (called by /start.sh)
# It builds, seeds (if needed), and starts Next.js with auto-restart.

set -e

PROJECT_DIR=/home/z/my-project
LOG_FILE=$PROJECT_DIR/next-supervisor.log
DB_FILE=$PROJECT_DIR/db/custom.db

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

# Step 3: Push database schema (creates tables if they don't exist)
log "Pushing database schema..."
npx prisma db push 2>&1 | tee -a "$LOG_FILE"

# Step 4: Seed database if empty (no users = fresh DB after container rebuild)
# The DB is in .gitignore so it gets wiped on container rebuild.
# The seed script creates the founder account + 25 bots + posts + everything.
SEED_NEEDED=false
if [ ! -f "$DB_FILE" ]; then
  SEED_NEEDED=true
  log "Database file not found, seeding needed"
else
  # Check if there are any users in the DB
  USER_COUNT=$(cd "$PROJECT_DIR" && node -e "
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    db.user.count().then(c => { console.log(c); db.\$disconnect(); });
  " 2>/dev/null || echo "0")
  if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    SEED_NEEDED=true
    log "Database is empty (0 users), seeding needed"
  else
    log "Database has $USER_COUNT users, no seed needed"
  fi
fi

if [ "$SEED_NEEDED" = true ]; then
  log "Seeding database with founder + 25 bots + posts + everything..."
  cd "$PROJECT_DIR"
  npm run db:seed 2>&1 | tee -a "$LOG_FILE"

  # Update founder password to user's expected password
  log "Setting founder password..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const db = new PrismaClient();
    async function main() {
      const hash = await bcrypt.hash('Weareone504', 12);
      await db.user.update({ where: { id: 'founder' }, data: { password: hash } });
      console.log('Founder password set');
    }
    main().catch(console.error).finally(() => db.\$disconnect());
  " 2>&1 | tee -a "$LOG_FILE"
  log "Database seeded successfully!"
fi

# Step 5: Build if .next doesn't exist
if [ ! -d "$PROJECT_DIR/.next" ]; then
  log "Building Next.js (first time)..."
  cd "$PROJECT_DIR"
  npx next build --webpack 2>&1 | tee -a "$LOG_FILE"
fi

# Step 6: Start Next.js with auto-restart
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

  # Wait before restarting
  log "Waiting 3 seconds before restart..."
  sleep 3
done

log "Supervisor exiting (max restarts reached or clean shutdown)"
