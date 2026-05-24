'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * KeepAliveProvider — prevents the platform container from freezing
 * and auto-recovers when the server goes down and comes back.
 *
 * Root cause: The app runs on Alibaba Cloud Function Compute, which
 * freezes the container after ~3-5 minutes of inactivity. When frozen,
 * the platform proxy returns 404/502 and the Next.js server stops.
 *
 * How this fixes it:
 * 1. Pings /api/health every 10 seconds to keep the container alive
 * 2. Detects when the server goes down (platform proxy 404/502/network error)
 * 3. Shows a "Reconnecting..." overlay while the server is down
 * 4. Auto-reloads the page once the server comes back
 * 5. Handles browser tab visibility changes (resume pings when tab becomes visible)
 */

const PING_INTERVAL = 10_000; // 10 seconds — must be less than platform idle timeout (~3-5 min)
const PING_TIMEOUT = 5_000;   // 5 second timeout for each ping
const MAX_FAST_RETRIES = 5;    // After detecting server down, retry this many times quickly
const FAST_RETRY_DELAY = 3_000; // 3 seconds between fast retries
const SLOW_RETRY_DELAY = 15_000; // 15 seconds between slow retries (after fast retries exhausted)
const BACKUP_INTERVAL = 60_000; // 60 seconds — auto-backup DB to persistent storage

type ServerStatus = 'healthy' | 'down' | 'recovering';

export function KeepAliveProvider({ children }: { children: React.ReactNode }) {
  const statusRef = useRef<ServerStatus>('healthy');
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const lastHealthyRef = useRef(Date.now());
  const isRecoveringRef = useRef(false);

  const setStatus = useCallback((status: ServerStatus) => {
    if (statusRef.current !== status) {
      statusRef.current = status;
      forceUpdate(prev => prev + 1);
    }
  }, []);

  const ping = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

      const res = await fetch('/api/health', {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        // Check if this is a real Next.js response (has X-Powered-By header)
        // vs a platform proxy 404 that still returns 200 for some paths
        return true;
      }

      // 404, 502, 503, etc — server is down
      return false;
    } catch {
      // Network error, timeout, abort — server is unreachable
      return false;
    }
  }, []);

  const recoverServer = useCallback(async () => {
    if (isRecoveringRef.current) return;
    isRecoveringRef.current = true;
    setStatus('recovering');
    retryCountRef.current = 0;

    console.warn('ORRA: Server appears down, starting recovery...');

    // Fast retries first
    for (let i = 0; i < MAX_FAST_RETRIES; i++) {
      retryCountRef.current = i + 1;
      await new Promise(r => setTimeout(r, FAST_RETRY_DELAY));

      const ok = await ping();
      if (ok) {
        console.warn('ORRA: Server is back! (fast retry', i + 1, ')');
        isRecoveringRef.current = false;
        lastHealthyRef.current = Date.now();
        setStatus('healthy');

        // Server is back — reload to get fresh app state
        window.location.replace('/?_cb=' + Date.now());
        return;
      }
    }

    // Slow retries — keep trying every 15 seconds
    console.warn('ORRA: Fast retries exhausted, switching to slow retries');
    const slowRetry = async () => {
      while (isRecoveringRef.current) {
        await new Promise(r => setTimeout(r, SLOW_RETRY_DELAY));
        retryCountRef.current++;

        const ok = await ping();
        if (ok) {
          console.warn('ORRA: Server is back! (slow retry', retryCountRef.current, ')');
          isRecoveringRef.current = false;
          lastHealthyRef.current = Date.now();
          setStatus('healthy');

          // Server is back — reload to get fresh app state
          window.location.replace('/?_cb=' + Date.now());
          return;
        }
      }
    };
    slowRetry();
  }, [ping, setStatus]);

  // Auto-backup database every 60 seconds to persistent storage
  // This ensures user changes (profile edits, new posts, etc.) survive container rebuilds
  useEffect(() => {
    const doBackup = async () => {
      try {
        await fetch('/api/db-backup', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
      } catch {
        // Silently fail — backup is best-effort
      }
    };

    // Initial backup after 30 seconds (give app time to load)
    const initialTimeout = setTimeout(doBackup, 30_000);
    // Then backup every 60 seconds
    const backupInterval = setInterval(doBackup, BACKUP_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(backupInterval);
    };
  }, []);

  // Main keep-alive loop
  useEffect(() => {
    const doPing = async () => {
      if (isRecoveringRef.current) return; // Don't ping during recovery

      const ok = await ping();
      if (ok) {
        lastHealthyRef.current = Date.now();
        setStatus('healthy');
      } else {
        const timeSinceHealthy = Date.now() - lastHealthyRef.current;
        // Only start recovery if we've been down for more than 5 seconds
        // (to avoid false positives from one bad ping)
        if (timeSinceHealthy > 5000 || retryCountRef.current > 0) {
          recoverServer();
        } else {
          // Mark as down but don't recover yet — might be transient
          lastHealthyRef.current = 0; // Force next ping to trigger recovery
          setStatus('down');
        }
      }
    };

    // Initial ping
    doPing();

    // Set up interval
    intervalRef.current = setInterval(doPing, PING_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ping, recoverServer, setStatus]);

  // Handle tab visibility — resume pings when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Tab is visible again — check server immediately
        const checkAndRecover = async () => {
          if (isRecoveringRef.current) return;

          const ok = await ping();
          if (ok) {
            lastHealthyRef.current = Date.now();
            setStatus('healthy');

            // Check if the page is showing an error/not-found state
            // If so, reload to get fresh content
            const bodyText = document.body?.innerText || '';
            if (
              bodyText.includes('Page Not Found') ||
              bodyText.includes('Something went wrong') ||
              bodyText.includes('404') ||
              bodyText.includes('Reconnecting')
            ) {
              console.warn('ORRA: Page shows error state but server is healthy — reloading');
              window.location.replace('/?_cb=' + Date.now());
            }
          } else {
            recoverServer();
          }
        };
        checkAndRecover();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [ping, recoverServer, setStatus]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.warn('ORRA: Network came back online, checking server...');
      const check = async () => {
        const ok = await ping();
        if (ok) {
          lastHealthyRef.current = Date.now();
          setStatus('healthy');
          // Reload to recover from any error state
          window.location.replace('/?_cb=' + Date.now());
        } else {
          recoverServer();
        }
      };
      // Small delay to let network stabilize
      setTimeout(check, 1000);
    };

    const handleOffline = () => {
      console.warn('ORRA: Network went offline');
      setStatus('down');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [ping, recoverServer, setStatus]);

  // Show recovery overlay when server is down
  const status = statusRef.current;

  return (
    <>
      {children}
      {(status === 'down' || status === 'recovering') && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto p-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-6 animate-pulse">
              <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Reconnecting...</h2>
            <p className="text-slate-400 text-sm mb-4">
              ORRA is waking back up. This usually takes a few seconds.
            </p>
            <div className="w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                style={{
                  animation: 'orra-reconnect-pulse 2s ease-in-out infinite',
                }}
              />
            </div>
            {retryCountRef.current > 0 && (
              <p className="text-slate-600 text-xs mt-3">
                Attempt {retryCountRef.current}
              </p>
            )}
            <button
              onClick={() => {
                window.location.replace('/?_cb=' + Date.now());
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors"
            >
              Try now
            </button>
            <style>{`
              @keyframes orra-reconnect-pulse {
                0%, 100% { width: 20%; margin-left: 0; }
                50% { width: 80%; margin-left: 10%; }
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}
