#!/bin/bash
# ORRA Keep-Alive - ensures the app never goes down
# Checks every 10 seconds and restarts if needed

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$STATUS" != "200" ]; then
    echo "[$(date)] ORRA is down (status: $STATUS), restarting..."
    # Kill any existing server process
    pkill -f "node server.js" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    pkill -f "next start" 2>/dev/null
    sleep 2
    # Restart using custom server.js (NOT next start — prevents white screen)
    cd /home/z/my-project
    export NODE_ENV=production
    export DATABASE_URL="file:/home/z/my-project/db/custom.db"
    export NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-2024"
    export NEXTAUTH_URL="http://localhost:3000"
    export AUTH_TRUST_HOST=true
    nohup node server.js > /tmp/orra-next.log 2>&1 &
    sleep 5
    # Verify
    NEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    echo "[$(date)] Restart result: $NEW_STATUS"
  fi
  sleep 10
done
