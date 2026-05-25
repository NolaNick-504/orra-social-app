#!/usr/bin/env python3
"""ORRA Build Preserver - Caches .next/ on /home/sync/ so it
survives container rebuilds on Alibaba Cloud FC.

On cold start, dev.sh restores from this cache instead of rebuilding.
"""
import os, sys, shutil, time

PROJECT_DIR = '/home/z/my-project'
CACHE_DIR = '/home/sync/orra-build-cache'  # /home/sync/ PERSISTS across rebuilds
NEXT_DIR = os.path.join(PROJECT_DIR, '.next')

def sync_build_to_cache():
    """Copy .next/ to persistent cache"""
    build_id = os.path.join(NEXT_DIR, 'BUILD_ID')
    if not os.path.exists(build_id):
        return False

    sig_file = os.path.join(CACHE_DIR, '.build-sig')
    try:
        with open(build_id) as f:
            sig = f.read().strip()
    except:
        return False

    if os.path.exists(sig_file):
        with open(sig_file) as f:
            if f.read().strip() == sig:
                return True  # Already cached

    print(f'[{time.strftime("%H:%M:%S")}] Caching build (sig: {sig})', flush=True)
    try:
        if os.path.exists(os.path.join(CACHE_DIR, 'next')):
            shutil.rmtree(os.path.join(CACHE_DIR, 'next'))
        os.makedirs(CACHE_DIR, exist_ok=True)
        shutil.copytree(NEXT_DIR, os.path.join(CACHE_DIR, 'next'))
        with open(sig_file, 'w') as f:
            f.write(sig)
        return True
    except Exception as e:
        print(f'Cache sync error: {e}', flush=True)
        return False

def restore_build_from_cache():
    """Restore .next/ from persistent cache"""
    cached = os.path.join(CACHE_DIR, 'next', 'BUILD_ID')
    if not os.path.exists(cached):
        return False

    print(f'[{time.strftime("%H:%M:%S")}] Restoring build from /home/sync/ cache...', flush=True)
    try:
        if os.path.exists(NEXT_DIR):
            shutil.rmtree(NEXT_DIR)
        shutil.copytree(os.path.join(CACHE_DIR, 'next'), NEXT_DIR)
        return True
    except Exception as e:
        print(f'Cache restore error: {e}', flush=True)
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == '--restore':
            sys.exit(0 if restore_build_from_cache() else 1)
        elif sys.argv[1] == '--sync':
            sys.exit(0 if sync_build_to_cache() else 1)
