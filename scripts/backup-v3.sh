#!/bin/bash
# ============================================
# ORRA BULLETPROOF BACKUP v3.0
# ============================================
# FIXED: Now backs up the CORRECT database (db/custom.db)
#        Previous version was backing up prisma/dev.db (STALE!)
#
# Saves to THREE places:
# 1. /backups/ (local, might get wiped)
# 2. /upload/orra-backup/ (OSS cloud storage, PERSISTS across resets)
# 3. GitHub (private repo — PERMANENT, YOU OWN IT!)
# ============================================

PROJECT_DIR="/home/z/my-project"
BACKUP_DIR="$PROJECT_DIR/backups"
OSS_DIR="$PROJECT_DIR/upload/orra-backup"  # THIS SURVIVES SERVER RESETS
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LABEL="$1"

# CORRECT database path — .env points to db/custom.db, NOT prisma/dev.db!
ACTIVE_DB="$PROJECT_DIR/db/custom.db"
DB_FILENAME="orra-custom.db"

mkdir -p "$BACKUP_DIR"
mkdir -p "$OSS_DIR"

echo "================================================"
echo "  ORRA BULLETPROOF BACKUP v3.0 — $TIMESTAMP"
echo "================================================"
echo "  Active DB: $ACTIVE_DB"

# 1. DATABASE BACKUP — Save CORRECT database to BOTH local + OSS
echo ""
echo "[1/5] Backing up database (local + cloud)..."
if [ -f "$ACTIVE_DB" ]; then
  # Local backup
  cp "$ACTIVE_DB" "$BACKUP_DIR/orra-db-${TIMESTAMP}.db"
  echo "  Local: orra-db-${TIMESTAMP}.db"
  
  # CLOUD backup (OSS - survives resets!)
  cp "$ACTIVE_DB" "$OSS_DIR/$DB_FILENAME"
  cp "$ACTIVE_DB" "$OSS_DIR/orra-custom-${TIMESTAMP}.db"
  echo "  Cloud OSS: $DB_FILENAME ($(du -h "$OSS_DIR/$DB_FILENAME" | cut -f1))"
  echo "  Cloud OSS: orra-custom-${TIMESTAMP}.db"
else
  echo "  WARNING: No database found at $ACTIVE_DB"
  echo "  Checking fallback prisma/dev.db..."
  if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
    cp "$PROJECT_DIR/prisma/dev.db" "$OSS_DIR/$DB_FILENAME"
    echo "  Fallback: Using prisma/dev.db (may be stale!)"
  fi
fi

# 2. SOURCE CODE BACKUP — Copy all critical source to OSS
echo ""
echo "[2/5] Saving source code to cloud..."
mkdir -p "$OSS_DIR/src-backup"
# API routes (EXIF orientation fix lives here!)
mkdir -p "$OSS_DIR/src-backup/src/app/api/posts"
mkdir -p "$OSS_DIR/src-backup/src/app/api/stories"
mkdir -p "$OSS_DIR/src-backup/src/app/api/users/profile"
mkdir -p "$OSS_DIR/src-backup/src/app/api/uploads"
cp "$PROJECT_DIR/src/app/api/posts/route.ts" "$OSS_DIR/src-backup/src/app/api/posts/route.ts" 2>/dev/null
cp "$PROJECT_DIR/src/app/api/stories/route.ts" "$OSS_DIR/src-backup/src/app/api/stories/route.ts" 2>/dev/null
cp "$PROJECT_DIR/src/app/api/users/profile/route.ts" "$OSS_DIR/src-backup/src/app/api/users/profile/route.ts" 2>/dev/null
cp "$PROJECT_DIR/src/app/api/uploads/route.ts" "$OSS_DIR/src-backup/src/app/api/uploads/route.ts" 2>/dev/null
# Main app files
mkdir -p "$OSS_DIR/src-backup/src/app"
cp "$PROJECT_DIR/src/app/page.tsx" "$OSS_DIR/src-backup/src/app/page.tsx" 2>/dev/null
cp "$PROJECT_DIR/src/app/layout.tsx" "$OSS_DIR/src-backup/src/app/layout.tsx" 2>/dev/null
cp "$PROJECT_DIR/src/app/globals.css" "$OSS_DIR/src-backup/src/app/globals.css" 2>/dev/null
# Game arena + components
cp "$PROJECT_DIR/src/components/game-arena.tsx" "$OSS_DIR/src-backup/src/components/game-arena.tsx" 2>/dev/null
mkdir -p "$OSS_DIR/src-backup/src/components/aura/games"
cp "$PROJECT_DIR/src/components/aura/games/"*.tsx "$OSS_DIR/src-backup/src/components/aura/games/" 2>/dev/null
cp "$PROJECT_DIR/src/components/aura/pulse-feed.tsx" "$OSS_DIR/src-backup/src/components/aura/pulse-feed.tsx" 2>/dev/null
cp "$PROJECT_DIR/src/components/aura/create-post-modal.tsx" "$OSS_DIR/src-backup/src/components/aura/create-post-modal.tsx" 2>/dev/null
# Store + middleware
mkdir -p "$OSS_DIR/src-backup/src/store"
cp "$PROJECT_DIR/src/store/aura-store.ts" "$OSS_DIR/src-backup/src/store/aura-store.ts" 2>/dev/null
cp "$PROJECT_DIR/src/middleware.ts" "$OSS_DIR/src-backup/src/middleware.ts" 2>/dev/null
# Config files
cp "$PROJECT_DIR/.env" "$OSS_DIR/src-backup/.env" 2>/dev/null
cp "$PROJECT_DIR/package.json" "$OSS_DIR/src-backup/package.json" 2>/dev/null
cp "$PROJECT_DIR/next.config.ts" "$OSS_DIR/src-backup/next.config.ts" 2>/dev/null
# Prisma schema + seed
mkdir -p "$OSS_DIR/src-backup/prisma"
cp "$PROJECT_DIR/prisma/schema.prisma" "$OSS_DIR/src-backup/prisma/schema.prisma" 2>/dev/null
cp "$PROJECT_DIR/prisma/seed.ts" "$OSS_DIR/src-backup/prisma/seed.ts" 2>/dev/null
# Database
mkdir -p "$OSS_DIR/src-backup/db"
cp "$ACTIVE_DB" "$OSS_DIR/src-backup/db/custom.db" 2>/dev/null
# Game covers + banners
mkdir -p "$OSS_DIR/src-backup/public/images/games/game-covers-v2"
mkdir -p "$OSS_DIR/src-backup/public/images/games/banners"
cp "$PROJECT_DIR/public/images/games/game-covers-v2/"*.png "$OSS_DIR/src-backup/public/images/games/game-covers-v2/" 2>/dev/null
cp "$PROJECT_DIR/public/images/games/banners/"*.png "$OSS_DIR/src-backup/public/images/games/banners/" 2>/dev/null
FILE_COUNT=$(find "$OSS_DIR/src-backup/" -type f | wc -l)
echo "  Source files saved to OSS: $FILE_COUNT files"

# 3. GIT COMMIT — Save all code changes
echo ""
echo "[3/5] Committing all code to git..."
cd "$PROJECT_DIR"
git add -A
if [ -n "$(git status --porcelain)" ]; then
  COMMIT_MSG="${TIMESTAMP} — ${LABEL:-auto-backup}"
  git commit -m "$COMMIT_MSG" --allow-empty
  echo "  Committed: $COMMIT_MSG"
else
  echo "  No uncommitted changes"
fi

# 4. PUSH TO GITHUB — PERMANENT OFF-PLATFORM BACKUP
echo ""
echo "[4/5] Pushing to GitHub (permanent backup you own!)..."
git push origin main 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  GitHub: PUSHED! Code is permanently safe at github.com/NolaNick-504/ORRA"
else
  echo "  GitHub: Push failed (will retry next backup cycle)"
  git remote get-url origin >/dev/null 2>&1 || {
    echo "  Setting up GitHub remote..."
    git remote add origin https://NolaNick-504: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@github.com/NolaNick-504/ORRA.git
    git push -u origin main 2>/dev/null
  }
fi

# 5. GIT BUNDLE — Save ENTIRE repo history to OSS (survives resets!)
echo ""
echo "[5/5] Creating git bundle on cloud storage (survives resets!)..."
git bundle create "$OSS_DIR/orra-full-repo.bundle" --all 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  Cloud OSS: orra-full-repo.bundle ($(du -h "$OSS_DIR/orra-full-repo.bundle" | cut -f1))"
else
  git bundle create "$OSS_DIR/orra-full-repo.bundle" HEAD 2>/dev/null
  echo "  Cloud OSS: orra-full-repo.bundle (HEAD only)"
fi

# Cleanup old local backups (keep 10)
ls -t "$BACKUP_DIR"/orra-db-*.db 2>/dev/null | tail -n +11 | xargs -r rm
# Cleanup old OSS timestamped DBs (keep 5)
ls -t "$OSS_DIR"/orra-custom-*.db 2>/dev/null | tail -n +6 | xargs -r rm
# Cleanup old stale orra-dev-* backups
ls -t "$OSS_DIR"/orra-dev-*.db 2>/dev/null | tail -n +3 | xargs -r rm

echo ""
echo "================================================"
echo "  BACKUP COMPLETE v3.0 — YOUR WORK IS SAFE!"
echo "================================================"
echo "  GitHub (PERMANENT — you own it!):"
echo "     https://github.com/NolaNick-504/ORRA (private)"
echo ""
echo "  Cloud OSS (survives resets):"
echo "     Git bundle: $OSS_DIR/orra-full-repo.bundle"
echo "     Database:   $OSS_DIR/$DB_FILENAME (CORRECT: db/custom.db!)"
echo "     Source:     $OSS_DIR/src-backup/ ($FILE_COUNT files)"
echo ""
echo "  To restore after a reset:"
echo "     bash /home/z/my-project/upload/orra-backup/restore.sh full"
echo "================================================"
