#!/usr/bin/env python3
"""AURA Server Daemon v3.0 - Fast-startup server watchdog.

THE SOLE supervisor for ORRA's Next.js server.

v3.0 CHANGES (fast startup):
- Starts the server FIRST, then does health checks in background
- Reduces restart delay from 5s to 2s
- DB checks happen AFTER server is up, not before
- This prevents FC proxy timeouts on container rebuilds

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
import shutil
import glob

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
    'NEXTAUTH_SECRET': 'orra-s3cr3t-k3y-p3rman3nt-2024',
    'NEXTAUTH_URL': 'http://localhost:3000',
    'AUTH_TRUST_HOST': 'true',
    'AUTOPOST_KEY': 'orra-internal-autopost-2026',
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
            time.sleep(2)
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

def restore_db_if_needed():
    """Quick DB restore from persistent backup if DB is missing or empty.
    Does NOT do integrity check — that's done in background after server starts."""
    if not os.path.exists(DB_FILE) or os.path.getsize(DB_FILE) == 0:
        log('DB missing/empty — quick restore from backup...')
        if os.path.exists(PERSISTENT_BACKUP) and os.path.getsize(PERSISTENT_BACKUP) > 0:
            os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
            shutil.copy2(PERSISTENT_BACKUP, DB_FILE)
            log('DB restored from backup')
            return True
        return False
    return True

def checkpoint_wal():
    """Quick WAL checkpoint — under 0.1s"""
    try:
        subprocess.run(
            ['node', '-e', f'const Database = require("better-sqlite3"); const db = new Database("{DB_FILE}"); db.pragma("wal_checkpoint(TRUNCATE)"); db.close();'],
            cwd=PROJECT_DIR, capture_output=True, timeout=5
        )
    except:
        pass

def check_and_repair_db():
    """Full DB integrity check — done in background after server is up."""
    log('Checking database integrity...')
    try:
        result = subprocess.run(
            ['node', '-e', f'''
const Database = require('better-sqlite3');
const fs = require('fs');
const DB_PATH = '{DB_FILE}';
const BACKUP_PATH = '{PERSISTENT_BACKUP}';
try {{
  const db = new Database(DB_PATH);
  db.pragma('wal_checkpoint(TRUNCATE)');
  const integrity = db.pragma('integrity_check');
  const status = integrity[0]?.integrity_check;
  if (status === 'ok') {{
    console.log('DB_INTEGRITY_OK');
  }} else {{
    console.error('DB_CORRUPTED');
    try {{ db.close(); }} catch(e) {{}}
    let recovered = false;
    const {{ execSync }} = require('child_process');
    const dumpPath = DB_PATH + '.recover.db';
    try {{
      execSync('sqlite3 "' + DB_PATH + '" .recover | sqlite3 "' + dumpPath + '"', {{stdio: 'pipe'}});
      if (fs.statSync(dumpPath).size > 0) {{
        try {{ fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); }} catch(e2) {{}}
        fs.renameSync(dumpPath, DB_PATH);
        console.log('DB_RECOVERED_VIA_DUMP');
        recovered = true;
      }} else {{ try {{ fs.unlinkSync(dumpPath); }} catch(e2) {{}} }}
    }} catch(e) {{
      try {{ fs.unlinkSync(dumpPath); }} catch(e2) {{}}
    }}
    if (!recovered && fs.existsSync(BACKUP_PATH) && fs.statSync(BACKUP_PATH).size > 0) {{
      try {{ fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); }} catch(e2) {{}}
      fs.copyFileSync(BACKUP_PATH, DB_PATH);
      console.log('RESTORING_FROM_BACKUP');
      recovered = true;
    }}
    if (!recovered) {{ console.log('DB_CORRUPTED_NO_RECOVERY'); }}
  }}
  try {{ db.close(); }} catch(e) {{}}
}} catch(e) {{
  console.error('DB_OPEN_ERROR:', e.message);
  if (fs.existsSync(BACKUP_PATH) && fs.statSync(BACKUP_PATH).size > 0) {{
    try {{ fs.copyFileSync(DB_PATH, DB_PATH + '.corrupted.bak'); }} catch(e2) {{}}
    fs.copyFileSync(BACKUP_PATH, DB_PATH);
    console.log('RESTORING_FROM_BACKUP');
  }}
}}
'''],
            capture_output=True, text=True, timeout=30,
            cwd=PROJECT_DIR
        )
        output = result.stdout + result.stderr
        log(f'DB check: {output.strip()}')
        
        if 'DB_CORRUPTED' in output or 'RESTORING' in output or 'DB_RECOVERED' in output:
            log('DB was corrupted — recovery attempted')
    except Exception as e:
        log(f'DB check error: {e}')

def build_if_needed():
    """Build the production bundle if BUILD_ID doesn't exist"""
    build_id_path = os.path.join(PROJECT_DIR, '.next', 'BUILD_ID')
    if not os.path.exists(build_id_path):
        log('No build found — building...')
        try:
            # Try cache restore first
            subprocess.run(
                ['python3', os.path.join(PROJECT_DIR, '.zscripts/build-preserver.py'), '--restore'],
                cwd=PROJECT_DIR, capture_output=True, timeout=10
            )
            if os.path.exists(build_id_path):
                log('Build restored from cache!')
                return True
            
            # Full build
            result = subprocess.run(
                ['npx', 'next', 'build', '--webpack'],
                cwd=PROJECT_DIR, capture_output=True, text=True, timeout=300
            )
            if result.returncode == 0:
                log('Build complete!')
                # Cache the build
                subprocess.run(
                    ['python3', os.path.join(PROJECT_DIR, '.zscripts/build-preserver.py'), '--sync'],
                    cwd=PROJECT_DIR, capture_output=True, timeout=10
                )
                return True
            else:
                log(f'Build FAILED: {result.stderr[-300:]}')
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
    """Start the Next.js production server FAST"""
    log('Starting production server...')
    proc = subprocess.Popen(
        ['node', 'server.js'],
        cwd=PROJECT_DIR,
        env=ENV,
        stdout=open(LOGFILE.replace('.log', '-server.log'), 'a'),
        stderr=subprocess.STDOUT,
    )
    with open(SERVER_PIDFILE, 'w') as f:
        f.write(str(proc.pid))
    log(f'Server started (PID: {proc.pid})')
    return proc

def backup_db():
    """Quick backup to persistent storage"""
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
'''
        ], cwd=PROJECT_DIR, capture_output=True, timeout=10)
    except:
        pass

def run_daemon():
    """Main daemon loop - keeps the server alive forever"""
    log('=== AURA Daemon v3.0 Starting ===')
    write_daemon_pid()
    
    # Kill old server first
    kill_old_server()
    time.sleep(1)
    
    # FAST: Restore DB and start server immediately
    restore_db_if_needed()
    checkpoint_wal()
    
    # Ensure build exists (this may take time on first run)
    if not build_if_needed():
        log('FATAL: Build failed — retrying in 30s...')
        time.sleep(30)
        if not build_if_needed():
            log('FATAL: Build failed twice — will retry in main loop')
    
    # START SERVER IMMEDIATELY — before any other checks
    server_proc = start_server_process()
    
    # Wait for server to respond (up to 10 seconds)
    for i in range(5):
        time.sleep(2)
        if is_port_active():
            log('Server is UP and responding!')
            break
    else:
        log('Server may not be responding yet — continuing anyway')
    
    # NOW do background checks (server is already serving traffic)
    check_and_repair_db()
    backup_db()
    
    server_proc = None  # Don't track directly — let the health check handle it
    crash_count = 0
    last_backup_time = time.time()
    backup_interval = 120  # 2 minutes
    
    while True:
        try:
            now = time.time()
            
            # Periodic DB backup
            if now - last_backup_time > backup_interval:
                if os.path.exists(DB_FILE):
                    backup_db()
                    last_backup_time = now
                    
                    # Hourly timestamped backup
                    minute = time.strftime('%M')
                    if int(minute) < 2:
                        try:
                            timestamp = time.strftime('%Y-%m-%dT%H-%M-%S')
                            ts_path = os.path.join('/home/sync/orra-db-backup', f'orra-{timestamp}.db')
                            os.makedirs('/home/sync/orra-db-backup', exist_ok=True)
                            shutil.copy2(DB_FILE, ts_path)
                            backups = sorted(glob.glob('/home/sync/orra-db-backup/orra-*.db'), reverse=True)
                            for old in backups[24:]:
                                try: os.unlink(old)
                                except: pass
                        except:
                            pass
            
            # Check if server is responding
            if not is_port_active():
                log('Server not responding — restarting...')
                crash_count += 1
                kill_port_3000()
                time.sleep(2)
                
                # Quick DB restore if needed
                restore_db_if_needed()
                checkpoint_wal()
                
                # Ensure build exists
                if not build_if_needed():
                    wait = min(crash_count * 30, 300)
                    log(f'Build failed, waiting {wait}s...')
                    time.sleep(wait)
                    continue
                
                # Restart server
                server_proc = start_server_process()
                
                # Wait for ready (up to 10s)
                for i in range(5):
                    time.sleep(2)
                    if is_port_active():
                        log('Server restarted successfully!')
                        crash_count = 0
                        break
                
                # Back off if crashing repeatedly
                if crash_count > 3:
                    wait = min(crash_count * 30, 300)
                    log(f'Too many crashes, waiting {wait}s...')
                    time.sleep(wait)
                    crash_count = max(0, crash_count - 1)
            else:
                # Server is healthy
                if crash_count > 0:
                    crash_count = max(0, crash_count - 1)
            
            # Health check interval
            time.sleep(10)
            
        except KeyboardInterrupt:
            log('Daemon stopped by user')
            backup_db()
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
            time.sleep(1)
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
