#!/bin/bash
# ============================================================
# ORRA HARD SAVE v5.0 RESTORE SCRIPT
# Created: 2026-05-10
# Description: Restore ORRA to the v5.0 checkpoint
#   - Echo/Repost feature complete with proper styling
#   - Green "Echoed" badge on top, normal border on nested card
#   - All features stable (auth, feed, reactions, DMs, games, etc.)
# ============================================================

set -e

PROJECT_DIR="/home/z/my-project"
BACKUP_DIR="$PROJECT_DIR/backups/hard-save-v5.0-echo-stable"
DB_BACKUP="$PROJECT_DIR/backups/hard-save-v5.0-echo-stable-20260510-232501.db"

echo "=========================================="
echo "  ORRA v5.0 HARD SAVE RESTORE"
echo "=========================================="
echo ""

# 1. Restore from git tag (preferred method)
echo "[1/3] Restoring source code from git tag 'hard-save-v5.0'..."
cd "$PROJECT_DIR"
git stash 2>/dev/null || true
git checkout hard-save-v5.0
echo "  -> Source code restored to hard-save-v5.0 tag"

# 2. Restore database
echo "[2/3] Restoring database..."
if [ -f "$DB_BACKUP" ]; then
    cp "$DB_BACKUP" "$PROJECT_DIR/db/custom.db"
    echo "  -> Database restored from $DB_BACKUP"
else
    echo "  -> WARNING: Database backup not found at $DB_BACKUP"
fi

# 3. Rebuild
echo "[3/3] Rebuilding project..."
cd "$PROJECT_DIR"
npm install
npx prisma generate
npx next build 2>/dev/null || echo "  -> Build may need manual run"

echo ""
echo "=========================================="
echo "  RESTORE COMPLETE!"
echo "  Run: cd $PROJECT_DIR && bash deploy.sh"
echo "=========================================="
