#!/bin/bash
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="aura-super-secret-key-2027-dev-only"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export NODE_ENV=production

cd /home/z/my-project

while true; do
  node .next/standalone/server.js
  echo "[$(date)] Server exited, restarting in 1s..."
  sleep 1
done
