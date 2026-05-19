#!/usr/bin/env python3
"""Server keeper - starts and keeps the Next.js server alive"""
import subprocess
import os
import time
import sys

env = os.environ.copy()
env.update({
    'PORT': '3000',
    'DATABASE_URL': 'file:/home/z/my-project/db/custom.db',
    'NEXTAUTH_SECRET': 'aura-super-secret-key-2027-dev-only',
    'NEXTAUTH_URL': 'http://localhost:3000',
    'AUTH_TRUST_HOST': 'true',
    'NODE_ENV': 'production',
})

while True:
    try:
        proc = subprocess.Popen(
            ['node', '/home/z/my-project/.next/standalone/server.js'],
            env=env,
            cwd='/home/z/my-project',
        )
        proc.wait()
        print(f"[keeper] Server exited with code {proc.returncode}, restarting in 2s...", flush=True)
    except Exception as e:
        print(f"[keeper] Error: {e}, restarting in 2s...", flush=True)
    time.sleep(2)
