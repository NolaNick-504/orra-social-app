#!/bin/bash
# =============================================================================
# ORRA Safe Deploy Script — Memory-Safe for t3.small (2GB RAM)
# =============================================================================
# Stops the server FIRST, then builds, then restarts.
# This prevents OOM crashes during npm run build on low-memory servers.
#
# Usage: bash /home/ubuntu/orra/aws/safe-deploy.sh
# =============================================================================

APP_DIR="/home/ubuntu/orra"
LOG_FILE="/home/ubuntu/orra/deploy-log.txt"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "[$TIMESTAMP] Safe deploy starting..." > "$LOG_FILE"

# Step 1: STOP the server first to free memory for the build
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Stopping server to free memory..." >> "$LOG_FILE"
cd "$APP_DIR"
pm2 stop orra-server 2>/dev/null || true

# Step 2: Pull latest code
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Pulling latest code..." >> "$LOG_FILE"
git fetch origin
git reset --hard origin/main

# Step 3: Install dependencies
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Installing dependencies..." >> "$LOG_FILE"
npm install --production=false 2>&1 | tail -1

# Step 4: Generate Prisma client
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Generating Prisma client..." >> "$LOG_FILE"
npx prisma generate 2>&1 | tail -1

# Step 5: Build (now safe because server is stopped — full RAM available)
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Building (server stopped, full RAM available)..." >> "$LOG_FILE"
rm -rf .next
NODE_OPTIONS="--max-old-space-size=1536" npm run build 2>&1 | tail -10

# Step 6: Delete old PM2 process (clean start)
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Starting server..." >> "$LOG_FILE"
pm2 delete orra-server 2>/dev/null || true
pm2 start server.js --name orra-server
pm2 save

echo "[$(date +"%Y-%m-%d %H:%M:%S")] Deploy complete!" >> "$LOG_FILE"
echo "Deploy complete at $(date)" 
