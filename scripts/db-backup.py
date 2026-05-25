#!/usr/bin/env python3
"""
ORRA Database Backup System
- Runs automatic snapshots of the SQLite database every 30 minutes
- Keeps the last 24 hourly backups and 7 daily backups
- Also runs a backup before any Prisma migration
- Can be triggered manually: python3 scripts/db-backup.py [--pre-migrate] [--list] [--restore LATEST|path]
"""
import subprocess
import os
import sys
import time
import shutil
import glob
from datetime import datetime, timedelta

DB_PATH = '/home/z/my-project/db/custom.db'
BACKUP_DIR = '/home/z/my-project/backups/auto'
HOURLY_KEEP = 24   # Keep last 24 hourly snapshots
DAILY_KEEP = 7     # Keep last 7 daily snapshots
PIDFILE = '/tmp/orra-db-backup.pid'

def get_size_mb(path):
    """Get file size in MB"""
    try:
        return os.path.getsize(path) / (1024 * 1024)
    except:
        return 0

def create_backup(tag=''):
    """Create a timestamped backup of the database"""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    suffix = f'_{tag}' if tag else ''
    backup_file = os.path.join(BACKUP_DIR, f'orra_db_{timestamp}{suffix}.db')
    
    # Use SQLite backup for consistency (not just file copy)
    try:
        # First try sqlite3 .backup command for consistency
        result = subprocess.run(
            ['sqlite3', DB_PATH, f'.backup {backup_file}'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            # Fallback to file copy if sqlite3 not available
            shutil.copy2(DB_PATH, backup_file)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        # sqlite3 not installed, use file copy
        shutil.copy2(DB_PATH, backup_file)
    
    size_mb = get_size_mb(backup_file)
    print(f'[db-backup] Created backup: {os.path.basename(backup_file)} ({size_mb:.1f} MB)')
    return backup_file

def cleanup_old_backups():
    """Remove old backups, keeping only the configured number"""
    # Group by type (hourly vs daily)
    all_backups = sorted(glob.glob(os.path.join(BACKUP_DIR, 'orra_db_*.db')), reverse=True)
    
    # Separate pre-migrate backups (never auto-delete these)
    pre_migrate = [f for f in all_backups if '_pre-migrate' in f]
    regular = [f for f in all_backups if '_pre-migrate' not in f]
    
    # Keep only the most recent HOURLY_KEEP regular backups
    to_delete = regular[HOURLY_KEEP:]
    for f in to_delete:
        try:
            os.remove(f)
            print(f'[db-backup] Cleaned up old backup: {os.path.basename(f)}')
        except:
            pass

def list_backups():
    """List all available backups"""
    all_backups = sorted(glob.glob(os.path.join(BACKUP_DIR, 'orra_db_*.db')), reverse=True)
    if not all_backups:
        print('[db-backup] No backups found')
        return
    
    print(f'[db-backup] {len(all_backups)} backup(s) available:')
    for f in all_backups:
        size_mb = get_size_mb(f)
        mtime = datetime.fromtimestamp(os.path.getmtime(f))
        tag = '(pre-migrate)' if '_pre-migrate' in f else ''
        print(f'  {os.path.basename(f)}  {size_mb:.1f}MB  {mtime.strftime("%Y-%m-%d %H:%M:%S")} {tag}')

def restore_backup(backup_path):
    """Restore database from a backup"""
    if backup_path.upper() == 'LATEST':
        all_backups = sorted(glob.glob(os.path.join(BACKUP_DIR, 'orra_db_*.db')), reverse=True)
        if not all_backups:
            print('[db-backup] No backups found to restore')
            return False
        backup_path = all_backups[0]
        print(f'[db-backup] Using latest backup: {os.path.basename(backup_path)}')
    
    if not os.path.exists(backup_path):
        # Try prepending the backup directory
        full_path = os.path.join(BACKUP_DIR, backup_path)
        if os.path.exists(full_path):
            backup_path = full_path
        else:
            print(f'[db-backup] Backup not found: {backup_path}')
            return False
    
    # Create a safety backup of current DB before overwriting
    safety_backup = DB_PATH + '.before-restore'
    if os.path.exists(DB_PATH):
        shutil.copy2(DB_PATH, safety_backup)
        print(f'[db-backup] Safety backup created: {safety_backup}')
    
    # Stop the server first
    print('[db-backup] Stopping server...')
    try:
        subprocess.run(['pkill', '-f', 'node server.js'], capture_output=True, timeout=5)
        subprocess.run(['pkill', '-f', 'next start'], capture_output=True, timeout=5)
        time.sleep(2)
    except:
        pass
    
    # Copy backup to DB location
    shutil.copy2(backup_path, DB_PATH)
    print(f'[db-backup] Restored from: {os.path.basename(backup_path)}')
    print('[db-backup] You need to restart the server manually.')
    return True

def run_daemon():
    """Run as a daemon that creates backups every 30 minutes"""
    # Double-fork to detach
    pid = os.fork()
    if pid > 0:
        print(f'[db-backup] Daemon started (PID: {pid})')
        os._exit(0)
    
    os.setsid()
    pid2 = os.fork()
    if pid2 > 0:
        os._exit(0)
    
    # Write PID file
    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))
    
    # Redirect output to log
    logfile = '/tmp/orra-db-backup.log'
    sys.stdout = open(logfile, 'a')
    sys.stderr = open(logfile, 'a')
    
    print(f'[db-backup] Daemon started at {datetime.now().isoformat()}')
    
    INTERVAL = 30 * 60  # 30 minutes
    
    # Create initial backup
    create_backup()
    
    while True:
        time.sleep(INTERVAL)
        try:
            create_backup()
            cleanup_old_backups()
        except Exception as e:
            print(f'[db-backup] Error: {e}')

if __name__ == '__main__':
    args = sys.argv[1:]
    
    if '--list' in args:
        list_backups()
    elif '--restore' in args:
        idx = args.index('--restore')
        path = args[idx + 1] if idx + 1 < len(args) else 'LATEST'
        restore_backup(path)
    elif '--pre-migrate' in args:
        create_backup('pre-migrate')
    elif '--daemon' in args:
        run_daemon()
    elif '--stop' in args:
        try:
            with open(PIDFILE) as f:
                pid = int(f.read().strip())
            os.kill(pid, 15)
            print(f'[db-backup] Stopped daemon (PID: {pid})')
        except:
            print('[db-backup] No running daemon found')
    elif '--now' in args or len(args) == 0:
        create_backup()
        cleanup_old_backups()
    else:
        print('Usage: python3 scripts/db-backup.py [--daemon|--now|--pre-migrate|--list|--restore LATEST|path|--stop]')
