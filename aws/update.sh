#!/bin/bash
set -e
echo "=== ORRA Update Script ==="

# Force pull latest code (handles force-pushes)
echo "Fetching latest code..."
git fetch origin
git reset --hard origin/main

# Install dependencies if changed
echo "Installing dependencies..."
npm install --production=false 2>/dev/null

# Clean build (remove old .next to prevent stale chunks)
echo "Cleaning old build..."
rm -rf .next

# Build
echo "Building app..."
npm run build

# Restart server
echo "Restarting server..."
pm2 restart orra-server

echo ""
echo "ORRA UPDATED!"
