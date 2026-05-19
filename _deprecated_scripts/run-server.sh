#!/bin/bash
export PORT=3000
export NODE_ENV=production
export DATABASE_URL=file:/home/z/my-project/db/custom.db
export NEXTAUTH_SECRET=aura-super-secret-key-2027-dev-only
export NEXTAUTH_URL=http://localhost:3000
export AUTH_TRUST_HOST=true

cd /home/z/my-project

# Kill any existing server
if [ -f /tmp/aura-server.pid ]; then
    OLD_PID=$(cat /tmp/aura-server.pid)
    kill $OLD_PID 2>/dev/null
    rm /tmp/aura-server.pid
fi

# Start server
exec node .next/standalone/server.js
