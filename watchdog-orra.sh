#!/bin/bash
# ORRA Watchdog - checks if server is running and restarts if needed
# Run via cron every minute

if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    # Server is running, all good
    exit 0
fi

# Server is down! Restart it
echo "[$(date)] WATCHDOG: ORRA server is down, restarting..." >> /home/z/my-project/logs/orra-manager.log

# Kill any leftover processes
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# Start the server
cd /home/z/my-project
mkdir -p logs .next/standalone/db
cp -f db/custom.db .next/standalone/db/custom.db 2>/dev/null || true
# Ensure static files are available for standalone server
cp -rn .next/static .next/standalone/.next/static 2>/dev/null || true

HOSTNAME=0.0.0.0 PORT=3000 nohup node .next/standalone/server.js >> logs/server-out.log 2>> logs/server-error.log &

# Wait and verify
for i in $(seq 1 20); do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
        echo "[$(date)] WATCHDOG: ORRA server restarted successfully" >> logs/orra-manager.log
        exit 0
    fi
    sleep 1
done

echo "[$(date)] WATCHDOG: Failed to restart ORRA server" >> logs/orra-manager.log
exit 1
