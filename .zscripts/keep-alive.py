#!/usr/bin/env python3
"""ORRA Keep-Alive Daemon — prevents the Alibaba Cloud FC proxy from
freezing the container due to inactivity.

CRITICAL: This daemon should ping the PUBLIC URL (not localhost).
Pings to localhost DON'T count as external traffic for FC.
Only traffic going through the FC load balancer keeps the container alive.

Set KEEP_ALIVE_URL to the public URL, e.g.:
  export KEEP_ALIVE_URL="https://orra.cn-hangzhou.fc.aliyuncs.com/api/health"

If KEEP_ALIVE_URL is not set, falls back to localhost (which won't prevent
FC freezing, but will at least detect server crashes).

Usage:
  python3 keep-alive.py          # Start daemon
  python3 keep-alive.py --stop   # Stop daemon
  python3 keep-alive.py --status # Check status
"""
import os
import time
import sys
import signal
import subprocess

PIDFILE = '/tmp/orra-keepalive.pid'
LOGFILE = '/tmp/orra-keepalive.log'

# Use the public URL if set, otherwise fall back to localhost
# The public URL is CRITICAL for preventing FC container freezing!
PING_URL = os.environ.get('KEEP_ALIVE_URL', 'http://127.0.0.1:3000/api/health')
PING_INTERVAL = 10  # seconds

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    try:
        with open(LOGFILE, 'a') as f:
            f.write(line + '\n')
    except:
        pass

def ping_server():
    """Ping the configured URL via curl"""
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
             '--max-time', '8', PING_URL],
            capture_output=True, text=True, timeout=12
        )
        status = result.stdout.strip()
        return status == '200'
    except Exception as e:
        log(f'Ping error: {e}')
        return False

def write_pid():
    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))

def read_pid():
    try:
        with open(PIDFILE) as f:
            return int(f.read().strip())
    except:
        return None

def is_daemon_running():
    pid = read_pid()
    if pid is None:
        return False
    try:
        os.kill(pid, 0)
        return True
    except:
        return False

def run_daemon():
    is_public = not PING_URL.startswith('http://127.0.0.1') and not PING_URL.startswith('http://localhost')
    log(f'=== ORRA Keep-Alive Daemon Starting ===')
    log(f'PING_URL: {PING_URL} ({"PUBLIC - prevents FC freeze!" if is_public else "LOCALHOST - will NOT prevent FC freeze!"})')
    if not is_public:
        log(f'WARNING: Set KEEP_ALIVE_URL to your PUBLIC URL to prevent FC freezing!')
    write_pid()

    consecutive_failures = 0

    while True:
        try:
            if ping_server():
                if consecutive_failures > 0:
                    log(f'Server is back online after {consecutive_failures} failures')
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                if consecutive_failures <= 3:
                    log(f'Ping failed ({consecutive_failures} consecutive) — server may be restarting')
                elif consecutive_failures % 10 == 0:
                    log(f'Server has been unreachable for {consecutive_failures * PING_INTERVAL}s')

        except Exception as e:
            log(f'Daemon error: {e}')

        time.sleep(PING_INTERVAL)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == '--stop':
            pid = read_pid()
            if pid and is_daemon_running():
                os.kill(pid, signal.SIGTERM)
                print(f'Keep-alive daemon stopped (PID {pid})')
            else:
                print('No running keep-alive daemon found')
            sys.exit(0)

        elif cmd == '--status':
            running = is_daemon_running()
            print(f'Keep-alive daemon running: {"YES" if running else "NO"}')
            print(f'PING_URL: {PING_URL}')
            pid = read_pid()
            if pid:
                print(f'PID: {pid}')
            sys.exit(0)
        else:
            print(f'Unknown command: {cmd}')
            sys.exit(1)

    if is_daemon_running():
        print('Keep-alive daemon is already running!')
        sys.exit(1)

    # Fork to background
    pid = os.fork()
    if pid > 0:
        time.sleep(1)
        if is_daemon_running():
            print(f'Keep-alive daemon started (PID: {pid})')
        else:
            print('Keep-alive daemon may have failed to start')
        sys.exit(0)

    # Child process — become daemon
    os.setsid()
    sys.stdout.flush()
    sys.stderr.flush()
    devnull = open(os.devnull, 'r')
    os.dup2(devnull.fileno(), sys.stdin.fileno())

    run_daemon()
