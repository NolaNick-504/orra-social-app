#!/bin/bash
# AURA Server Keep-Alive Script
# Ensures the Next.js production server stays running

export PORT=3000
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="aura-super-secret-key-2027-dev-only"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export NODE_ENV=production

cd /home/z/my-project

# Ensure static files are in place
mkdir -p .next/standalone/.next/static
cp -rn .next/static/* .next/standalone/.next/static/ 2>/dev/null
cp -rn public .next/standalone/public 2>/dev/null

while true; do
    # Check if server is already running
    if curl -s -o /dev/null -w "" http://127.0.0.1:3000/ 2>/dev/null; then
        sleep 5
        continue
    fi
    
    echo "[$(date)] Starting server..."
    node .next/standalone/server.js &
    SERVER_PID=$!
    
    # Wait for server to be ready
    for i in $(seq 1 15); do
        if curl -s -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
            echo "[$(date)] Server ready (PID $SERVER_PID)"
            break
        fi
        sleep 1
    done
    
    # Wait for server to die
    wait $SERVER_PID 2>/dev/null
    echo "[$(date)] Server exited, restarting in 2s..."
    sleep 2
done
