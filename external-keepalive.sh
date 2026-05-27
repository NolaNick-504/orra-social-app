#!/bin/bash
# ORRA External Keep-Alive — Pings the PUBLIC URL every 30 seconds
# This is the MOST EFFECTIVE way to prevent container freezing because
# the request goes through the platform's load balancer (counts as real traffic)

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

echo "[$(date)] External keep-alive STARTING. URL: $PUBLIC_URL. PID: $$" >> "$LOG_FILE"

# Keep running forever — trap signals to prevent unexpected exit
trap 'echo "[$(date)] Received signal — ignoring (keep-alive must stay running)" >> "$LOG_FILE"' SIGTERM SIGINT SIGHUP

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$PUBLIC_URL/api/health" 2>/dev/null || echo "000")
  COUNT=$((COUNT + 1))
  
  if [ "$STATUS" = "200" ]; then
    # Log every 5th successful ping (every ~2.5 min) to confirm it's working
    if [ $((COUNT % 5)) -eq 0 ]; then
      echo "[$(date)] ★ Public URL ping OK (#$COUNT) — container stays alive!" >> "$LOG_FILE"
    fi
  else
    echo "[$(date)] ⚠ Public URL ping returned $STATUS — may need to rediscover URL" >> "$LOG_FILE"
    
    # Try to rediscover the URL
    if [ -f "$PROJECT_DIR/discovered-url.txt" ]; then
      NEW_URL=$(cat "$PROJECT_DIR/discovered-url.txt" 2>/dev/null | tr -d '[:space:]')
      if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$PUBLIC_URL" ]; then
        PUBLIC_URL="$NEW_URL"
        echo "[$(date)] Rediscovered public URL: $PUBLIC_URL" >> "$LOG_FILE"
      fi
    fi
  fi
  
  sleep 30
done
