#!/bin/bash
# ORRA External Keep-Alive v3 — Bulletproof
# Pings the PUBLIC URL to keep the container alive.
# This process is monitored and auto-restarted by the supervisor (dev.sh).
# Even if this script dies, the supervisor will restart it.

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/external-keepalive.log"
PID_FILE="$PROJECT_DIR/external-keepalive.pid"
PUBLIC_URL=""
COUNT=0
CONSECUTIVE_FAILS=0

# Write PID file for supervisor monitoring
echo $$ > "$PID_FILE"

# Load the public URL
if [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
  PUBLIC_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
fi

# Fallback
if [ -z "$PUBLIC_URL" ]; then
  PUBLIC_URL="https://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.chatglm.site"
fi

echo "[$(date)] External keep-alive v3 STARTING. URL: $PUBLIC_URL. PID: $$" >> "$LOG_FILE"

# Keep running forever — ignore most signals
trap '' SIGTERM SIGHUP SIGUSR1 SIGUSR2
trap 'echo "[$(date)] Received SIGINT — shutting down" >> "$LOG_FILE"; rm -f "$PID_FILE"; exit 0' SIGINT

while true; do
  # Re-read the public URL in case it changed
  if [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
    NEW_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$PUBLIC_URL" ]; then
      PUBLIC_URL="$NEW_URL"
      echo "[$(date)] Updated public URL: $PUBLIC_URL" >> "$LOG_FILE"
    fi
  fi

  # Ping the public URL health endpoint
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$PUBLIC_URL/api/health" 2>/dev/null || echo "000")
  COUNT=$((COUNT + 1))

  if [ "$STATUS" = "200" ]; then
    CONSECUTIVE_FAILS=0
    # Log every 20th successful ping (every ~5 min) to confirm it's working
    if [ $((COUNT % 20)) -eq 0 ]; then
      echo "[$(date)] ★ Public URL ping OK (#$COUNT)" >> "$LOG_FILE"
    fi
  else
    CONSECUTIVE_FAILS=$((CONSECUTIVE_FAILS + 1))
    echo "[$(date)] ⚠ Public URL ping returned $STATUS (#$COUNT, fails: $CONSECUTIVE_FAILS)" >> "$LOG_FILE"

    # Also ping the homepage (different path = looks like real traffic)
    if [ $((CONSECUTIVE_FAILS % 3)) -eq 0 ]; then
      curl -s -o /dev/null --max-time 10 "$PUBLIC_URL/" 2>/dev/null || true
    fi
  fi

  # Also ping through Caddy proxy (port 81) to keep it warm
  curl -s -o /dev/null --max-time 5 http://127.0.0.1:81/api/health 2>/dev/null || true

  # Write heartbeat timestamp (supervisor can check this to see if we're alive)
  date +%s > "$PROJECT_DIR/.keepalive-heartbeat"

  sleep 15
done
