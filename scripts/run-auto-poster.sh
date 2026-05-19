#!/bin/bash
# Auto-poster keep-alive runner
# Restarts the auto-poster if it crashes
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting auto-poster..."
  node scripts/auto-poster.js --cron
  EXIT_CODE=$?
  echo "[$(date)] Auto-poster exited with code $EXIT_CODE, restarting in 10s..."
  sleep 10
done
