import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm font-medium animate-pulse">Loading ORRA...</p>
          <p className="text-slate-600 text-xs mt-1">Echo &bull; Pulse &bull; Vibe</p>
        </div>
      </div>
    </div>
  );
}
