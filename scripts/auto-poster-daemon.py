#!/usr/bin/env python3
"""ORRA Auto-Poster Daemon — Keeps the auto-poster running permanently (45min interval)."""
import subprocess
import os
import time
import sys
import signal

PROJECT_DIR = '/home/z/my-project'
SCRIPT = ['node', 'scripts/auto-poster.js', '--cron']
PIDFILE = '/tmp/auto-poster-daemon.pid'
LOGFILE = '/tmp/auto-poster-daemon.log'

ENV = {
    **os.environ,
    'ORRA_URL': 'http://localhost:3000',
    'AUTOPOST_KEY': 'orra-internal-autopost-2026',
    'NEXTAUTH_SECRET': 'xOl2TQ9tBWNt4yDD9zQnbZlKV8oemICL75YyVnGhIsM=',
}

child_pid = None

def start_poster():
    """Start the auto-poster node process"""
    global child_pid
    proc = subprocess.Popen(SCRIPT, cwd=PROJECT_DIR, env=ENV)
    child_pid = proc.pid
    # Write the DAEMON pid (not child) to pidfile so --stop works
    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))
    return proc

def signal_handler(signum, frame):
    """Handle stop signal — kill child and exit"""
    global child_pid
    if child_pid:
        try:
            os.kill(child_pid, signal.SIGTERM)
        except:
            pass
    sys.exit(0)

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--stop':
        try:
            with open(PIDFILE) as f:
                pid = int(f.read().strip())
            os.kill(pid, signal.SIGTERM)
            print(f'Stopped auto-poster daemon (PID {pid})')
        except:
            print('No running auto-poster daemon found')
        sys.exit(0)

    # Double-fork to detach from terminal
    pid = os.fork()
    if pid > 0:
        print(f'Auto-poster daemon started (watcher PID: {pid})')
        os._exit(0)

    os.setsid()

    pid2 = os.fork()
    if pid2 > 0:
        os._exit(0)

    # Redirect stdout/stderr to log file
    sys.stdout.flush()
    sys.stderr.flush()
    log = open(LOGFILE, 'a')
    os.dup2(log.fileno(), sys.stdout.fileno())
    os.dup2(log.fileno(), sys.stderr.fileno())

    # Register signal handler
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    # Main loop: start node process, wait for it, restart if it dies
    while True:
        try:
            print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Starting auto-poster...', flush=True)
            proc = start_poster()
            proc.wait()
            print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Auto-poster exited with code {proc.returncode}, restarting in 10s...', flush=True)
        except Exception as e:
            print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Error: {e}, retrying in 10s...', flush=True)
        time.sleep(10)
