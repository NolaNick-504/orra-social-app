#!/usr/bin/env python3
"""ORRA Keep-Alive Daemon — prevents the Alibaba Cloud FC proxy from
freezing the container due to inactivity.

The FC proxy freezes containers after ~3-5 minutes of no incoming requests.
Client-side keep-alive (from the browser) is unreliable because:
1. Browsers throttle setInterval in background tabs (1x/min instead of 1x/15s)
2. If the user closes the browser, no keep-alive is sent at all
3. Mobile browsers aggressively kill background tabs

This daemon runs SERVER-SIDE and pings the local Next.js server every 10 seconds.
The FC proxy sees these as incoming requests and keeps the container alive.

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
NEXT_URL = 'http://127.0.0.1:3000/api/health'
PING_INTERVAL = 10  # seconds — must be less than FC idle timeout (~180s)

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
    """Ping the local Next.js server via curl"""
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
             '--max-time', '5', NEXT_URL],
            capture_output=True, text=True, timeout=8
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
    log('=== ORRA Keep-Alive Daemon Starting ===')
    write_pid()

    consecutive_failures = 0

    while True:
        try:
            if ping_server():
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                if consecutive_failures <= 3:
                    log(f'Ping failed ({consecutive_failures} consecutive) — server may be restarting')
                elif consecutive_failures == 10:
                    log(f'Server has been unreachable for {consecutive_failures * PING_INTERVAL}s')
                    # The aura-daemon should handle restarting Next.js
                    # We just keep pinging to detect when it comes back

            # If server is back after failures, log it
            if consecutive_failures == 0 and os.path.exists('/tmp/orra-keepalive-was-down'):
                log('Server is back online after downtime!')
                os.remove('/tmp/orra-keepalive-was-down')
            elif consecutive_failures > 3:
                open('/tmp/orra-keepalive-was-down', 'w').close()

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
