'use client';

import { useEffect } from 'react';

// Root not-found page — redirect to home so the user isn't stuck on a 404.
// Uses replace() to avoid adding the 404 URL to browser history.
export default function RootNotFound() {
  useEffect(() => {
    // Only redirect once per session to prevent loops
    try {
      if (sessionStorage.getItem('orra_404_redirect') === '1') {
        console.warn('ORRA: Already redirected from 404, stopping loop');
        return;
      }
      sessionStorage.setItem('orra_404_redirect', '1');
    } catch {}
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
