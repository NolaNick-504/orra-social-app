#!/bin/bash
# AURA Server Supervisor - keeps the Next.js server alive
# This script is designed to be started once and run forever

LOG="/home/z/my-project/.zscripts/server-supervisor.log"
PIDFILE="/home/z/my-project/.zscripts/server.pid"

echo "[$(date)] AURA Supervisor starting..." >> "$LOG"

while true; do
    # Check if server is already running
    if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
        sleep 5
        continue
    fi

    echo "[$(date)] Starting Next.js production server..." >> "$LOG"
    
    cd /home/z/my-project
    PORT=3000 NODE_ENV=production node .next/standalone/server.js >> "$LOG" 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > "$PIDFILE"
    
    echo "[$(date)] Server started with PID $SERVER_PID" >> "$LOG"
    
    # Wait for the server to exit
    wait $SERVER_PID 2>/dev/null
    EXIT_CODE=$?
    
    echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> "$LOG"
    rm -f "$PIDFILE"
    sleep 3
done
