#!/usr/bin/env python3
"""AURA Server Daemon - Bulletproof Next.js production server watchdog.

Keeps the ORRA app running 24/7. If the server crashes, it auto-restarts.
If the build is missing, it auto-rebuilds. If port is stuck, it kills the old process.

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
    # Kill tracked server
    try:
        with open(SERVER_PIDFILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, signal.SIGKILL)
        log(f'Killed tracked server PID {pid}')
    except:
        pass
    # Kill anything on port 3000
    kill_port_3000()

def build_if_needed():
    """Build the production bundle if BUILD_ID doesn't exist"""
    build_id_path = os.path.join(PROJECT_DIR, '.next', 'BUILD_ID')
    if not os.path.exists(build_id_path):
        log('No production build found. Building...')
        try:
            result = subprocess.run(
                ['npx', 'next', 'build'],
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
        os.kill(pid, 0)  # Signal 0 = check if process exists
        return True
    except:
        return False

def start_server_process():
    """Start the Next.js production server and return the process"""
    log('Starting production server (next start -p 3000)...')
    proc = subprocess.Popen(
        ['npx', 'next', 'start', '-p', '3000'],
        cwd=PROJECT_DIR,
        env=ENV,
        stdout=open(LOGFILE.replace('.log', '-server.log'), 'a'),
        stderr=subprocess.STDOUT,
    )
    # Write server PID
    with open(SERVER_PIDFILE, 'w') as f:
        f.write(str(proc.pid))
    log(f'Server process started (PID: {proc.pid})')
    return proc

def run_daemon():
    """Main daemon loop - keeps the server alive forever"""
    log('=== AURA Daemon Starting ===')
    write_daemon_pid()
    
    # Kill old server first
    kill_old_server()
    time.sleep(2)
    
    # Make sure we have a build
    if not build_if_needed():
        log('FATAL: Build failed. Will retry in 60 seconds...')
        time.sleep(60)
        if not build_if_needed():
            log('FATAL: Build failed twice. Giving up for now, will retry every 60s.')
    
    server_proc = None
    crash_count = 0
    last_start_time = 0
    
    while True:
        try:
            # Check if server is responding
            if not is_port_active():
                log('Server is not responding!')
                
                # Kill any stuck processes
                kill_port_3000()
                time.sleep(2)
                
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
                    # Check if process is even alive
                    if server_proc.poll() is not None:
                        log(f'Server process exited with code: {server_proc.returncode}')
                
                # Back off if crashing repeatedly
                if crash_count > 3:
                    wait = min(crash_count * 30, 300)
                    log(f'Too many crashes, waiting {wait}s before next attempt...')
                    time.sleep(wait)
                    crash_count = max(0, crash_count - 1)  # Slowly decay
            
            else:
                # Server is healthy - check if process is still alive
                if server_proc and server_proc.poll() is not None:
                    exit_code = server_proc.returncode
                    log(f'Server process exited with code {exit_code}')
                    crash_count += 1
                    server_proc = None
                    # Will be caught on next iteration when is_port_active() returns False
                elif server_proc is None:
                    # Port is active but we don't have a tracked process
                    # This means something else started the server - that's fine
                    pass
            
            # Health check interval
            time.sleep(10)
            
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
            # Stop the daemon
            pid = read_daemon_pid()
            if pid and is_daemon_running():
                os.kill(pid, signal.SIGTERM)
                log(f'Daemon stopped (PID {pid})')
                # Also kill the server
                kill_old_server()
            else:
                print('No running daemon found')
                # Kill any server on port 3000 as cleanup
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
            # Stop and start
            pid = read_daemon_pid()
            if pid and is_daemon_running():
                os.kill(pid, signal.SIGTERM)
                time.sleep(3)
            kill_old_server()
            time.sleep(2)
            print('Restarting daemon...')
            # Continue to start below
        
        else:
            print(f'Unknown command: {cmd}')
            print('Usage: aura-daemon.py [--stop|--status|--restart]')
            sys.exit(1)
    else:
        # Check if daemon is already running
        if is_daemon_running():
            print('Daemon is already running! Use --stop to stop it first.')
            sys.exit(1)
    
    # Start the daemon in background
    log('Starting AURA daemon in background...')
    
    # Simple background approach - redirect output and fork
    pid = os.fork()
    if pid > 0:
        # Parent process - wait briefly then exit
        time.sleep(2)
        if is_daemon_running():
            print(f'Daemon started successfully (PID: {pid})')
        else:
            print('Daemon may have failed to start')
        sys.exit(0)
    
    # Child process - become daemon
    os.setsid()
    
    # Close standard file descriptors
    sys.stdout.flush()
    sys.stderr.flush()
    devnull = open(os.devnull, 'r')
    os.dup2(devnull.fileno(), sys.stdin.fileno())
    
    # Run the daemon loop
    run_daemon()
