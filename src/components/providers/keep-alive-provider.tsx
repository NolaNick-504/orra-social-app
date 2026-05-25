'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * KeepAliveProvider — prevents the FC container from freezing.
 *
 * HOW IT WORKS:
 * Pings /api/health every 5 seconds. These pings go through the FC proxy
 * (browser → FC load balancer → Caddy → Node), which counts as external
 * traffic and keeps the container alive.
 *
 * KEY DESIGN PRINCIPLES:
 * 1. NEVER stop the main ping interval — pings are what keep the container alive
 * 2. NO abort timeout on pings — let the browser handle timeouts naturally
 * 3. Require 3+ consecutive failures before showing reconnect overlay
 * 4. Recovery does NOT do a full page reload — just invalidates React Query cache
 *    so the app refreshes its data without losing the current UI state
 *
 * PREVIOUS BUG (the one causing all the "Reconnecting..." screens):
 * - Old code had a 3-second AbortController timeout on pings
 * - If the server was even slightly slow, the ping would abort → counted as failure
 * - On ONE failed ping, recovery mode started
 * - Recovery mode STOPPED all pings → container froze → death spiral
 *
 * ALSO IMPORTANT: This client-side ping is the BACKUP to the server-side
 * self-ping (in server.js). The server-side ping is more reliable because
 * it runs even when the browser is closed. But this client-side ping
 * provides immediate feedback to the user.
 */

const PING_INTERVAL = 5_000;     // 5 seconds — ping often enough that FC never sees inactivity
const FAIL_THRESHOLD = 3;        // Need this many consecutive failures before showing overlay
const RECONNECT_CHECK = 3_000;   // 3 seconds between reconnect checks (parallel to main ping)

type ServerStatus = 'healthy' | 'down' | 'recovering';

export function KeepAliveProvider({ children }: { children: React.ReactNode }) {
  const statusRef = useRef<ServerStatus>('healthy');
  const [, forceUpdate] = useState(0);
  const consecutiveFailsRef = useRef(0);
  const isRecoveringRef = useRef(false);

  const setStatus = useCallback((status: ServerStatus) => {
    if (statusRef.current !== status) {
      statusRef.current = status;
      forceUpdate(prev => prev + 1);
    }
  }, []);

  // Simple ping — NO abort controller, NO timeout.
  const ping = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/health', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Recovery — runs IN PARALLEL with the main ping loop.
  // The main ping loop NEVER stops, even during recovery.
  // On recovery: just dismiss the overlay. React Query will auto-refetch
  // stale data on the next render cycle. No full page reload needed.
  const startRecovery = useCallback(async () => {
    if (isRecoveringRef.current) return;
    isRecoveringRef.current = true;
    setStatus('recovering');

    console.warn('ORRA: Server appears down, starting recovery (pings continue in background)...');

    // Keep trying until server comes back
    while (isRecoveringRef.current) {
      await new Promise(r => setTimeout(r, RECONNECT_CHECK));
      const ok = await ping();
      if (ok) {
        console.warn('ORRA: Server is back!');
        isRecoveringRef.current = false;
        consecutiveFailsRef.current = 0;
        setStatus('healthy');

        // Instead of a full page reload, just dispatch a custom event
        // that React Query listeners can use to invalidate their caches.
        // This is much less disruptive than window.location.replace().
        try {
          window.dispatchEvent(new CustomEvent('orra-server-recovered'));
        } catch {}

        // If the page is showing error state (e.g., ErrorBoundary caught something),
        // a gentle reload is needed. But only if there's visible error content.
        const bodyText = document.body?.innerText || '';
        const hasErrorUI = (
          bodyText.includes('Something went wrong') ||
          bodyText.includes('Page Not Found')
        );
        if (hasErrorUI) {
          window.location.replace('/?_cb=' + Date.now());
        }
        return;
      }
    }
  }, [ping, setStatus]);

  // MAIN KEEP-ALIVE LOOP — this is the most critical part.
  // It NEVER stops. It pings every 5 seconds regardless of server status.
  // These pings go through the FC proxy → keep the container alive.
  useEffect(() => {
    let cancelled = false;

    const doPing = async () => {
      if (cancelled) return;

      const ok = await ping();
      if (cancelled) return;

      if (ok) {
        consecutiveFailsRef.current = 0;
        if (isRecoveringRef.current) {
          isRecoveringRef.current = false;
          setStatus('healthy');
        } else if (statusRef.current !== 'healthy') {
          setStatus('healthy');
        }
      } else {
        consecutiveFailsRef.current++;
        if (consecutiveFailsRef.current >= FAIL_THRESHOLD) {
          setStatus('down');
          if (!isRecoveringRef.current) {
            startRecovery();
          }
        }
      }
    };

    // First ping immediately
    doPing();

    // CRITICAL: This interval NEVER stops. Even during recovery.
    const id = setInterval(doPing, PING_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ping, startRecovery, setStatus]);

  // Handle tab visibility — check immediately when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const check = async () => {
          const ok = await ping();
          if (ok) {
            consecutiveFailsRef.current = 0;
            if (statusRef.current !== 'healthy') {
              setStatus('healthy');
            }
            // Check if page shows error state but server is healthy
            const bodyText = document.body?.innerText || '';
            if (
              bodyText.includes('Page Not Found') ||
              bodyText.includes('Something went wrong') ||
              bodyText.includes('404')
            ) {
              window.location.replace('/?_cb=' + Date.now());
            }
          } else {
            consecutiveFailsRef.current++;
            if (!isRecoveringRef.current) {
              startRecovery();
            }
          }
        };
        check();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [ping, startRecovery, setStatus]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.warn('ORRA: Network back online, checking server...');
      setTimeout(async () => {
        const ok = await ping();
        if (ok) {
          consecutiveFailsRef.current = 0;
          setStatus('healthy');
        }
      }, 1000);
    };

    const handleOffline = () => {
      console.warn('ORRA: Network went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [ping, setStatus]);

  // Show recovery overlay only when server has been down for multiple checks
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
            {consecutiveFailsRef.current > FAIL_THRESHOLD && (
              <p className="text-slate-600 text-xs mt-3">
                Attempt {consecutiveFailsRef.current - FAIL_THRESHOLD}
              </p>
            )}
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/?_cb=' + Date.now(), { cache: 'no-store' });
                  if (res.ok) {
                    window.location.replace('/?_cb=' + Date.now());
                  }
                } catch {
                  // Will keep retrying via main loop
                }
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
