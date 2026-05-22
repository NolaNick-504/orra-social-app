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
  const [autoRetrying, setAutoRetrying] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.warn('ORRA Page Error:', error?.message || error);
  }, [error]);

  // ALWAYS force a cache-bust reload on any error — stale chunks after rebuild
  // cause cascading failures that reset() can't fix. Only a full reload with
  // a fresh HTML page (which references the new chunk filenames) works.
  useEffect(() => {
    console.warn('ORRA Page Error:', error?.message || error);
    // Force a cache-bust reload after a short delay so the user sees the message
    const timer = setTimeout(() => {
      window.location.replace('/?_cb=' + Date.now());
    }, 2000);
    return () => clearTimeout(timer);
  }, [error]);

  // If auto-retry is in progress, show a brief reconnecting overlay
  if (autoRetrying) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-4">ORRA hit a snag. Your data is safe — just reload.</p>
        <button
          onClick={() => {
            window.location.replace('/?_cb=' + Date.now());
          }}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Reload ORRA
        </button>
      </div>
    </div>
  );
}
