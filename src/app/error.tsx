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

  // Check if this is a chunk/stale-cache error — if so, force reload immediately
  useEffect(() => {
    const msg = (error?.message || '').toLowerCase();
    const isChunkError = (
      msg.includes('chunk') ||
      msg.includes('loading') ||
      msg.includes('unexpected token') ||
      msg.includes('syntax') ||
      msg.includes('failed to fetch')
    );
    if (isChunkError) {
      console.warn('ORRA: Chunk/syntax error detected in error boundary, forcing cache-bust reload');
      window.location.replace('/?_cb=' + Date.now());
      return;
    }

    // Auto-retry after 3 seconds — most errors after a rebuild are transient
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
  }, [autoRetrying, reset, error]);

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
