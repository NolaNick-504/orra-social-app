#!/bin/bash
# Auto-backup ORRA database - keeps last 24 hourly backups
cd /home/z/my-project
cp db/custom.db "backups/auto-db-$(date +%Y%m%d-%H%M).db"
# Remove backups older than 24 hours
find backups/ -name "auto-db-*.db" -mmin +1440 -delete 2>/dev/null
echo "$(date): Backup complete" >> backups/backup-log.txt
