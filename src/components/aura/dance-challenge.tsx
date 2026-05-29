'use client';

import { pastChallenges } from '@/lib/data';
import { timeAgo } from '@/lib/utils';
import { Trophy, Medal, Heart, Play, Clock, ChevronDown, ChevronUp, Star, Crown, Award, Flame, Music, TrendingUp, TrendingDown, Minus, Zap, Film, Info, X, Share2, Check, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuraStore } from '@/store/aura-store';

// Types for API data
interface ApiChallenge {
  id: string;
  name: string;
  hashtag: string;
  song: string;
  description: string;
  bannerImage: string;
  timeRemaining: number;
  active: boolean;
  hasSubmitted: boolean;
  totalEntries: number;
  prize: string | null;
  secondPrize: string | null;
  thirdPrize: string | null;
}

interface ApiLeaderboardEntry {
  id: string;
  description: string;
  thumbnail: string;
  likesCount: number;
  rank: number;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
}

function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
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
  const s = seconds % 60;

  return (
    <div className="flex items-center gap-1.5">
      {[
        { val: h, label: 'HRS' },
        { val: m, label: 'MIN' },
        { val: s, label: 'SEC' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-b from-violet-600/20 to-fuchsia-600/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[52px] text-center border border-violet-500/20">
              <span className="text-xl md:text-3xl font-black text-white countdown-glow font-mono">
                {String(item.val).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[8px] text-slate-500 mt-1 tracking-widest font-medium">{item.label}</span>
          </div>
          {i < 2 && <span className="text-2xl font-black text-violet-400 mt-[-14px] animate-pulse">:</span>}
        </div>
      ))}
    </div>
  );
}

function PlaqueCard({ rank, user, likes, handle }: { rank: number; user: { name: string; avatar: string }; likes: number; handle: string }) {
  const config = {
    1: { plaqueClass: 'plaque-gold', glowClass: 'glow-gold', label: 'CHAMPION', icon: Crown, ringColor: 'ring-yellow-400', textColor: 'text-yellow-300', badgeBg: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30', size: 'md:scale-105', gradientFrom: 'from-yellow-900/20', gradientTo: 'to-yellow-600/10' },
    2: { plaqueClass: 'plaque-silver', glowClass: 'glow-silver', label: 'RUNNER-UP', icon: Medal, ringColor: 'ring-gray-300', textColor: 'text-gray-300', badgeBg: 'bg-gray-400/20', borderColor: 'border-gray-400/30', size: '', gradientFrom: 'from-gray-800/20', gradientTo: 'to-gray-500/10' },
    3: { plaqueClass: 'plaque-bronze', glowClass: 'glow-bronze', label: '3RD PLACE', icon: Award, ringColor: 'ring-amber-600', textColor: 'text-amber-500', badgeBg: 'bg-amber-600/20', borderColor: 'border-amber-600/30', size: '', gradientFrom: 'from-amber-900/20', gradientTo: 'to-amber-600/10' },
  }[rank];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`${config.plaqueClass} ${config.glowClass} rounded-2xl p-[3px] ${config.size}`}>
      <div className={`bg-gradient-to-b ${config.gradientFrom} ${config.gradientTo} rounded-[13px] p-1`}>
        <div className="bg-[#0a0a0a]/95 rounded-xl p-4 md:p-5 relative overflow-hidden">
          <div className={`absolute top-0 right-0 px-3 py-1.5 ${config.badgeBg} rounded-bl-xl`}>
            <span className={`text-[9px] font-black ${config.textColor} tracking-[0.2em]`}>PLAQUE</span>
          </div>
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${config.badgeBg} blur-2xl opacity-30`} />
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-9 h-9 rounded-xl ${config.badgeBg} border ${config.borderColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <span className={`text-xs font-black ${config.textColor} tracking-[0.15em]`}>{config.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-3 ${config.ringColor} flex-shrink-0`}>
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base md:text-lg truncate">{user.name}</p>
              <p className="text-xs text-slate-400 mb-2">{handle}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-red-400">
                  <Heart className="w-4 h-4 fill-red-400" />
                  <span className="text-sm font-bold">{likes.toLocaleString()}</span>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full ${config.badgeBg} ${config.borderColor} border text-[10px] font-black ${config.textColor}`}>
                  #{rank}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DanceChallenge() {
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'entries' | 'past' | 'my'>('leaderboard');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitText, setSubmitText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // API data state
  const [challenge, setChallenge] = useState<ApiChallenge | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<ApiLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState<string | null>(null);

  const { votedEntries, voteEntry, danceEntries: userEntries, submitDanceEntry, auraTokens } = useAuraStore();

  // Fetch challenge + leaderboard from API
  const fetchChallengeData = useCallback(async () => {
    try {
      const res = await fetch('/api/dance');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      if (json.success && json.data) {
        setChallenge(json.data.challenge);
        setLeaderboardData(json.data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch dance challenge:', err);
      toast.error('Failed to load dance challenge', { duration: 1500 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallengeData();
  }, [fetchChallengeData]);

  const handleVote = async (entryId: string) => {
    if (isVoting) return;

    // Optimistic UI: immediately add to votedEntries
    const wasVoted = votedEntries.has(entryId);

    // Only call API if not already voted (API enforces one-vote-per-entry)
    if (!wasVoted) {
      setIsVoting(entryId);
      try {
        const res = await fetch('/api/dance/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId }),
        });
        const json = await res.json();
        if (json.success) {
          voteEntry(entryId);
          toast.success('Voted! +1 ORRA +2 XP', { duration: 1500 });
        } else {
          toast.error(json.error || 'Failed to vote', { duration: 1500 });
        }
      } catch (err) {
        console.error('Vote failed:', err);
        toast.error('Failed to vote', { duration: 1500 });
      } finally {
        setIsVoting(null);
      }
    } else {
      toast.info('You already voted for this entry', { duration: 1500 });
    }
  };

  const handleSubmitEntry = async () => {
    if (!submitText.trim()) {
      toast.error('Please describe your dance entry');
      return;
    }
    if (!challenge) {
      toast.error('No active challenge');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dance/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: submitText.trim(),
          challengeId: challenge.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Also update local store for the "My Entries" tab (without double-awarding tokens)
        const tokensAwarded = json.tokensAwarded || 0;
        const xpAwarded = json.xpAwarded || 0;
        if (tokensAwarded > 0) {
          useAuraStore.getState().earnTokens(tokensAwarded, 'Dance entry submitted');
        }
        submitDanceEntry(submitText.trim());
        toast.success(`Entry submitted! +${tokensAwarded} ORRA +${xpAwarded} XP`, { duration: 1500 });
        setSubmitText('');
        setShowSubmitModal(false);
        setActiveTab('my');
        // Refresh data to show updated leaderboard
        fetchChallengeData();
      } else {
        toast.error(json.error || 'Failed to submit entry', { duration: 1500 });
      }
    } catch (err) {
      console.error('Submit failed:', err);
      toast.error('Failed to submit entry', { duration: 1500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareChallenge = () => {
    const hashtag = challenge?.hashtag || '#OrraDanceOff2027';
    navigator.clipboard.writeText(`${hashtag} - Join the ORRA DANCE OFF 2027!`);
    toast.success('Challenge link copied!');
  };

  const handlePlayTrack = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 5000);
    const song = challenge?.song || 'Neon Dreams - DJ Prism ft. Luna';
    toast.success(`Now playing: ${song}`, { duration: 1500 });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fade-in flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading dance challenge...</p>
        </div>
      </div>
    );
  }

  // No active challenge
  if (!challenge) {
    return (
      <div className="fade-in flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <Trophy className="w-12 h-12 text-slate-600" />
          <p className="text-lg font-bold text-white">No Active Challenge</p>
          <p className="text-sm text-slate-400">Check back later for the next dance challenge!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden h-48 md:h-72">
        <img src={challenge.bannerImage} alt="Dance Challenge Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-2 h-2 bg-violet-400/60 rounded-full top-1/4 left-1/4 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-1.5 h-1.5 bg-fuchsia-400/60 rounded-full top-1/3 right-1/3 animate-ping" style={{ animationDuration: '4s' }} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">ORRA Dance Challenge</span>
            {challenge.active && <span className="px-2 py-0.5 rounded-full bg-red-600/80 text-white text-[10px] font-bold animate-pulse">LIVE</span>}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-1 leading-tight">
            {challenge.name.includes('OFF') ? (
              <>
                {challenge.name.split('OFF')[0]}<span className="gradient-text">OFF {challenge.name.split('OFF')[1]}</span>
              </>
            ) : (
              <span className="gradient-text">{challenge.name}</span>
            )}
          </h1>
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <span className="gradient-text font-bold">{challenge.hashtag}</span>
            <span className="text-slate-500">|</span>
            <span>{challenge.totalEntries.toLocaleString()} entries and counting</span>
          </p>
        </div>
      </div>

      {/* Challenge Info Card */}
      <div className="glass-panel rounded-2xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{challenge.song}</p>
                <p className="text-xs text-slate-400">Official Challenge Track</p>
              </div>
              <button
                onClick={handlePlayTrack}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isPlaying ? 'bg-violet-600 glow-violet' : 'bg-violet-600/20 hover:bg-violet-600/40'}`}
              >
                {isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : (
                  <Play className="w-5 h-5 text-violet-400 ml-0.5" />
                )}
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">{challenge.description}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <Crown className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-yellow-300">1st Place</p>
                <p className="text-[9px] text-yellow-400/70">{challenge.prize || '100K ORRA + Plaque'}</p>
              </div>
              <div className="p-2 rounded-xl bg-gray-400/10 border border-gray-400/20 text-center">
                <Medal className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-300">2nd Place</p>
                <p className="text-[9px] text-gray-400/70">{challenge.secondPrize || '50K ORRA + Plaque'}</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-600/10 border border-amber-600/20 text-center">
                <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-amber-500">3rd Place</p>
                <p className="text-[9px] text-amber-500/70">{challenge.thirdPrize || '25K ORRA + Plaque'}</p>
              </div>
            </div>
          </div>

          {/* Countdown & Submit */}
          <div className="flex flex-col items-center gap-3 md:min-w-[220px]">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">Time Remaining</span>
            </div>
            <CountdownTimer initialSeconds={challenge.timeRemaining} />
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={challenge.hasSubmitted}
              className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition-all glow-violet flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Flame className="w-5 h-5" />
              {challenge.hasSubmitted ? 'Already Submitted' : 'Submit Your Entry'}
            </button>
            <div className="flex items-center gap-3">
              <button onClick={handleShareChallenge} className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-all">
                <Share2 className="w-3 h-3" /> Share
              </button>
              <span className="text-[10px] text-slate-500">Rank by most likes. Top 3 win plaques!</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Zap className="w-3 h-3" />
              <span>Your votes: {votedEntries.size} | Earned: +{votedEntries.size * 1} ORRA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {[
          { key: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
          { key: 'entries' as const, label: 'Recent Entries', icon: Film },
          { key: 'past' as const, label: 'Past Winners', icon: Award },
          { key: 'my' as const, label: 'My Entries', icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="glass-panel rounded-2xl p-4 md:p-6 fade-in">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Leaderboard</h2>
            {challenge.active && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold animate-pulse">LIVE</span>}
          </div>
          {leaderboardData.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No entries yet</p>
              <p className="text-xs text-slate-600 mt-1">Be the first to submit your dance entry!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {leaderboardData.slice(0, 3).map((entry) => (
                  <PlaqueCard
                    key={entry.id}
                    rank={entry.rank}
                    user={{ name: entry.author.name, avatar: entry.author.avatar }}
                    likes={entry.likesCount + (votedEntries.has(entry.id) ? 1 : 0)}
                    handle={entry.author.handle}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                {leaderboardData.slice(3).map((entry) => {
                  const ChangeIcon = Minus;
                  const changeColor = 'text-slate-500';
                  const isVoted = votedEntries.has(entry.id);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
                      <span className="w-8 text-center font-bold text-slate-500 text-sm">#{entry.rank}</span>
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
                        <img src={entry.author.avatar} alt={entry.author.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{entry.author.name}</p>
                        <p className="text-xs text-slate-500">{entry.author.handle}</p>
                      </div>
                      <ChangeIcon className={`w-3.5 h-3.5 ${changeColor}`} />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVote(entry.id); }}
                        disabled={isVoting !== null}
                        className="flex items-center gap-1 min-w-[70px] justify-end"
                      >
                        {isVoting === entry.id ? (
                          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                        ) : (
                          <>
                            <Heart className={`w-3.5 h-3.5 ${isVoted ? 'fill-red-400 text-red-400' : 'text-red-400'}`} />
                            <span className="text-xs font-bold text-red-400">{(entry.likesCount + (isVoted ? 1 : 0)).toLocaleString()}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Recent Entries */}
      {activeTab === 'entries' && (
        <div className="glass-panel rounded-2xl p-4 md:p-6 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Recent Entries</h2>
          </div>
          {leaderboardData.length === 0 ? (
            <div className="text-center py-8">
              <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No entries yet</p>
              <p className="text-xs text-slate-600 mt-1">Submit your dance entry to get featured here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {leaderboardData.map((entry) => {
                const isVoted = votedEntries.has(entry.id);
                return (
                  <div key={entry.id} className="relative rounded-xl overflow-hidden aspect-[9/16] group cursor-pointer glass-card">
                    {entry.thumbnail ? (
                      <img src={entry.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-violet-900/40 to-fuchsia-900/40 flex items-center justify-center">
                        <Music className="w-8 h-8 text-violet-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/20">
                          <img src={entry.author.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] font-bold text-white truncate">{entry.author.name}</p>
                      </div>
                      <p className="text-[9px] text-slate-300 line-clamp-1 mb-1">{entry.description}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVote(entry.id); }}
                        disabled={isVoting !== null}
                        className="flex items-center gap-1"
                      >
                        {isVoting === entry.id ? (
                          <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                        ) : (
                          <>
                            <Heart className={`w-3 h-3 ${isVoted ? 'fill-red-400 text-red-400' : 'text-red-300'}`} />
                            <span className="text-[9px] text-red-300">{(entry.likesCount + (isVoted ? 1 : 0)).toLocaleString()}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Past Winners */}
      {activeTab === 'past' && (
        <div className="fade-in space-y-3">
          {pastChallenges.map((challenge, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 hover:border-yellow-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-yellow-500/50 flex-shrink-0">
                  <img src={challenge.winner.avatar} alt={challenge.winner.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <p className="font-bold text-white">{challenge.name}</p>
                  </div>
                  <p className="text-sm text-slate-300">Winner: {challenge.winner.name}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{challenge.likes.toLocaleString()} likes</span>
                    <span>{challenge.entries.toLocaleString()} entries</span>
                    <span>{challenge.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Entries */}
      {activeTab === 'my' && (
        <div className="glass-panel rounded-2xl p-4 md:p-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">My Entries</h2>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={challenge.hasSubmitted}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" /> New Entry
            </button>
          </div>
          {userEntries.length > 0 ? (
            <div className="space-y-3">
              {userEntries.map((entry) => (
                <div key={entry.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-200">{entry.text}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{timeAgo(entry.createdAt)}</span>
                    <span className="text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3" />+5 ORRA earned</span>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Submitted</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Flame className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No entries yet</p>
              <p className="text-xs text-slate-600 mt-1">Submit your first dance entry to earn 5 ORRA tokens!</p>
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={challenge.hasSubmitted}
                className="mt-3 px-4 py-2 rounded-lg bg-violet-600/20 text-violet-400 text-xs font-semibold hover:bg-violet-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Entry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Challenge Rules */}
      <div className="glass-panel rounded-2xl p-4 md:p-6">
        <button onClick={() => setShowRules(!showRules)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Challenge Rules</h2>
          </div>
          {showRules ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {showRules && (
          <div className="mt-4 space-y-3 text-sm text-slate-300 fade-in">
            <div className="grid gap-3">
              {[
                { num: '1', text: `Record your dance video using the official challenge track "${challenge.song}"` },
                { num: '2', text: `Tag your entry with ${challenge.hashtag} to be eligible for the leaderboard` },
                { num: '3', text: 'Video must be between 15-60 seconds — keep it tight and impactful' },
                { num: '4', text: 'Entries are ranked by community likes — share your entry to climb the leaderboard' },
                { num: '5', text: `1st Place: ${challenge.prize || '100,000 ORRA tokens + Champion Plaque'}. 2nd Place: ${challenge.secondPrize || '50,000 ORRA + Runner-Up Plaque'}. 3rd Place: ${challenge.thirdPrize || '25,000 ORRA + 3rd Place Plaque'}` },
                { num: '6', text: 'Top 3 entries will be featured on the ORRA homepage for 7 days' },
                { num: '7', text: 'The challenge runs for exactly 72 hours — once the timer hits zero, rankings are final' },
                { num: '8', text: 'No inappropriate content — keep it fun, respectful, and creative!' },
              ].map((rule) => (
                <div key={rule.num} className="flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {rule.num}
                  </span>
                  <p className="leading-relaxed">{rule.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Entry Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => !isSubmitting && setShowSubmitModal(false)} />
          <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-violet-500/20">
            <button onClick={() => !isSubmitting && setShowSubmitModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white disabled:opacity-50" disabled={isSubmitting}>
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-fuchsia-400" />
              <h2 className="text-xl font-bold text-white">Submit Your Entry</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">Describe your dance entry and share your video link to join the challenge! Earn 5 ORRA tokens + 10 XP per submission.</p>
            <textarea
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              placeholder="Describe your dance moves and paste your video link..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none min-h-[120px] leading-relaxed"
              disabled={isSubmitting}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEntry}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all glow-violet flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Submit +5 ORRA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}
