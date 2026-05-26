#!/usr/bin/env python3
"""AURA Server Daemon - Keeps Next.js production server alive permanently.
Uses double-fork to fully detach from parent process tree,
making it immune to parent process cleanup.
"""
import subprocess
import os
import time
import sys
import signal

PROJECT_DIR = '/home/z/my-project'
SERVER_CMD = ['node', '.next/standalone/server.js']
STANDALONE_DIR = '/home/z/my-project/.next/standalone'
PIDFILE = '/tmp/aura-daemon.pid'
LOGFILE = '/tmp/aura-daemon.log'

# Track the current server process to kill it on restart
current_server_pid = None

ENV = {
    **os.environ,
    'PORT': '3000',
    'DATABASE_URL': 'file:/home/z/my-project/db/custom.db',
    'NEXTAUTH_SECRET': 'orra-super-secret-key-2025-production',
    'NEXTAUTH_URL': 'http://localhost:3000',
    'AUTH_TRUST_HOST': 'true',
    'NODE_ENV': 'production',
}

def is_port_active():
    """Check if port 3000 is responding"""
    try:
        import urllib.request
        urllib.request.urlopen('http://127.0.0.1:3000/', timeout=2)
        return True
    except:
        return False

def start_server():
    """Start the Next.js server with double-fork daemon pattern"""
    # First fork
    pid = os.fork()
    if pid > 0:
        # Parent returns immediately
        return pid

    # Decouple from parent
    os.setsid()

    # Second fork
    pid = os.fork()
    if pid > 0:
        os._exit(0)

    # Redirect standard file descriptors
    sys.stdout.flush()
    sys.stderr.flush()
    log = open(LOGFILE, 'a')
    os.dup2(log.fileno(), sys.stdout.fileno())
    os.dup2(log.fileno(), sys.stderr.fileno())

    # Write PID
    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))

    # Main daemon loop
    crash_count = 0
    while True:
        # CRITICAL: Check that the build actually exists before starting
        server_js = os.path.join(STANDALONE_DIR, 'server.js')
        if not os.path.exists(server_js):
            print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Build not found at {server_js}, waiting for build...', flush=True)
            time.sleep(10)
            continue

        if not is_port_active():
            print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Starting Next.js server...', flush=True)
            try:
                proc = subprocess.Popen(
                    SERVER_CMD,
                    cwd=PROJECT_DIR,
                    env=ENV,
                )
                proc.wait()
                exit_code = proc.returncode
                print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Server exited with code {exit_code}', flush=True)

                # If killed by signal (negative code), wait longer before restart
                # to avoid crash loop during container restart
                if exit_code < 0:
                    crash_count += 1
                    backoff = min(crash_count * 5, 60)  # 5s, 10s, 15s... up to 60s
                    print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Server killed (signal {-exit_code}), waiting {backoff}s before restart...', flush=True)
                    time.sleep(backoff)
                    continue
                else:
                    crash_count = 0
                    time.sleep(3)
                    continue

            except Exception as e:
                crash_count += 1
                print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Error: {e}', flush=True)
                time.sleep(min(crash_count * 5, 60))
                continue
        else:
            # Server is running, reset crash counter
            crash_count = 0
        
        time.sleep(3)

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--stop':
        try:
            with open(PIDFILE) as f:
                pid = int(f.read())
            os.kill(pid, signal.SIGTERM)
            print(f'Stopped daemon (PID {pid})')
        except:
            print('No running daemon found')
        sys.exit(0)

    child = start_server()
    print(f'AURA daemon started (watcher PID: {child})')
    # Parent exits immediately
    os._exit(0)
