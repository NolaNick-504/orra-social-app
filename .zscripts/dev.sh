#!/bin/bash
# =============================================================================
# ORRA Startup v10 — Build Version Check
# =============================================================================
# FC measures EXTERNAL traffic (through the proxy) to decide whether to freeze
# the container. Localhost self-pings don't count. The client-side
# KeepAliveProvider handles keeping the container alive with pings from the browser.
#
# This script: installs deps → checks build version → restores/rebuilds → starts server
#
# BUILD_VERSION: Increment this when code changes require a fresh build.
# The build cache is invalidated if the version doesn't match, ensuring
# the latest code is always compiled into .next/
# =============================================================================

PROJECT_DIR=/home/z/my-project
DB_FILE=$PROJECT_DIR/db/custom.db
DB_BACKUP=/home/sync/orra-db-backup/latest.db
BUILD_CACHE=/home/sync/orra-build-cache
LOG_FILE=$PROJECT_DIR/orra-supervisor.log

# Increment this when you push code changes that need a fresh build.
# This forces the stale build cache to be invalidated and a new build to run.
BUILD_VERSION=11

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

cd "$PROJECT_DIR"

# Step 1: Bun cache symlink (speeds up install on cold starts)
if [ ! -L /home/z/.bun/install/cache ] && [ -d /home/sync/orra-bun-cache ]; then
  rm -rf /home/z/.bun/install/cache 2>/dev/null
  ln -s /home/sync/orra-bun-cache /home/z/.bun/install/cache 2>/dev/null
fi

# Step 2: node_modules (NOT in repo.tar — must install on every cold start)
if [ ! -d "$PROJECT_DIR/node_modules/next" ]; then
  log "node_modules missing - installing with bun..."
  bun install 2>&1 | tail -3 | tee -a "$LOG_FILE"
  log "Dependencies installed"
fi

# Step 3: Build version check — invalidate cache if version changed
CACHED_VERSION_FILE="$BUILD_CACHE/.next/BUILD_VERSION"
NEEDS_BUILD=false

# Check if the cached build version matches the current version
if [ -f "$CACHED_VERSION_FILE" ]; then
  CACHED_VERSION=$(cat "$CACHED_VERSION_FILE" 2>/dev/null || echo "0")
  if [ "$CACHED_VERSION" != "$BUILD_VERSION" ]; then
    log "Build version mismatch: cached=$CACHED_VERSION current=$BUILD_VERSION — forcing rebuild"
    rm -rf "$BUILD_CACHE/.next" 2>/dev/null
    rm -rf "$PROJECT_DIR/.next" 2>/dev/null
    NEEDS_BUILD=true
  fi
else
  # No version file in cache — need to check if cache exists at all
  if [ ! -f "$BUILD_CACHE/.next/BUILD_ID" ]; then
    NEEDS_BUILD=true
  fi
fi

# Step 4: Restore .next build from cache (if still valid) or build fresh
if [ "$NEEDS_BUILD" = true ]; then
  if [ -f "$BUILD_CACHE/.next/BUILD_ID" ] && [ -f "$BUILD_CACHE/.next/routes-manifest.json" ]; then
    # Cache was invalidated by version check but still exists — rebuild anyway
    log "Rebuilding from source (version mismatch)..."
    npx next build --webpack 2>&1 | tail -5 | tee -a "$LOG_FILE"
    # Update cache with fresh build
    rm -rf "$BUILD_CACHE/.next" 2>/dev/null
    mkdir -p "$BUILD_CACHE/.next"
    cp -r "$PROJECT_DIR/.next/server" "$BUILD_CACHE/.next/" 2>/dev/null
    cp -r "$PROJECT_DIR/.next/static" "$BUILD_CACHE/.next/" 2>/dev/null
    cp -r "$PROJECT_DIR/.next/types" "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/BUILD_ID" "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/"*.json "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/"*.js "$BUILD_CACHE/.next/" 2>/dev/null
    cp "$PROJECT_DIR/.next/trace" "$BUILD_CACHE/.next/" 2>/dev/null
    echo "$BUILD_VERSION" > "$BUILD_CACHE/.next/BUILD_VERSION"
    log "Build complete and cached (version $BUILD_VERSION)"
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
    echo "$BUILD_VERSION" > "$BUILD_CACHE/.next/BUILD_VERSION"
    log "Build complete and cached (version $BUILD_VERSION)"
  fi
elif [ ! -f "$PROJECT_DIR/.next/BUILD_ID" ] || [ ! -f "$PROJECT_DIR/.next/routes-manifest.json" ]; then
  # .next doesn't exist locally but cache is valid — restore from cache
  if [ -f "$BUILD_CACHE/.next/BUILD_ID" ] && [ -f "$BUILD_CACHE/.next/routes-manifest.json" ]; then
    log "Restoring build from cache (version $BUILD_VERSION)..."
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
    echo "$BUILD_VERSION" > "$BUILD_CACHE/.next/BUILD_VERSION"
    log "Build complete and cached (version $BUILD_VERSION)"
  fi
fi

# Step 5: Restore DB from persistent storage
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

# Step 6: Patch Caddy config with keep-alive
if [ -w /app/Caddyfile ] 2>/dev/null; then
  if ! grep -q "keep_alive" /app/Caddyfile 2>/dev/null; then
    sed -i '/^:81 {/a\\tkeep_alive 60s' /app/Caddyfile 2>/dev/null
    caddy reload --config /app/Caddyfile --adapter caddyfile 2>/dev/null || true
    log "Patched Caddy with keep_alive 60s"
  fi
fi

# Step 6b: Export ORRA_PUBLIC_URL for the supervisor daemon
# CRITICAL: This must be set for the server-side keep-alive to work.
# The server pings this URL every 10 seconds through the FC load balancer,
# which counts as external traffic and prevents container freezing.
#
# HOW TO SET: Edit the line below with your app's public URL, e.g.:
#   export ORRA_PUBLIC_URL="https://orra.cn-hangzhou.fc.aliyuncs.com"
#
# Or set it as an environment variable in the FC console.
export ORRA_PUBLIC_URL="${ORRA_PUBLIC_URL:-}"

# Step 7: Kill any existing server, then launch daemon
pkill -f "node server.js" 2>/dev/null || true
sleep 0.5

log "Launching supervisor daemon..."

# Double-fork daemonization: creates new session, process gets adopted by PID 1
# This means the server survives process group cleanup by tini
(
  setsid bash /home/z/my-project/.zscripts/supervisor-daemon.sh &
) &

log "Supervisor daemon launched. dev.sh exiting."
