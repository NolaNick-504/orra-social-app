#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="orra-super-secret-key-2025-production"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST="true"

# Copy static assets if they don't exist in standalone
if [ ! -d "/home/z/my-project/.next/standalone/.next/static" ]; then
  cp -rn /home/z/my-project/.next/static /home/z/my-project/.next/standalone/.next/ 2>/dev/null
fi
if [ ! -d "/home/z/my-project/.next/standalone/public" ]; then
  cp -rn /home/z/my-project/public /home/z/my-project/.next/standalone/ 2>/dev/null
fi

exec node .next/standalone/server.js
