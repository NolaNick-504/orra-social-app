#!/bin/bash
# ORRA Production Server Watchdog
# Restarts the production server automatically if it crashes
# No dev toolbar — safe for public access

PROJECT_DIR="/home/z/my-project"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"
LOG="/tmp/orra-prod.log"
WATCHDOG_LOG="/tmp/orra-watchdog.log"

while true; do
  # Check if production server is running
  if ! pgrep -f "node.*server.js" > /dev/null 2>&1; then
    echo "[$(date)] Production server down — restarting..." >> "$WATCHDOG_LOG"

    # Make sure the build exists
    if [ ! -f "$STANDALONE_DIR/server.js" ]; then
      echo "[$(date)] No build found — running build first..." >> "$WATCHDOG_LOG"
      cd "$PROJECT_DIR"
      npm run build >> "$WATCHDOG_LOG" 2>&1
      # Sync files
      rm -rf "$STANDALONE_DIR/.next/static" 2>/dev/null
      cp -r "$PROJECT_DIR/.next/static" "$STANDALONE_DIR/.next/static"
      rm -rf "$STANDALONE_DIR/public" 2>/dev/null
      cp -r "$PROJECT_DIR/public" "$STANDALONE_DIR/public"
      cp "$PROJECT_DIR/.env" "$STANDALONE_DIR/.env"
    fi

    cd "$STANDALONE_DIR"
    export PORT=3000
    export NODE_ENV=production
    export DATABASE_URL="file:/home/z/my-project/db/custom.db"
    export NEXTAUTH_SECRET="GE7zsSvcDhpu2P7M9QjO49o3yA4b770tkNtv1KW/H/A="
    export NEXTAUTH_URL="http://localhost:3000"
    export AUTH_TRUST_HOST=true
    nohup node server.js >> "$LOG" 2>&1 &
    sleep 5

    # Verify it started
    if curl -s -o /dev/null http://localhost:3000; then
      echo "[$(date)] Production server restarted successfully" >> "$WATCHDOG_LOG"
    else
      echo "[$(date)] Production server failed to start — will retry" >> "$WATCHDOG_LOG"
    fi
  fi
  sleep 15
done
