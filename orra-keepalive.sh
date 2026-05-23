#!/bin/bash
# ORRA Keep-Alive - ensures the app never goes down
# Checks every 10 seconds and restarts if needed

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$STATUS" != "200" ]; then
    echo "[$(date)] ORRA is down (status: $STATUS), restarting..."
    # Kill any existing next process
    pkill -f "next-server" 2>/dev/null
    pkill -f "next start" 2>/dev/null
    sleep 2
    # Restart
    cd /home/z/my-project
    nohup npx next start -p 3000 > /tmp/orra-next.log 2>&1 &
    sleep 5
    # Verify
    NEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    echo "[$(date)] Restart result: $NEW_STATUS"
  fi
  sleep 10
done
