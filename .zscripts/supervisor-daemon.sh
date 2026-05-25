#!/bin/bash
# =============================================================================
# ORRA supervisor daemon — runs the node server in a loop
# If the server crashes, it restarts it after 1 second
# This script is meant to be run inside a setsid session
# =============================================================================
# CRITICAL: Set ORRA_PUBLIC_URL to your app's public URL.
# This enables the server-side keep-alive that prevents FC from freezing
# the container. Without it, the container will freeze after ~3 minutes
# of no external traffic.
# =============================================================================

cd /home/z/my-project
export NODE_ENV=production
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="orra-s3cr3t-k3rman3nt-2024"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export AUTOPOST_KEY="orra-internal-autopost-2026"

# =============================================================================
# ⚠️ IMPORTANT: Set ORRA_PUBLIC_URL to your app's public URL!
# This is the #1 fix for FC container freezing.
# The server will ping this URL every 10 seconds, going through the FC
# load balancer, which counts as external traffic and prevents freezing.
#
# Example: export ORRA_PUBLIC_URL="https://orra.cn-hangzhou.fc.aliyuncs.com"
# Or if using a custom domain: export ORRA_PUBLIC_URL="https://orra.app"
#
# If you're unsure, check your FC console for the public endpoint.
# =============================================================================
export ORRA_PUBLIC_URL="${ORRA_PUBLIC_URL:-}"

LOG_FILE=/home/z/my-project/orra-supervisor.log
DB_FILE=/home/z/my-project/db/custom.db

echo "[$(date +%H:%M:%S)] Supervisor daemon started (PPID=$(ps -o ppid= -p $$))" >> "$LOG_FILE"

if [ -n "$ORRA_PUBLIC_URL" ]; then
  echo "[$(date +%H:%M:%S)] ORRA_PUBLIC_URL=$ORRA_PUBLIC_URL — server-side keep-alive ENABLED" >> "$LOG_FILE"
else
  echo "[$(date +%H:%M:%S)] WARNING: ORRA_PUBLIC_URL not set — server-side keep-alive DISABLED" >> "$LOG_FILE"
  echo "[$(date +%H:%M:%S)] Set ORRA_PUBLIC_URL to prevent FC container freezing!" >> "$LOG_FILE"
fi

LAST_BACKUP=$(date +%s)

# Start the keep-alive Python daemon (backup mechanism)
start_keep_alive() {
  if [ -f /home/z/my-project/.zscripts/keep-alive.py ]; then
    # Kill any existing keep-alive daemon
    python3 /home/z/my-project/.zscripts/keep-alive.py --stop 2>/dev/null || true

    # Set the URL for keep-alive.py
    export KEEP_ALIVE_URL="${ORRA_PUBLIC_URL:-http://127.0.0.1:3000}/api/health"

    # Start the daemon in the background
    python3 /home/z/my-project/.zscripts/keep-alive.py >> "$LOG_FILE" 2>&1 &
    echo "[$(date +%H:%M:%S)] Keep-alive daemon started" >> "$LOG_FILE"
  fi
}

while true; do
  node server.js >> "$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  echo "[$(date +%H:%M:%S)] Server started (PID: $SERVER_PID)" >> "$LOG_FILE"

  # Wait for server to be ready (up to 20 seconds)
  for i in $(seq 1 20); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
      echo "[$(date +%H:%M:%S)] Server UP (${i}s)" >> "$LOG_FILE"
      break
    fi
    sleep 1
  done

  # Start keep-alive daemon after server is up
  start_keep_alive

  # Monitor server process — wait for it to die
  while kill -0 $SERVER_PID 2>/dev/null; do
    NOW=$(date +%s)
    if [ $((NOW - LAST_BACKUP)) -gt 120 ]; then
      if [ -f "$DB_FILE" ]; then
        mkdir -p /home/sync/orra-db-backup 2>/dev/null
        cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
      fi
      LAST_BACKUP=$NOW
    fi
    sleep 10
  done

  # Server died — restart quickly
  wait $SERVER_PID 2>/dev/null
  EXIT_CODE=$?
  echo "[$(date +%H:%M:%S)] Server exited (code: $EXIT_CODE) - restarting in 1s..." >> "$LOG_FILE"

  # Backup DB on crash
  if [ -f "$DB_FILE" ]; then
    mkdir -p /home/sync/orra-db-backup 2>/dev/null
    cp "$DB_FILE" /home/sync/orra-db-backup/latest.db 2>/dev/null || true
  fi

  sleep 1
done
