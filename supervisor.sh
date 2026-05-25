#!/bin/bash
# ORRA Process Supervisor — keeps Next.js alive
# If the Next.js process dies, this script restarts it automatically.
# This handles the case where the platform thaws a frozen container
# but the Next.js process was killed during the freeze.

PORT=3000
MAX_RESTARTS=10
RESTART_COUNT=0
RESTART_WINDOW=300  # 5 minutes — reset counter after this many seconds of uptime
LAST_START=0

echo "[ORRA-Supervisor] Starting process supervisor for Next.js on port $PORT"

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
    # Reset restart counter if we've been running for more than RESTART_WINDOW
    NOW=$(date +%s)
    if [ $((NOW - LAST_START)) -gt $RESTART_WINDOW ] && [ $RESTART_COUNT -gt 0 ]; then
        echo "[ORRA-Supervisor] Process ran for $RESTART_WINDOW+ seconds, resetting restart counter"
        RESTART_COUNT=0
    fi

    LAST_START=$NOW
    RESTART_COUNT=$((RESTART_COUNT + 1))

    echo "[ORRA-Supervisor] Starting Next.js (attempt $RESTART_COUNT/$MAX_RESTARTS)..."

    # Start Next.js using the custom server.js (NOT npx next start)
    # server.js provides chunk-404 protection that prevents white screen
    cd /home/z/my-project
    NODE_ENV=production DATABASE_URL="file:/home/z/my-project/db/custom.db" NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024" NEXTAUTH_URL="http://localhost:3000" AUTH_TRUST_HOST=true node server.js

    EXIT_CODE=$?
    echo "[ORRA-Supervisor] Next.js exited with code $EXIT_CODE"

    # If exit code is 0, it was a clean shutdown — don't restart
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[ORRA-Supervisor] Clean shutdown, not restarting"
        break
    fi

    # Wait a bit before restarting to avoid tight crash loops
    echo "[ORRA-Supervisor] Waiting 5 seconds before restart..."
    sleep 5
done

echo "[ORRA-Supervisor] Max restarts reached, giving up"
