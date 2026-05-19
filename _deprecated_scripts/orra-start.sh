#!/bin/bash
# ORRA Safe Start Script
# Kills any stale processes on port 3000 before starting PM2

echo "ORRA: Checking for stale processes on port 3000..."
STALE_PID=$(lsof -ti :3000 2>/dev/null)
if [ -n "$STALE_PID" ]; then
  echo "ORRA: Killing stale process(es) on port 3000: $STALE_PID"
  kill -9 $STALE_PID 2>/dev/null
  sleep 1
fi

echo "ORRA: Building fresh..."
cd /home/z/my-project
npm run build 2>&1 | tail -5

echo "ORRA: Starting PM2..."
pm2 delete orra 2>/dev/null
pm2 start "npx next start -p 3000 -H 0.0.0.0" --name orra
pm2 save

echo "ORRA: Waiting for server..."
sleep 4
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>&1)
if [ "$STATUS" = "200" ]; then
  echo "ORRA: Server is UP (HTTP $STATUS)"
else
  echo "ORRA: WARNING - Server returned HTTP $STATUS"
fi
