#!/bin/bash
# ORRA Production Server Starter
# Builds and runs the app in production mode — no dev toolbar visible to visitors
# Fast startup, optimized performance, secure for public access

cd /home/z/my-project

# Kill any existing server
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
sleep 2

# Check if we need to build
if [ ! -f ".next/standalone/server.js" ]; then
  echo "No production build found. Building..."
  npm run build
  # Sync static files
  rm -rf .next/standalone/.next/static
  cp -r .next/static .next/standalone/.next/static
  rm -rf .next/standalone/public
  cp -r public .next/standalone/public
  cp .env .next/standalone/.env
fi

echo "Starting ORRA in PRODUCTION mode..."
echo "No dev toolbar — safe for public access."

# Start production server
export PORT=3000
export NODE_ENV=production
cd .next/standalone
node server.js
