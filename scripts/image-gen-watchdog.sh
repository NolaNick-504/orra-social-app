#!/bin/bash
# Watchdog: keeps image generation running until all images are generated
while true; do
  REMAINING=$(node -e "
    const q = require('./.image-queue.json');
    process.stdout.write(String(q.filter(i=>!i.completed).length));
  ")
  if [ "$REMAINING" = "0" ]; then
    echo "All images generated!"
    break
  fi
  echo "[$(date)] Remaining: $REMAINING images"
  timeout 300 node scripts/generate-images.js --batch 5 2>&1
  sleep 5
done
