'use client';

import { useAuraStore } from '@/store/aura-store';
import { Zap, Coffee, Brain, Shield, X, Sparkles, Laugh, Drama, Newspaper, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const moods = [
  { id: 'hyped', label: 'Hyped / Energetic', description: 'High energy, ready to go', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', hoverBg: 'hover:bg-yellow-500/10' },
  { id: 'laughing', label: 'Laughing / Comedy', description: 'LOL mode, bring the memes', icon: Laugh, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', hoverBg: 'hover:bg-amber-500/10' },
  { id: 'chill', label: 'Chill / Relaxed', description: 'Easy vibes, take it slow', icon: Coffee, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', hoverBg: 'hover:bg-blue-500/10' },
  { id: 'dramatic', label: 'Extra / Dramatic', description: 'Main character energy', icon: Drama, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/30', hoverBg: 'hover:bg-fuchsia-500/10' },
  { id: 'focused', label: 'Focused / Learning', description: 'Deep work, stay productive', icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', hoverBg: 'hover:bg-emerald-500/10' },
  { id: 'peaceful', label: 'Anxious / Need Peace', description: 'Calm content, gentle vibes', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', hoverBg: 'hover:bg-purple-500/10' },
  { id: 'news', label: 'News / Politics', description: 'Stay informed, current events', icon: Newspaper, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', hoverBg: 'hover:bg-orange-500/10' },
  { id: 'sports', label: 'Sports / Athletics', description: 'Game day, highlight reels', icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', hoverBg: 'hover:bg-green-500/10' },
];

export function VibeCheckModal() {
  const { showVibeCheck, toggleVibeCheck, setVibe, currentVibe, selectedVibes, setSelectedVibes, toggleSelectedVibe } = useAuraStore();

  if (!showVibeCheck) return null;

  const handleToggleVibe = (vibeId: string) => {
    toggleSelectedVibe(vibeId);
    const mood = moods.find((m) => m.id === vibeId);
    const isSelected = (selectedVibes || []).includes(vibeId);
    if (isSelected) {
      toast.success(`Removed: ${mood?.label || vibeId}`);
    } else {
      toast.success(`Vibe set to: ${mood?.label || vibeId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={toggleVibeCheck} />
      <div className="relative glass-panel rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col fade-in border border-violet-500/20">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Drag handle for mobile */}
        <div className="sm:hidden flex justify-center mb-2 -mt-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <button onClick={toggleVibeCheck} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-3 sm:mb-6 flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mb-2 sm:mb-4 glow-violet">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Vibe Check</h2>
          <p className="text-xs sm:text-sm text-slate-400">We&apos;ll filter your feed to match your mood</p>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 overscroll-contain -mx-1 px-1">
          {moods.map((mood) => {
            const Icon = mood.icon;
            const isActive = (selectedVibes || []).includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => handleToggleVibe(mood.id)}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-xl transition-all ${
                  isActive
                    ? `${mood.bg} border ${mood.border}`
                    : `bg-white/5 border border-white/10 ${mood.hoverBg}`
                }`}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${mood.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${mood.color}`} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className={`font-semibold block text-sm sm:text-base ${isActive ? mood.color : 'text-white'}`}>
                    {mood.label}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500">{mood.description}</span>
                </div>
                {isActive && (
                  <div className={`w-5 h-5 rounded-full ${mood.bg} border ${mood.border} flex items-center justify-center flex-shrink-0`}>
                    <div className={`w-2 h-2 rounded-full ${mood.color.replace('text-', 'bg-')}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {(selectedVibes || []).length > 0 && (
          <div className="mt-3 sm:mt-4 text-center flex-shrink-0">
            <button
              onClick={() => { setSelectedVibes([]); toast.success('Vibe filter cleared'); }}
              className="text-xs text-slate-500 hover:text-white transition-all"
            >
              Clear vibe filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
