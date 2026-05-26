#!/bin/bash
# ORRA Keepalive - restarts the app if it goes down
cd /home/z/my-project

while true; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$HTTP_CODE" != "200" ]; then
    echo "$(date): App down (HTTP $HTTP_CODE), restarting..." >> /tmp/orra-keepalive.log
    pkill -f "next-server" 2>/dev/null
    sleep 2
    nohup npm exec next start -p 3000 > /tmp/next.log 2>&1 &
    sleep 5
    # Verify it came back
    HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    echo "$(date): Restart result: HTTP $HTTP_CODE2" >> /tmp/orra-keepalive.log
  fi
  sleep 10
done
