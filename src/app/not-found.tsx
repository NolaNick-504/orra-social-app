'use client';

import { useEffect } from 'react';

// Root not-found page — ultimate safety net.
// If the user lands on a path that Next.js can't resolve, redirect to home.
// This should almost never happen because the middleware rewrites all paths to /.
export default function RootNotFound() {
  useEffect(() => {
    // Redirect to home with cache-bust to ensure fresh HTML
    window.location.replace('/?_cb=' + Date.now());
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
          <span className="text-2xl font-bold text-white">O</span>
        </div>
        <p className="text-slate-400 text-sm">Redirecting to ORRA...</p>
      </div>
    </div>
  );
}
