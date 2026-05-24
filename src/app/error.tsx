'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [countdown, setCountdown] = useState(3);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.warn('ORRA Page Error:', error?.message || error);
  }, [error]);

  // Try in-place recovery FIRST (using Next.js reset), only full-reload as fallback
  useEffect(() => {
    // First attempt: try Next.js reset() which re-renders the page component
    // without a full page reload. This recovers from most transient errors.
    const retryTimer = setTimeout(() => {
      try {
        reset();
      } catch (e) {
        // reset() failed — will fall through to countdown below
        console.warn('ORRA: reset() failed, will do full reload');
      }
    }, 1500);

    return () => clearTimeout(retryTimer);
  }, [error, reset]);

  // If still showing after 5 seconds, do a full reload (but only once)
  useEffect(() => {
    let alreadyReloaded = false;
    try {
      alreadyReloaded = sessionStorage.getItem('orra_error_reload') === '1';
    } catch {}

    if (alreadyReloaded) {
      // Already reloaded once — don't loop. Show manual button.
      return;
    }

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const reloadTimer = setTimeout(() => {
      try { sessionStorage.setItem('orra_error_reload', '1'); } catch {}
      window.location.replace('/?_cb=' + Date.now());
    }, 5000);

    return () => {
      clearTimeout(reloadTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
        <p className="text-slate-400 text-sm mb-2">ORRA hit a snag. Auto-recovering...</p>
        <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>
        <p className="text-slate-600 text-xs mt-2">{countdown}s</p>
        <button
          onClick={() => {
            try { sessionStorage.removeItem('orra_error_reload'); } catch {}
            window.location.replace('/?_cb=' + Date.now());
          }}
          className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Reload ORRA
        </button>
      </div>
    </div>
  );
}
