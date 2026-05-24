'use client';

import { useEffect, useRef } from 'react';

/**
 * Root not-found page — smart 404 detection
 *
 * The platform (Alibaba Cloud Function Compute) returns 404 when the
 * container is frozen. This page detects that case and auto-recovers
 * instead of showing a permanent "Page Not Found" error.
 *
 * How it works:
 * 1. When this page loads, it pings /api/health to check if the server is alive
 * 2. If the server responds — this is a REAL 404 (wrong URL), redirect to home
 * 3. If the server doesn't respond — the container is frozen, show reconnecting UI
 * 4. Keep retrying until the server comes back, then auto-reload
 */
export default function RootNotFound() {
  const hasStartedRecovery = useRef(false);

  useEffect(() => {
    if (hasStartedRecovery.current) return;
    hasStartedRecovery.current = true;

    let retryCount = 0;
    let cancelled = false;

    const checkServer = async () => {
      if (cancelled) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch('/api/health', {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          // Server is alive — this was a real 404 or the server just came back
          // Redirect to home with cache-bust
          console.warn('ORRA: Server is healthy on not-found page, redirecting home');
          window.location.replace('/?_cb=' + Date.now());
          return;
        }
      } catch {
        // Server unreachable — container is frozen
        console.warn('ORRA: Server unreachable on not-found page (attempt', retryCount + 1, ')');
      }

      // Server is down — retry
      retryCount++;
      const delay = retryCount < 5 ? 3000 : 15000; // Fast retries first, then slow
      setTimeout(checkServer, delay);
    };

    checkServer();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
        <p className="text-slate-400 text-sm mb-3">ORRA is waking back up.</p>
        <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
            style={{ animation: 'orra-notfound-pulse 2s ease-in-out infinite' }}
          />
        </div>
        <button
          onClick={() => { window.location.replace('/?_cb=' + Date.now()); }}
          className="mt-4 px-5 py-2 rounded-xl bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors"
        >
          Try now
        </button>
        <style>{`
          @keyframes orra-notfound-pulse {
            0%, 100% { width: 20%; margin-left: 0; }
            50% { width: 80%; margin-left: 10%; }
          }
        `}</style>
      </div>
    </div>
  );
}
