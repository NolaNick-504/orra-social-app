'use client';

import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { trending } from '@/lib/data';
import { useCurrentUser } from '@/lib/use-current-user';
import { useNotifications } from '@/lib/api-hooks';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, UserPlus, Flame, Clock, Zap, Coins, Star, Target, Sparkles, Leaf, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

function MiniCountdown({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return (
    <span className="text-violet-400 font-mono text-xs">{String(h).padStart(2, '0')}h {String(m).padStart(2, '0')}m</span>
  );
}

export function RightSidebar() {
  const { setView, followedUsers, toggleFollow, userPosts, customNotifications, auraTokens, auraLevel, auraXP, joinedHubs, dailyStreak, setViewingUser } = useAuraStore();
  const currentUser = useCurrentUser();

  const { data: notifData } = useNotifications();

  const displayName = currentUser.name;
  const displayAvatar = currentUser.avatar;
  const displayHandle = currentUser.handle;
  const totalPosts = currentUser.posts + userPosts.length;
  // Combine API + local notification counts for the sidebar
  const apiUnreadCount = notifData?.unreadCount || 0;
  const localUnreadCount = customNotifications.filter((n) => !n.read).length;
  const unreadNotifs = apiUnreadCount + localUnreadCount;

  // Fetch suggested users from the API instead of using static data
  const { data: suggestedUsersData } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data as Array<{ id: string; name: string; handle: string; avatar: string; verified: boolean; auraLevel: number }>;
    },
    staleTime: 1000 * 60, // 1 minute
  });
  const suggestedUsers = (suggestedUsersData || []).filter((u) => !followedUsers.has(u.id)).slice(0, 5);

  // Fetch active dance challenge from the API
  const { data: danceData } = useQuery({
    queryKey: ['dance-challenge-sidebar'],
    queryFn: async () => {
      const res = await fetch('/api/dance');
      const data = await res.json();
      if (!data.success) return null;
      return data.data as { challenge: { name: string; hashtag: string; entries: number; timeRemaining: number; prize?: string } } | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  const danceChallengeInfo = danceData?.challenge;

  // Recent achievements (last 3 token/level notifications)
  const recentAchievements = customNotifications
    .filter((n) => n.type === 'token' || n.type === 'levelup' || n.type === 'hub')
    .slice(0, 3);

  // Token earning tips
  const tokenTips = [
    { action: 'Like a post', reward: '+1 ORRA' },
    { action: 'Comment', reward: '+2 ORRA' },
    { action: 'Create post', reward: '+5 ORRA' },
    { action: 'Join a hub', reward: '+5 ORRA' },
    { action: 'Submit dance entry', reward: '+5 ORRA' },
  ];

  return (
    <aside className="hidden xl:flex flex-col w-80 h-screen fixed right-0 top-0 z-40 overflow-y-auto no-scrollbar">
      <div className="p-4 space-y-4 pt-4">

        {/* My ORRA Sphere */}
        <div className="p-4 rounded-2xl glass-panel">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">My ORRA Sphere</h3>
          <div className="flex flex-col items-center">
            <button
              onClick={() => { setViewingUser(null); setView('profile'); }}
              className="relative w-24 h-24 mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="absolute inset-0 aura-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.6)]" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              </div>
              <div className="absolute inset-3 rounded-full overflow-hidden ring-2 ring-violet-500/50">
                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              </div>
            </button>
            <button
              onClick={() => { setViewingUser(null); setView('profile'); }}
              className="font-bold text-white hover:text-violet-300 transition-colors"
            >
              {displayName}
            </button>
            <p className="text-xs text-slate-400 mb-3">{displayHandle}</p>

            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              <div className="text-center p-2 rounded-xl bg-violet-600/10 border border-violet-500/20">
                <p className="font-bold text-violet-400 text-sm">Lvl {auraLevel}</p>
                <p className="text-[10px] text-slate-500">Level</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-fuchsia-600/10 border border-fuchsia-500/20">
                <p className="font-bold text-fuchsia-400 text-sm">{auraTokens.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">ORRA</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="w-full">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>XP Progress</span>
                <span>{auraXP}/1000</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-700"
                  style={{ width: `${(auraXP / 1000) * 100}%` }}
                />
              </div>
            </div>

            {/* Daily Streak */}
            <div className="w-full mt-3 p-2 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-300">{dailyStreak} Day Streak</p>
                <p className="text-[9px] text-amber-400/60">Keep it going!</p>
              </div>
            </div>

            {/* Hub Count */}
            {joinedHubs.size > 0 && (
              <div className="w-full mt-2 p-2 rounded-xl bg-fuchsia-600/10 border border-fuchsia-500/20 flex items-center gap-2">
                <Target className="w-4 h-4 text-fuchsia-400" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-fuchsia-300">{joinedHubs.size} Hubs Joined</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="p-4 rounded-2xl glass-panel">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent</h3>
            </div>
            <div className="space-y-2">
              {recentAchievements.map((n) => (
                <div key={n.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <Coins className={`w-3.5 h-3.5 ${n.type === 'levelup' ? 'text-fuchsia-400' : 'text-yellow-400'}`} />
                  <p className="text-xs text-slate-300 truncate">{n.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Dance Challenge */}
        <div className="p-4 rounded-2xl glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Challenge</h3>
          </div>
          {danceChallengeInfo ? (
            <button
              onClick={() => setView('dance')}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border border-violet-500/20 hover:border-violet-500/40 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-fuchsia-400 group-hover:animate-pulse" />
                <p className="text-sm font-bold text-white">{danceChallengeInfo.name}</p>
              </div>
              <p className="text-xs text-slate-400 mb-2">{danceChallengeInfo.hashtag}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{danceChallengeInfo.entries?.toLocaleString() || 0} entries</span>
                <MiniCountdown initialSeconds={danceChallengeInfo.timeRemaining || 0} />
              </div>
            </button>
          ) : (
            <p className="text-xs text-slate-500 text-center py-2">No active challenge</p>
          )}
        </div>

        {/* Trending */}
        <div className="p-4 rounded-2xl glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trending</h3>
          </div>
          <div className="space-y-3">
            {trending.map((item, i) => (
              <div key={i} className="flex items-start gap-2 cursor-pointer hover:bg-white/5 rounded-lg p-1.5 -m-1.5 transition-all group">
                <span className="text-xs font-bold text-slate-500 mt-0.5 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">{item.tag}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{item.posts}</span>
                    <span className="text-slate-600">|</span>
                    <span>{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who to Follow */}
        <div className="p-4 rounded-2xl glass-panel">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Who to Follow</h3>
          {suggestedUsers.length > 0 ? (
            <div className="space-y-3">
              {suggestedUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <button
                    onClick={() => { setViewingUser(user.id); setView('profile'); }}
                    className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10 aura-glow-ring level-bronze hover:opacity-80 transition-opacity flex-shrink-0"
                  >
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setViewingUser(user.id); setView('profile'); }}
                        className="text-sm font-semibold text-white truncate hover:text-violet-300 transition-colors"
                      >
                        {user.name}
                      </button>
                      {user.verified && (
                        <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.handle}</p>
                  </div>
                  <button
                    onClick={() => { toggleFollow(user.id); fetch('/api/follows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }).catch(() => {}); toast.success(`Following ${user.name}`); }}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-2">You follow everyone suggested!</p>
          )}
        </div>

        {/* Prism AI Quick Access */}
        <div className="p-4 rounded-2xl glass-panel border border-violet-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prism AI</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">Your AI companion — chat, remix, vibe.</p>
          <button
            onClick={() => useAuraStore.setState({ prismCompanionOpen: true })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold hover:from-violet-600/40 hover:to-fuchsia-600/40 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open Prism AI
          </button>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => useAuraStore.setState({ prismCompanionOpen: true, prismCompanionMode: 'companion' })}
              className="flex-1 px-2 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-medium hover:bg-violet-500/20 transition-all"
            >
              Chat
            </button>
            <button
              onClick={() => useAuraStore.setState({ prismCompanionOpen: true, prismCompanionMode: 'remix' })}
              className="flex-1 px-2 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-medium hover:bg-fuchsia-500/20 transition-all"
            >
              Remix
            </button>
            <button
              onClick={() => useAuraStore.setState({ prismCompanionOpen: true, prismCompanionMode: 'coach' })}
              className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-all"
            >
              Coach
            </button>
          </div>
        </div>

        {/* Quick Nav: Wellness & Market */}
        <div className="p-4 rounded-2xl glass-panel">
          <div className="space-y-2">
            <button
              onClick={() => setView('wellness')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/15 transition-all"
            >
              <Leaf className="w-4 h-4" />
              Wellness Dashboard
            </button>
            <button
              onClick={() => setView('marketplace')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/15 transition-all"
            >
              <Coins className="w-4 h-4" />
              ORRA Market
            </button>
            <button
              onClick={() => setView('settings')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/15 transition-all"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Token Earning Tips */}
        <div className="p-4 rounded-2xl glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Earn ORRA</h3>
          </div>
          <div className="space-y-2">
            {tokenTips.map((tip, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{tip.action}</span>
                <span className="text-yellow-400 font-bold">{tip.reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-600 py-2">
          <p>ORRA 2027 • The Conscious Social Ecosystem</p>
          <p className="text-violet-500/50 mt-0.5">Echo • Pulse • Vibe • Glow</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span>Terms</span>
            <span>Privacy</span>
            <span>About</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
