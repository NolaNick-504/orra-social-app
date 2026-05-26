#!/bin/bash
# ============================================
# ORRA RESTORE v2.0 — Recover From Cloud/GitHub
# ============================================
# This restores from:
#   1. GitHub (primary — you own it permanently!)
#   2. OSS cloud storage (survives server resets)
# Usage:
#   bash scripts/restore.sh           — Show available backups & status
#   bash scripts/restore.sh full      — Full restore (code + DB)
#   bash scripts/restore.sh github    — Restore code from GitHub (primary!)
#   bash scripts/restore.sh db        — Restore database only
#   bash scripts/restore.sh code      — Restore code from OSS git bundle
# ============================================

PROJECT_DIR="/home/z/my-project"
OSS_DIR="$PROJECT_DIR/upload/orra-backup"  # Cloud storage — SURVIVES RESETS
GITHUB_REPO="https://NolaNick-504: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@github.com/NolaNick-504/ORRA.git"

# Show status if no arguments
if [ -z "$1" ]; then
  echo "================================================"
  echo "  ORRA RESTORE — Cloud Backup Status"
  echo "================================================"
  echo ""
  
  if [ -f "$OSS_DIR/orra-full-repo.bundle" ]; then
    echo "  ☁️  Git Bundle: EXISTS ($(du -h "$OSS_DIR/orra-full-repo.bundle" | cut -f1))"
    echo "     Contains ALL code history — survives server resets"
  else
    echo "  ❌ Git Bundle: NOT FOUND — no cloud code backup!"
  fi
  
  if [ -f "$OSS_DIR/orra-dev.db" ]; then
    echo "  ☁️  Database:   EXISTS ($(du -h "$OSS_DIR/orra-dev.db" | cut -f1))"
    echo "     Current data — survives server resets"
  else
    echo "  ❌ Database:   NOT FOUND — no cloud DB backup!"
  fi
  
  echo ""
  echo "  GitHub (PERMANENT — you own it!):"
  echo "     https://github.com/NolaNick-504/ORRA (private repo)"
  echo ""
  echo "  Available OSS backup files:"
  ls -lht "$OSS_DIR/" 2>/dev/null
  echo ""
  echo "================================================"
  echo "  USAGE:"
  echo "  bash scripts/restore.sh github — Restore code from GitHub (BEST!)"
  echo "  bash scripts/restore.sh full   — Restore everything from cloud"
  echo "  bash scripts/restore.sh db     — Restore database from cloud"
  echo "  bash scripts/restore.sh code   — Restore code from cloud bundle"
  echo "================================================"
  exit 0
fi

MODE="$1"

# GITHUB RESTORE (code from GitHub — PRIMARY METHOD!)
if [ "$MODE" = "github" ]; then
  echo "================================================"
  echo "  RESTORE FROM GITHUB (PERMANENT BACKUP)"
  echo "================================================"
  echo ""
  
  echo "[1/3] Cloning from GitHub..."
  cd /home/z
  rm -rf /tmp/orra-github 2>/dev/null
  git clone "$GITHUB_REPO" /tmp/orra-github 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "  GitHub clone failed! Trying OSS bundle instead..."
    bash scripts/restore.sh code
    exit $?
  fi
  
  # Copy restored code over current project (preserving upload/, .git/, and database)
  echo "[2/3] Restoring code files..."
  rsync -a --exclude='upload' --exclude='.git' --exclude='prisma/dev.db' --exclude='node_modules' /tmp/orra-github/ "$PROJECT_DIR/" 2>/dev/null
  rm -rf /tmp/orra-github
  
  # Set up git remote pointing to GitHub
  cd "$PROJECT_DIR"
  git remote remove origin 2>/dev/null
  git remote add origin "$GITHUB_REPO"
  
  echo "[3/3] Rebuilding and restarting..."
  npm install 2>/dev/null
  npx prisma generate 2>/dev/null
  npx next build 2>/dev/null
  npx pm2 restart orra 2>/dev/null || npx pm2 start npm --name orra -- start 2>/dev/null
  
  echo ""
  echo "  RESTORED FROM GITHUB! Your code is back!"
  exit 0
fi

# FULL RESTORE (code + database from cloud)
if [ "$MODE" = "full" ]; then
  echo "================================================"
  echo "  FULL RESTORE FROM CLOUD"
  echo "================================================"
  echo ""
  echo "⚠️  This will overwrite current project with cloud backup!"
  echo "   The cloud backup SURVIVES server resets."
  echo ""
  
  BUNDLE="$OSS_DIR/orra-full-repo.bundle"
  DB="$OSS_DIR/orra-dev.db"
  
  if [ ! -f "$BUNDLE" ]; then
    echo "❌ No git bundle found in cloud storage!"
    exit 1
  fi
  
  if [ ! -f "$DB" ]; then
    echo "⚠️  No database found in cloud storage (code only will be restored)"
  fi
  
  # Step 1: Restore code from git bundle
  echo "[1/3] Restoring code from cloud bundle..."
  cd /home/z
  # Clone from bundle into a temp location
  rm -rf /tmp/orra-restore 2>/dev/null
  git clone "$BUNDLE" /tmp/orra-restore 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "❌ Failed to clone from bundle!"
    exit 1
  fi
  
  # Copy restored code over current project (preserving upload/ and .git/)
  rsync -a --exclude='upload' --exclude='.git' /tmp/orra-restore/ "$PROJECT_DIR/" 2>/dev/null
  rm -rf /tmp/orra-restore
  echo "  ✅ Code restored from cloud"
  
  # Step 2: Restore database
  if [ -f "$DB" ]; then
    echo "[2/3] Restoring database from cloud..."
    cp "$DB" "$PROJECT_DIR/prisma/dev.db"
    echo "  ✅ Database restored from cloud"
  else
    echo "[2/3] No cloud database to restore"
  fi
  
  # Step 3: Rebuild and restart
  echo "[3/3] Rebuilding and restarting..."
  cd "$PROJECT_DIR"
  npm install 2>/dev/null
  npx prisma generate 2>/dev/null
  npx next build 2>/dev/null
  npx pm2 restart orra 2>/dev/null || npx pm2 start npm --name orra -- start 2>/dev/null
  echo "  ✅ App rebuilt and restarted"
  
  echo ""
  echo "================================================"
  echo "  FULL RESTORE COMPLETE!"
  echo "================================================"
  exit 0
fi

# DATABASE ONLY RESTORE
if [ "$MODE" = "db" ]; then
  DB="$OSS_DIR/orra-dev.db"
  
  if [ ! -f "$DB" ]; then
    echo "❌ No database found in cloud storage!"
    exit 1
  fi
  
  echo "Restoring database from cloud..."
  
  # Stop app
  cd "$PROJECT_DIR" && npx pm2 stop orra 2>/dev/null
  
  # Restore
  cp "$DB" "$PROJECT_DIR/prisma/dev.db"
  echo "  ✅ Database restored from cloud"
  
  # Restart
  npx pm2 restart orra 2>/dev/null || npx pm2 start npm --name orra -- start 2>/dev/null
  echo "  ✅ App restarted"
  exit 0
fi

# CODE ONLY RESTORE
if [ "$MODE" = "code" ]; then
  BUNDLE="$OSS_DIR/orra-full-repo.bundle"
  
  if [ ! -f "$BUNDLE" ]; then
    echo "❌ No git bundle found in cloud storage!"
    exit 1
  fi
  
  echo "Restoring code from cloud bundle..."
  
  cd /home/z
  rm -rf /tmp/orra-restore 2>/dev/null
  git clone "$BUNDLE" /tmp/orra-restore 2>/dev/null
  rsync -a --exclude='upload' --exclude='.git' --exclude='prisma/dev.db' /tmp/orra-restore/ "$PROJECT_DIR/" 2>/dev/null
  rm -rf /tmp/orra-restore
  echo "  ✅ Code restored from cloud"
  
  cd "$PROJECT_DIR"
  npm install 2>/dev/null
  npx prisma generate 2>/dev/null
  npx next build 2>/dev/null
  npx pm2 restart orra 2>/dev/null
  echo "  ✅ App rebuilt and restarted"
  exit 0
fi

echo "❌ Unknown mode: $MODE"
echo "   Use: full, db, or code"
exit 1
