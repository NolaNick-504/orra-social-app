#!/bin/bash
# ORRA Startup Script - starts all services
# Run this after a server restart or crash

cd /home/z/my-project

echo "=== ORRA Startup ==="

# Kill any existing processes
echo "Cleaning up old processes..."
fuser -k 3000/tcp 2>/dev/null
pkill -f "auto-poster" 2>/dev/null
sleep 2

# Start Next.js server
echo "Starting Next.js on port 3000..."
nohup npx next start -p 3000 > /tmp/orra-server.log 2>&1 &
NEXT_PID=$!
sleep 4

# Verify Next.js is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200"; then
  echo "✅ Next.js is running (PID: $NEXT_PID)"
else
  echo "❌ Next.js failed to start"
  cat /tmp/orra-server.log
  exit 1
fi

# Start auto-poster
echo "Starting auto-poster..."
nohup node scripts/auto-poster.js > /tmp/auto-poster.log 2>&1 &
POSTER_PID=$!
sleep 2

if ps -p $POSTER_PID > /dev/null; then
  echo "✅ Auto-poster is running (PID: $POSTER_PID)"
else
  echo "❌ Auto-poster failed to start"
fi

# Verify external access
EXTERNAL=$(curl -s -o /dev/null -w "%{http_code}" "https://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.chatglm.site/" 2>&1)
if [ "$EXTERNAL" = "200" ]; then
  echo "✅ External URL is accessible"
else
  echo "⚠️ External URL returned $EXTERNAL (may need a moment for gateway)"
fi

echo ""
echo "=== ORRA is live ==="
echo "Local: http://localhost:3000"
echo "External: https://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.chatglm.site/"
