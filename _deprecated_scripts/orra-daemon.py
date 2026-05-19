#!/usr/bin/env python3
"""ORRA Server Daemon - keeps the Next.js standalone server alive."""
import subprocess, os, time, signal, sys

SERVER_DIR = '/home/z/my-project/.next/standalone'
PORT = 3000
SECRET = 'orra-super-secret-key-2025-production'

def main():
    env = os.environ.copy()
    env['PORT'] = str(PORT)
    env['NEXTAUTH_SECRET'] = SECRET

    while True:
        print(f"[orra-daemon] Starting server on port {PORT}...")
        proc = subprocess.Popen(
            ['node', 'server.js'],
            cwd=SERVER_DIR,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        # Wait for process to exit
        ret = proc.wait()
        print(f"[orra-daemon] Server exited with code {ret}, restarting in 3s...")
        time.sleep(3)

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    main()
