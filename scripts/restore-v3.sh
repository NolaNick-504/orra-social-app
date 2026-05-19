#!/bin/bash
# ============================================
# ORRA RESTORE v3.0 — Recover From Cloud/GitHub
# ============================================
# FIXED: Now restores to the CORRECT database path (db/custom.db)
#        Previous version was restoring to prisma/dev.db (WRONG!)
#
# Restores from:
#   1. GitHub (primary — you own it permanently!)
#   2. OSS cloud storage (survives server resets)
# Usage:
#   bash restore.sh           — Show available backups & status
#   bash restore.sh full      — Full restore (code + DB)
#   bash restore.sh github    — Restore code from GitHub (primary!)
#   bash restore.sh db        — Restore database only
#   bash restore.sh code      — Restore code from OSS git bundle
#   bash restore.sh quick     — Quick restore: copy source files from OSS src-backup
# ============================================

PROJECT_DIR="/home/z/my-project"
OSS_DIR="$PROJECT_DIR/upload/orra-backup"  # Cloud storage — SURVIVES RESETS
GITHUB_REPO="https://NolaNick-504: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@github.com/NolaNick-504/ORRA.git"

# CORRECT database paths
ACTIVE_DB="$PROJECT_DIR/db/custom.db"
ACTIVE_DB_DIR="$PROJECT_DIR/db"
OSS_DB="$OSS_DIR/orra-custom.db"

# Show status if no arguments
if [ -z "$1" ]; then
  echo "================================================"
  echo "  ORRA RESTORE v3.0 — Cloud Backup Status"
  echo "================================================"
  echo ""
  
  if [ -f "$OSS_DIR/orra-full-repo.bundle" ]; then
    echo "  Git Bundle: EXISTS ($(du -h "$OSS_DIR/orra-full-repo.bundle" | cut -f1))"
    echo "    Contains ALL code history — survives server resets"
  else
    echo "  Git Bundle: NOT FOUND — no cloud code backup!"
  fi
  
  if [ -f "$OSS_DB" ]; then
    echo "  Database:   EXISTS ($(du -h "$OSS_DB" | cut -f1))"
    echo "    Path: $OSS_DB (CORRECT: db/custom.db format)"
  else
    echo "  Database:   NOT FOUND at $OSS_DB"
  fi

  if [ -d "$OSS_DIR/src-backup" ]; then
    FILE_COUNT=$(find "$OSS_DIR/src-backup/" -type f | wc -l)
    echo "  Source Code: EXISTS ($FILE_COUNT files)"
  else
    echo "  Source Code: NOT FOUND"
  fi

  echo ""
  echo "  GitHub (PERMANENT — you own it!):"
  echo "     https://github.com/NolaNick-504/ORRA (private repo)"
  echo ""
  echo "  Current active DB: $ACTIVE_DB"
  echo "  Current DB size: $(du -h "$ACTIVE_DB" 2>/dev/null | cut -f1 || echo 'NOT FOUND')"
  echo ""
  echo "================================================"
  echo "  USAGE:"
  echo "  bash restore.sh github — Restore code from GitHub (BEST!)"
  echo "  bash restore.sh full   — Restore everything from cloud"
  echo "  bash restore.sh db     — Restore database from cloud"
  echo "  bash restore.sh code   — Restore code from cloud bundle"
  echo "  bash restore.sh quick  — Quick file copy from OSS src-backup"
  echo "================================================"
  exit 0
fi

MODE="$1"

# QUICK RESTORE — Copy source files directly from OSS src-backup
if [ "$MODE" = "quick" ]; then
  echo "================================================"
  echo "  QUICK RESTORE FROM OSS SRC-BACKUP"
  echo "================================================"
  echo ""
  
  SRC="$OSS_DIR/src-backup"
  if [ ! -d "$SRC" ]; then
    echo "  No src-backup found! Try 'full' or 'github' instead."
    exit 1
  fi

  echo "[1/3] Copying source files from OSS..."
  # API routes
  cp "$SRC/src/app/api/posts/route.ts" "$PROJECT_DIR/src/app/api/posts/route.ts" 2>/dev/null
  cp "$SRC/src/app/api/stories/route.ts" "$PROJECT_DIR/src/app/api/stories/route.ts" 2>/dev/null
  mkdir -p "$PROJECT_DIR/src/app/api/users/profile"
  cp "$SRC/src/app/api/users/profile/route.ts" "$PROJECT_DIR/src/app/api/users/profile/route.ts" 2>/dev/null
  cp "$SRC/src/app/api/uploads/route.ts" "$PROJECT_DIR/src/app/api/uploads/route.ts" 2>/dev/null
  # Main files
  cp "$SRC/src/app/page.tsx" "$PROJECT_DIR/src/app/page.tsx" 2>/dev/null
  cp "$SRC/src/app/layout.tsx" "$PROJECT_DIR/src/app/layout.tsx" 2>/dev/null
  cp "$SRC/src/app/globals.css" "$PROJECT_DIR/src/app/globals.css" 2>/dev/null
  # Components
  cp "$SRC/src/components/game-arena.tsx" "$PROJECT_DIR/src/components/game-arena.tsx" 2>/dev/null
  cp "$SRC/src/components/aura/games/"*.tsx "$PROJECT_DIR/src/components/aura/games/" 2>/dev/null
  cp "$SRC/src/components/aura/pulse-feed.tsx" "$PROJECT_DIR/src/components/aura/pulse-feed.tsx" 2>/dev/null
  cp "$SRC/src/components/aura/create-post-modal.tsx" "$PROJECT_DIR/src/components/aura/create-post-modal.tsx" 2>/dev/null
  # Store + middleware
  cp "$SRC/src/store/aura-store.ts" "$PROJECT_DIR/src/store/aura-store.ts" 2>/dev/null
  cp "$SRC/src/middleware.ts" "$PROJECT_DIR/src/middleware.ts" 2>/dev/null
  # Config
  cp "$SRC/.env" "$PROJECT_DIR/.env" 2>/dev/null
  cp "$SRC/package.json" "$PROJECT_DIR/package.json" 2>/dev/null
  cp "$SRC/next.config.ts" "$PROJECT_DIR/next.config.ts" 2>/dev/null
  # Prisma
  cp "$SRC/prisma/schema.prisma" "$PROJECT_DIR/prisma/schema.prisma" 2>/dev/null
  cp "$SRC/prisma/seed.ts" "$PROJECT_DIR/prisma/seed.ts" 2>/dev/null
  echo "  Source files copied!"

  # Restore database
  echo "[2/3] Restoring database from OSS..."
  mkdir -p "$ACTIVE_DB_DIR"
  if [ -f "$OSS_DB" ]; then
    cp "$OSS_DB" "$ACTIVE_DB"
    echo "  Database restored: $ACTIVE_DB"
  else
    echo "  WARNING: No database backup found in OSS!"
  fi

  # Rebuild + restart
  echo "[3/3] Rebuilding and restarting..."
  cd "$PROJECT_DIR"
  bun install 2>/dev/null || npm install 2>/dev/null
  npx prisma generate 2>/dev/null
  npx next build 2>/dev/null
  # Restart the app
  pkill -f "next start" 2>/dev/null
  sleep 2
  nohup npx next start -p 3000 &>/dev/null &
  echo "  App rebuilt and restarted!"

  echo ""
  echo "================================================"
  echo "  QUICK RESTORE COMPLETE!"
  echo "================================================"
  exit 0
fi

# GITHUB RESTORE (code from GitHub — PRIMARY METHOD!)
if [ "$MODE" = "github" ]; then
  echo "================================================"
  echo "  RESTORE FROM GITHUB (PERMANENT BACKUP)"
  echo "================================================"
  echo ""
  
  echo "[1/4] Cloning from GitHub..."
  cd /home/z
  rm -rf /tmp/orra-github 2>/dev/null
  git clone "$GITHUB_REPO" /tmp/orra-github 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "  GitHub clone failed! Trying OSS bundle instead..."
    bash "$OSS_DIR/restore.sh" code
    exit $?
  fi
  
  # Copy restored code over current project (preserving upload/, .git/, and database)
  echo "[2/4] Restoring code files..."
  rsync -a --exclude='upload' --exclude='.git' --exclude='node_modules' --exclude='db/custom.db' /tmp/orra-github/ "$PROJECT_DIR/" 2>/dev/null
  rm -rf /tmp/orra-github
  
  # Set up git remote
  cd "$PROJECT_DIR"
  git remote remove origin 2>/dev/null
  git remote add origin "$GITHUB_REPO"
  
  # Also restore database from OSS (GitHub may have stale DB)
  echo "[3/4] Restoring database from OSS (most recent)..."
  mkdir -p "$ACTIVE_DB_DIR"
  if [ -f "$OSS_DB" ]; then
    cp "$OSS_DB" "$ACTIVE_DB"
    echo "  Database restored from OSS cloud"
  fi

  echo "[4/4] Rebuilding and restarting..."
  bun install 2>/dev/null || npm install 2>/dev/null
  npx prisma generate 2>/dev/null
  npx next build 2>/dev/null
  pkill -f "next start" 2>/dev/null
  sleep 2
  nohup npx next start -p 3000 &>/dev/null &
  
  echo ""
  echo "  RESTORED FROM GITHUB + OSS DB! Your code is back!"
  exit 0
fi

# FULL RESTORE (code + database from cloud)
if [ "$MODE" = "full" ]; then
  echo "================================================"
  echo "  FULL RESTORE FROM CLOUD"
  echo "================================================"
  echo ""
  echo "  This will overwrite current project with cloud backup!"
  echo "  The cloud backup SURVIVES server resets."
  echo ""
  
  BUNDLE="$OSS_DIR/orra-full-repo.bundle"
  DB="$OSS_DB"
  
  if [ ! -f "$BUNDLE" ]; then
    echo "  No git bundle found! Trying quick restore instead..."
    bash "$OSS_DIR/restore.sh" quick
    exit $?
  fi

  # Step 1: Restore code from git bundle
  echo "[1/3] Restoring code from cloud bundle..."
  cd /home/z
  rm -rf /tmp/orra-restore 2>/dev/null
  git clone "$BUNDLE" /tmp/orra-restore 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "  Failed to clone from bundle! Trying quick restore..."
    bash "$OSS_DIR/restore.sh" quick
    exit $?
  fi
  
  # Copy restored code over current project (preserving upload/ and .git/)
  rsync -a --exclude='upload' --exclude='.git' --exclude='db/custom.db' /tmp/orra-restore/ "$PROJECT_DIR/" 2>/dev/null
  rm -rf /tmp/orra-restore
  echo "  Code restored from cloud"
  
  # Step 2: Restore database (to CORRECT path!)
  if [ -f "$DB" ]; then
    echo "[2/3] Restoring database from cloud..."
    mkdir -p "$ACTIVE_DB_DIR"
    cp "$DB" "$ACTIVE_DB"
    echo "  Database restored: $ACTIVE_DB"
  else
    echo "[2/3] No cloud database to restore"
  fi
  
  # Step 3: Rebuild and restart
  echo "[3/3] Rebuilding and restarting..."
  cd "$PROJECT_DIR"
  bun install 2>/dev/null || npm install 2>/dev/null
  npx prisma generate 2>/dev/null
  npx next build 2>/dev/null
  pkill -f "next start" 2>/dev/null
  sleep 2
  nohup npx next start -p 3000 &>/dev/null &
  echo "  App rebuilt and restarted"
  
  echo ""
  echo "================================================"
  echo "  FULL RESTORE COMPLETE!"
  echo "================================================"
  exit 0
fi

# DATABASE ONLY RESTORE
if [ "$MODE" = "db" ]; then
  DB="$OSS_DB"
  
  if [ ! -f "$DB" ]; then
    echo "  No database found in cloud storage!"
    exit 1
  fi
  
  echo "Restoring database from cloud..."
  
  # Stop app
  pkill -f "next start" 2>/dev/null
  sleep 2

  # Restore to CORRECT path
  mkdir -p "$ACTIVE_DB_DIR"
  cp "$DB" "$ACTIVE_DB"
  echo "  Database restored: $ACTIVE_DB"
  
  # Restart
  cd "$PROJECT_DIR"
  nohup npx next start -p 3000 &>/dev/null &
  echo "  App restarted"
  exit 0
fi

# CODE ONLY RESTORE
if [ "$MODE" = "code" ]; then
  BUNDLE="$OSS_DIR/orra-full-repo.bundle"
  
  if [ ! -f "$BUNDLE" ]; then
    echo "  No git bundle found in cloud storage!"
    exit 1
  fi
  
  echo "Restoring code from cloud bundle..."
  
  cd /home/z
  rm -rf /tmp/orra-restore 2>/dev/null
  git clone "$BUNDLE" /tmp/orra-restore 2>/dev/null
  rsync -a --exclude='upload' --exclude='.git' --exclude='db/custom.db' /tmp/orra-restore/ "$PROJECT_DIR/" 2>/dev/null
  rm -rf /tmp/orra-restore
  echo "  Code restored from cloud"
  
  cd "$PROJECT_DIR"
  bun install 2>/dev/null || npm install 2>/dev/null
  npx prisma generate 2>/dev/null
  npx next build 2>/dev/null
  pkill -f "next start" 2>/dev/null
  sleep 2
  nohup npx next start -p 3000 &>/dev/null &
  echo "  App rebuilt and restarted"
  exit 0
fi

echo "  Unknown mode: $MODE"
echo "   Use: full, github, db, code, or quick"
exit 1
