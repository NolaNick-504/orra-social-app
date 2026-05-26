#!/bin/bash
# ORRA Health Monitor & Backup System
# Runs every 5 minutes via cron to:
# 1. Check server health
# 2. Backup the database
# 3. Restart services if needed
# 4. Clean up old logs

PROJECT_DIR="/home/z/my-project"
DB_PATH="$PROJECT_DIR/db/custom.db"
BACKUP_DIR="$PROJECT_DIR/backups/db"
LOG_DIR="$PROJECT_DIR/logs"
MAX_DB_BACKUPS=48  # Keep 48 backups (24 hours at 30min intervals)

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_DIR/health-monitor.log"
}

# 1. Database backup
backup_db() {
  if [ -f "$DB_PATH" ]; then
    local backup_name="custom-$(date '+%Y%m%d-%H%M%S').db"
    # Use SQLite backup command for consistency
    sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/$backup_name'" 2>/dev/null
    if [ $? -eq 0 ]; then
      log "DB backup OK: $backup_name"
    else
      # Fallback: copy the file directly
      cp "$DB_PATH" "$BACKUP_DIR/$backup_name" 2>/dev/null
      log "DB backup (copy): $backup_name"
    fi
    
    # Clean up old backups
    local count=$(ls -1 "$BACKUP_DIR"/custom-*.db 2>/dev/null | wc -l)
    if [ "$count" -gt "$MAX_DB_BACKUPS" ]; then
      local to_remove=$((count - MAX_DB_BACKUPS))
      ls -1t "$BACKUP_DIR"/custom-*.db | tail -n "$to_remove" | xargs rm -f 2>/dev/null
      log "Cleaned up $to_remove old backups"
    fi
  else
    log "WARNING: Database file not found at $DB_PATH"
  fi
}

# 2. Check PM2 services
check_services() {
  # Check if PM2 is running
  if ! pm2 ping > /dev/null 2>&1; then
    log "PM2 is not running! Starting PM2..."
    pm2 resurrect 2>/dev/null || pm2 start "$PROJECT_DIR/ecosystem.config.js" 2>/dev/null
    return
  fi
  
  # Check orra-server
  local server_status=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    apps = json.load(sys.stdin)
    for app in apps:
        if app.get('name') == 'orra-server':
            print(app.get('pm2_env', {}).get('status', 'unknown'))
            break
    else:
        print('not_found')
except:
    print('error')
" 2>/dev/null)
  
  if [ "$server_status" != "online" ]; then
    log "Server is $server_status! Restarting..."
    pm2 restart orra-server 2>/dev/null
    sleep 5
    # Verify it came back
    local new_status=$(pm2 status orra-server 2>/dev/null | grep orra-server | awk '{print $10}')
    log "Server restart result: $new_status"
  fi
  
  # Check orra-autoposter
  local poster_status=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    apps = json.load(sys.stdin)
    for app in apps:
        if app.get('name') == 'orra-autoposter':
            print(app.get('pm2_env', {}).get('status', 'unknown'))
            break
    else:
        print('not_found')
except:
    print('error')
" 2>/dev/null)
  
  if [ "$poster_status" != "online" ]; then
    log "Auto-poster is $poster_status! Restarting..."
    pm2 restart orra-autoposter 2>/dev/null
  fi
}

# 3. HTTP health check
http_check() {
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$http_code" != "200" ]; then
    log "HTTP check FAILED (got $http_code)! Restarting server..."
    pm2 restart orra-server 2>/dev/null
    sleep 10
    local retry_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    if [ "$retry_code" != "200" ]; then
      log "HTTP check still FAILED after restart (got $retry_code)"
      # DON'T auto-rebuild — it causes extended downtime and data loss risk.
      # Just log the issue. A human should investigate persistent failures.
      log "ALERT: Server is persistently down. Manual investigation required."
    fi
  fi
}

# 4. Clean up old logs (keep last 7 days)
cleanup_logs() {
  find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null
  find /tmp -name "aura-*.log" -mtime +2 -delete 2>/dev/null
  find /tmp -name "orra-*.log" -mtime +2 -delete 2>/dev/null
}

# Main
log "=== Health check starting ==="
backup_db
check_services
http_check
cleanup_logs
log "=== Health check complete ==="
