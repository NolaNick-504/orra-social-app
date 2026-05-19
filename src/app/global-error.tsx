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
  const [autoRetrying, setAutoRetrying] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.warn('ORRA Global Error:', error?.message || error);
  }, [error]);

  // Auto-retry after 3 seconds — most errors after a rebuild are transient
  useEffect(() => {
    if (!autoRetrying) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAutoRetrying(false);
          reset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRetrying, reset]);

  // If auto-retry is in progress, show a brief reconnecting overlay
  if (autoRetrying) {
    return (
      <html lang="en" className="dark">
        <body className="bg-[#050505] antialiased">
          <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
              <p className="text-slate-400 text-sm mb-2">ORRA is refreshing. Hang tight!</p>
              <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
              <p className="text-slate-600 text-xs mt-2">{countdown}s</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] antialiased">
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-1">ORRA encountered an error.</p>
            {error?.message && (
              <p className="text-slate-500 text-xs mb-4 font-mono truncate max-w-xs mx-auto">{error.message}</p>
            )}
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reload ORRA
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="text-slate-500 text-xs hover:text-white transition-colors"
              >
                Go to home page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
