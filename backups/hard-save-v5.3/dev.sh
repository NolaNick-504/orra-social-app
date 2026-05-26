#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log_step() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cd "$PROJECT_DIR"

# ========================================
# STEP 1: Try to restore build from cache
# This is the KEY fix - if .next/ was wiped by container restart,
# we restore from /tmp/ cache instead of rebuilding from scratch (5 min vs 10 sec)
# ========================================
PRESERVER="$SCRIPT_DIR/build-preserver.py"

if [ ! -f ".next/standalone/server.js" ]; then
    log_step "Build not found! Checking cache..."
    if python3 "$PRESERVER" --restore; then
        log_step "Build restored from cache - skipping rebuild!"
    else
        log_step "No cached build found, will need to rebuild..."
    fi
fi

# ========================================
# STEP 2: Install dependencies if needed
# ========================================
if [ ! -d "node_modules" ]; then
    log_step "Installing dependencies..."
    npm install 2>/dev/null || bun install
fi

# ========================================
# STEP 3: Push database schema
# ========================================
log_step "Setting up database..."
npx prisma db push 2>/dev/null || bun run db:push 2>/dev/null || true

# ========================================
# STEP 4: Build if standalone doesn't exist
# ========================================
if [ ! -f ".next/standalone/server.js" ]; then
    log_step "Building Next.js production bundle (this takes 2-5 min)..."
    rm -rf .next
    npm run build
    log_step "Build complete!"
else
    log_step "Build exists, skipping rebuild"
fi

# ========================================
# STEP 5: Ensure static files and .env are in place
# ========================================
mkdir -p .next/standalone/.next/static
cp -rf .next/static/* .next/standalone/.next/static/
cp -rf public .next/standalone/public 2>/dev/null || true

# Ensure .env in standalone
if [ ! -f ".next/standalone/.env" ] || ! grep -q "NEXTAUTH_SECRET" .next/standalone/.env 2>/dev/null; then
    cat > .next/standalone/.env << 'ENVEOF'
DATABASE_URL=file:/home/z/my-project/db/custom.db
NEXTAUTH_SECRET=orra-super-secret-key-2025-production
ENVEOF
    log_step "Created .env in standalone directory"
fi

# ========================================
# STEP 6: Verify build integrity
# ========================================
CHUNK_COUNT=$(ls .next/standalone/.next/static/chunks/*.js 2>/dev/null | wc -l)
log_step "Build verification: $CHUNK_COUNT chunk files found"
if [ "$CHUNK_COUNT" -eq 0 ]; then
    log_step "ERROR: No chunk files! Build may be corrupted. Rebuilding..."
    rm -rf .next
    npm run build
    mkdir -p .next/standalone/.next/static
    cp -rf .next/static/* .next/standalone/.next/static/
    cp -rf public .next/standalone/public 2>/dev/null || true
fi

# ========================================
# STEP 7: Cache the build for next restart
# ========================================
python3 "$PRESERVER" --sync 2>/dev/null || true

# ========================================
# STEP 8: Start the build preserver daemon
# ========================================
python3 "$PRESERVER" 2>/dev/null || true

# ========================================
# STEP 9: Start the server daemon
# ========================================
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="orra-super-secret-key-2025-production"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export NODE_ENV=production

log_step "Starting AURA daemon (self-healing server) on port 3000..."
python3 "$SCRIPT_DIR/aura-daemon.py"

# Keep alive
while true; do
    sleep 60
done
