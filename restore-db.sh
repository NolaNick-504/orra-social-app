#!/bin/bash
# ============================================
# ORRA QUICK DATABASE RESTORE
# Only restores the database (fast, no rebuild)
# Use when: data got corrupted, reseed happened,
# posts/users disappeared, etc.
# ============================================

set -e

PROJECT_DIR="/home/z/my-project"
BACKUP_DB="$PROJECT_DIR/backups/custom.db.restore-point"
ACTIVE_DB="$PROJECT_DIR/db/custom.db"

echo "Restoring ORRA database from restore point..."

# Stop server briefly to release DB locks
pkill -f "next" 2>/dev/null || true
sleep 2

# Remove WAL/SHM and restore
rm -f "$ACTIVE_DB-wal" "$ACTIVE_DB-shm" 2>/dev/null || true
cp "$BACKUP_DB" "$ACTIVE_DB"

echo "✓ Database restored!"

# Restart server
cd "$PROJECT_DIR"
NEXTAUTH_SECRET=orra-super-secret-key-2025-production \
DATABASE_URL=file:/home/z/my-project/db/custom.db \
nohup npx next start -p 3000 > /tmp/next-server.log 2>&1 &
sleep 5

echo "✓ Server restarted at http://127.0.0.1:3000/"
