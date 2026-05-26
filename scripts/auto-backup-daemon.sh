#!/bin/bash
# ============================================
# ORRA AUTO-BACKUP DAEMON
# ============================================
# Runs as a background process, creating backups
# every 30 minutes automatically
# ============================================

PROJECT_DIR="/home/z/my-project"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$BACKUP_DIR/auto-backup.log"
INTERVAL=1800  # 30 minutes in seconds

echo "[$(date)] ORRA Auto-Backup daemon started (every 30 min)" >> "$LOG_FILE"

while true; do
  sleep $INTERVAL
  
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  echo "[$(date)] Running auto-backup..." >> "$LOG_FILE"
  
  # Database backup
  if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
    cp "$PROJECT_DIR/prisma/dev.db" "$BACKUP_DIR/orra-db-${TIMESTAMP}.db"
    echo "[$(date)] ✅ DB backed up: orra-db-${TIMESTAMP}.db" >> "$LOG_FILE"
  fi
  
  # Git commit
  cd "$PROJECT_DIR"
  git add -A
  if [ -n "$(git status --porcelain)" ]; then
    git commit -m "auto-backup-${TIMESTAMP}" --allow-empty
    echo "[$(date)] ✅ Code committed" >> "$LOG_FILE"
  else
    echo "[$(date)] ✅ No changes to commit" >> "$LOG_FILE"
  fi
  
  # Cleanup: keep only last 10 DB backups
  ls -t "$BACKUP_DIR"/orra-db-auto-*.db 2>/dev/null | tail -n +11 | xargs -r rm 2>/dev/null
  # Keep last 20 total DB backups
  ls -t "$BACKUP_DIR"/orra-db-*.db 2>/dev/null | tail -n +21 | xargs -r rm 2>/dev/null
  
  echo "[$(date)] Auto-backup complete" >> "$LOG_FILE"
done
