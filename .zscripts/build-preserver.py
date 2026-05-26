#!/usr/bin/env python3
"""ORRA Build Preserver - Keeps a copy of .next/ in /tmp/ so it
survives the container's /start.sh wipe (which only deletes /home/z/my-project/).

Runs as a background daemon and syncs the build every 60 seconds.
On boot, dev.sh checks for the cached build and restores it instead of rebuilding.

NOTE: The project does NOT use 'output: standalone', so we cache the entire
.next/ directory (not just .next/standalone).
"""
import os
import sys
import shutil
import time

PROJECT_DIR = '/home/z/my-project'
CACHE_DIR = '/tmp/orra-build-cache'
NEXT_DIR = os.path.join(PROJECT_DIR, '.next')
PIDFILE = '/tmp/build-preserver.pid'
LOGFILE = '/tmp/build-preserver.log'

def get_build_signature():
    """Get a signature of the current build (BUILD_ID content + chunk count)"""
    build_id_path = os.path.join(NEXT_DIR, 'BUILD_ID')
    if not os.path.exists(build_id_path):
        return None
    try:
        with open(build_id_path) as f:
            build_id = f.read().strip()
        chunks_dir = os.path.join(NEXT_DIR, 'static', 'chunks')
        chunk_count = len([f for f in os.listdir(chunks_dir) if f.endswith('.js')]) if os.path.exists(chunks_dir) else 0
        return f"{build_id}:{chunk_count}"
    except:
        return None

def sync_build_to_cache():
    """Copy .next/ to cache directory"""
    sig = get_build_signature()
    if not sig:
        return False

    sig_file = os.path.join(CACHE_DIR, '.build-sig')

    # Skip if already cached with same signature
    if os.path.exists(sig_file):
        with open(sig_file) as f:
            cached_sig = f.read().strip()
        if cached_sig == sig:
            return True  # Already up to date

    print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Syncing build to cache (sig: {sig})', flush=True)

    try:
        # Remove old cache
        if os.path.exists(CACHE_DIR):
            shutil.rmtree(CACHE_DIR)
        os.makedirs(CACHE_DIR, exist_ok=True)

        # Copy the entire .next/ directory
        if os.path.exists(NEXT_DIR):
            shutil.copytree(NEXT_DIR, os.path.join(CACHE_DIR, 'next'))

        # Write signature
        with open(sig_file, 'w') as f:
            f.write(sig)

        print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Build cached successfully', flush=True)
        return True
    except Exception as e:
        print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Cache sync error: {e}', flush=True)
        return False

def restore_build_from_cache():
    """Restore .next/ from cache if it's valid"""
    sig_file = os.path.join(CACHE_DIR, '.build-sig')
    if not os.path.exists(sig_file):
        return False

    cached_next_dir = os.path.join(CACHE_DIR, 'next')
    if not os.path.exists(os.path.join(cached_next_dir, 'BUILD_ID')):
        return False

    print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Restoring build from cache...', flush=True)

    try:
        # Remove current .next
        if os.path.exists(NEXT_DIR):
            shutil.rmtree(NEXT_DIR)

        # Restore from cache
        shutil.copytree(cached_next_dir, NEXT_DIR)

        print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Build restored from cache', flush=True)
        return True
    except Exception as e:
        print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Cache restore error: {e}', flush=True)
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == '--restore':
            success = restore_build_from_cache()
            sys.exit(0 if success else 1)
        elif sys.argv[1] == '--sync':
            success = sync_build_to_cache()
            sys.exit(0 if success else 1)
        elif sys.argv[1] == '--check':
            sig = get_build_signature()
            cache_sig_file = os.path.join(CACHE_DIR, '.build-sig')
            cached = None
            if os.path.exists(cache_sig_file):
                with open(cache_sig_file) as f:
                    cached = f.read().strip()
            print(f'Current build: {sig}')
            print(f'Cached build:  {cached}')
            print(f'Match: {sig == cached if sig and cached else False}')
            sys.exit(0)

    # Daemon mode - run in background
    pid = os.fork()
    if pid > 0:
        print(f'Build preserver started (PID: {pid})')
        os._exit(0)

    os.setsid()
    sys.stdout.flush()
    sys.stderr.flush()
    log = open(LOGFILE, 'a')
    os.dup2(log.fileno(), sys.stdout.fileno())
    os.dup2(log.fileno(), sys.stderr.fileno())

    with open(PIDFILE, 'w') as f:
        f.write(str(os.getpid()))

    print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Build preserver daemon started', flush=True)

    while True:
        try:
            sync_build_to_cache()
        except Exception as e:
            print(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Error: {e}', flush=True)
        time.sleep(60)
