'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [countdown, setCountdown] = useState(5);
  const [autoRecovering, setAutoRecovering] = useState(true);

  useEffect(() => {
    console.warn('ORRA Global Error:', error?.message || error);
  }, [error]);

  // Try in-place recovery first using Next.js reset()
  useEffect(() => {
    const retryTimer = setTimeout(() => {
      try {
        reset();
      } catch (e) {
        console.warn('ORRA: reset() failed in global error');
      }
    }, 2000);
    return () => clearTimeout(retryTimer);
  }, [error, reset]);

  // If still showing after 5 seconds, full reload (once only)
  useEffect(() => {
    let alreadyReloaded = false;
    try {
      alreadyReloaded = sessionStorage.getItem('orra_global_reload') === '1';
    } catch {}

    if (alreadyReloaded) {
      // Already tried once — stop auto-recovery, show manual button
      setAutoRecovering(false);
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
      try { sessionStorage.setItem('orra_global_reload', '1'); } catch {}
      window.location.replace('/?_cb=' + Date.now());
    }, 6000);

    return () => {
      clearTimeout(reloadTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] antialiased">
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            {autoRecovering ? (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
                <p className="text-slate-400 text-sm mb-2">ORRA is recovering. Hang tight!</p>
                <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
                <p className="text-slate-600 text-xs mt-2">{countdown}s</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-slate-400 text-sm mb-4">ORRA hit a snag. Tap below to refresh.</p>
              </>
            )}
            <button
              onClick={() => {
                try { sessionStorage.removeItem('orra_global_reload'); } catch {}
                window.location.replace('/?_cb=' + Date.now());
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" /> Refresh ORRA
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
