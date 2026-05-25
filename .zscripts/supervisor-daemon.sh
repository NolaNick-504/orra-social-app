#!/bin/bash
# ORRA supervisor daemon — runs the node server in a loop
# If the server crashes, it restarts it after 1 second
# This script is meant to be run inside a setsid session

cd /home/z/my-project
export NODE_ENV=production
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="orra-s3cr3t-k3rman3nt-2024"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export AUTOPOST_KEY="orra-internal-autopost-2026"
LOG_FILE=/home/z/my-project/orra-supervisor.log
DB_FILE=/home/z/my-project/db/custom.db

echo "[$(date +%H:%M:%S)] Supervisor daemon started (PPID=$(ps -o ppid= -p $$))" >> "$LOG_FILE"

LAST_BACKUP=$(date +%s)

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

  # Monitor server process — wait for it to die
  # Client-side KeepAliveProvider handles keep-alive pings to FC
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
