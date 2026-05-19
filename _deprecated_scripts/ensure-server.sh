#!/bin/bash
cd /home/z/my-project
# Check if server is already running on port 3000
if curl -s -o /dev/null -w "" http://127.0.0.1:3000/ 2>/dev/null; then
    echo "Server already running"
    exit 0
fi

# Kill any leftover processes
pkill -f "standalone/server" 2>/dev/null || true
sleep 1

# Start server
PORT=3000 NODE_ENV=production node .next/standalone/server.js &
SERVER_PID=$!

# Wait for it to be ready (max 10 seconds)
for i in $(seq 1 10); do
    if curl -s -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
        echo "Server started (PID $SERVER_PID)"
        exit 0
    fi
    sleep 1
done

echo "Server failed to start"
exit 1
