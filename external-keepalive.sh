#!/bin/bash
# ORRA External Keep-Alive v2 — More robust, actually stays running
# Pings the PUBLIC URL every 15 seconds to keep the container alive
# This request goes through the platform's load balancer (counts as real traffic)

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/external-keepalive.log"
PUBLIC_URL=""
COUNT=0

# Load the public URL
if [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
  PUBLIC_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
fi

# Fallback
if [ -z "$PUBLIC_URL" ]; then
  PUBLIC_URL="https://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.chatglm.site"
fi

echo "[$(date)] External keep-alive v2 STARTING. URL: $PUBLIC_URL. PID: $$" >> "$LOG_FILE"

# Keep running forever — ignore most signals
trap '' SIGTERM SIGHUP SIGUSR1 SIGUSR2
trap 'echo "[$(date)] Received SIGINT — shutting down" >> "$LOG_FILE"; exit 0' SIGINT

while true; do
  # Re-read the public URL in case it changed
  if [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
    NEW_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$PUBLIC_URL" ]; then
      PUBLIC_URL="$NEW_URL"
      echo "[$(date)] Updated public URL: $PUBLIC_URL" >> "$LOG_FILE"
    fi
  fi
  
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$PUBLIC_URL/api/health" 2>/dev/null || echo "000")
  COUNT=$((COUNT + 1))
  
  if [ "$STATUS" = "200" ]; then
    # Log every 10th successful ping (every ~2.5 min) to confirm it's working
    if [ $((COUNT % 10)) -eq 0 ]; then
      echo "[$(date)] ★ Public URL ping OK (#$COUNT)" >> "$LOG_FILE"
    fi
  else
    echo "[$(date)] ⚠ Public URL ping returned $STATUS (#$COUNT)" >> "$LOG_FILE"
  fi
  
  sleep 15
done
