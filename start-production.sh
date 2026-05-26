#!/bin/bash
# AURA Production Server Startup Script
# Ensures correct environment variables are loaded

cd "$(dirname "$0")/.next/standalone"

# Source env file if it exists  
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Override critical env vars to ensure they're correct
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NEXTAUTH_SECRET="aura-super-secret-key-2027-production-abc123xyz"
export NEXTAUTH_URL="http://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.z.ai"
export NODE_ENV=production
export PORT=3000

echo "Starting AURA production server..."
echo "NEXTAUTH_URL=$NEXTAUTH_URL"

exec node server.js
