#!/bin/bash
# =============================================================================
# ORRA Social App - Quick Update Script
# =============================================================================
# Run this when you want to update ORRA with new code from GitHub.
#
# Usage:  bash update-orra.sh
#
# What it does:
#   1. Downloads latest code from GitHub
#   2. Installs any new dependencies
#   3. Rebuilds the app
#   4. Restarts the server
#   5. Verifies it's working
# =============================================================================

set -e
APP_DIR="/home/ubuntu/orra"

echo ""
echo -e "\033[0;34m========================================\033[0m"
echo -e "\033[0;34m   ORRA - Updating to Latest Version\033[0m"
echo -e "\033[0;34m========================================\033[0m"
echo ""

cd "$APP_DIR"

# Step 1: Pull latest code
echo -e "\033[1;33m[1/5] Downloading latest code...\033[0m"
git pull origin main

# Step 2: Install dependencies
echo -e "\033[1;33m[2/5] Installing dependencies...\033[0m"
npm install

# Step 3: Generate Prisma client
echo -e "\033[1;33m[3/5] Updating database schema...\033[0m"
npx prisma generate
npx prisma db push

# Step 4: Build
echo -e "\033[1;33m[4/5] Building app (2-3 minutes)...\033[0m"
npm run build

# Step 5: Restart
echo -e "\033[1;33m[5/5] Restarting server...\033[0m"
pm2 restart orra-server

# Wait and verify
echo ""
echo -e "\033[1;33mVerifying server is running...\033[0m"
sleep 5
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo ""
    echo -e "\033[0;32m========================================\033[0m"
    echo -e "\033[0;32m   ✓ UPDATE COMPLETE! ORRA is running!\033[0m"
    echo -e "\033[0;32m========================================\033[0m"
else
    echo ""
    echo -e "\033[0;31m⚠ Server may need a moment to start up.\033[0m"
    echo -e "\033[0;33mCheck logs with: pm2 logs orra-server\033[0m"
fi
