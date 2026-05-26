'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { usePosts } from '@/lib/api-hooks';
import { X, Sparkles, TrendingUp, Flame, Star, Zap, Crown, Users, Calendar, Heart } from 'lucide-react';
import { useEffect } from 'react';

export function DailyDigest() {
  const { showDigest, dismissDigest, userSettings, auraTokens, auraLevel, dailyStreak } = useAuraStore();
  const currentUser = useCurrentUser();

  const { data: postsData } = usePosts();

  // Don't render if digest is disabled or already dismissed
  if (!showDigest) return null;
  if (!userSettings?.digestEnabled) return null;

  const firstName = (currentUser.name || 'User').split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Generate digest content from real data
  const totalPosts = postsData?.posts?.length || 0;
  const trendingVibe = ['Creative', 'Hype', 'Chill', 'Focused', 'Social'][new Date().getDay() % 5];

  // Daily ORRA tip
  const tips = [
    { text: 'Post a Pulse with a vibe tag to earn 2x ORRA tokens!', icon: Zap },
    { text: 'Join a Hub to unlock exclusive challenges and rewards.', icon: Users },
    { text: 'Check the Game Arena for today\'s featured game.', icon: Star },
    { text: 'Your Daily Streak builds your ORRA Level faster.', icon: Flame },
    { text: 'Echo a post to share it with your followers for bonus XP.', icon: TrendingUp },
    { text: 'Complete your profile setup to unlock the Founder badge.', icon: Crown },
    { text: 'Visit the ORRA Market for exclusive digital items.', icon: Sparkles },
  ];
  const todayTip = tips[new Date().getDate() % tips.length];
  const TipIcon = todayTip.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismissDigest} />
      <div className="relative glass-panel rounded-2xl w-full max-w-sm fade-in border border-violet-500/20 overflow-hidden">
        {/* Shimmer header */}
        <div className="relative bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-violet-600/30 p-5 overflow-hidden">
          {/* Animated shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
          <button onClick={dismissDigest} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Daily Dose</h2>
              <p className="text-xs text-slate-300">{today}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Greeting */}
          <div className="text-center">
            <p className="text-white font-semibold text-base">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}!</p>
            <p className="text-slate-400 text-xs mt-1">Here's your ORRA universe at a glance</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-violet-400" />
                <span className="text-sm font-bold text-white">{auraLevel}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">Level</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-sm font-bold text-white">{dailyStreak}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">Streak</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />
                <span className="text-sm font-bold text-white">{auraTokens.toLocaleString()}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">Tokens</p>
            </div>
          </div>

          {/* Trending Vibe */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Today's Vibe: {trendingVibe}</p>
              <p className="text-[10px] text-slate-400">{totalPosts} pulses in the universe</p>
            </div>
          </div>

          {/* Daily Tip */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600/20 to-orange-600/20 flex items-center justify-center flex-shrink-0">
              <TipIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Daily Tip</p>
              <p className="text-xs text-slate-300 mt-0.5">{todayTip.text}</p>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={dismissDigest}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all"
          >
            Let's Go
          </button>

          <p className="text-center text-[9px] text-slate-600">Shows once daily · Disable in Settings</p>
        </div>
      </div>
    </div>
  );
}

// Auto-show logic hook - call this in AuthenticatedApp
export function useDailyDigest() {
  const { userSettings, lastDigestDate, showDigest } = useAuraStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!userSettings?.digestEnabled) return;
    // Show digest once per day
    const today = new Date().toISOString().split('T')[0];
    if (lastDigestDate !== today && !showDigest) {
      // Delay 1.5 seconds after app loads for smooth UX
      const timer = setTimeout(() => {
        useAuraStore.setState({ showDigest: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userSettings?.digestEnabled, lastDigestDate, showDigest]);
}
