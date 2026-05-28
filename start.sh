#!/bin/bash
# ORRA Auto-Recovery Startup Script
# Handles missing node_modules by auto-reinstalling before starting

cd /home/z/my-project

echo "[ORRA-START] Checking environment..."

# Check if node_modules exists and has the 'next' module
if [ ! -d "node_modules" ] || [ ! -d "node_modules/next" ]; then
  echo "[ORRA-START] node_modules missing or incomplete — reinstalling..."
  npm install --prefer-offline --production=false 2>&1 | tail -3
  echo "[ORRA-START] Reinstall complete"
fi

# Check if .next build exists
if [ ! -d ".next/server" ]; then
  echo "[ORRA-START] Build missing — rebuilding..."
  npm run build 2>&1 | tail -5
  echo "[ORRA-START] Build complete"
fi

# Check if image directories exist
if [ ! -d "public/images/live-thumbnails" ] || [ ! -d "public/images/profile-covers" ]; then
  echo "[ORRA-START] Image directories missing — re-downloading..."
  mkdir -p public/images/live-thumbnails public/images/profile-covers
  node scripts/re-download-images.js 2>&1 | tail -5
fi

echo "[ORRA-START] Starting server..."
NODE_ENV=production exec node server.js
