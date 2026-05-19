'use client';

import Link from 'next/link';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* ORRA Logo Mark */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 mb-6 relative">
          <Sparkles className="w-10 h-10 text-violet-400" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 animate-pulse" />
        </div>

        {/* 404 Number */}
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-3">
          404
        </h1>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2">Lost in the Aura</h2>

        {/* Description */}
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          This page doesn&apos;t exist or has been moved.
          <br />
          Let&apos;s get you back to the vibes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
          >
            <Home className="w-4 h-4" /> Back to ORRA
          </Link>
          <button
            onClick={() => typeof window !== 'undefined' && window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>

        {/* ORRA Tagline */}
        <p className="text-[10px] text-slate-600 mt-8">
          ORRA &bull; The Conscious Social Ecosystem
        </p>
      </div>
    </div>
  );
}
