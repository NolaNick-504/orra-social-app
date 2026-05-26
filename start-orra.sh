#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Force copy static files to standalone (required for standalone mode)
cp -rf .next/static .next/standalone/.next/ 2>/dev/null || true
cp -rf public .next/standalone/ 2>/dev/null || true

# Run with NODE (not bun - bun has issues serving static files in Next.js standalone)
exec node .next/standalone/server.js
