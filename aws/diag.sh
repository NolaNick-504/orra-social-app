#!/bin/bash
# ORRA Diagnostic - find out what's wrong
echo "=== ORRA Diagnostic ==="
echo ""
echo "1. PM2 Status:"
pm2 status
echo ""
echo "2. Database files:"
find ~/orra -name "*.db" 2>/dev/null
echo ""
echo "3. .next directory?"
ls ~/orra/.next/BUILD_ID 2>/dev/null || echo "MISSING: .next not found"
echo ""
echo "4. Port 3000?"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "NOT RESPONDING"
echo ""
echo "5. Error log:"
tail -10 ~/orra/logs/pm2-error.log 2>/dev/null || echo "No error log"
echo ""
echo "6. Out log:"
tail -5 ~/orra/logs/pm2-out.log 2>/dev/null || echo "No out log"
