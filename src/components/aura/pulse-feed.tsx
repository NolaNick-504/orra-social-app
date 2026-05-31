'use client';

import React from 'react';

import { useAuraStore } from '@/store/aura-store';
import { useInfinitePosts, useCreatePost, useToggleLike, useToggleSave, useToggleRepost, useVotePoll, useCreateComment, useComments } from '@/lib/api-hooks';
import { resolveImageUrl, timeAgo } from '@/lib/utils';
import { vibeLabels } from '@/lib/data';
import { useCurrentUser } from '@/lib/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Bookmark, Plus, Image as ImageIcon, Video, MoreHorizontal, BadgeCheck, Repeat2, BarChart3, Play, Send, X, Trash2, Zap, Waves, Sparkles, Radio, Trophy, CheckCircle2, Eye, Clock, MonitorUp, Users, Megaphone, ExternalLink, Star, Mic, Pause, Volume2 } from 'lucide-react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { ImageLightbox } from '@/components/aura/image-lightbox';

// Reaction Orb Component - REMOVED: no more color orbs on like

// Image Carousel for posts with multiple images
function PostImageCarousel({ images, maxH = 'max-h-[400px]', imgIconSize = 'w-8 h-8', onImageClick }: { images: string[]; maxH?: string; imgIconSize?: string; onImageClick?: (index: number) => void }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    onSelect();
    return () => { api.off('select', onSelect); };
  }, [api]);

  return (
    <div className="relative">
      <Carousel setApi={setApi} opts={{ loop: false, dragFree: false }} className="w-full">
        <CarouselContent className="-ml-0">
          {images.map((img, i) => (
            <CarouselItem key={i} className="pl-0">
              <div className={`relative overflow-hidden group cursor-pointer ${maxH}`} onClick={() => onImageClick?.(i)}>
                <img
                  src={resolveImageUrl(img)}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                <div
                  className="w-full h-full bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 items-center justify-center absolute inset-0"
                  style={{ display: 'none' }}
                >
                  <ImageIcon className={`${imgIconSize} text-violet-400/50`} />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {images.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-4 h-1.5 bg-violet-400'
                  : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
              }`
            }
          />
        ))}
      </div>
    )}
  </div>
  );
}

// Mood Wave Bar - community mood visualization with multi-select
function MoodWaveBar({ currentVibe }: { currentVibe: string | null }) {
  const { selectedVibes, toggleSelectedVibe } = useAuraStore();
  const moods = [
    { key: 'hyped', label: 'Hyped', color: 'bg-red-500', width: 35 },
    { key: 'laughing', label: 'Laughing', color: 'bg-amber-400', width: 20 },
    { key: 'chill', label: 'Chill', color: 'bg-emerald-500', width: 25 },
    { key: 'dramatic', label: 'Dramatic', color: 'bg-fuchsia-500', width: 10 },
    { key: 'focused', label: 'Focused', color: 'bg-blue-500', width: 15 },
    { key: 'peaceful', label: 'Peaceful', color: 'bg-cyan-500', width: 8 },
    { key: 'news', label: 'News/Politics', color: 'bg-orange-500', width: 12 },
    { key: 'sports', label: 'Sports', color: 'bg-green-500', width: 18 },
  ];

  const activeVibes = selectedVibes.length > 0 ? selectedVibes : [];

  return (
    <div className="glass-panel rounded-2xl p-3 space-y-2 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Community Vibe</span>
        </div>
        <span className="text-[10px] text-violet-400 font-medium">LIVE</span>
      </div>
      {/* Animated gradient bar */}
      <div className="mood-wave-bar h-2 rounded-full overflow-hidden" />
      {/* Mood segments - wrap on mobile, multi-select */}
      <div className="flex flex-wrap gap-1">
        {moods.map((mood) => {
          const isActive = activeVibes.includes(mood.key);
          return (
            <button
              key={mood.key}
              onClick={() => toggleSelectedVibe(mood.key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap ${
                isActive
                  ? `${mood.color} text-white shadow-lg scale-105`
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : mood.color}`} />
              {mood.label}
            </button>
          );
        })}
      </div>
      {/* Show selected vibes as filter */}
      {activeVibes.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-slate-500">Filtering:</span>
          {activeVibes.map((v) => {
            const mood = moods.find((m) => m.key === v);
            return (
              <span key={v} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                {mood?.label || v}
              </span>
            );
          })}
          <button
            onClick={() => useAuraStore.getState().setSelectedVibes([])}
            className="text-[10px] text-slate-500 hover:text-white transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// Live Banner — prominent banner on feed that opens the full Live feed
interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likesCount: number;
  isLive: boolean;
  viewerCount: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
}

function LiveBanner() {
  const { setView } = useAuraStore();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatIdx, setChatIdx] = useState(0);

  const SIMULATED_CHAT = [
    { user: 'Tasha', color: 'text-pink-400', text: 'Yooo this is fire!! 🔥🔥' },
    { user: 'Marcus', color: 'text-blue-400', text: 'Letss gooo 💪' },
    { user: 'Aaliyah', color: 'text-emerald-400', text: 'W stream!! 💜' },
    { user: 'Chris', color: 'text-amber-400', text: 'Vibes are immaculate ✨' },
    { user: 'Destiny', color: 'text-fuchsia-400', text: 'ORRA fam in the building 💯' },
    { user: 'Jay', color: 'text-red-400', text: 'Can not miss this!! 🎶' },
    { user: 'Nina', color: 'text-cyan-400', text: 'First time here!! 🙌' },
    { user: 'Deon', color: 'text-orange-400', text: 'This whole stream hits different 💯' },
    { user: 'Kiara', color: 'text-violet-400', text: 'Wish I could be there live 😭' },
    { user: 'Trey', color: 'text-teal-400', text: 'Who else is watching from NOLA?? 🎷' },
  ];

  // Fetch live streams from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/livestreams');
        const data = await res.json();
        if (!cancelled && data.success) {
          setLiveStreams(data.data || []);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Rotate simulated chat messages — faster like a real live chat
  useEffect(() => {
    const interval = setInterval(() => {
      setChatIdx((prev) => (prev + 1) % SIMULATED_CHAT.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Don't render while loading to avoid flash
  if (isLoading) return null;

  const streamCount = liveStreams.length;
  const topStream = streamCount > 0 ? liveStreams[0] : null;

  return (
    <button
      onClick={() => setView('live')}
      className="w-full rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border border-red-500/30 hover:border-red-500/50 transition-all group live-card-glow card-3d relative"
    >
      {topStream ? (
        // Active live streams — show preview with stream count
        <div className="relative h-44 md:h-52">
          {/* Background - use thumbnail or live-banner.jpg fallback */}
          {topStream.thumbnail ? (
            <img
              src={resolveImageUrl(topStream.thumbnail)}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to live-banner.jpg if the thumbnail doesn't load
                const img = e.currentTarget;
                if (!img.dataset.retried) {
                  img.dataset.retried = '1';
                  img.src = '/images/live-banner.jpg';
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-950/60 via-black/80 to-violet-950/60">
              <img src="/images/live-banner.jpg" alt="" className="w-full h-full object-cover opacity-60" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          {/* Live badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
            <div className="live-badge-pulse flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">LIVE</span>
            </div>
            {streamCount > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                <Users className="w-3 h-3 text-white/70" />
                <span className="text-white text-[10px] font-medium">{streamCount} streams</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              <Eye className="w-3 h-3 text-white/70" />
              <span className="text-white text-[10px] font-medium tabular-nums">{topStream.viewerCount}</span>
            </div>
          </div>

          {/* Simulated live chat overlay — looks like real live comments */}
          <div className="absolute bottom-16 left-3 w-48 z-10 space-y-1 pointer-events-none">
            {SIMULATED_CHAT.slice(chatIdx, chatIdx + 3).map((msg, i) => (
              <div
                key={`${chatIdx}-${i}`}
                className="chat-overlay-glass rounded-lg px-2 py-1 flex items-center gap-1.5"
                style={{ opacity: 1 - i * 0.25, animation: `fade-in 0.3s ease-out` }}
              >
                <span className={`text-[9px] font-bold ${msg.color} whitespace-nowrap`}>{msg.user}</span>
                <span className="text-[9px] text-white/90 truncate">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Streamer info + action */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative flex-shrink-0 cosmic-avatar-glow">
                <img
                  src={resolveImageUrl(topStream.creator.avatar)}
                  alt={topStream.creator.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500/40"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white truncate neon-text-red">{topStream.creator.name}</span>
                  {topStream.creator.verified && (
                    <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-white/60 truncate">{topStream.title || 'Live now'}</p>
              </div>
            </div>
            <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold group-hover:opacity-90 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              Watch Live
            </div>
          </div>

          {/* Multiple stream avatars stacked on right */}
          {streamCount > 1 && (
            <div className="absolute top-3 right-3 z-10 flex -space-x-2">
              {liveStreams.slice(0, 4).map((s, i) => (
                <div key={s.id} className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-black/60" style={{ zIndex: 10 - i }}>
                  <img src={resolveImageUrl(s.creator.avatar)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {streamCount > 4 && (
                <div className="w-8 h-8 rounded-full bg-black/60 ring-2 ring-black/60 flex items-center justify-center text-[8px] font-bold text-white">
                  +{streamCount - 4}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // No active streams — Go Live promo banner with background image
        <div className="relative p-4 overflow-hidden">
          <img src="/images/live-banner.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
          <div className="relative flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-red-600 to-fuchsia-600 cosmic-avatar-glow">
              <MonitorUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Go Live</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[9px] font-bold">NEW</span>
              </div>
              <p className="text-sm font-bold text-white neon-text-red">Start Your Live Stream</p>
              <p className="text-[11px] text-slate-400">Connect with your audience in real-time</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold group-hover:opacity-90 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              Go Live
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

// ORRA Glow Avatar - dynamic glow based on level
function AuraGlowAvatar({ src, alt, level, vibeTag, size = 'md' }: { src: string; alt: string; level: number; vibeTag?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };

  // Determine glow class based on level
  let glowClass = 'aura-glow-ring';
  if (level >= 100) glowClass += ' level-legend';
  else if (level >= 75) glowClass += ' level-diamond';
  else if (level >= 50) glowClass += ' level-gold';
  else if (level >= 25) glowClass += ' level-silver';
  else glowClass += ' level-bronze';

  // Override with vibe color if active
  if (vibeTag) glowClass += ` vibe-${vibeTag}`;

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ${glowClass} transition-all duration-500`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

// timeAgo is now imported from @/lib/utils

// Poll Renderer Component
function PollRenderer({ poll, postId }: { poll: { id: string; question: string; options: { id: string; text: string; voteCount: number; voted: boolean }[]; totalVotes: number; expiresAt: string }; postId: string }) {
  const votePollMutation = useVotePoll();
  const queryClient = useQueryClient();
  const [localVotedOption, setLocalVotedOption] = useState<string | null>(null);

  const handleVote = async (optionId: string) => {
    try {
      await votePollMutation.mutateAsync({ optionId });
      setLocalVotedOption(optionId);
      toast.success('Vote recorded! +1 ORRA', { duration: 1500 });
    } catch (error: any) {
      if (error?.message?.includes('already voted')) {
        toast.error('You already voted on this option');
      } else {
        toast.error('Failed to vote');
      }
    }
  };

  const hasVoted = poll.options.some((o) => o.voted) || localVotedOption !== null;

  // Check if poll is expired
  const isExpired = new Date(poll.expiresAt) < new Date();

  return (
    <div className="mt-3 px-4 pb-1">
      <div className="space-y-2">
        {poll.options.map((option) => {
          const voted = option.voted || localVotedOption === option.id;
          const percentage = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              onClick={() => {
                if (!hasVoted && !isExpired) handleVote(option.id);
              }}
              disabled={hasVoted || isExpired || votePollMutation.isPending}
              className={`w-full relative rounded-xl overflow-hidden text-left transition-all ${
                voted
                  ? 'bg-violet-600/20 border border-violet-500/30'
                  : hasVoted
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30'
              }`}
            >
              {/* Background bar showing percentage */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    voted ? 'bg-violet-600/20' : 'bg-white/5'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {voted && <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                  <span className={`text-sm ${voted ? 'text-violet-300 font-medium' : 'text-slate-200'}`}>
                    {option.text}
                  </span>
                </div>
                {hasVoted && (
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                    {percentage}% ({option.voteCount})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
        <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{isExpired ? 'Poll ended' : `Ends ${timeAgo(poll.expiresAt)}`}</span>
      </div>
    </div>
  );
}

// Voice Player Component - Premium vinyl/radio aesthetic
function VoicePlayer({ audioUrl, avatarUrl, authorName }: { audioUrl: string; avatarUrl: string; authorName: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [waveformBars] = useState(() => Array.from({ length: 32 }, () => Math.random() * 0.6 + 0.3));
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedUrl = resolveImageUrl(audioUrl);

  const updateProgress = useCallback(() => {
    if (audioRef.current && audioRef.current.duration) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(pct);
      setCurrentTime(audioRef.current.currentTime);
    }
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(resolvedUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        setIsLoaded(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      audio.onerror = () => {
        toast.error('Failed to load audio');
      };

      audio.play().catch(() => {
        toast.error('Failed to play audio');
      });
      setIsPlaying(true);
      updateProgress();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      updateProgress();
    }
  }, [isPlaying, resolvedUrl, updateProgress]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
    setProgress(pct * 100);
  };

  return (
    <div className="mx-4 mb-3 rounded-xl overflow-hidden">
      <div className="glass-panel rounded-xl p-4 border border-violet-500/15 bg-gradient-to-br from-violet-950/30 via-black/40 to-fuchsia-950/20">
        {/* Top row: Avatar + Author + Volume icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`relative flex-shrink-0 ${isPlaying ? 'voice-avatar-spin' : ''}`}>
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-violet-500/40">
              <img src={resolveImageUrl(avatarUrl)} alt={authorName} className="w-full h-full object-cover" />
            </div>
            {/* Talking animation ring */}
            {isPlaying && (
              <div className="absolute inset-[-3px] rounded-full border-2 border-fuchsia-400/40 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{authorName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mic className="w-3 h-3 text-fuchsia-400" />
              <span className="text-[10px] text-fuchsia-300/70 font-medium">Voice Note</span>
            </div>
          </div>
          <div className={`transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}>
            <Volume2 className="w-4 h-4 text-violet-400" />
          </div>
        </div>

        {/* Waveform visualization */}
        <div className="flex items-end gap-[2px] h-10 mb-2 cursor-pointer" onClick={handleSeek}>
          {waveformBars.map((height, i) => {
            const progressIndex = Math.floor((progress / 100) * waveformBars.length);
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-100 ${
                  i <= progressIndex
                    ? 'bg-gradient-to-t from-violet-500 to-fuchsia-400'
                    : 'bg-white/15'
                }`}
                style={{
                  height: `${isPlaying && i <= progressIndex ? height * 100 : height * 70}%`,
                  minHeight: '3px',
                }}
              />
            );
          })}
        </div>

        {/* Controls row: Play/Pause + Progress + Duration */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center hover:opacity-90 transition-all active:scale-95 flex-shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </button>

          {/* Progress bar */}
          <div className="flex-1 min-w-0">
            <div className="w-full bg-white/10 rounded-full h-1.5 cursor-pointer" onClick={handleSeek}>
              <div
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-1.5 rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-600"> / </span>
            <span>{isLoaded ? formatTime(duration) : '0:00'}</span>
          </div>
        </div>

        {/* Vinyl record grooves decoration */}
        <div className="flex items-center justify-center mt-3 gap-1 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-violet-400" />
          ))}
          <Waves className="w-3 h-3 text-violet-400 mx-1" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-violet-400" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Comment Reaction Picker — smaller version for comments
function CommentReactionPicker({ commentId, onSelect, onClose }: { commentId: string; onSelect: (reaction: ReactionKey) => void; onClose: () => void }) {
  return (
    <>
      {/* Backdrop to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 mb-1 z-50 reaction-picker-enter">
        <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-0 border border-white/10 shadow-xl shadow-black/40">
          {REACTION_TYPES.map((reaction) => (
            <button
              key={reaction.key}
              onClick={(e) => { e.stopPropagation(); onSelect(reaction.key); onClose(); }}
              className="flex flex-col items-center gap-0 p-1.5 rounded-lg hover:bg-white/10 transition-all hover:scale-125 active:scale-95 group"
              title={reaction.label}
            >
              <span className="text-base group-hover:animate-bounce">{reaction.emoji}</span>
              <span className="text-[7px] text-slate-500 group-hover:text-white transition-colors font-medium">{reaction.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Comment Section Component - fetches comments from API when expanded
function PostCommentsSection({ postId, currentUser, commentCount }: { postId: string; currentUser: { id: string; name: string; avatar: string }; commentCount: number }) {
  const { setViewingUser, setView } = useAuraStore();
  const createCommentApi = useCreateComment();
  const toggleLikeApi = useToggleLike();
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  // Ref-based guard to prevent double-submission (isPending state is async on mobile)
  const isSubmittingRef = useRef(false);
  // Comment reaction picker state
  const [showCommentReactionPicker, setShowCommentReactionPicker] = useState<string | null>(null);
  const [commentLongPressTimer, setCommentLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isCommentLongPress, setIsCommentLongPress] = useState(false);

  // Fetch comments from API — single source of truth (no local Zustand comments)
  const { data: apiCommentsData } = useComments(postId);

  // Map API comments to display format, deduplicate by ID (safety net)
  const apiComments = (() => {
    const raw = (apiCommentsData?.comments || []).map((c: any) => ({
      id: c.id,
      userId: c.author?.id || '',
      userName: c.author?.name || 'Unknown',
      userAvatar: c.author?.avatar || '/api/uploads?path=images/orra-logo.png',
      text: c.text,
      createdAt: new Date(c.createdAt).getTime(),
      likesCount: c.likesCount || 0,
      isLiked: c.isLiked || false,
      myReaction: c.myReaction || null,
    }));
    // Deduplicate by ID — prevents display bugs if cache briefly returns duplicates
    const seen = new Set<string>();
    return raw.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  })();

  // Sort by creation time (oldest first for conversation flow)
  const sortedComments = [...apiComments].sort((a: any, b: any) => a.createdAt - b.createdAt);

  // Show limited or all comments
  const INITIAL_SHOW = 5;
  const visibleComments = showAllComments ? sortedComments : sortedComments.slice(-INITIAL_SHOW);
  const hasMore = sortedComments.length > INITIAL_SHOW;

  const handleComment = () => {
    const text = commentText.trim();
    // Double guard: both ref (sync) and isPending (async) to prevent double-submission on mobile)
    if (!text || createCommentApi.isPending || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setCommentText('');
    setReplyTo(null);
    createCommentApi.mutate({ postId, text }, {
      onSuccess: () => {
        toast.success('Comment added! +2 ORRA', { duration: 1500 });
      },
      onError: () => {
        toast.error('Comment failed to post');
        setCommentText(text); // Restore text on error so user doesn't lose it
      },
      onSettled: () => {
        isSubmittingRef.current = false;
      },
    });
  };

  // Quick tap = heart like on comment
  const handleCommentQuickLike = (commentId: string, currentReaction: string | null) => {
    if (currentReaction === 'like') {
      // Toggle off if already liked with heart
      toggleLikeApi.mutate({ targetId: commentId, targetType: 'comment', reactionType: 'like' }, { onError: () => {} });
    } else {
      toggleLikeApi.mutate({ targetId: commentId, targetType: 'comment', reactionType: 'like' }, { onError: () => {} });
    }
  };

  // Long-press / picker reaction on comment
  const handleCommentReaction = (commentId: string, reactionType: ReactionKey, currentReaction: string | null) => {
    if (currentReaction === reactionType) {
      // Same reaction — toggle off
      toggleLikeApi.mutate({ targetId: commentId, targetType: 'comment', reactionType }, { onError: () => {} });
    } else {
      toggleLikeApi.mutate({ targetId: commentId, targetType: 'comment', reactionType }, { onError: () => {} });
    }
  };

  return (
    <div className="border-t border-white/5 fade-in">
      {/* Existing comments */}
      {sortedComments.length > 0 && (
        <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
          {/* View more comments toggle */}
          {hasMore && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-xs text-slate-500 hover:text-violet-400 transition-colors mb-1"
            >
              View all {sortedComments.length} comments
            </button>
          )}
          {showAllComments && sortedComments.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllComments(false)}
              className="text-xs text-slate-500 hover:text-violet-400 transition-colors mb-1"
            >
              Show less
            </button>
          )}
          {visibleComments.map((c: any) => {
            const reactionDef = c.myReaction ? REACTION_TYPES.find(r => r.key === c.myReaction) : null;
            const displayEmoji = reactionDef?.emoji || '❤️';
            const displayLabel = reactionDef?.label || 'Like';
            const displayColor = reactionDef?.color || 'text-red-400';
            return (
              <div key={c.id} className="flex gap-2">
                <button
                  onClick={() => { if (c.userId) { setViewingUser(c.userId); setView('profile'); } }}
                  className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <img src={resolveImageUrl(c.userAvatar)} alt={c.userName} className="w-full h-full object-cover" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="bg-white/5 rounded-xl px-3 py-2">
                    <button
                      onClick={() => { if (c.userId) { setViewingUser(c.userId); setView('profile'); } }}
                      className="text-xs font-semibold text-white hover:text-violet-300 transition-colors"
                    >
                      {c.userName}
                    </button>
                    <p className="text-xs text-slate-300 break-words">{c.text}</p>
                  </div>
                  {/* Comment actions: Like (with reaction picker), Reply */}
                  <div className="flex items-center gap-3 mt-1 ml-1">
                    <p className="text-[10px] text-slate-600">
                      {timeAgo(c.createdAt)}
                    </p>
                    <div className="relative">
                      {showCommentReactionPicker === c.id && (
                        <CommentReactionPicker
                          commentId={c.id}
                          onSelect={(reaction) => handleCommentReaction(c.id, reaction, c.myReaction)}
                          onClose={() => setShowCommentReactionPicker(null)}
                        />
                      )}
                      <button
                        onClick={() => { if (!isCommentLongPress) { handleCommentQuickLike(c.id, c.myReaction); setIsCommentLongPress(false); } }}
                        onTouchStart={() => {
                          setIsCommentLongPress(false);
                          const timer = setTimeout(() => {
                            setIsCommentLongPress(true);
                            setShowCommentReactionPicker(showCommentReactionPicker === c.id ? null : c.id);
                          }, 500);
                          setCommentLongPressTimer(timer);
                        }}
                        onTouchEnd={() => { if (commentLongPressTimer) clearTimeout(commentLongPressTimer); setCommentLongPressTimer(null); }}
                        onTouchMove={() => { if (commentLongPressTimer) clearTimeout(commentLongPressTimer); setCommentLongPressTimer(null); }}
                        onMouseDown={() => {
                          setIsCommentLongPress(false);
                          const timer = setTimeout(() => {
                            setIsCommentLongPress(true);
                            setShowCommentReactionPicker(showCommentReactionPicker === c.id ? null : c.id);
                          }, 500);
                          setCommentLongPressTimer(timer);
                        }}
                        onMouseUp={() => { if (commentLongPressTimer) clearTimeout(commentLongPressTimer); setCommentLongPressTimer(null); }}
                        onMouseLeave={() => { if (commentLongPressTimer) clearTimeout(commentLongPressTimer); setCommentLongPressTimer(null); }}
                        onContextMenu={(e) => { e.preventDefault(); setShowCommentReactionPicker(showCommentReactionPicker === c.id ? null : c.id); }}
                        className={`text-[10px] font-medium transition-colors flex items-center gap-0.5 ${c.isLiked ? displayColor : 'text-slate-600 hover:text-red-400'}`}
                      >
                        {c.isLiked ? (
                          <>
                            <span className="text-xs">{displayEmoji}</span>
                            <span>{displayLabel}</span>
                          </>
                        ) : (
                          'Like'
                        )}
                        {c.likesCount > 0 ? ` ${c.likesCount}` : ''}
                      </button>
                    </div>
                    <button
                      onClick={() => setReplyTo({ id: c.id, name: c.userName })}
                      className="text-[10px] font-medium text-slate-600 hover:text-violet-400 transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
        <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
          <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={replyTo ? `@${replyTo.name} ` + commentText : commentText}
            onChange={(e) => {
              const val = e.target.value;
              // If replying and user clears the @mention prefix, cancel reply mode
              if (replyTo && !val.startsWith(`@${replyTo.name}`)) {
                setReplyTo(null);
                setCommentText(val);
              } else {
                setCommentText(replyTo ? val.replace(`@${replyTo.name} `, '') : val);
              }
            }}
            placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Write a comment...'}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all disabled:opacity-50"
            disabled={createCommentApi.isPending}
            onKeyDown={(e) => { if (e.key === 'Enter' && !createCommentApi.isPending && !isSubmittingRef.current) handleComment(); }}
          />
          <button
            onClick={handleComment}
            disabled={createCommentApi.isPending || !commentText.trim() || isSubmittingRef.current}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-violet-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {createCommentApi.isPending ? <div className="w-3.5 h-3.5 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        {replyTo && (
          <button
            onClick={() => { setReplyTo(null); setCommentText(''); }}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Reaction types with their emoji, label, and colors
const REACTION_TYPES = [
  { key: 'like', emoji: '❤️', label: 'Like', color: 'text-red-400', bgColor: 'bg-red-500/10', activeBg: 'bg-red-500/20' },
  { key: 'wow', emoji: '😮', label: 'Wow', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', activeBg: 'bg-yellow-500/20' },
  { key: 'omg', emoji: '😱', label: 'OMG', color: 'text-orange-400', bgColor: 'bg-orange-500/10', activeBg: 'bg-orange-500/20' },
  { key: 'wtf', emoji: '🤯', label: 'WTF', color: 'text-purple-400', bgColor: 'bg-purple-500/10', activeBg: 'bg-purple-500/20' },
  { key: 'laughing', emoji: '😂', label: 'Laughing', color: 'text-amber-400', bgColor: 'bg-amber-500/10', activeBg: 'bg-amber-500/20' },
  { key: 'sad', emoji: '😢', label: 'Sad', color: 'text-blue-400', bgColor: 'bg-blue-500/10', activeBg: 'bg-blue-500/20' },
  { key: 'care', emoji: '🥰', label: 'Care', color: 'text-pink-400', bgColor: 'bg-pink-500/10', activeBg: 'bg-pink-500/20' },
  { key: 'prayers', emoji: '🙏', label: 'Prayers', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/20' },
] as const;

type ReactionKey = typeof REACTION_TYPES[number]['key'];

// Reaction Picker — animated popup that appears on long-press or hover
function ReactionPicker({ postId, onSelect, onClose }: { postId: string; onSelect: (reaction: ReactionKey) => void; onClose: () => void }) {
  return (
    <>
      {/* Backdrop to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 mb-2 z-50 reaction-picker-enter">
        <div className="glass-panel rounded-2xl p-2 flex items-center gap-0.5 border border-white/10 shadow-xl shadow-black/40">
          {REACTION_TYPES.map((reaction) => (
            <button
              key={reaction.key}
              onClick={(e) => { e.stopPropagation(); onSelect(reaction.key); onClose(); }}
              className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-white/10 transition-all hover:scale-125 active:scale-95 group"
              title={reaction.label}
            >
              <span className="text-xl group-hover:animate-bounce">{reaction.emoji}</span>
              <span className="text-[8px] text-slate-500 group-hover:text-white transition-colors font-medium">{reaction.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function PulseFeed() {
  const {
    likedPosts, savedPosts, toggleLike, toggleSave, toggleCreatePost, toggleShareModal,
    currentVibe, selectedVibes, searchQuery,
    expandedComments, toggleComments,
    repostIds, toggleRepost, deleteUserPost, auraTokens, auraLevel,
    sharedViaDM, setViewingUser, setView, setViewingPostId, setViewingEchoId,
    postReactions, setPostReaction,
    scrollToPostId, setScrollToPostId,
  } = useAuraStore();
  const currentUser = useCurrentUser();

  // Fetch real posts from the API - use first selected vibe or currentVibe
  // IMPORTANT: This MUST be declared before the useEffect that references postsLoading,
  // otherwise JavaScript's temporal dead zone causes "Cannot access before initialization" error
  const activeVibeFilter = (selectedVibes && selectedVibes.length > 0) ? selectedVibes[0] : currentVibe;
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
    error: postsError,
  } = useInfinitePosts(activeVibeFilter || undefined);

  // Intersection observer ref for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Set up IntersectionObserver to fetch next page when sentinel is near viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '800px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto-scroll to a specific post when navigating from a notification
  // This effect fires on mount AND when scrollToPostId/postsLoading changes,
  // ensuring it works even if scrollToPostId was set before this component mounted
  useEffect(() => {
    if (scrollToPostId && !postsLoading) {
      // Delay to let posts render in the DOM
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${scrollToPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Brief highlight effect
          el.classList.add('ring-2', 'ring-violet-500/50');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-violet-500/50');
          }, 2000);
          setScrollToPostId(null); // Clear after scrolling
        } else {
          // Post not found in DOM yet — retry once after a longer delay
          // (can happen if posts are still being fetched)
          const retryTimer = setTimeout(() => {
            const retryEl = document.getElementById(`post-${scrollToPostId}`);
            if (retryEl) {
              retryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              retryEl.classList.add('ring-2', 'ring-violet-500/50');
              setTimeout(() => {
                retryEl.classList.remove('ring-2', 'ring-violet-500/50');
              }, 2000);
            }
            setScrollToPostId(null); // Clear regardless — don't loop forever
          }, 1000);
          return () => clearTimeout(retryTimer);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [scrollToPostId, postsLoading, setScrollToPostId]);

  const createPost = useCreatePost();
  const toggleLikeApi = useToggleLike();
  const toggleSaveApi = useToggleSave();
  const toggleRepostApi = useToggleRepost();
  const queryClient = useQueryClient();
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [likeAnimation, setLikeAnimation] = useState<string | null>(null);
  const [likeAnimationReaction, setLikeAnimationReaction] = useState<ReactionKey>('like');
  const [echoAnimation, setEchoAnimation] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  // Long-press detection for reaction picker
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxKey, setLightboxKey] = useState(0);
  const displayName = currentUser.name;
  const displayAvatar = currentUser.avatar;

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
    setLightboxKey((prev) => prev + 1);
  };

  // Flatten all pages from infinite query into a single post list
  const allPosts = infiniteData?.pages.flatMap(page => page.posts) ?? [];

  // Map API posts to the format the component expects
  const apiPosts = allPosts.map((post) => {
    const images: string[] = (() => {
      try {
        const parsed = JSON.parse(post.images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    return {
      id: post.id,
      user: {
        id: post.author.id,
        name: post.author.name,
        handle: post.author.handle,
        avatar: post.author.avatar || '/api/uploads?path=images/orra-logo.png',
        verified: post.author.verified,
      },
      text: post.text,
      images,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      time: timeAgo(post.createdAt),
      verified: post.author.verified,
      type: (post.type || (images.length > 0 ? 'image' : 'text')) as string,
      audioUrl: (post as any).audioUrl || '',
      vibeTag: post.vibeTag || 'hyped',
      isLiked: post.isLiked,
      myReaction: (post as any).myReaction || null,
      isSaved: post.isSaved,
      isReposted: post.isReposted,
      isUserPost: post.author.id === currentUser.id,
      createdAt: post.createdAt,
      poll: (post as any).poll || undefined,
      // Echo/repost fields from the API
      _isEcho: (post as any)._isEcho || (post as any).isEcho || false,
      echoedBy: (post as any).echoedBy || null,
      echoedAt: (post as any).echoedAt || null,
      _echoId: (post as any)._echoId || null,
    };
  });

  // Deduplicate posts — echoes and originals can share the same post.id across pages.
  // For echo entries, use a composite key like "echo-{echoId}" so they coexist with
  // the original post. Plain posts are keyed by their id.
  const dedupedPosts = useMemo(() => {
    const seen = new Map<string, typeof apiPosts[number]>();
    for (const post of apiPosts) {
      const isEcho = (post as any)._isEcho === true;
      const echoId = (post as any)._echoId;
      const key = isEcho && echoId ? `echo-${echoId}` : post.id;
      if (!seen.has(key)) {
        seen.set(key, post);
      }
    }
    return Array.from(seen.values());
  }, [apiPosts]);

  // Filter by search and by selected vibes (client-side multi-vibe filter)
  let filteredPosts = dedupedPosts;
  if (selectedVibes && selectedVibes.length > 0) {
    filteredPosts = filteredPosts.filter((p) => selectedVibes.includes(p.vibeTag));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter((p) =>
      p.text.toLowerCase().includes(q) || p.user.name.toLowerCase().includes(q)
    );
  }

  const handleLike = (postId: string) => {
    const isLiked = likedPosts.has(postId);
    const { likedPostsEarned } = useAuraStore.getState();
    const alreadyEarned = likedPostsEarned.has(postId);
    // Default to 'like' reaction
    const currentReaction = postReactions[postId] || 'like';
    // Toggle: if already liked with 'like', remove. Otherwise set to 'like'
    if (isLiked && currentReaction === 'like') {
      toggleLike(postId, 'like');
      toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType: 'like' }, { onError: () => {} });
    } else {
      toggleLike(postId, 'like');
      toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType: 'like' }, { onError: () => {} });
      if (!isLiked) {
        setLikeAnimationReaction('like');
        setLikeAnimation(postId);
        setTimeout(() => setLikeAnimation(null), 600);
        if (!alreadyEarned) {
          toast.success('+1 ORRA tokens', { duration: 1500 });
        }
      }
    }
  };

  const handleReaction = (postId: string, reactionType: ReactionKey) => {
    const isLiked = likedPosts.has(postId);
    const currentReaction = postReactions[postId];
    const { likedPostsEarned } = useAuraStore.getState();
    const alreadyEarned = likedPostsEarned.has(postId);

    // If same reaction already active, toggle off
    if (isLiked && currentReaction === reactionType) {
      toggleLike(postId, reactionType);
      toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType }, { onError: () => {} });
      return;
    }

    // Set new reaction
    setPostReaction(postId, reactionType);
    toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType }, { onError: () => {} });

    // Always show animation when switching reactions (even if already liked)
    setLikeAnimationReaction(reactionType);
    setLikeAnimation(postId);
    setTimeout(() => setLikeAnimation(null), 600);
    if (!isLiked && !alreadyEarned) {
      toast.success('+1 ORRA tokens', { duration: 1500 });
    }
  };

  const handleEcho = (postId: string) => {
    toggleRepost(postId);
    // Persist to database so other users see the repost
    toggleRepostApi.mutate({ postId }, {
      onSuccess: () => {
        // Refresh feed so the echo entry appears at the top
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      },
      onError: () => {}
    });
    const isReposted = repostIds.has(postId);
    if (!isReposted) {
      setEchoAnimation(postId);
      setTimeout(() => setEchoAnimation(null), 800);
      toast.success('Echoed! +2 ORRA', { duration: 1500 });
    } else {
      toast.success('Echo removed', { duration: 1500 });
    }
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Mood Wave Bar - ORRA EXCLUSIVE */}
      <MoodWaveBar currentVibe={currentVibe} />

      {/* LIVE Stream Card — Pinned to top */}
      <LiveBanner />

      {/* ORRA Dance Off Event Banner */}
      <button
        onClick={() => useAuraStore.getState().setView('dance')}
        className="w-full rounded-2xl overflow-hidden hover:border-fuchsia-500/30 transition-all group relative"
      >
        <div className="relative h-32 md:h-40">
          <img
            src="/api/uploads?path=images/banners/dance-off-banner.png"
            alt="ORRA Dance Off"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {/* Animated sparkles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-2 h-2 bg-violet-400/50 rounded-full top-3 left-[15%] animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute w-1.5 h-1.5 bg-fuchsia-400/50 rounded-full top-6 right-[25%] animate-ping" style={{ animationDuration: '4s' }} />
            <div className="absolute w-1 h-1 bg-pink-400/50 rounded-full bottom-10 left-[40%] animate-ping" style={{ animationDuration: '2.5s' }} />
          </div>
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">💃</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600/80 text-white text-[10px] font-bold animate-pulse">LIVE</span>
                <span className="text-xs font-bold text-fuchsia-400 tracking-wider uppercase">Dance Challenge</span>
              </div>
              <p className="text-xl md:text-2xl font-black text-white leading-tight">ORRA DANCE OFF</p>
              <p className="text-[11px] text-slate-300">Join the challenge & win 100K ORRA + Plaque</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-sm font-bold group-hover:opacity-90 transition-all glow-violet">
              Join →
            </div>
          </div>
        </div>
      </button>

      {/* Game Arena Promo Card */}
      <button
        onClick={() => useAuraStore.getState().setView('games')}
        className="w-full rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all group"
      >
        <div className="relative h-28 md:h-32">
          <img
            src="/api/uploads?path=images/banners/game-arena-banner.png"
            alt="Game Arena"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-orange-400 tracking-wider uppercase">Multiplayer</span>
              </div>
              <p className="text-lg font-black text-white leading-tight">GAME ARENA</p>
              <p className="text-[11px] text-slate-300">6 new games with friends + ORRA rewards</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold group-hover:opacity-90 transition-all">
              Play →
            </div>
          </div>
        </div>
      </button>

      {/* Vibe Filter Banner */}
      {(selectedVibes && selectedVibes.length > 0) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30">
          <Waves className="w-4 h-4 text-fuchsia-400" />
          <span className="text-sm text-slate-300">Filtering by:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {selectedVibes.map((v) => (
              <span key={v} className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{vibeLabels[v] || v}</span>
            ))}
          </div>
          <button
            onClick={() => useAuraStore.getState().setSelectedVibes([])}
            className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Results Banner */}
      {searchQuery.trim() && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-sm text-slate-400">Results for &quot;{searchQuery}&quot;: {filteredPosts.length} posts</span>
          <button
            onClick={() => useAuraStore.getState().setSearchQuery('')}
            className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Post Box */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setViewingUser(null); setView('profile'); }}
            className="hover:opacity-80 transition-opacity"
          >
            <AuraGlowAvatar src={displayAvatar} alt={displayName} level={auraLevel} vibeTag={currentVibe || undefined} />
          </button>
          <button
            onClick={() => toggleCreatePost()}
            className="flex-1 text-left px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm hover:bg-white/10 hover:border-violet-500/20 transition-all"
          >
            What&apos;s on your mind, {displayName.split(' ')[0]}?
          </button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 mt-3 pt-3 border-t border-white/5 overflow-x-auto no-scrollbar">
          <button onClick={() => toggleCreatePost('image')} className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-400 hover:bg-emerald-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap">
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Photo
          </button>
          <button onClick={() => toggleCreatePost('reel')} className="flex items-center gap-1 text-[10px] sm:text-xs text-red-400 hover:bg-red-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap">
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Video
          </button>
          <button onClick={() => toggleCreatePost('poll')} className="flex items-center gap-1 text-[10px] sm:text-xs text-violet-400 hover:bg-violet-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Poll
          </button>
          <button onClick={() => toggleCreatePost('reel')} className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-400 hover:bg-amber-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap">
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reel
          </button>
          <div className="ml-auto flex items-center gap-1 text-[10px] sm:text-xs text-amber-400 whitespace-nowrap pl-2">
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span>{auraTokens.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Loading State — skeleton cards for first load */}
      {postsLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                  <div className="h-2 w-16 rounded-full bg-white/5" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded-full bg-white/10" />
                <div className="h-3 w-3/4 rounded-full bg-white/10" />
              </div>
              {i !== 2 && <div className="mt-3 h-40 rounded-xl bg-white/5" />}
              <div className="mt-3 flex justify-around">
                <div className="h-6 w-16 rounded-full bg-white/5" />
                <div className="h-6 w-16 rounded-full bg-white/5" />
                <div className="h-6 w-16 rounded-full bg-white/5" />
                <div className="h-6 w-16 rounded-full bg-white/5" />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center py-2">
            <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <span className="ml-2 text-xs text-slate-500">Loading your feed...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {postsError && !postsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-red-400 text-sm mb-2">Failed to load posts</p>
          <button
            onClick={() => window.location.reload()}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Feed Posts */}
      {!postsLoading && !postsError && filteredPosts.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No posts found{selectedVibes && selectedVibes.length > 0 ? ` for selected vibes` : currentVibe ? ` for "${vibeLabels[currentVibe]}"` : ''}.</p>
          {(selectedVibes && selectedVibes.length > 0) && (
            <button onClick={() => useAuraStore.getState().setSelectedVibes([])} className="mt-2 text-violet-400 text-sm font-semibold hover:text-violet-300">
              Clear filter
            </button>
          )}
          {currentVibe && !(selectedVibes && selectedVibes.length > 0) && (
            <button onClick={() => useAuraStore.getState().setVibe('')} className="mt-2 text-violet-400 text-sm font-semibold hover:text-violet-300">
              Clear filter
            </button>
          )}
        </div>
      )}

      {filteredPosts.map((post, index) => {
        const isLiked = likedPosts.has(post.id) || post.isLiked;
        const showComments = expandedComments.has(post.id);
        const totalComments = post.comments || 0;
        const isReposted = repostIds.has(post.id) || post.isReposted;
        const isUserPost = post.isUserPost;
        const isSaved = savedPosts.has(post.id) || post.isSaved;
        const isShared = sharedViaDM.has(post.id);
        const isEcho = (post as any)._isEcho === true || (post as any).isEcho === true;
        const echoedBy = (post as any).echoedBy as { id: string; name: string; handle: string; avatar: string; verified: boolean } | null;

        // For echo cards: the echoer IS the post owner, original author is inside the nested card
        const echoerIsCurrentUser = echoedBy && echoedBy.id === currentUser.id;
        // The "header user" is the echoer for echo posts, the author for normal posts
        const headerUser = isEcho && echoedBy ? {
          id: echoedBy.id,
          name: echoedBy.name,
          handle: echoedBy.handle,
          avatar: echoedBy.avatar,
          verified: echoedBy.verified || false,
        } : post.user;
        const headerIsCurrentUser = isEcho ? echoerIsCurrentUser : isUserPost;

        // Insert an ad card every 8-12 posts (tighter intervals for more ads as feed grows)
        const AD_INTERVALS = [8, 10, 9, 11, 8, 10, 9, 12, 8, 11, 10, 9, 12, 8, 10, 11, 9, 10, 8, 12, 11, 9, 10, 8];
        let adSlot = 0;
        let adThreshold = AD_INTERVALS[0];
        const showAd = (index + 1) >= adThreshold && (index + 1) === adThreshold;
        // Calculate which ad slot we're at based on cumulative thresholds
        let cumThreshold = 0;
        let currentAdSlot = 0;
        for (let s = 0; s < AD_INTERVALS.length; s++) {
          cumThreshold += AD_INTERVALS[s];
          if ((index + 1) <= cumThreshold) { currentAdSlot = s; break; }
        }
        const adIndex = currentAdSlot;

        const AD_PROMOS = [
          {
            badge: 'PROMOTED',
            badgeColor: 'bg-teal-600',
            brand: 'SURGE ENERGY',
            brandIcon: <Zap className="w-3 h-3" />,
            image: '/images/ads/surge-can.jpg',
            headline: 'Fuel Your Grind',
            subtext: 'Zero sugar. Infinite focus. The energy drink for creators who never stop.',
            details: '3 flavors | $2.99/can | Free shipping on 12-packs',
            website: 'surgeenergy.com',
            phone: '1-800-SURGE-UP',
            address: 'Austin, TX',
            hours: 'Order 24/7 online',
            rating: '4.8',
            reviews: '12.4K',
            cta: 'Get a Free Sample',
            ctaColor: 'bg-teal-600 hover:bg-teal-500',
            glowColor: 'teal',
            borderColor: 'border-teal-300',
            neonShadow: '0 0 20px rgba(20,184,166,1), 0 0 50px rgba(20,184,166,0.7), 0 0 100px rgba(20,184,166,0.4), 0 0 150px rgba(20,184,166,0.2), inset 0 0 20px rgba(20,184,166,0.2)',
            neonShadowHover: '0 0 25px rgba(20,184,166,1), 0 0 70px rgba(20,184,166,0.9), 0 0 120px rgba(20,184,166,0.5), 0 0 180px rgba(20,184,166,0.3), inset 0 0 25px rgba(20,184,166,0.25)',
          },
          {
            badge: 'SPONSORED',
            badgeColor: 'bg-purple-600',
            brand: 'ZENITH APPAREL',
            brandIcon: <Star className="w-3 h-3" />,
            image: '/images/ads/zenith-hoodie.jpg',
            headline: 'Wear the Vibe',
            subtext: 'Iridescent streetwear that shifts color with your mood. Drop 03 is live now.',
            details: 'Sizes XS-3XL | Starting at $89 | Free returns',
            website: 'zenithapparel.co',
            phone: '1-833-ZENITH-1',
            address: 'Los Angeles, CA',
            hours: 'Mon-Fri 9AM-6PM PT',
            rating: '4.9',
            reviews: '8.7K',
            cta: 'Shop Drop 03',
            ctaColor: 'bg-purple-600 hover:bg-purple-500',
            glowColor: 'purple',
            borderColor: 'border-purple-300',
            neonShadow: '0 0 20px rgba(147,51,234,1), 0 0 50px rgba(147,51,234,0.7), 0 0 100px rgba(147,51,234,0.4), 0 0 150px rgba(147,51,234,0.2), inset 0 0 20px rgba(147,51,234,0.2)',
            neonShadowHover: '0 0 25px rgba(147,51,234,1), 0 0 70px rgba(147,51,234,0.9), 0 0 120px rgba(147,51,234,0.5), 0 0 180px rgba(147,51,234,0.3), inset 0 0 25px rgba(147,51,234,0.25)',
          },
          {
            badge: 'AD',
            badgeColor: 'bg-orange-600',
            brand: 'PULSE AUDIO',
            brandIcon: <Waves className="w-3 h-3" />,
            image: '/images/ads/pulse-audio.jpg',
            headline: 'Sound Redefined',
            subtext: 'Spatial audio headphones with AI noise cancellation. Hear what you\'ve been missing.',
            details: 'Model PX-7 Pro | $299.99 | 30-day guarantee',
            website: 'pulseaudio.io',
            phone: '1-800-PULSE-3D',
            address: 'Seattle, WA',
            hours: 'Support 24/7',
            rating: '4.7',
            reviews: '23.1K',
            cta: 'Order Now — $50 Off',
            ctaColor: 'bg-orange-600 hover:bg-orange-500',
            glowColor: 'orange',
            borderColor: 'border-orange-300',
            neonShadow: '0 0 20px rgba(245,158,11,1), 0 0 50px rgba(245,158,11,0.7), 0 0 100px rgba(245,158,11,0.4), 0 0 150px rgba(245,158,11,0.2), inset 0 0 20px rgba(245,158,11,0.2)',
            neonShadowHover: '0 0 25px rgba(245,158,11,1), 0 0 70px rgba(245,158,11,0.9), 0 0 120px rgba(245,158,11,0.5), 0 0 180px rgba(245,158,11,0.3), inset 0 0 25px rgba(245,158,11,0.25)',
          },
          {
            badge: 'AD',
            badgeColor: 'bg-blue-600',
            brand: 'NOVA KICKS',
            brandIcon: <Sparkles className="w-3 h-3" />,
            image: '/images/ads/nova-kicks.jpg',
            headline: 'Step Into the Future',
            subtext: 'Limited drop — holographic sole tech. Only 500 pairs made. Get yours before they vanish.',
            details: 'Sizes 5-14 | $249.99 | Ships worldwide',
            website: 'novakicks.com',
            phone: '1-888-NOVA-KIK',
            address: 'Portland, OR',
            hours: 'Drop live: Friday 12AM ET',
            rating: '4.9',
            reviews: '5.2K',
            cta: 'Shop the Drop',
            ctaColor: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500',
            glowColor: 'blue',
            borderColor: 'border-blue-300',
            neonShadow: '0 0 20px rgba(59,130,246,1), 0 0 50px rgba(59,130,246,0.7), 0 0 100px rgba(59,130,246,0.4), 0 0 150px rgba(59,130,246,0.2), inset 0 0 20px rgba(59,130,246,0.2)',
            neonShadowHover: '0 0 25px rgba(59,130,246,1), 0 0 70px rgba(59,130,246,0.9), 0 0 120px rgba(59,130,246,0.5), 0 0 180px rgba(59,130,246,0.3), inset 0 0 25px rgba(59,130,246,0.25)',
          },
          // === NEW PROFESSIONAL OUT-OF-THIS-WORLD ADS ===
          {
            badge: 'SPONSORED',
            badgeColor: 'bg-cyan-600',
            brand: 'OASIS HYDRATION',
            brandIcon: <Waves className="w-3 h-3" />,
            image: '/images/ads/oasis-water.jpg',
            headline: 'Hydrate Beyond Reality',
            subtext: 'Electrolyte-infused water from glacial sources. Your body is 70% water — make it cosmic.',
            details: '6 flavors | $3.49/bottle | Subscribe & save 25%',
            website: 'oasishydration.com',
            phone: '1-800-OASIS-H2O',
            address: 'Boulder, CO',
            hours: 'Free delivery in 30 min',
            rating: '4.9',
            reviews: '31.8K',
            cta: 'Try Cosmic Flow',
            ctaColor: 'bg-cyan-600 hover:bg-cyan-500',
            glowColor: 'cyan',
            borderColor: 'border-cyan-300',
            neonShadow: '0 0 20px rgba(6,182,212,1), 0 0 50px rgba(6,182,212,0.7), 0 0 100px rgba(6,182,212,0.4), 0 0 150px rgba(6,182,212,0.2), inset 0 0 20px rgba(6,182,212,0.2)',
            neonShadowHover: '0 0 25px rgba(6,182,212,1), 0 0 70px rgba(6,182,212,0.9), 0 0 120px rgba(6,182,212,0.5), 0 0 180px rgba(6,182,212,0.3), inset 0 0 25px rgba(6,182,212,0.25)',
          },
          {
            badge: 'PROMOTED',
            badgeColor: 'bg-rose-600',
            brand: 'FLAME STREETWEAR',
            brandIcon: <Sparkles className="w-3 h-3" />,
            image: '/images/ads/flame-streetwear.jpg',
            headline: 'Burn the Ordinary',
            subtext: 'Thermochromic fabric that glows with your body heat. Streetwear from another dimension.',
            details: 'Limited Summer Drop | $120-$280 | Worldwide shipping',
            website: 'flamestreet.com',
            phone: '1-888-FLAME-DRP',
            address: 'Miami, FL',
            hours: 'Drop goes live: Saturday 8PM ET',
            rating: '4.8',
            reviews: '14.2K',
            cta: 'Ignite Your Style',
            ctaColor: 'bg-rose-600 hover:bg-rose-500',
            glowColor: 'rose',
            borderColor: 'border-rose-300',
            neonShadow: '0 0 20px rgba(244,63,94,1), 0 0 50px rgba(244,63,94,0.7), 0 0 100px rgba(244,63,94,0.4), 0 0 150px rgba(244,63,94,0.2), inset 0 0 20px rgba(244,63,94,0.2)',
            neonShadowHover: '0 0 25px rgba(244,63,94,1), 0 0 70px rgba(244,63,94,0.9), 0 0 120px rgba(244,63,94,0.5), 0 0 180px rgba(244,63,94,0.3), inset 0 0 25px rgba(244,63,94,0.25)',
          },
          {
            badge: 'AD',
            badgeColor: 'bg-indigo-600',
            brand: 'NEXUS GAMING',
            brandIcon: <Zap className="w-3 h-3" />,
            image: '/images/ads/nexus-gaming.jpg',
            headline: 'Level Up Your Reality',
            subtext: 'Cloud gaming at 8K 240fps. Zero latency. Every game, every device, zero limits.',
            details: 'Pro Tier: $14.99/mo | 7-day free trial | Cancel anytime',
            website: 'nexusgaming.gg',
            phone: '1-833-NEXUS-GG',
            address: 'San Jose, CA',
            hours: 'Support 24/7',
            rating: '4.8',
            reviews: '45.6K',
            cta: 'Start Free Trial',
            ctaColor: 'bg-indigo-600 hover:bg-indigo-500',
            glowColor: 'indigo',
            borderColor: 'border-indigo-300',
            neonShadow: '0 0 20px rgba(99,102,241,1), 0 0 50px rgba(99,102,241,0.7), 0 0 100px rgba(99,102,241,0.4), 0 0 150px rgba(99,102,241,0.2), inset 0 0 20px rgba(99,102,241,0.2)',
            neonShadowHover: '0 0 25px rgba(99,102,241,1), 0 0 70px rgba(99,102,241,0.9), 0 0 120px rgba(99,102,241,0.5), 0 0 180px rgba(99,102,241,0.3), inset 0 0 25px rgba(99,102,241,0.25)',
          },
          {
            badge: 'SPONSORED',
            badgeColor: 'bg-emerald-600',
            brand: 'NEON FIT',
            brandIcon: <Sparkles className="w-3 h-3" />,
            image: '/images/ads/neon-fit.jpg',
            headline: 'Train in Another Dimension',
            subtext: 'AR-powered fitness gear that projects your workout into any space. No gym required.',
            details: 'Starter Kit: $199 | Includes AR glasses + 3 programs',
            website: 'neonfit.io',
            phone: '1-800-NEON-FIT',
            address: 'Denver, CO',
            hours: 'Mon-Sat 7AM-9PM MT',
            rating: '4.7',
            reviews: '9.3K',
            cta: 'Enter the Grid',
            ctaColor: 'bg-emerald-600 hover:bg-emerald-500',
            glowColor: 'emerald',
            borderColor: 'border-emerald-300',
            neonShadow: '0 0 20px rgba(16,185,129,1), 0 0 50px rgba(16,185,129,0.7), 0 0 100px rgba(16,185,129,0.4), 0 0 150px rgba(16,185,129,0.2), inset 0 0 20px rgba(16,185,129,0.2)',
            neonShadowHover: '0 0 25px rgba(16,185,129,1), 0 0 70px rgba(16,185,129,0.9), 0 0 120px rgba(16,185,129,0.5), 0 0 180px rgba(16,185,129,0.3), inset 0 0 25px rgba(16,185,129,0.25)',
          },
          {
            badge: 'PROMOTED',
            badgeColor: 'bg-amber-600',
            brand: 'GROUNDS COFFEE',
            brandIcon: <Star className="w-3 h-3" />,
            image: '/images/ads/grounds-coffee.jpg',
            headline: 'Coffee From the Cosmos',
            subtext: 'Single-origin beans roasted by AI for the perfect cup every time. Your morning, elevated.',
            details: '4 roasts | From $18/bag | First bag 50% off',
            website: 'groundscoffee.co',
            phone: '1-888-GROUNDS',
            address: 'Portland, OR',
            hours: 'Order anytime — roasts daily',
            rating: '4.9',
            reviews: '18.4K',
            cta: 'Claim 50% Off',
            ctaColor: 'bg-amber-600 hover:bg-amber-500',
            glowColor: 'amber',
            borderColor: 'border-amber-300',
            neonShadow: '0 0 20px rgba(245,158,11,1), 0 0 50px rgba(245,158,11,0.7), 0 0 100px rgba(245,158,11,0.4), 0 0 150px rgba(245,158,11,0.2), inset 0 0 20px rgba(245,158,11,0.2)',
            neonShadowHover: '0 0 25px rgba(245,158,11,1), 0 0 70px rgba(245,158,11,0.9), 0 0 120px rgba(245,158,11,0.5), 0 0 180px rgba(245,158,11,0.3), inset 0 0 25px rgba(245,158,11,0.25)',
          },
          {
            badge: 'AD',
            badgeColor: 'bg-pink-600',
            brand: 'BLOOM SKINCARE',
            brandIcon: <Sparkles className="w-3 h-3" />,
            image: '/images/ads/bloom-skincare.jpg',
            headline: 'Glow Like a Supernova',
            subtext: 'Bioluminescent skincare that adapts to your skin in real-time. Science meets stardust.',
            details: '5-piece set: $149 | Dermatologist approved | Vegan',
            website: 'bloomskin.co',
            phone: '1-800-BLOOM-GLOW',
            address: 'New York, NY',
            hours: 'Free consultations daily',
            rating: '4.9',
            reviews: '22.7K',
            cta: 'Get Your Glow',
            ctaColor: 'bg-pink-600 hover:bg-pink-500',
            glowColor: 'pink',
            borderColor: 'border-pink-300',
            neonShadow: '0 0 20px rgba(236,72,153,1), 0 0 50px rgba(236,72,153,0.7), 0 0 100px rgba(236,72,153,0.4), 0 0 150px rgba(236,72,153,0.2), inset 0 0 20px rgba(236,72,153,0.2)',
            neonShadowHover: '0 0 25px rgba(236,72,153,1), 0 0 70px rgba(236,72,153,0.9), 0 0 120px rgba(236,72,153,0.5), 0 0 180px rgba(236,72,153,0.3), inset 0 0 25px rgba(236,72,153,0.25)',
          },
          {
            badge: 'SPONSORED',
            badgeColor: 'bg-violet-600',
            brand: 'WAVE STREAMING',
            brandIcon: <Waves className="w-3 h-3" />,
            image: '/images/ads/wave-streaming.jpg',
            headline: 'Stream the Multiverse',
            subtext: 'AI-curated entertainment that learns your vibe. Movies, music, and VR experiences in one.',
            details: 'All-access: $12.99/mo | 4K HDR | 6 screens',
            website: 'wavestream.tv',
            phone: '1-888-WAVE-TV',
            address: 'San Francisco, CA',
            hours: 'Support 24/7',
            rating: '4.8',
            reviews: '67.3K',
            cta: 'Dive In Free',
            ctaColor: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500',
            glowColor: 'violet',
            borderColor: 'border-violet-300',
            neonShadow: '0 0 20px rgba(139,92,246,1), 0 0 50px rgba(139,92,246,0.7), 0 0 100px rgba(139,92,246,0.4), 0 0 150px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.2)',
            neonShadowHover: '0 0 25px rgba(139,92,246,1), 0 0 70px rgba(139,92,246,0.9), 0 0 120px rgba(139,92,246,0.5), 0 0 180px rgba(139,92,246,0.3), inset 0 0 25px rgba(139,92,246,0.25)',
          },
          {
            badge: 'AD',
            badgeColor: 'bg-lime-600',
            brand: 'DRIFT ELECTRIC',
            brandIcon: <Zap className="w-3 h-3" />,
            image: '/images/ads/drift-ev.jpg',
            headline: 'Ride the Lightning',
            subtext: 'The EV that charges in 8 minutes and drives itself. Welcome to the future of mobility.',
            details: 'Model D-1 | $38,900 | 400mi range | Self-driving',
            website: 'driftelectric.com',
            phone: '1-800-DRIFT-EV',
            address: 'Austin, TX',
            hours: 'Test drives available daily',
            rating: '4.9',
            reviews: '8.9K',
            cta: 'Book Test Drive',
            ctaColor: 'bg-lime-600 hover:bg-lime-500',
            glowColor: 'lime',
            borderColor: 'border-lime-300',
            neonShadow: '0 0 20px rgba(132,204,22,1), 0 0 50px rgba(132,204,22,0.7), 0 0 100px rgba(132,204,22,0.4), 0 0 150px rgba(132,204,22,0.2), inset 0 0 20px rgba(132,204,22,0.2)',
            neonShadowHover: '0 0 25px rgba(132,204,22,1), 0 0 70px rgba(132,204,22,0.9), 0 0 120px rgba(132,204,22,0.5), 0 0 180px rgba(132,204,22,0.3), inset 0 0 25px rgba(132,204,22,0.25)',
          },
          // === OUT-OF-THIS-WORLD PROFESSIONAL ADS — COSMIC & FUTURISTIC ===
          {
            badge: 'SPONSORED',
            badgeColor: 'bg-sky-600',
            brand: 'ASTRAL TECH',
            brandIcon: <Sparkles className="w-3 h-3" />,
            image: '/images/ads/cipher-vpn.jpg',
            headline: 'Beyond the Stars',
            subtext: 'Neural interface headset that lets you control your devices with thought alone. The future is not coming — it is here.',
            details: 'AstralLink v3 | $499 | Pre-order now | Ships Q3',
            website: 'astraltech.io',
            phone: '1-888-ASTRAL-3',
            address: 'San Francisco, CA',
            hours: 'Pre-order 24/7',
            rating: '4.9',
            reviews: '52.1K',
            cta: 'Pre-Order Now',
            ctaColor: 'bg-sky-600 hover:bg-sky-500',
            glowColor: 'sky',
            borderColor: 'border-sky-300',
            neonShadow: '0 0 20px rgba(14,165,233,1), 0 0 50px rgba(14,165,233,0.7), 0 0 100px rgba(14,165,233,0.4), 0 0 150px rgba(14,165,233,0.2), inset 0 0 20px rgba(14,165,233,0.2)',
            neonShadowHover: '0 0 25px rgba(14,165,233,1), 0 0 70px rgba(14,165,233,0.9), 0 0 120px rgba(14,165,233,0.5), 0 0 180px rgba(14,165,233,0.3), inset 0 0 25px rgba(14,165,233,0.25)',
          },
          {
            badge: 'PROMOTED',
            badgeColor: 'bg-fuchsia-600',
            brand: 'COSMOS BEAUTY',
            brandIcon: <Star className="w-3 h-3" />,
            image: '/images/ads/bloom-skincare.jpg',
            headline: 'Stardust in a Bottle',
            subtext: 'Holographic nail polish that shifts through 12 colors based on light and movement. Wear the aurora borealis on your fingertips.',
            details: '8 shades | $28/bottle | Limited celestial collection',
            website: 'cosmosbeauty.co',
            phone: '1-800-COSMOS-GLOW',
            address: 'Miami, FL',
            hours: 'Drop goes live: Friday 8PM ET',
            rating: '4.9',
            reviews: '34.7K',
            cta: 'Catch the Drop',
            ctaColor: 'bg-fuchsia-600 hover:bg-fuchsia-500',
            glowColor: 'fuchsia',
            borderColor: 'border-fuchsia-300',
            neonShadow: '0 0 20px rgba(192,38,211,1), 0 0 50px rgba(192,38,211,0.7), 0 0 100px rgba(192,38,211,0.4), 0 0 150px rgba(192,38,211,0.2), inset 0 0 20px rgba(192,38,211,0.2)',
            neonShadowHover: '0 0 25px rgba(192,38,211,1), 0 0 70px rgba(192,38,211,0.9), 0 0 120px rgba(192,38,211,0.5), 0 0 180px rgba(192,38,211,0.3), inset 0 0 25px rgba(192,38,211,0.25)',
          },
          {
            badge: 'AD',
            badgeColor: 'bg-slate-600',
            brand: 'PRISM Optics',
            brandIcon: <Sparkles className="w-3 h-3" />,
            image: '/images/ads/echo-speakers.jpg',
            headline: 'See in Another Dimension',
            subtext: 'Smart glasses with real-time AR overlay, translation, and infinite zoom. The world just got an upgrade.',
            details: 'Prism Pro | $799 | Prescription compatible | 12hr battery',
            website: 'prismoptics.com',
            phone: '1-833-PRISM-AR',
            address: 'Seattle, WA',
            hours: 'Order now — ships in 2 days',
            rating: '4.8',
            reviews: '18.9K',
            cta: 'Experience AR',
            ctaColor: 'bg-slate-600 hover:bg-slate-500',
            glowColor: 'slate',
            borderColor: 'border-slate-300',
            neonShadow: '0 0 20px rgba(148,163,184,1), 0 0 50px rgba(148,163,184,0.7), 0 0 100px rgba(148,163,184,0.4), 0 0 150px rgba(148,163,184,0.2), inset 0 0 20px rgba(148,163,184,0.2)',
            neonShadowHover: '0 0 25px rgba(148,163,184,1), 0 0 70px rgba(148,163,184,0.9), 0 0 120px rgba(148,163,184,0.5), 0 0 180px rgba(148,163,184,0.3), inset 0 0 25px rgba(148,163,184,0.25)',
          },
          {
            badge: 'SPONSORED',
            badgeColor: 'bg-teal-600',
            brand: 'VOID FRAGRANCE',
            brandIcon: <Sparkles className="w-3 h-3" />,
            image: '/images/ads/velvet-skin.jpg',
            headline: 'Wear the Cosmos',
            subtext: 'A fragrance engineered from molecular data of actual meteorites. Smell like nothing on Earth — because it is not from Earth.',
            details: '50ml | $185 | Unisex | Limited to 2,000 bottles',
            website: 'voidfragrance.com',
            phone: '1-888-VOID-SCT',
            address: 'New York, NY',
            hours: 'Available now while supplies last',
            rating: '4.9',
            reviews: '7.3K',
            cta: 'Claim Your Bottle',
            ctaColor: 'bg-teal-600 hover:bg-teal-500',
            glowColor: 'teal',
            borderColor: 'border-teal-300',
            neonShadow: '0 0 20px rgba(20,184,166,1), 0 0 50px rgba(20,184,166,0.7), 0 0 100px rgba(20,184,166,0.4), 0 0 150px rgba(20,184,166,0.2), inset 0 0 20px rgba(20,184,166,0.2)',
            neonShadowHover: '0 0 25px rgba(20,184,166,1), 0 0 70px rgba(20,184,166,0.9), 0 0 120px rgba(20,184,166,0.5), 0 0 180px rgba(20,184,166,0.3), inset 0 0 25px rgba(20,184,166,0.25)',
          },
          {
            badge: 'PROMOTED',
            badgeColor: 'bg-violet-600',
            brand: 'NEBULA DRINKS',
            brandIcon: <Waves className="w-3 h-3" />,
            image: '/images/ads/surge-can.jpg',
            headline: 'Taste the Galaxy',
            subtext: 'Sparkling adaptogen beverages with color-shifting micro-crystals. Every sip is a light show. Zero alcohol, infinite vibes.',
            details: '4 cosmic flavors | $4.99/can | Variety 8-pack $34',
            website: 'nebuladrinks.com',
            phone: '1-800-NEBULA-8',
            address: 'Austin, TX',
            hours: 'Delivered in 30 min or less',
            rating: '4.8',
            reviews: '41.2K',
            cta: 'Try the Galaxy',
            ctaColor: 'bg-violet-600 hover:bg-violet-500',
            glowColor: 'violet',
            borderColor: 'border-violet-300',
            neonShadow: '0 0 20px rgba(139,92,246,1), 0 0 50px rgba(139,92,246,0.7), 0 0 100px rgba(139,92,246,0.4), 0 0 150px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.2)',
            neonShadowHover: '0 0 25px rgba(139,92,246,1), 0 0 70px rgba(139,92,246,0.9), 0 0 120px rgba(139,92,246,0.5), 0 0 180px rgba(139,92,246,0.3), inset 0 0 25px rgba(139,92,246,0.25)',
          },
          {
            badge: 'AD',
            badgeColor: 'bg-rose-600',
            brand: 'ECLIPSE AUTO',
            brandIcon: <Zap className="w-3 h-3" />,
            image: '/images/ads/drift-ev.jpg',
            headline: 'Driving Reinvented',
            subtext: 'The hypercar that runs on solar paint. 0-60 in 1.8 seconds. 800 mile range. Painted with photovoltaic nanocoating.',
            details: 'Eclipse One | $142,000 | Reserve $5,000 | 2026 delivery',
            website: 'eclipseauto.com',
            phone: '1-888-ECLIPSE-1',
            address: 'Los Angeles, CA',
            hours: 'Reservations open now',
            rating: '5.0',
            reviews: '3.4K',
            cta: 'Reserve Yours',
            ctaColor: 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500',
            glowColor: 'rose',
            borderColor: 'border-rose-300',
            neonShadow: '0 0 20px rgba(244,63,94,1), 0 0 50px rgba(244,63,94,0.7), 0 0 100px rgba(244,63,94,0.4), 0 0 150px rgba(244,63,94,0.2), inset 0 0 20px rgba(244,63,94,0.2)',
            neonShadowHover: '0 0 25px rgba(244,63,94,1), 0 0 70px rgba(244,63,94,0.9), 0 0 120px rgba(244,63,94,0.5), 0 0 180px rgba(244,63,94,0.3), inset 0 0 25px rgba(244,63,94,0.25)',
          },
        ];

        // Check if this post index hits an ad threshold
        let actualShowAd = false;
        let actualAdIdx = 0;
        let cumSum = 0;
        for (let s = 0; s < AD_INTERVALS.length; s++) {
          cumSum += AD_INTERVALS[s];
          if ((index + 1) === cumSum) {
            actualShowAd = true;
            actualAdIdx = s;
            break;
          }
        }
        const ad = AD_PROMOS[actualAdIdx % AD_PROMOS.length];

        return (
          <React.Fragment key={isEcho ? `echo-${(post as any)._echoId || post.id}` : post.id}>
            {/* Ad Card — realistic business ad with strong glowing neon border */}
            {actualShowAd && (
              <div
                className={`rounded-2xl overflow-hidden border-[3px] ${ad.borderColor} bg-black/80 backdrop-blur-xl transition-all duration-300 cursor-pointer group/ad`}
                style={{
                  boxShadow: ad.neonShadow,
                  animation: `ad-pulse-${ad.glowColor} 2s ease-in-out infinite alternate`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = ad.neonShadowHover; e.currentTarget.style.animationPlayState = 'paused'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ad.neonShadow; e.currentTarget.style.animationPlayState = 'running'; }}
              >
                {/* Ad header: badge + brand + rating */}
                <div className="flex items-center justify-between p-3 pb-0">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${ad.badgeColor} text-white text-[10px] font-bold tracking-wider shadow-lg`}>
                      <Megaphone className="w-3 h-3" />
                      {ad.badge}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-amber-400 text-[10px] font-bold">{ad.rating}</span>
                      <span className="text-slate-500 text-[9px]">({ad.reviews})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 text-white text-[11px] font-bold tracking-wider">
                    {ad.brandIcon}
                    {ad.brand}
                  </div>
                </div>
                {/* Ad image */}
                <div className="relative mx-3 mt-2 rounded-xl overflow-hidden max-h-[200px]">
                  <img
                    src={ad.image}
                    alt={ad.brand}
                    className="w-full h-full object-cover group-hover/ad:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                {/* Ad content with full business details */}
                <div className="px-4 pt-3 pb-4">
                  <h3 className="text-white font-bold text-lg mb-1">{ad.headline}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-2">{ad.subtext}</p>
                  {/* Product details */}
                  <p className="text-slate-400 text-xs leading-relaxed mb-3 font-medium">{ad.details}</p>
                  {/* Business info row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" />{ad.website}</span>
                    <span className="flex items-center gap-1">{ad.phone}</span>
                    <span className="flex items-center gap-1">{ad.address}</span>
                  </div>
                  {/* CTA row */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] font-medium">{ad.hours}</span>
                    <button className={`flex items-center gap-2 px-5 py-2 rounded-xl ${ad.ctaColor} text-white text-sm font-bold transition-all shadow-xl`}>
                      {ad.cta}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div id={`post-${post.id}`} className={`glass-panel rounded-2xl overflow-hidden hover:border-violet-500/20 transition-all relative  ${echoAnimation === post.id ? 'echo-ripple' : ''}`}>
            {/* Reaction Animation Burst — shows the correct emoji */}
            {likeAnimation === post.id && (() => {
              const reactionDef = REACTION_TYPES.find(r => r.key === likeAnimationReaction);
              const emoji = reactionDef?.emoji || '❤️';
              return (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <span className="text-7xl animate-ping opacity-60 drop-shadow-lg">{emoji}</span>
                </div>
              );
            })()}

            {/* Shared Indicator */}
            {isShared && (
              <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-violet-400">
                <Share2 className="w-3 h-3" />
                <span>{displayName} shared</span>
              </div>
            )}

            {/* Post Header — for echo posts this is the ECHOER, for normal posts this is the AUTHOR */}
            <div className="flex items-center gap-3 p-4 pb-2">
              <button
                onClick={() => { setViewingUser(headerUser.id); setView('profile'); }}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <AuraGlowAvatar src={resolveImageUrl(headerUser.avatar)} alt={headerUser.name} level={auraLevel} vibeTag={currentVibe || undefined} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setViewingUser(headerUser.id); setView('profile'); }}
                    className="font-semibold text-white text-sm hover:text-violet-300 transition-colors"
                  >
                    {headerUser.name}
                  </button>
                  {headerUser.verified && <BadgeCheck className="w-4 h-4 text-violet-400 fill-violet-400/20" />}
                  {headerIsCurrentUser && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 font-bold">YOU</span>}
                  {isEcho && (
                    <>
                      <Waves className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                      <span className="text-[10px] text-emerald-400 font-medium">Echoed</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{(() => { const t = isEcho && (post as any).echoedAt ? timeAgo(new Date((post as any).echoedAt)) : post.time; return t; })()}</span>
                  {!isEcho && post.type === 'text' && <span className="text-slate-600">•</span>}
                  {!isEcho && post.type === 'text' && <span className="text-slate-600">Pulse</span>}
                  {!isEcho && post.type === 'poll' && <span className="text-slate-600">•</span>}
                  {!isEcho && post.type === 'poll' && <span className="text-violet-400">Poll</span>}
                  {!isEcho && post.type === 'video' && <span className="text-slate-600">•</span>}
                  {!isEcho && post.type === 'video' && <span className="text-red-400">Reel</span>}
                  {!isEcho && post.type === 'image' && <span className="text-slate-600">•</span>}
                  {!isEcho && post.type === 'image' && <span className="text-emerald-400">Photo</span>}
                  {!isEcho && post.type === 'voice' && <span className="text-slate-600">•</span>}
                  {!isEcho && post.type === 'voice' && <span className="text-fuchsia-400">Voice</span>}
                  {post.vibeTag && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        post.vibeTag === 'hyped' ? 'bg-red-500/20 text-red-400' :
                        post.vibeTag === 'laughing' ? 'bg-amber-500/20 text-amber-400' :
                        post.vibeTag === 'chill' ? 'bg-emerald-500/20 text-emerald-400' :
                        post.vibeTag === 'dramatic' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                        post.vibeTag === 'focused' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>{vibeLabels[post.vibeTag]?.split('/')[0]?.trim()}</span>
                    </>
                  )}
                </div>
              </div>
              {headerIsCurrentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDeleteMenu(showDeleteMenu === post.id ? null : post.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                  {showDeleteMenu === post.id && (
                    <div className="absolute right-0 top-8 z-20 glass-panel rounded-xl p-1 border border-white/10 min-w-[120px]">
                      <button
                        onClick={() => {
                          deleteUserPost(post.id);
                          fetch(`/api/posts/${post.id}`, { method: 'DELETE' }).catch(() => {});
                          queryClient.invalidateQueries({ queryKey: ['posts'] });
                          setShowDeleteMenu(null);
                          toast.success('Post deleted');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Post
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="p-1.5 rounded-lg hover:bg-white/5 transition-all">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Echo card: original post nested inside */}
            {isEcho ? (
              <div
                onClick={() => { setViewingEchoId((post as any)._echoId || null); setViewingPostId(post.id); setView('postDetail'); }}
                className="mx-4 mb-3 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden cursor-pointer hover:border-emerald-500/30 transition-all"
              >
                {/* Original Author Header */}
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <button
                    onClick={() => { setViewingUser(post.user.id); setView('profile'); }}
                    className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                      <img src={resolveImageUrl(post.user.avatar)} alt={post.user.name} className="w-full h-full object-cover" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setViewingUser(post.user.id); setView('profile'); }}
                        className="text-xs font-semibold text-slate-200 hover:text-violet-300 transition-colors"
                      >
                        {post.user.name}
                      </button>
                      {post.user.verified && <BadgeCheck className="w-3 h-3 text-violet-400 fill-violet-400/20" />}
                    </div>
                    <span className="text-[10px] text-slate-500">@{post.user.handle?.replace('@', '') || post.user.name.toLowerCase().replace(/\s/g, '')}</span>
                  </div>
                </div>
                {/* Original Post Content */}
                {post.text && (
                  <div className="px-3 pb-2">
                    <p className="text-sm text-slate-300 leading-relaxed">{post.text}</p>
                  </div>
                )}
                {/* Original Post Images */}
                {post.images.length > 0 && post.type !== 'video' && (
                  <div className="mx-3 mb-2 rounded-lg overflow-hidden">
                    {post.images.length === 1 ? (
                      <div className="relative overflow-hidden group cursor-pointer max-h-[300px]" onClick={() => openLightbox(post.images, 0)}>
                        <img
                          src={resolveImageUrl(post.images[0])}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div
                          className="w-full h-full bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 items-center justify-center absolute inset-0"
                          style={{ display: 'none' }}
                        >
                          <ImageIcon className="w-6 h-6 text-violet-400/50" />
                        </div>
                      </div>
                    ) : (
                      <PostImageCarousel images={post.images} maxH="max-h-[300px]" imgIconSize="w-6 h-6" onImageClick={(i) => openLightbox(post.images, i)} />
                    )}
                  </div>
                )}
                {/* Original Post Video */}
                {post.type === 'video' && post.images.length > 0 && (
                  <div className="mx-3 mb-2 rounded-lg overflow-hidden">
                    <video
                      src={resolveImageUrl(post.images[0])}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-[300px] object-cover rounded-lg"
                    />
                  </div>
                )}
                {/* Original Post Voice Note */}
                {post.type === 'voice' && (post as any).audioUrl && (
                  <div className="mx-3 mb-2">
                    <VoicePlayer
                      audioUrl={(post as any).audioUrl}
                      avatarUrl={post.user.avatar}
                      authorName={post.user.name}
                    />
                  </div>
                )}
                {/* Original Post Poll */}
                {post.poll && (
                  <div className="px-3 pb-2">
                    <PollRenderer poll={post.poll} postId={post.id} />
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Normal Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-slate-200 leading-relaxed">{post.text}</p>
                </div>

                {/* Poll Rendering */}
                {post.poll && (
                  <PollRenderer poll={post.poll} postId={post.id} />
                )}

                {/* Post Images */}
                {post.images.length > 0 && post.type !== 'video' && (
                  <div className="mx-4 mb-3 rounded-xl overflow-hidden">
                    {post.images.length === 1 ? (
                      <div className="relative overflow-hidden group cursor-pointer max-h-[400px]" onClick={() => openLightbox(post.images, 0)}>
                        <img
                          src={resolveImageUrl(post.images[0])}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div
                          className="w-full h-full bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 items-center justify-center absolute inset-0"
                          style={{ display: 'none' }}
                        >
                          <ImageIcon className="w-8 h-8 text-violet-400/50" />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ) : (
                      <PostImageCarousel images={post.images} maxH="max-h-[400px]" imgIconSize="w-8 h-8" onImageClick={(i) => openLightbox(post.images, i)} />
                    )}
                  </div>
                )}

                {/* Post Video (for reel/video type posts) */}
                {post.type === 'video' && post.images.length > 0 && (
                  <div className="mx-4 mb-3 rounded-xl overflow-hidden">
                    <video
                      src={resolveImageUrl(post.images[0])}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-[400px] object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* Post Voice Note (for voice type posts) */}
                {post.type === 'voice' && (post as any).audioUrl && (
                  <VoicePlayer
                    audioUrl={(post as any).audioUrl}
                    avatarUrl={post.user.avatar}
                    authorName={post.user.name}
                  />
                )}
              </>
            )}

            {/* Engagement Stats - Reaction emoji + Comments toggleable */}
            {(post.likes > 0 || totalComments >= 0) && (
              <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  {/* Show reaction emoji based on user's reaction */}
                  {isLiked && (() => {
                    const reaction = postReactions[post.id] || post.myReaction || 'like';
                    const reactionDef = REACTION_TYPES.find(r => r.key === reaction);
                    return (
                      <span className="text-sm">{reactionDef?.emoji || '❤️'}</span>
                    );
                  })()}
                  {!isLiked && (
                    <Heart className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>{(post.likes + (likedPosts.has(post.id) && !post.isLiked ? 1 : 0)).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1 transition-colors ${showComments ? 'text-violet-400' : totalComments === 0 ? 'text-slate-600 hover:text-slate-400' : 'text-slate-500 hover:text-white'}`}
                  >
                    <span>{totalComments} comment{totalComments !== 1 ? 's' : ''}</span>
                    {totalComments > 0 && (
                      <svg className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  <span>{(post.shares + (repostIds.has(post.id) && !post.isReposted ? 1 : 0))} echo{(post.shares + (repostIds.has(post.id) && !post.isReposted ? 1 : 0)) !== 1 ? 'es' : ''}</span>
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
              <div className="flex items-center gap-1 flex-1">
                {/* Reaction Button — click for Like, long-press/hover for reaction picker */}
                <div className="relative flex-1">
                  {showReactionPicker === post.id && (
                    <ReactionPicker
                      postId={post.id}
                      onSelect={(reaction) => handleReaction(post.id, reaction)}
                      onClose={() => setShowReactionPicker(null)}
                    />
                  )}
                  <button
                    onClick={() => { if (!isLongPress) handleLike(post.id); setIsLongPress(false); }}
                    onTouchStart={() => {
                      setIsLongPress(false);
                      const timer = setTimeout(() => {
                        setIsLongPress(true);
                        setShowReactionPicker(showReactionPicker === post.id ? null : post.id);
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onTouchEnd={() => { if (longPressTimer) clearTimeout(longPressTimer); setLongPressTimer(null); }}
                    onTouchMove={() => { if (longPressTimer) clearTimeout(longPressTimer); setLongPressTimer(null); }}
                    onMouseDown={() => {
                      setIsLongPress(false);
                      const timer = setTimeout(() => {
                        setIsLongPress(true);
                        setShowReactionPicker(showReactionPicker === post.id ? null : post.id);
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onMouseUp={() => { if (longPressTimer) clearTimeout(longPressTimer); setLongPressTimer(null); }}
                    onMouseLeave={() => { if (longPressTimer) clearTimeout(longPressTimer); setLongPressTimer(null); }}
                    onContextMenu={(e) => { e.preventDefault(); setShowReactionPicker(showReactionPicker === post.id ? null : post.id); }}
                    className="flex items-center gap-1 group w-full justify-center py-2 rounded-xl transition-all relative hover:bg-white/5"
                  >
                    {isLiked ? (() => {
                      const reaction = postReactions[post.id] || post.myReaction || 'like';
                      const reactionDef = REACTION_TYPES.find(r => r.key === reaction);
                      return (
                        <>
                          <span className="text-lg">{reactionDef?.emoji || '❤️'}</span>
                          <span className={`text-xs font-medium ${reactionDef?.color || 'text-red-400'}`}>{reactionDef?.label || 'Like'}</span>
                        </>
                      );
                    })() : (
                      <>
                        <Heart className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
                        <span className="text-xs font-medium text-slate-400">Like</span>
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => isEcho ? (setViewingEchoId((post as any)._echoId || null), setViewingPostId(post.id), setView('postDetail')) : toggleComments(post.id)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white flex-1 justify-center py-2 rounded-xl hover:bg-violet-500/10 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">Comment</span>
                </button>
                <button
                  onClick={() => handleEcho(post.id)}
                  className="flex items-center gap-1 flex-1 justify-center py-2 rounded-xl hover:bg-emerald-500/10 transition-all"
                >
                  <Waves className={`w-5 h-5 transition-all ${isReposted ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'} ${echoAnimation === post.id ? 'echo-wave-icon' : ''}`} />
                  <span className={`text-xs font-medium transition-colors ${isReposted ? 'text-emerald-400' : 'text-slate-400'}`}>Echo</span>
                </button>
                <button
                  onClick={() => toggleShareModal(post.id)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white flex-1 justify-center py-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Share</span>
                </button>
              </div>
              <button
                onClick={() => { toggleSave(post.id); toggleSaveApi.mutate({ targetId: post.id, targetType: 'post' }, { onError: () => {} }); toast.success(isSaved ? 'Post unsaved' : 'Post saved!', { duration: 1500 }); }}
                className="text-slate-400 hover:text-violet-400 p-1.5 rounded-lg hover:bg-white/5 transition-all ml-2"
              >
                <Bookmark className={`w-[18px] h-[18px] ${isSaved ? 'fill-violet-400 text-violet-400' : ''}`} />
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <PostCommentsSection postId={post.id} currentUser={{ id: currentUser.id, name: displayName, avatar: displayAvatar }} commentCount={totalComments} />
            )}
          </div>
          </React.Fragment>
        );
      })}

      {/* Infinite scroll sentinel — IntersectionObserver watches this */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more posts — skeleton cards for smooth UX */}
      {isFetchingNextPage && (
        <div className="space-y-4 py-2">
          {/* Skeleton card 1 */}
          <div className="glass-panel rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-2 w-16 rounded-full bg-white/5" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-3/4 rounded-full bg-white/10" />
            </div>
            <div className="mt-3 h-40 rounded-xl bg-white/5" />
            <div className="mt-3 flex justify-around">
              <div className="h-6 w-16 rounded-full bg-white/5" />
              <div className="h-6 w-16 rounded-full bg-white/5" />
              <div className="h-6 w-16 rounded-full bg-white/5" />
              <div className="h-6 w-16 rounded-full bg-white/5" />
            </div>
          </div>
          {/* Skeleton card 2 */}
          <div className="glass-panel rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded-full bg-white/10" />
                <div className="h-2 w-14 rounded-full bg-white/5" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-1/2 rounded-full bg-white/10" />
            </div>
            <div className="mt-3 flex justify-around">
              <div className="h-6 w-16 rounded-full bg-white/5" />
              <div className="h-6 w-16 rounded-full bg-white/5" />
              <div className="h-6 w-16 rounded-full bg-white/5" />
              <div className="h-6 w-16 rounded-full bg-white/5" />
            </div>
          </div>
          {/* Center spinner */}
          <div className="flex items-center justify-center py-2">
            <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <span className="ml-2 text-xs text-slate-500">Loading more vibes...</span>
          </div>
        </div>
      )}

      {/* End of feed — beautiful cosmic closure */}
      {!hasNextPage && filteredPosts.length > 0 && !postsLoading && (
        <div className="text-center py-10 space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
          </div>
          <p className="text-sm font-semibold text-violet-300">You&apos;ve explored every vibe</p>
          <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Pull down to refresh or tap Home for the latest pulses</p>
        </div>
      )}

      <ImageLightbox key={lightboxKey} images={lightboxImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </div>
  );
}
