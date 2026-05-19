#!/bin/bash
# ORRA Game Arena Restore Script
# This restores the locked/protected game arena from backup
# Run this if game arena files or covers ever get lost or corrupted

set -e

LOCK_DIR="/home/z/my-project/protected-backups/game-arena-lock"
UPLOAD_LOCK="/home/z/my-project/upload/game-arena-lock"
PROJECT="/home/z/my-project"

echo "=== ORRA Game Arena Restore ==="

# Prefer upload backup (survives container resets), fall back to protected-backups
if [ -d "$UPLOAD_LOCK/games" ] && [ "$(ls -A $UPLOAD_LOCK/games)" ]; then
    SOURCE="$UPLOAD_LOCK"
    echo "Using upload/ backup (persistent storage)"
elif [ -d "$LOCK_DIR/games" ] && [ "$(ls -A $LOCK_DIR/games)" ]; then
    SOURCE="$LOCK_DIR"
    echo "Using protected-backups/ backup"
else
    echo "ERROR: No game arena backup found!"
    exit 1
fi

# Restore game arena component
echo "Restoring game-arena.tsx..."
cp "$SOURCE/game-arena.tsx" "$PROJECT/src/components/aura/game-arena.tsx"

# Restore all game components
echo "Restoring game components..."
cp "$SOURCE/games/"*.tsx "$PROJECT/src/components/aura/games/"

# Restore game cover images
echo "Restoring game cover images..."
cp "$SOURCE/game-covers-v2/"*.png "$PROJECT/public/images/game-covers-v2/"

# Restore banner images
echo "Restoring banner images..."
cp "$SOURCE/banners/"*.png "$PROJECT/public/images/banners/"

# Rebuild and restart
echo "Rebuilding app..."
cd "$PROJECT"
rm -rf .next
npm run build

echo "Restarting app..."
npx pm2 restart orra 2>/dev/null || npx pm2 start npm --name orra -- start

echo ""
echo "=== Game Arena Restored Successfully! ==="
echo "All 17 games, covers, and banners are back."
