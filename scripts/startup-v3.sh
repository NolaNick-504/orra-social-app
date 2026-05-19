#!/bin/bash
# ============================================
# ORRA STARTUP & RECOVERY v3.0
# ============================================
# Run this if the server restarts or anything goes wrong.
# It will: backup current state -> restore from cloud -> rebuild -> restart
# ============================================

PROJECT_DIR="/home/z/my-project"
OSS_DIR="$PROJECT_DIR/upload/orra-backup"
cd "$PROJECT_DIR"

echo "================================================"
echo "  ORRA STARTUP & RECOVERY v3.0"
echo "  $(date)"
echo "================================================"

# 0. Kill any leftover processes
echo ""
echo "[1/7] Cleaning up old processes..."
pkill -f "next start" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# 1. Quick backup of current state (if anything is worth saving)
echo ""
echo "[2/7] Quick backup of current state..."
if [ -f "$PROJECT_DIR/src/app/page.tsx" ]; then
  bash "$OSS_DIR/backup.sh" "startup-recovery" 2>/dev/null
  echo "  Current state backed up"
else
  echo "  No project files found — skipping backup"
fi

# 2. Check if project exists and has source files
echo ""
echo "[3/7] Checking project state..."
if [ ! -f "$PROJECT_DIR/src/app/page.tsx" ]; then
  echo "  Project files missing! Restoring from cloud..."
  
  # Try GitHub first, then OSS bundle, then quick file copy
  if command -v git &>/dev/null; then
    echo "  Attempting GitHub restore..."
    bash "$OSS_DIR/restore.sh" github 2>/dev/null
    if [ $? -ne 0 ]; then
      echo "  GitHub failed, trying quick restore..."
      bash "$OSS_DIR/restore.sh" quick 2>/dev/null
    fi
  else
    bash "$OSS_DIR/restore.sh" quick 2>/dev/null
  fi
else
  echo "  Project files present — no restore needed"
fi

# 3. Verify EXIF orientation fix is in place
echo ""
echo "[4/7] Verifying EXIF orientation fix..."
EXIF_OK=true
for route in posts stories users/profile; do
  FILE="$PROJECT_DIR/src/app/api/$route/route.ts"
  if [ -f "$FILE" ]; then
    if grep -q "\.rotate()" "$FILE"; then
      echo "  $route/route.ts: .rotate() PRESENT"
    else
      echo "  $route/route.ts: .rotate() MISSING — restoring from backup!"
      # Restore from OSS backup
      case $route in
        posts) cp "$OSS_DIR/src-backup/src/app/api/posts/route.ts" "$FILE" ;;
        stories) cp "$OSS_DIR/src-backup/src/app/api/stories/route.ts" "$FILE" ;;
        users/profile)
          mkdir -p "$PROJECT_DIR/src/app/api/users/profile"
          cp "$OSS_DIR/src-backup/src/app/api/users/profile/route.ts" "$FILE"
          ;;
      esac
      EXIF_OK=false
    fi
  fi
done

# Check CSS fallback
if [ -f "$PROJECT_DIR/src/app/globals.css" ]; then
  if grep -q "image-orientation" "$PROJECT_DIR/src/app/globals.css"; then
    echo "  globals.css: image-orientation PRESENT"
  else
    echo "  globals.css: image-orientation MISSING — restoring from backup!"
    cp "$OSS_DIR/src-backup/src/app/globals.css" "$PROJECT_DIR/src/app/globals.css"
    EXIF_OK=false
  fi
fi

if [ "$EXIF_OK" = true ]; then
  echo "  ALL EXIF FIXES VERIFIED!"
else
  echo "  Some EXIF fixes were restored from backup"
fi

# 4. Verify database exists
echo ""
echo "[5/7] Checking database..."
if [ ! -f "$PROJECT_DIR/db/custom.db" ]; then
  echo "  Database missing! Restoring from cloud..."
  mkdir -p "$PROJECT_DIR/db"
  if [ -f "$OSS_DIR/orra-custom.db" ]; then
    cp "$OSS_DIR/orra-custom.db" "$PROJECT_DIR/db/custom.db"
    echo "  Database restored from OSS"
  else
    echo "  WARNING: No database backup found!"
  fi
else
  echo "  Database present ($(du -h "$PROJECT_DIR/db/custom.db" | cut -f1))"
fi

# 5. Install dependencies if needed
echo ""
echo "[6/7] Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  bun install 2>/dev/null || npm install 2>/dev/null
else
  echo "  Dependencies present"
fi

# 6. Build and start
echo ""
echo "[7/7] Building and starting ORRA..."

# Generate Prisma client
npx prisma generate 2>/dev/null

# Build if needed
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "  Building app..."
  npx next build 2>/dev/null
else
  echo "  Build present, checking if stale..."
  # Quick check: if source files are newer than build, rebuild
  SRC_NEWER=$(find src/ -name "*.tsx" -newer .next/BUILD_ID 2>/dev/null | head -1)
  if [ -n "$SRC_NEWER" ]; then
    echo "  Source files newer than build — rebuilding..."
    npx next build 2>/dev/null
  else
    echo "  Build is current"
  fi
fi

# Start the app
echo "  Starting ORRA on port 3000..."
nohup npx next start -p 3000 &>/dev/null &
sleep 3

# Verify it's running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
  echo "  ORRA IS LIVE on port 3000!"
else
  echo "  WARNING: App may not be responding — checking process..."
  if pgrep -f "next start" >/dev/null; then
    echo "  Process is running, may need more time to start"
  else
    echo "  Process not found! Starting in dev mode..."
    nohup npx next dev -p 3000 &>/dev/null &
  fi
fi

echo ""
echo "================================================"
echo "  ORRA STARTUP COMPLETE!"
echo "================================================"
echo "  App:       http://localhost:3000"
echo "  Database:  $PROJECT_DIR/db/custom.db"
echo "  Backups:   $OSS_DIR/"
echo "  Restore:   bash $OSS_DIR/restore.sh"
echo "  Backup:    bash $OSS_DIR/backup.sh"
echo "================================================"
