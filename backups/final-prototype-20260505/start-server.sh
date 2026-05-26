#!/bin/bash
cd /home/z/my-project
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="aura-super-secret-key-2027-dev-only"
export NEXTAUTH_URL="http://localhost:3000"
export AUTH_TRUST_HOST=true
export NODE_ENV=production

# Kill any existing server on port 3000
fuser -k 3000/tcp 2>/dev/null
sleep 1

# Ensure static files are copied — use -r (overwrite) not -rn (no-clobber)
# so stale chunks from old builds are always replaced
mkdir -p .next/standalone/.next/static
rm -rf .next/standalone/.next/static/*
cp -r .next/static/* .next/standalone/.next/static/
rm -rf .next/standalone/public
cp -r public .next/standalone/public

# Start the server detached
exec node .next/standalone/server.js
