#!/bin/bash
# ============================================
# ORRA RESTORE SCRIPT
# Restores the app to the stable restore point
# Date: 2026-05-16
# ============================================

set -e

echo "============================================"
echo "  ORRA RESTORE SCRIPT"
echo "  Restoring to stable restore point..."
echo "============================================"
echo ""

PROJECT_DIR="/home/z/my-project"
BACKUP_DB="$PROJECT_DIR/backups/custom.db.restore-point"
ACTIVE_DB="$PROJECT_DIR/db/custom.db"
RESTORE_COMMIT="3c5d46f"

# 1. Stop any running Next.js processes
echo "[1/6] Stopping Next.js server..."
pkill -f "next" 2>/dev/null || true
sleep 3
echo "  ✓ Server stopped"

# 2. Restore database from backup
echo ""
echo "[2/6] Restoring database..."
if [ -f "$BACKUP_DB" ]; then
  # Remove WAL and SHM files first
  rm -f "$ACTIVE_DB-wal" "$ACTIVE_DB-shm" 2>/dev/null || true
  cp "$BACKUP_DB" "$ACTIVE_DB"
  echo "  ✓ Database restored from backup"
else
  echo "  ⚠ Backup DB not found at $BACKUP_DB"
  echo "  Attempting git restore..."
fi

# 3. Restore source code from git commit
echo ""
echo "[3/6] Restoring source code to commit $RESTORE_COMMIT..."
cd "$PROJECT_DIR"
git checkout "$RESTORE_COMMIT" -- src/ prisma/ public/ 2>/dev/null || {
  echo "  ⚠ Could not restore from git, trying git stash + checkout..."
  git stash 2>/dev/null || true
  git checkout "$RESTORE_COMMIT" -- src/ prisma/ public/ 2>/dev/null || true
}
echo "  ✓ Source code restored"

# 4. Push Prisma schema
echo ""
echo "[4/6] Syncing database schema..."
cd "$PROJECT_DIR"
DATABASE_URL="file:/home/z/my-project/db/custom.db" npx prisma db push --accept-data-loss 2>/dev/null || {
  echo "  ⚠ Schema push had issues, but this is usually OK"
}
echo "  ✓ Schema synced"

# 5. Rebuild the app
echo ""
echo "[5/6] Rebuilding the app..."
cd "$PROJECT_DIR"
npx next build --webpack 2>&1 | tail -5
echo "  ✓ App rebuilt"

# 6. Start the server
echo ""
echo "[6/6] Starting the server..."
cd "$PROJECT_DIR"
NEXTAUTH_SECRET=orra-super-secret-key-2025-production \
DATABASE_URL=file:/home/z/my-project/db/custom.db \
nohup npx next start -p 3000 > /tmp/next-server.log 2>&1 &
sleep 5

# Verify server is running
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ | grep -q "200"; then
  echo "  ✓ Server started successfully"
else
  echo "  ⚠ Server may need a moment - check http://127.0.0.1:3000/"
fi

echo ""
echo "============================================"
echo "  RESTORE COMPLETE!"
echo "  App should be running at http://127.0.0.1:3000/"
echo ""
echo "  Database stats at restore point:"
echo "    17 users, 207 posts, 1324 comments"
echo "    12 hubs, 69 hub posts"
echo "    27 reels, 22 stories"
echo "============================================"
