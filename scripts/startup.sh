#!/bin/bash
# ============================================
# ORRA STARTUP — Full Recovery & Launch
# ============================================
# Run this if the server restarts or anything goes wrong.
# It will: backup current state → rebuild → restart everything
# ============================================

PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

echo "================================================"
echo "  ORRA STARTUP & RECOVERY"
echo "================================================"

# 0. Kill any leftover processes
echo ""
echo "[1/6] Cleaning up old processes..."
pkill -f "next start" 2>/dev/null
pkill -f "auto-backup-daemon" 2>/dev/null
sleep 2

# 1. Quick backup of current state
echo ""
echo "[2/6] Quick backup of current state..."
bash scripts/backup.sh "startup-recovery" 2>/dev/null

# 2. Install PM2 if missing
echo ""
echo "[3/6] Ensuring PM2 is installed..."
if ! command -v npx &>/dev/null; then
  echo "  ❌ npx not found — cannot continue"
  exit 1
fi

if ! npx pm2 --version &>/dev/null; then
  echo "  Installing PM2..."
  npm install pm2 --save-dev 2>/dev/null
fi
echo "  ✅ PM2 ready"

# 3. Install dependencies if node_modules is missing
echo ""
echo "[4/6] Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  npm install 2>/dev/null
else
  echo "  ✅ Dependencies present"
fi

# 4. Rebuild if .next is missing or stale
echo ""
echo "[5/6] Checking build..."
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "  Building app..."
  npx next build 2>/dev/null
else
  echo "  ✅ Build present"
fi

# 5. Start the app with PM2
echo ""
echo "[6/6] Starting ORRA..."
npx pm2 delete orra 2>/dev/null  # Remove old process
npx pm2 start npm --name orra -- start 2>/dev/null
npx pm2 save 2>/dev/null

# 6. Start auto-backup daemon
echo ""
echo "Starting auto-backup daemon..."
nohup bash scripts/auto-backup-daemon.sh &>/dev/null &

# Done
sleep 5
echo ""
echo "================================================"
echo "  ORRA IS LIVE!"
echo "================================================"
npx pm2 status 2>/dev/null
echo ""
echo "  🔗 App:      http://localhost:3000"
echo "  💾 Backups:  $PROJECT_DIR/backups/"
echo "  📋 Restore:  npm run restore"
echo "  💾 Backup:   npm run backup"
echo "================================================"
