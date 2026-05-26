#!/bin/bash
# ORRA Health Daemon - runs in background, checks health every 5 min, backs up DB every 30 min
PROJECT_DIR="/home/z/my-project"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

HEALTH_INTERVAL=300    # 5 minutes
BACKUP_INTERVAL=1800   # 30 minutes

last_backup=0

while true; do
  now=$(date +%s)
  
  # HTTP health check
  http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$http_code" != "200" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] HTTP check FAILED ($http_code) - restarting server" >> "$LOG_DIR/health-monitor.log"
    pm2 restart orra-server 2>/dev/null
    sleep 10
    retry=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    if [ "$retry" != "200" ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Still failing after restart - rebuilding..." >> "$LOG_DIR/health-monitor.log"
      cd "$PROJECT_DIR" && rm -rf .next && npx next build >> "$LOG_DIR/health-monitor.log" 2>&1
      pm2 restart orra-server 2>/dev/null
    fi
  fi
  
  # DB backup every 30 min
  if [ $((now - last_backup)) -ge $BACKUP_INTERVAL ]; then
    BACKUP_DIR="$PROJECT_DIR/backups/db"
    mkdir -p "$BACKUP_DIR"
    backup_name="custom-$(date '+%Y%m%d-%H%M%S').db"
    cp "$PROJECT_DIR/db/custom.db" "$BACKUP_DIR/$backup_name" 2>/dev/null
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] DB backup: $backup_name" >> "$LOG_DIR/health-monitor.log"
    # Keep only last 48 backups
    count=$(ls -1 "$BACKUP_DIR"/custom-*.db 2>/dev/null | wc -l)
    if [ "$count" -gt 48 ]; then
      to_remove=$((count - 48))
      ls -1t "$BACKUP_DIR"/custom-*.db | tail -n "$to_remove" | xargs rm -f 2>/dev/null
    fi
    last_backup=$now
  fi
  
  # Check PM2 processes
  pm2 resurrect 2>/dev/null  # Auto-restart any dead processes
  
  sleep $HEALTH_INTERVAL
done
