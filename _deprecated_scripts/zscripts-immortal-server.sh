#!/bin/bash
# AURA Immortal Server - Survives process cleanup
# This script writes a PID file and restarts itself if killed

cd /home/z/my-project

export PORT=3000
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="aura-super-secret-key-2027-dev-only"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export NODE_ENV=production

# Ensure static files are copied
cp -rn .next/static/* .next/standalone/.next/static/ 2>/dev/null || true
cp -rn public .next/standalone/public 2>/dev/null || true

PIDFILE="/tmp/aura-node.pid"
LOGFILE="/tmp/aura-node.log"

while true; do
    # Check if port 3000 is already in use
    if curl -s -o /dev/null -w "" http://127.0.0.1:3000/ 2>/dev/null; then
        echo "[$(date)] Port 3000 already in use, waiting..." >> "$LOGFILE"
        sleep 5
        continue
    fi

    echo "[$(date)] Starting Next.js server..." >> "$LOGFILE"
    node .next/standalone/server.js >> "$LOGFILE" 2>&1 &
    NODE_PID=$!
    echo $NODE_PID > "$PIDFILE"

    # Wait for the node process to exit
    wait $NODE_PID 2>/dev/null
    EXIT_CODE=$?

    echo "[$(date)] Node exited with code $EXIT_CODE, restarting in 2s..." >> "$LOGFILE"
    rm -f "$PIDFILE"
    sleep 2
done
