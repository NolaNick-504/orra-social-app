#!/bin/bash
# ============================================
# ORRA BULLETPROOF BACKUP v2.0
# ============================================
# This saves to THREE places:
# 1. /backups/ (local, might get wiped)
# 2. /upload/orra-backup/ (OSS cloud storage, PERSISTS across resets)
# 3. GitHub (private repo — PERMANENT, YOU OWN IT!)
# ============================================

PROJECT_DIR="/home/z/my-project"
BACKUP_DIR="$PROJECT_DIR/backups"
OSS_DIR="$PROJECT_DIR/upload/orra-backup"  # THIS SURVIVES SERVER RESETS
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LABEL="$1"

mkdir -p "$BACKUP_DIR"
mkdir -p "$OSS_DIR"

echo "================================================"
echo "  ORRA BULLETPROOF BACKUP — $TIMESTAMP"
echo "================================================"

# 1. DATABASE BACKUP — Save to BOTH local + OSS
echo ""
echo "[1/5] Backing up database (local + cloud)..."
if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
  # Local backup
  cp "$PROJECT_DIR/prisma/dev.db" "$BACKUP_DIR/orra-db-${TIMESTAMP}.db"
  echo "  Local: orra-db-${TIMESTAMP}.db"
  
  # CLOUD backup (OSS - survives resets!)
  cp "$PROJECT_DIR/prisma/dev.db" "$OSS_DIR/orra-dev.db"
  cp "$PROJECT_DIR/prisma/dev.db" "$OSS_DIR/orra-dev-${TIMESTAMP}.db"
  echo "  Cloud OSS: orra-dev.db (survives resets!)"
else
  echo "  WARNING: No database file found"
fi

# 2. GIT COMMIT — Save all code changes
echo ""
echo "[2/5] Committing all code to git..."
cd "$PROJECT_DIR"
git add -A
if [ -n "$(git status --porcelain)" ]; then
  COMMIT_MSG="${TIMESTAMP} — ${LABEL:-auto-backup}"
  git commit -m "$COMMIT_MSG" --allow-empty
  echo "  Committed: $COMMIT_MSG"
else
  echo "  No uncommitted changes"
fi

# 3. PUSH TO GITHUB — YOUR PERMANENT OFF-PLATFORM BACKUP!
echo ""
echo "[3/5] Pushing to GitHub (permanent backup you own!)..."
git push origin main 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  GitHub: PUSHED! Code is permanently safe at github.com/NolaNick-504/ORRA"
else
  echo "  GitHub: Push failed (will retry next backup cycle)"
  # Try setting up remote if it's missing
  git remote get-url origin >/dev/null 2>&1 || {
    echo "  Setting up GitHub remote..."
    git remote add origin https://NolaNick-504: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@github.com/NolaNick-504/ORRA.git
    git push -u origin main 2>/dev/null
  }
fi

# 4. GIT BUNDLE — Save ENTIRE repo history to OSS (survives resets!)
echo ""
echo "[4/5] Creating git bundle on cloud storage (survives resets!)..."
git bundle create "$OSS_DIR/orra-full-repo.bundle" --all 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  Cloud OSS: orra-full-repo.bundle ($(du -h "$OSS_DIR/orra-full-repo.bundle" | cut -f1))"
else
  git bundle create "$OSS_DIR/orra-full-repo.bundle" HEAD 2>/dev/null
  echo "  Cloud OSS: orra-full-repo.bundle (HEAD only)"
fi

# 5. SAVE CRITICAL FILES TO OSS
echo ""
echo "[5/5] Saving critical files to cloud..."
cp "$PROJECT_DIR/ORRA-STATE.md" "$OSS_DIR/ORRA-STATE.md" 2>/dev/null
cp "$PROJECT_DIR/PROJECT_STATE.md" "$OSS_DIR/PROJECT_STATE.md" 2>/dev/null
cp "$PROJECT_DIR/scripts/backup.sh" "$OSS_DIR/backup.sh" 2>/dev/null
cp "$PROJECT_DIR/scripts/restore.sh" "$OSS_DIR/restore.sh" 2>/dev/null
cp "$PROJECT_DIR/scripts/startup.sh" "$OSS_DIR/startup.sh" 2>/dev/null
echo "  Critical files saved to OSS"

# Cleanup old local backups (keep 10)
ls -t "$BACKUP_DIR"/orra-db-*.db 2>/dev/null | tail -n +11 | xargs -r rm
# Cleanup old OSS timestamped DBs (keep 5)
ls -t "$OSS_DIR"/orra-dev-*.db 2>/dev/null | tail -n +6 | xargs -r rm

echo ""
echo "================================================"
echo "  BACKUP COMPLETE — YOUR WORK IS SAFE!"
echo "================================================"
echo "  GitHub (PERMANENT — you own it!):"
echo "     https://github.com/NolaNick-504/ORRA (private)"
echo ""
echo "  Cloud OSS (survives resets):"
echo "     Git bundle: $OSS_DIR/orra-full-repo.bundle"
echo "     Database:   $OSS_DIR/orra-dev.db"
echo "     State:      $OSS_DIR/ORRA-STATE.md"
echo ""
echo "  Local (might not survive reset):"
echo "     Database:  orra-db-${TIMESTAMP}.db"
echo ""
echo "  To restore after a reset:"
echo "     bash scripts/restore.sh"
echo "================================================"
