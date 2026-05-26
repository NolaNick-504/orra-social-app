#!/usr/bin/env python3
"""AURA Server Daemon - Keeps Next.js production server alive permanently.
Uses double-fork to fully detach from parent process tree,
making it immune to parent process cleanup.

Also runs AI agent cron jobs every 15 minutes to keep the feed alive.
"""
import subprocess
import os
import time
import sys
import signal
import threading
import json

PROJECT_DIR = '/home/z/my-project'
SERVER_CMD = ['node', '.next/standalone/server.js']
PIDFILE = '/tmp/aura-daemon.pid'
LOGFILE = '/tmp/aura-daemon.log'
CACHE_DIR = '/home/z/my-project/.next/standalone/.next/cache'
CRON_INTERVAL = 15 * 60  # 15 minutes between AI agent cron runs

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

def run_ai_agent_cron():
    """Background thread: run AI agent cron every 5 minutes"""
    import urllib.request
    import urllib.error

    # Wait 30 seconds for server to be ready before first cron run
    time.sleep(30)

    while True:
        try:
            if is_port_active():
                req = urllib.request.Request(
                    'http://127.0.0.1:3000/api/ai-agents/cron?key=orra-cron-2025',
                    method='GET'
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode())
                    ts = time.strftime("%Y-%m-%d %H:%M:%S")
                    print(f'[{ts}] AI Agent Cron: {data.get("actions", 0)} actions completed', flush=True)
        except urllib.error.HTTPError as e:
            ts = time.strftime("%Y-%m-%d %H:%M:%S")
            print(f'[{ts}] AI Agent Cron HTTP error: {e.code}', flush=True)
        except Exception as e:
            ts = time.strftime("%Y-%m-%d %H:%M:%S")
            print(f'[{ts}] AI Agent Cron error: {e}', flush=True)

        time.sleep(CRON_INTERVAL)

def seed_ai_agents():
    """One-time seed of AI agents on first startup"""
    import urllib.request
    import urllib.error

    # Wait for server to be ready
    for attempt in range(10):
        if is_port_active():
            break
        time.sleep(3)

    try:
        # Seed AI agents
        seed_data = json.dumps({'action': 'seed'}).encode()
        req = urllib.request.Request(
            'http://127.0.0.1:3000/api/ai-agents',
            data=seed_data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            ts = time.strftime("%Y-%m-%d %H:%M:%S")
            print(f'[{ts}] AI Agent Seed: {data.get("message", "done")}', flush=True)

        # Generate initial content
        gen_data = json.dumps({'action': 'generate'}).encode()
        req2 = urllib.request.Request(
            'http://127.0.0.1:3000/api/ai-agents',
            data=gen_data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req2, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            ts = time.strftime("%Y-%m-%d %H:%M:%S")
            print(f'[{ts}] AI Agent Generate: {data.get("postsGenerated", 0)} posts created', flush=True)

    except urllib.error.HTTPError as e:
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f'[{ts}] AI Agent seed HTTP error: {e.code}', flush=True)
    except Exception as e:
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f'[{ts}] AI Agent seed error: {e}', flush=True)

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

    # Start AI agent cron thread
    cron_thread = threading.Thread(target=run_ai_agent_cron, daemon=True)
    cron_thread.start()
    print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] AI Agent cron thread started (every {CRON_INTERVAL//60} min)', flush=True)

    # Start AI agent seed thread (one-time)
    seed_thread = threading.Thread(target=seed_ai_agents, daemon=True)
    seed_thread.start()

    # Main daemon loop
    while True:
        if not is_port_active():
            # Clear Next.js server-side cache before starting
            # This prevents stale HTML/chunk references from being served
            try:
                import shutil
                if os.path.exists(CACHE_DIR):
                    shutil.rmtree(CACHE_DIR)
                    print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Cleared Next.js cache', flush=True)
            except Exception as e:
                print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Cache clear warning: {e}', flush=True)

            print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Starting Next.js server...', flush=True)
            try:
                proc = subprocess.Popen(
                    SERVER_CMD,
                    cwd=PROJECT_DIR,
                    env=ENV,
                )
                proc.wait()
                print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Server exited with code {proc.returncode}', flush=True)
            except Exception as e:
                print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Error: {e}', flush=True)

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

    if len(sys.argv) > 1 and sys.argv[1] == '--restart':
        # Stop existing daemon
        try:
            with open(PIDFILE) as f:
                pid = int(f.read())
            os.kill(pid, signal.SIGTERM)
            print(f'Stopped daemon (PID {pid})')
            time.sleep(2)
        except:
            print('No running daemon found')

        # Kill any existing node server
        try:
            subprocess.run(['pkill', '-f', 'next-server'], capture_output=True)
            time.sleep(1)
        except:
            pass

    if len(sys.argv) > 1 and sys.argv[1] == '--status':
        if is_port_active():
            print('ORRA server is RUNNING on port 3000')
        else:
            print('ORRA server is DOWN')
        try:
            with open(PIDFILE) as f:
                pid = int(f.read())
            print(f'Daemon PID: {pid}')
        except:
            print('No daemon PID file found')
        sys.exit(0)

    child = start_server()
    print(f'AURA daemon started (watcher PID: {child})')
    print(f'AI agents will post every {CRON_INTERVAL//60} minutes to keep the feed alive')
    # Parent exits immediately
    os._exit(0)
