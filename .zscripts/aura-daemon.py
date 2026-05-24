#!/usr/bin/env python3
"""AURA Server Daemon - Bulletproof Next.js production server watchdog.

THE SOLE supervisor for ORRA's Next.js server. No other script should
start or manage Next.js — this daemon handles everything:

- Health checking every 10 seconds
- Auto-restarting Next.js if it crashes
- Auto-rebuilding if the build is missing
- DB integrity check + WAL checkpoint on restart
- Killing stale processes on port 3000

Usage:
  python3 aura-daemon.py         # Start the daemon
  python3 aura-daemon.py --stop  # Stop the daemon
  python3 aura-daemon.py --status # Check status
"""
import subprocess
import os
import time
import sys
import signal
import json

PROJECT_DIR = '/home/z/my-project'
PIDFILE = '/tmp/aura-daemon.pid'
LOGFILE = '/tmp/aura-daemon.log'
SERVER_PIDFILE = '/tmp/orra-next-server.pid'
DB_FILE = os.path.join(PROJECT_DIR, 'db/custom.db')
PERSISTENT_BACKUP = '/home/sync/orra-db-backup/latest.db'

ENV = {
    **os.environ,
    'PORT': '3000',
    'NODE_ENV': 'production',
    'DATABASE_URL': 'file:/home/z/my-project/db/custom.db',
    'NEXTAUTH_SECRET': 'orra-super-secret-key-2025-production',
    'NEXTAUTH_URL': 'http://localhost:3000',
    'AUTH_TRUST_HOST': 'true',
}

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    try:
        with open(LOGFILE, 'a') as f:
            f.write(line + '\n')
    except:
        pass

def is_port_active():
    """Check if port 3000 is responding with HTTP 200"""
    try:
        import urllib.request
        resp = urllib.request.urlopen('http://127.0.0.1:3000/', timeout=5)
        return resp.status == 200
    except:
        return False

def kill_port_3000():
    """Kill any process on port 3000"""
    try:
        result = subprocess.run(
            ['lsof', '-ti:3000'],
            capture_output=True, text=True, timeout=5
        )
        pids = [p.strip() for p in result.stdout.strip().split('\n') if p.strip()]
        for pid_str in pids:
            try:
                os.kill(int(pid_str), signal.SIGKILL)
                log(f'Killed process {pid_str} on port 3000')
            except:
                pass
        if pids:
            time.sleep(3)
    except:
        pass

def kill_old_server():
    """Kill server tracked by PID file and anything on port 3000"""
    try:
        with open(SERVER_PIDFILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, signal.SIGKILL)
        log(f'Killed tracked server PID {pid}')
    except:
        pass
    kill_port_3000()

def check_and_repair_db():
    """Check SQLite integrity and repair if needed. Also checkpoint WAL.
    
    IMPORTANT: We NEVER delete the database file. The user's data is sacred.
    Recovery strategy (in order):
    1. Try SQLite .recover to salvage data from corrupted DB
    2. Restore from persistent backup at /home/sync/
    3. If nothing works, leave the DB in place — prisma/seed will handle it
    """
    log('Checking database integrity and checkpointing WAL...')
    try:
        result = subprocess.run(
            ['node', '-e', f'''
const Database = require('better-sqlite3');
const fs = require('fs');
const DB_PATH = '{DB_FILE}';
const BACKUP_PATH = '{PERSISTENT_BACKUP}';

// NEVER delete the database file. Always try to recover or restore.
try {{
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  
  // Force WAL checkpoint
  try {{
    db.pragma('wal_checkpoint(TRUNCATE)');
    console.log('WAL checkpoint done');
  }} catch(e) {{
    console.warn('WAL checkpoint warning:', e.message);
  }}
  
  // Check integrity
  const integrity = db.pragma('integrity_check');
  const status = integrity[0]?.integrity_check;
  
  if (status === 'ok') {{
    console.log('DB_INTEGRITY_OK');
  }} else {{
    console.error('DB_CORRUPTED');
    try {{ db.close(); }} catch(e) {{}}
    
    let recovered = false;
    
    // Strategy 1: Try SQLite .recover to salvage data
    console.log('Attempting SQLite .recover...');
    const {{ execSync }} = require('child_process');
    const dumpPath = DB_PATH + '.recover.db';
    try {{
      execSync('sqlite3 "' + DB_PATH + '" .recover | sqlite3 "' + dumpPath + '"', {{stdio: 'pipe'}});
      const recoveredStats = fs.statSync(dumpPath);
      if (recoveredStats.size > 0) {{
        // Keep corrupted file as backup
        try {{ fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); }} catch(e2) {{}}
        fs.renameSync(dumpPath, DB_PATH);
        console.log('DB_RECOVERED_VIA_DUMP');
        recovered = true;
      }} else {{
        try {{ fs.unlinkSync(dumpPath); }} catch(e2) {{}}
      }}
    }} catch(e) {{
      console.warn('SQLite .recover failed:', e.message);
      try {{ fs.unlinkSync(dumpPath); }} catch(e2) {{}}
    }}
    
    // Strategy 2: Restore from persistent backup
    if (!recovered && fs.existsSync(BACKUP_PATH)) {{
      const backupStats = fs.statSync(BACKUP_PATH);
      if (backupStats.size > 0) {{
        console.log('RESTORING_FROM_BACKUP');
        try {{ fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); }} catch(e2) {{}}
        fs.copyFileSync(BACKUP_PATH, DB_PATH);
        recovered = true;
      }}
    }}
    
    // Strategy 3: If nothing worked, keep the corrupted DB in place
    if (!recovered) {{
      console.log('DB_CORRUPTED_NO_RECOVERY');
      // Do NOT delete. Leave it for prisma/seed to handle.
    }}
  }}
  
  try {{ db.close(); }} catch(e) {{}}
}} catch(e) {{
  console.error('DB_OPEN_ERROR:', e.message);
  // Try to restore from backup — but NEVER delete the DB file
  if (fs.existsSync(BACKUP_PATH)) {{
    const backupStats = fs.statSync(BACKUP_PATH);
    if (backupStats.size > 0) {{
      console.log('RESTORING_FROM_BACKUP');
      try {{ fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); }} catch(e2) {{}}
      fs.copyFileSync(BACKUP_PATH, DB_PATH);
    }}
  }} else {{
    console.log('DB_OPEN_ERROR_NO_BACKUP');
    // Do NOT delete the DB file. Leave it for prisma/seed to handle.
  }}
}}
'''],
            capture_output=True, text=True, timeout=30,
            cwd=PROJECT_DIR
        )
        output = result.stdout + result.stderr
        log(f'DB check output: {output.strip()}')
        
        if 'DB_CORRUPTED' in output or 'RESTORING_FROM_BACKUP' in output or 'DB_RECOVERED_VIA_DUMP' in output:
            log('Database was corrupted — recovery attempted')
            # Re-push schema after restore (safe — only adds columns)
            subprocess.run(['npx', 'prisma', 'db', 'push', '--skip-generate'], 
                         cwd=PROJECT_DIR, capture_output=True, timeout=30)
        elif 'DB_INTEGRITY_OK' in output:
            log('Database integrity OK')
        return True
    except Exception as e:
        log(f'DB check error: {e}')
        return False

def build_if_needed():
    """Build the production bundle if BUILD_ID doesn't exist"""
    build_id_path = os.path.join(PROJECT_DIR, '.next', 'BUILD_ID')
    if not os.path.exists(build_id_path):
        log('No production build found. Building...')
        try:
            result = subprocess.run(
                ['npx', 'next', 'build', '--webpack'],
                cwd=PROJECT_DIR,
                capture_output=True, text=True, timeout=300
            )
            if result.returncode == 0:
                log('Build complete!')
                return True
            else:
                log(f'Build FAILED: {result.stderr[-500:]}')
                return False
        except subprocess.TimeoutExpired:
            log('Build timed out!')
            return False
    return True

def write_daemon_pid():
    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))

def read_daemon_pid():
    try:
        with open(PIDFILE) as f:
            return int(f.read().strip())
    except:
        return None

def is_daemon_running():
    pid = read_daemon_pid()
    if pid is None:
        return False
    try:
        os.kill(pid, 0)
        return True
    except:
        return False

def start_server_process():
    """Start the Next.js production server and return the process"""
    log('Starting production server (node server.js -p 3000)...')
    proc = subprocess.Popen(
        ['node', 'server.js'],
        cwd=PROJECT_DIR,
        env=ENV,
        stdout=open(LOGFILE.replace('.log', '-server.log'), 'a'),
        stderr=subprocess.STDOUT,
    )
    with open(SERVER_PIDFILE, 'w') as f:
        f.write(str(proc.pid))
    log(f'Server process started (PID: {proc.pid})')
    return proc

def backup_db():
    """Quick backup of the database to persistent storage"""
    try:
        subprocess.run([
            'node', '-e', f'''
const Database = require('better-sqlite3');
const fs = require('fs');
try {{
  const db = new Database('{DB_FILE}');
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
}} catch(e) {{}}
fs.copyFileSync('{DB_FILE}', '{PERSISTENT_BACKUP}');
console.log('DB backed up');
'''
        ], cwd=PROJECT_DIR, capture_output=True, timeout=10)
    except:
        pass

def run_daemon():
    """Main daemon loop - keeps the server alive forever"""
    log('=== AURA Daemon Starting ===')
    write_daemon_pid()
    
    # Kill old server first
    kill_old_server()
    time.sleep(2)
    
    # Check and repair database
    check_and_repair_db()
    
    # Make sure we have a build
    if not build_if_needed():
        log('FATAL: Build failed. Will retry in 60 seconds...')
        time.sleep(60)
        if not build_if_needed():
            log('FATAL: Build failed twice. Will retry every 60s in main loop.')
    
    server_proc = None
    crash_count = 0
    last_start_time = 0
    health_check_interval = 10  # seconds
    last_backup_time = 0
    backup_interval = 300  # 5 minutes
    
    while True:
        try:
            now = time.time()
            
            # Periodic DB backup
            if now - last_backup_time > backup_interval:
                if os.path.exists(DB_FILE):
                    backup_db()
                    last_backup_time = now
            
            # Check if server is responding
            if not is_port_active():
                log('Server is not responding!')
                
                # Kill any stuck processes
                kill_port_3000()
                time.sleep(2)
                
                # Check DB integrity before restarting
                check_and_repair_db()
                
                # Ensure build exists
                if not build_if_needed():
                    crash_count += 1
                    wait = min(crash_count * 30, 300)
                    log(f'Build failed, waiting {wait}s before retry...')
                    time.sleep(wait)
                    continue
                
                # Start the server
                server_proc = start_server_process()
                last_start_time = time.time()
                
                # Wait for server to become ready (up to 30 seconds)
                ready = False
                for i in range(15):
                    time.sleep(2)
                    if is_port_active():
                        log('Server is ready and responding!')
                        ready = True
                        crash_count = 0
                        break
                
                if not ready:
                    log('Server failed to start within 30s')
                    crash_count += 1
                    if server_proc and server_proc.poll() is not None:
                        log(f'Server process exited with code: {server_proc.returncode}')
                
                # Back off if crashing repeatedly
                if crash_count > 3:
                    wait = min(crash_count * 30, 300)
                    log(f'Too many crashes, waiting {wait}s before next attempt...')
                    time.sleep(wait)
                    crash_count = max(0, crash_count - 1)
            
            else:
                # Server is healthy — check if tracked process is still alive
                if server_proc and server_proc.poll() is not None:
                    exit_code = server_proc.returncode
                    log(f'Server process exited with code {exit_code}')
                    crash_count += 1
                    server_proc = None
                    # Backup DB before potential restart
                    backup_db()
                elif server_proc is None:
                    # Port is active but we don't track the process — that's fine
                    # Maybe started by a previous daemon instance
                    pass
            
            # Health check interval
            time.sleep(health_check_interval)
            
        except KeyboardInterrupt:
            log('Daemon stopped by user')
            break
        except Exception as e:
            log(f'Daemon error: {e}')
            crash_count += 1
            time.sleep(min(crash_count * 10, 120))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == '--stop':
            pid = read_daemon_pid()
            if pid and is_daemon_running():
                os.kill(pid, signal.SIGTERM)
                log(f'Daemon stopped (PID {pid})')
                kill_old_server()
            else:
                print('No running daemon found')
                kill_port_3000()
            sys.exit(0)
        
        elif cmd == '--status':
            daemon_ok = is_daemon_running()
            server_ok = is_port_active()
            print(f'Daemon running: {"YES" if daemon_ok else "NO"}')
            print(f'Server responding: {"YES" if server_ok else "NO"}')
            pid = read_daemon_pid()
            if pid:
                print(f'Daemon PID: {pid}')
            sys.exit(0)
        
        elif cmd == '--restart':
            pid = read_daemon_pid()
            if pid and is_daemon_running():
                os.kill(pid, signal.SIGTERM)
                time.sleep(3)
            kill_old_server()
            time.sleep(2)
            print('Restarting daemon...')
        else:
            print(f'Unknown command: {cmd}')
            print('Usage: aura-daemon.py [--stop|--status|--restart]')
            sys.exit(1)
    else:
        if is_daemon_running():
            print('Daemon is already running! Use --stop to stop it first.')
            sys.exit(1)
    
    # Start the daemon in background
    log('Starting AURA daemon in background...')
    
    pid = os.fork()
    if pid > 0:
        time.sleep(2)
        if is_daemon_running():
            print(f'Daemon started successfully (PID: {pid})')
        else:
            print('Daemon may have failed to start')
        sys.exit(0)
    
    # Child process - become daemon
    os.setsid()
    sys.stdout.flush()
    sys.stderr.flush()
    devnull = open(os.devnull, 'r')
    os.dup2(devnull.fileno(), sys.stdin.fileno())
    
    run_daemon()
