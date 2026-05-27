'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [status, setStatus] = useState<'recovering' | 'manual'>('recovering');
  const [attempt, setAttempt] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.warn('ORRA Page Error:', error?.message || error);
  }, [error]);

  // Try in-place recovery FIRST (using Next.js reset)
  useEffect(() => {
    const retryTimer = setTimeout(() => {
      try {
        reset();
      } catch (e) {
        console.warn('ORRA: reset() failed');
      }
    }, 1500);

    return () => clearTimeout(retryTimer);
  }, [error, reset]);

  // Persistent recovery loop — keeps trying until the server is back
  const checkAndRecover = useCallback(() => {
    setAttempt(prev => prev + 1);

    // Check if server is alive using health endpoint
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          // Server is alive! Reload the page
          window.location.replace('/?_cb=' + Date.now());
        } else {
          throw new Error('bad status');
        }
      })
      .catch(() => {
        // Server still down — schedule another retry
        setStatus('recovering');
        setCountdown(5);
      });
  }, []);

  // Countdown and auto-retry loop
  useEffect(() => {
    if (status !== 'recovering') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          checkAndRecover();
          return 5; // Reset for next attempt
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, checkAndRecover, attempt]); // Re-run when attempt changes

  // Also try recovery on visibility change (user switches back to tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        checkAndRecover();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkAndRecover]);

  // Also try on online event
  useEffect(() => {
    const handleOnline = () => {
      checkAndRecover();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [checkAndRecover]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        {status === 'recovering' ? (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
            <p className="text-slate-400 text-sm mb-2">ORRA is waking back up. Hang tight...</p>
            <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                style={{
                  animation: 'orra-err-pulse 2s ease-in-out infinite',
                }}
              />
            </div>
            <p className="text-slate-600 text-xs mt-2">
              {attempt > 0 ? `Attempt ${attempt} · retrying in ${countdown}s` : `Checking connection...`}
            </p>
            <style>{`
              @keyframes orra-err-pulse {
                0%, 100% { width: 20%; margin-left: 0; }
                50% { width: 80%; margin-left: 10%; }
              }
            `}</style>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-4">ORRA hit a snag. Tap below to refresh.</p>
          </>
        )}
        <button
          onClick={() => {
            window.location.replace('/?_cb=' + Date.now());
          }}
          className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center gap-2 mx-auto active:scale-95 transition-transform"
        >
          <RefreshCw className="w-4 h-4" /> Reload ORRA
        </button>
      </div>
    </div>
  );
}
