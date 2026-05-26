'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import {
  Radio,
  Eye,
  Clock,
  Heart,
  MessageCircle,
  Gift,
  Send,
  X,
  MonitorUp,
  ChevronUp,
  ChevronDown,
  Users,
  BadgeCheck,
  Zap,
  Plus,
  Loader2,
  Video,
  StopCircle,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  isLive: boolean;
  viewerCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  category?: string;
  creator: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  isSystem?: boolean;
}

// ─── Simulated Chat ──────────────────────────────────────────────────────────

const SIMULATED_USERS = [
  { name: 'Luna Sky', avatar: '/api/uploads?path=images/avatars/luna-avatar.jpg' },
  { name: 'Kai Storm', avatar: '/api/uploads?path=images/avatars/kai-avatar.jpg' },
  { name: 'Nova Blaze', avatar: '/api/uploads?path=images/avatars/nova-avatar.jpg' },
  { name: 'Zara Miles', avatar: '/api/uploads?path=images/avatars/zara-avatar.jpg' },
  { name: 'Jay Parker', avatar: '/api/uploads?path=images/avatars/jay-avatar.jpg' },
  { name: 'Maya Chen', avatar: '/api/uploads?path=images/avatars/maya-avatar.jpg' },
  { name: 'Dre Williams', avatar: '/api/uploads?path=images/avatars/dre-avatar.jpg' },
  { name: 'Sarah Kim', avatar: '/api/uploads?path=images/avatars/sarah-avatar.jpg' },
  { name: 'Marcus Rivera', avatar: '/api/uploads?path=images/avatars/marcus-avatar.jpg' },
  { name: 'Elena Rodriguez', avatar: '/api/uploads?path=images/avatars/elena-avatar.jpg' },
  { name: 'Cyber Drifter', avatar: '/api/uploads?path=images/avatars/cyber-avatar.jpg' },
  { name: 'Music Central', avatar: '/api/uploads?path=images/avatars/music-avatar.jpg' },
];

const SIMULATED_MESSAGES = [
  'Hey everyone! 🔥',
  'This is amazing!',
  'Love this stream 💜',
  'First time here!',
  'Can you do a shoutout?',
  'Vibes are immaculate ✨',
  'How long have you been streaming?',
  'That was so cool!',
  '🙌🙌🙌',
  'Love the energy!',
  'You rock!',
  "Let's gooo 🔥🔥",
  'Where are you from?',
  'This made my day',
  'ORRA fam! 💯',
  'Just joined! 🎉',
  'W stream!',
  'Best live on ORRA rn',
  'yo this is fire',
  'how do I get the badge?',
  'can you follow me back?',
  'the quality is insane',
  'been watching for 20 mins straight',
  'dropped a gift for you 💝',
  'lmao 😂😂',
  'anyone else from Texas?',
  'turn the mic up!',
  'you should collab with @novablaze',
  'chat is poppin tonight',
  'brb grabbing snacks',
  'this beat goes hard 🎵',
  'first live I caught today',
  'youre so real for this',
  'the lighting looks great btw',
  'happy to be here 🙏',
];

// ─── Format Duration ──────────────────────────────────────────────────────────

function formatDuration(createdAt: string): string {
  let elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (isNaN(elapsed) || elapsed < 0) return '00:00';
  // Cap at ~1hr max — stale DB records can show days-long durations which is unrealistic
  // Use a simple hash of createdAt to give each stream a unique capped duration
  if (elapsed > 3600) {
    let hash = 0;
    for (let i = 0; i < createdAt.length; i++) hash = ((hash << 5) - hash + createdAt.charCodeAt(i)) | 0;
    elapsed = 2700 + Math.abs(hash % 900); // 45min to 1hr range
  }
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Format Viewer Count (realistic) ──────────────────────────────────────────

function formatViewerCount(count: number): string {
  if (count >= 10000) return `${(count / 1000).toFixed(1)}K`;
  return count.toLocaleString();
}

// ─── Simulated Live Streams (seeded when DB is empty) ─────────────────────────

const SEED_LIVE_STREAMS: LiveStream[] = (() => {
  const now = Date.now();
  const seedCreators = [
    { id: 's-u1', name: 'Luna Sky', handle: '@lunasky', avatar: '/api/uploads?path=images/avatars/luna-avatar.jpg', verified: true },
    { id: 's-u2', name: 'Kai Storm', handle: '@kaistorm', avatar: '/api/uploads?path=images/avatars/kai-avatar.jpg', verified: false },
    { id: 's-u3', name: 'Nova Blaze', handle: '@novablaze', avatar: '/api/uploads?path=images/avatars/nova-avatar.jpg', verified: true },
    { id: 's-u4', name: 'Zara Miles', handle: '@zaramiles', avatar: '/api/uploads?path=images/avatars/zara-avatar.jpg', verified: false },
    { id: 's-u5', name: 'Jay Parker', handle: '@jayparker', avatar: '/api/uploads?path=images/avatars/jay-avatar.jpg', verified: true },
    { id: 's-u6', name: 'Maya Chen', handle: '@mayachen', avatar: '/api/uploads?path=images/avatars/maya-avatar.jpg', verified: false },
    { id: 's-u7', name: 'Dre Williams', handle: '@drewilliams', avatar: '/api/uploads?path=images/avatars/dre-avatar.jpg', verified: true },
    { id: 's-u8', name: 'Sarah Kim', handle: '@sarahkim', avatar: '/api/uploads?path=images/avatars/sarah-avatar.jpg', verified: false },
    { id: 's-u9', name: 'Marcus Rivera', handle: '@marcusr', avatar: '/api/uploads?path=images/avatars/marcus-avatar.jpg', verified: true },
    { id: 's-u10', name: 'Elena Rodriguez', handle: '@elenarod', avatar: '/api/uploads?path=images/avatars/elena-avatar.jpg', verified: false },
    { id: 's-u11', name: 'Cyber Drifter', handle: '@cyberdrift', avatar: '/api/uploads?path=images/avatars/cyber-avatar.jpg', verified: true },
    { id: 's-u12', name: 'Music Central', handle: '@musiccentral', avatar: '/api/uploads?path=images/avatars/music-avatar.jpg', verified: false },
  ];
  const seedStreams = [
    { title: 'Late night vibes come chill 🌙', category: 'Music', viewerCount: 147, likesCount: 89, commentsCount: 23, thumbnail: '/images/reels/reel1.jpg' },
    { title: 'Ranked grind — push to diamond', category: 'Gaming', viewerCount: 283, likesCount: 156, commentsCount: 47, thumbnail: '/images/reels/reel2.jpg' },
    { title: 'Painting session pt.2', category: 'Art', viewerCount: 34, likesCount: 22, commentsCount: 8, thumbnail: '/images/reels/reel3.jpg' },
    { title: 'Cooking something special 👨‍🍳', category: 'Lifestyle', viewerCount: 72, likesCount: 41, commentsCount: 15, thumbnail: '/images/reels/reel5.jpg' },
    { title: 'Dance challenge — who wants next?', category: 'Dance', viewerCount: 198, likesCount: 134, commentsCount: 39, thumbnail: '/images/reels/reel6.jpg' },
    { title: 'Storytime + Q&A', category: 'Comedy', viewerCount: 56, likesCount: 31, commentsCount: 12, thumbnail: '/images/reels/reel7.jpg' },
    { title: 'Pre-game warm up 🏀', category: 'Sports', viewerCount: 421, likesCount: 287, commentsCount: 64, thumbnail: '/images/reels/reel8.jpg' },
    { title: 'Just chatting fr fr', category: 'Trending', viewerCount: 93, likesCount: 52, commentsCount: 19, thumbnail: '/images/reels/reel10.jpg' },
    { title: 'Beat making live 🔥', category: 'Music', viewerCount: 168, likesCount: 97, commentsCount: 31, thumbnail: '/images/reels/reel11.jpg' },
    { title: 'Trending sounds react', category: 'Trending', viewerCount: 312, likesCount: 201, commentsCount: 55, thumbnail: '/images/reels/reel12.jpg' },
    { title: 'Morning yoga flow 🧘', category: 'Lifestyle', viewerCount: 47, likesCount: 28, commentsCount: 9, thumbnail: '/images/reels/reel3.jpg' },
    { title: 'COD marathon lets gooo', category: 'Gaming', viewerCount: 576, likesCount: 342, commentsCount: 87, thumbnail: '/images/reels/reel2.jpg' },
  ];
  // Stagger start times realistically: from 2 min ago to 1h8m ago
  // Varied offsets — no two streams started at the same round time
  const startOffsets = [
    127000,   // 2:07
    483000,   // 8:03
    312000,   // 5:12
    1740000,  // 29:00
    647000,   // 10:47
    238000,   // 3:58
    891000,   // 14:51
    56000,    // 0:56
    1523000,  // 25:23
    714000,   // 11:54
    2637000,  // 43:57
    4092000,  // 1:08:12
  ];

  return seedStreams.map((s, i) => ({
    id: `seed-live-${i}`,
    title: s.title,
    thumbnail: s.thumbnail,
    isLive: true,
    viewerCount: s.viewerCount,
    likesCount: s.likesCount,
    commentsCount: s.commentsCount,
    createdAt: new Date(now - startOffsets[i]).toISOString(),
    category: s.category,
    creator: seedCreators[i],
  }));
})();

// ─── Small Browse Card (2-3 visible at once) ──────────────────────────────────

function LiveBrowseCard({
  stream,
  onClick,
}: {
  stream: LiveStream;
  onClick: () => void;
}) {
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 0);
  const [duration, setDuration] = useState(formatDuration(stream.createdAt));

  // Tick viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tick duration
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(formatDuration(stream.createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [stream.createdAt]);

  // Category gradient
  const categoryGradients: Record<string, string> = {
    'Music': 'from-violet-900/80 to-purple-950/90',
    'Dance': 'from-pink-900/80 to-rose-950/90',
    'Comedy': 'from-amber-900/80 to-orange-950/90',
    'Sports': 'from-emerald-900/80 to-green-950/90',
    'Art': 'from-cyan-900/80 to-teal-950/90',
    'Lifestyle': 'from-rose-900/80 to-pink-950/90',
    'Gaming': 'from-indigo-900/80 to-blue-950/90',
    'Trending': 'from-red-900/80 to-violet-950/90',
  };
  const bgGradient = categoryGradients[stream.category || 'Trending'] || 'from-red-900/80 to-violet-950/90';

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 hover:border-red-500/30 transition-all group live-card-glow relative"
    >
      {/* Thumbnail / visual area — aspect-video so cards are a nice size */}
      <div className={`relative aspect-video bg-gradient-to-br ${bgGradient}`}>
        {/* Background image */}
        {stream.thumbnail ? (
          <img
            src={resolveImageUrl(stream.thumbnail)}
            alt=""
            className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={resolveImageUrl(stream.creator.avatar)}
              alt={stream.creator.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-red-500/30 opacity-50"
            />
          </div>
        )}

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

        {/* Top-left: LIVE badge + viewer count + duration */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[9px] font-black uppercase tracking-widest">LIVE</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
            <Eye className="w-3 h-3 text-white/70" />
            <span className="text-white text-[9px] font-medium tabular-nums">{formatViewerCount(viewerCount)}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
            <Clock className="w-3 h-3 text-white/70" />
            <span className="text-white text-[9px] font-medium tabular-nums">{duration}</span>
          </div>
        </div>

        {/* Category pill top-right */}
        {stream.category && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[9px] text-white/70 font-medium">
              {stream.category}
            </span>
          </div>
        )}

        {/* Bottom: Streamer info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={resolveImageUrl(stream.creator.avatar)}
                alt={stream.creator.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500/40"
              />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-600 border border-black flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            {/* Name + title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-bold truncate">{stream.creator.name}</span>
                {stream.creator.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 flex-shrink-0" />
                )}
              </div>
              <p className="text-white/50 text-[10px] truncate">{stream.title || 'Live now'}</p>
            </div>
            {/* Watch button */}
            <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold group-hover:opacity-90 transition-all shadow-[0_0_12px_rgba(239,68,68,0.3)]">
              Watch
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Full-Screen Live Viewer (opened when clicking a card) ────────────────────

function LiveFullScreenViewer({
  stream,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
  isLast,
}: {
  stream: LiveStream;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex: number;
  totalCount: number;
  isLast?: boolean;
}) {
  const { toggleFollow, followedUsers, setViewingUser, setView } = useAuraStore();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      user: 'ORRA',
      avatar: '/api/uploads?path=images/orra-logo.png',
      text: `Welcome to ${stream.creator.name}'s live stream! 🎉`,
      isSystem: true,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stream.likesCount || 0);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const [streamDuration, setStreamDuration] = useState(formatDuration(stream.createdAt));
  const chatEndRef = useRef<HTMLDivElement>(null);
  const heartIdRef = useRef(0);
  const isFollowed = followedUsers.has(stream.creator.id);

  // Simulated chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      const user = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)];
      const text = SIMULATED_MESSAGES[Math.floor(Math.random() * SIMULATED_MESSAGES.length)];
      setChatMessages((prev) => [
        ...prev.slice(-30),
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user: user.name,
          avatar: user.avatar,
          text,
        },
      ]);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulated viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update stream duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamDuration(formatDuration(stream.createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [stream.createdAt]);

  // Auto-scroll chat
  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Send heart
  const sendHeart = useCallback(() => {
    const id = heartIdRef.current++;
    setFloatingHearts((prev) => [...prev, id]);
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h !== id));
    }, 2000);
  }, [isLiked]);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    const currentUser = useAuraStore.getState().currentUserProfile;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `my-${Date.now()}`,
        user: currentUser?.name || 'You',
        avatar: currentUser?.avatar || '/api/uploads?path=images/orra-logo.png',
        text: chatInput.trim(),
      },
    ]);
    setChatInput('');
  }, [chatInput]);

  // Double-tap for heart
  const lastTapRef = useRef<number>(0);
  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input') || target.closest('a')) return;
      const now = Date.now();
      const timeDiff = now - lastTapRef.current;
      lastTapRef.current = now;
      if (timeDiff < 300 && timeDiff > 0) {
        sendHeart();
      }
    },
    [sendHeart]
  );

  // Category gradient
  const categoryGradients: Record<string, string> = {
    'Music': 'from-violet-900/80 via-purple-950/60 to-black/90',
    'Dance': 'from-pink-900/80 via-rose-950/60 to-black/90',
    'Comedy': 'from-amber-900/80 via-orange-950/60 to-black/90',
    'Sports': 'from-emerald-900/80 via-green-950/60 to-black/90',
    'Art': 'from-cyan-900/80 via-teal-950/60 to-black/90',
    'Lifestyle': 'from-rose-900/80 via-pink-950/60 to-black/90',
    'Gaming': 'from-indigo-900/80 via-blue-950/60 to-black/90',
    'Trending': 'from-red-900/80 via-violet-950/60 to-black/90',
  };
  const bgGradient = categoryGradients[stream.category || 'Trending'] || 'from-red-900/80 via-violet-950/60 to-black/90';

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black" onClick={handleTap}>
      {/* Background gradient + thumbnail */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />
      {stream.thumbnail ? (
        <>
          <img
            src={resolveImageUrl(stream.thumbnail)}
            alt=""
            className="w-full h-full object-cover opacity-40 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/60" />
      )}

      {/* Center streamer avatar */}
      <div className="absolute inset-0 flex items-center justify-center z-[1]">
        <div className="relative">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden ring-4 ring-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <img
              src={resolveImageUrl(stream.creator.avatar)}
              alt={stream.creator.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-600 border-3 border-black flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm shadow-[0_0_12px_rgba(239,68,68,0.5)]">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-black uppercase tracking-widest">LIVE</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <Eye className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white text-xs font-medium tabular-nums">{viewerCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white text-xs font-medium tabular-nums">{streamDuration}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streamer info */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setViewingUser(stream.creator.id); setView('profile'); }}
            className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-red-500/40 flex-shrink-0"
          >
            <img src={resolveImageUrl(stream.creator.avatar)} alt="" className="w-full h-full object-cover" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm truncate">{stream.creator.name}</span>
              {stream.creator.verified && (
                <BadgeCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20 flex-shrink-0" />
              )}
            </div>
            <p className="text-white/50 text-xs truncate">{stream.title || 'Live now'}</p>
          </div>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              toggleFollow(stream.creator.id);
              try {
                const res = await fetch('/api/follows', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: stream.creator.id }),
                });
                if (res.status === 403) { toggleFollow(stream.creator.id); toast.error("Can't unfollow the ORRA Founder"); return; }
              } catch { toggleFollow(stream.creator.id); }
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
              isFollowed
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90'
            }`}
          >
            {isFollowed ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Nav arrows (desktop) */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 flex-col gap-2">
        {currentIndex > 0 && onPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 active:scale-90 transition-all"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {!isLast && onNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 active:scale-90 transition-all"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Floating hearts */}
      <div className="absolute bottom-32 right-6 z-30 pointer-events-none">
        {floatingHearts.map((id) => (
          <div
            key={id}
            className="absolute animate-[floatUp_2s_ease-out_forwards]"
            style={{ left: `${10 + Math.random() * 40}%`, bottom: 0 }}
          >
            <Heart className="w-8 h-8 text-red-500 fill-red-500 drop-shadow-lg" />
          </div>
        ))}
      </div>

      {/* ── BOTTOM: Actions + Chat ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Side action buttons — positioned higher to avoid AI companion button */}
        <div className="absolute right-3 bottom-64 z-20 flex flex-col gap-3 items-center">
          <button onClick={(e) => { e.stopPropagation(); sendHeart(); }} className="flex flex-col items-center gap-0.5">
            <div className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${isLiked ? 'bg-red-500/30' : 'bg-black/30 hover:bg-red-500/20'}`}>
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </div>
            <span className="text-[10px] text-white/70">{likeCount > 0 ? (likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount) : ''}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowChat(!showChat); }} className="flex flex-col items-center gap-0.5">
            <div className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${showChat ? 'bg-violet-500/30' : 'bg-black/30 hover:bg-violet-500/20'}`}>
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-white/70">Chat</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); toast.success('Gifts coming soon!'); }} className="flex flex-col items-center gap-0.5">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-amber-500/20 transition-all">
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-[10px] text-white/70">Gift</span>
          </button>
        </div>

        {/* Chat overlay */}
        {showChat && (
          <div className="fade-in">
            <div className="mx-3 mb-2 max-h-48 overflow-y-auto no-scrollbar space-y-1.5" style={{ scrollbarWidth: 'none' }}>
              {chatMessages.slice(-8).map((msg) => (
                <div key={msg.id} className="inline-flex items-start gap-1.5 max-w-[85%]">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 backdrop-blur-sm">
                    <img
                      src={resolveImageUrl(msg.avatar)}
                      alt={msg.user}
                      className="w-5 h-5 rounded-full shrink-0 object-cover bg-violet-500/30"
                      onError={(e) => { const img = e.currentTarget; img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user)}&background=7c3aed&color=fff&size=32&bold=true&font-size=0.4`; }}
                    />
                    <span className={`text-[10px] font-bold ${msg.isSystem ? 'text-violet-400' : 'text-violet-300'} whitespace-nowrap`}>{msg.user}</span>
                    <span className="text-white/80 text-[11px] break-words">{msg.text}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 px-3 pb-4 pt-2 safe-area-bottom">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); sendMessage(); } }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Say something..."
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none"
                />
                <button onClick={(e) => { e.stopPropagation(); sendMessage(); }} disabled={!chatInput.trim()} className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-30 text-white transition-all active:scale-95">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
        {!showChat && <div className="h-16 bg-gradient-to-t from-black/80 to-transparent" />}
      </div>

      {/* Stream counter */}
      {totalCount > 1 && (
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
          <Radio className="w-3 h-3 text-white/60" />
          <span className="text-white/60 text-[10px] font-medium tabular-nums">{currentIndex + 1} / {totalCount}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.8; transform: translateY(-80px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-160px) scale(0.8); }
        }
      `}</style>
    </div>
  );
}

// ─── Unified Live Broadcast View (Setup + Active in one, no video flash) ──────

function UnifiedLiveBroadcastView({
  videoRef,
  cameraStream,
  isSetup,
  isActive,
  liveTitle,
  setLiveTitle,
  liveCategory,
  setLiveCategory,
  categories,
  isStartingLive,
  viewerCount,
  onStartLive,
  onEndLive,
  onCloseSetup,
  onMinimize,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStream: MediaStream | null;
  isSetup: boolean;
  isActive: boolean;
  liveTitle: string;
  setLiveTitle: (v: string) => void;
  liveCategory: string;
  setLiveCategory: (v: string) => void;
  categories: string[];
  isStartingLive: boolean;
  viewerCount: number;
  onStartLive: () => void;
  onEndLive: () => void;
  onCloseSetup: () => void;
  onMinimize: () => void;
}) {
  const [liveDuration, setLiveDuration] = useState('00:00');
  const [cameraReady, setCameraReady] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Attach camera stream to video element whenever it changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      setCameraReady(true);
    }
  }, [cameraStream, videoRef]);

  // Poll for camera attachment
  useEffect(() => {
    const interval = setInterval(() => {
      if (cameraStream && videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = cameraStream;
        setCameraReady(true);
      }
      if (videoRef.current?.srcObject) {
        setCameraReady(true);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [cameraStream, videoRef]);

  // Reset start time when going live
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
    }
  }, [isActive]);

  // Update live duration
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      if (h > 0) {
        setLiveDuration(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        setLiveDuration(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Simulated chat when live
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const user = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)];
      const text = SIMULATED_MESSAGES[Math.floor(Math.random() * SIMULATED_MESSAGES.length)];
      setChatMessages((prev) => [
        ...prev.slice(-30),
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user: user.name,
          avatar: user.avatar,
          text,
        },
      ]);
    }, 2500 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Auto-scroll chat
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    const currentUser = useAuraStore.getState().currentUserProfile;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `my-${Date.now()}`,
        user: currentUser?.name || 'You',
        avatar: currentUser?.avatar || '/api/uploads?path=images/orra-logo.png',
        text: chatInput.trim(),
      },
    ]);
    setChatInput('');
  }, [chatInput]);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col safe-area-top safe-area-bottom">
      {/* ── VIDEO PREVIEW (always mounted — no flash between setup/active) ── */}
      <div className="flex-1 relative">
        <div className="w-full h-full bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Camera not ready placeholder */}
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-3 text-white/30">
                <Camera className="w-14 h-14" />
                <span className="text-sm">Starting camera...</span>
              </div>
            </div>
          )}
        </div>

        {/* ── TOP BAR (shared) ── */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* PREVIEW badge (setup) or LIVE badge (active) */}
              {isSetup && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600/90 backdrop-blur-sm shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-xs font-black uppercase tracking-widest">PREVIEW</span>
                </div>
              )}
              {isActive && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-xs font-black uppercase tracking-widest">LIVE</span>
                </div>
              )}
              {/* Viewer count + duration (active only) */}
              {isActive && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                    <Eye className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-white text-xs font-medium tabular-nums">{viewerCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-white text-xs font-medium tabular-nums">{liveDuration}</span>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-white/10 text-xs text-white/60 font-medium">YOUR STREAM</div>
                </>
              )}
            </div>
            <button
              onClick={isSetup ? onCloseSetup : onMinimize}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── SETUP: Centered overlay with Go Live button ── */}
        {isSetup && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
            {/* Semi-transparent backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content card */}
            <div className="relative z-10 w-[90%] max-w-sm space-y-4 pointer-events-auto">
              {/* Title input */}
              <input
                type="text"
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder="Stream title (optional)"
                className="w-full bg-black/60 backdrop-blur-xl border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-500/50 transition-all"
              />

              {/* Category pills */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      liveCategory === cat
                        ? 'bg-red-600/50 text-red-200 border border-red-500/40 backdrop-blur-sm'
                        : 'bg-black/40 backdrop-blur-sm text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* BIG GO LIVE BUTTON — center of screen */}
              <button
                onClick={onStartLive}
                disabled={isStartingLive}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(239,68,68,0.5)] active:scale-95"
              >
                {isStartingLive ? (
                  <><Loader2 className="w-6 h-6 animate-spin" />Going Live...</>
                ) : (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <Radio className="w-5 h-5" />
                    Go Live
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── ACTIVE STREAM: Side actions + chat + end button ── */}
        {isActive && (
          <>
            {/* Side action buttons — positioned higher to avoid AI companion button */}
            <div className="absolute right-3 bottom-44 z-20 flex flex-col gap-3 items-center">
              <button onClick={() => setShowChat(!showChat)} className="flex flex-col items-center gap-0.5">
                <div className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${showChat ? 'bg-violet-500/30' : 'bg-black/30 hover:bg-violet-500/20'}`}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-white/70">Chat</span>
              </button>
              <button onClick={() => toast.success('Gifts coming soon!')} className="flex flex-col items-center gap-0.5">
                <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-amber-500/20 transition-all">
                  <Gift className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-[10px] text-white/70">Gift</span>
              </button>
              <button onClick={() => toast.success('Camera flip coming soon!')} className="flex flex-col items-center gap-0.5">
                <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 transition-all">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-white/70">Flip</span>
              </button>
            </div>

            {/* Chat overlay */}
            {showChat && (
              <div className="absolute bottom-20 left-0 right-16 z-20 fade-in">
                <div className="mx-3 mb-2 max-h-40 overflow-y-auto no-scrollbar space-y-1.5" style={{ scrollbarWidth: 'none' }}>
                  {chatMessages.slice(-8).map((msg) => (
                    <div key={msg.id} className="inline-flex items-start gap-1.5 max-w-[85%]">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 backdrop-blur-sm">
                        <img
                          src={resolveImageUrl(msg.avatar)}
                          alt={msg.user}
                          className="w-5 h-5 rounded-full shrink-0 object-cover bg-violet-500/30"
                          onError={(e) => { const img = e.currentTarget; img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user)}&background=7c3aed&color=fff&size=32&bold=true&font-size=0.4`; }}
                        />
                        <span className={`text-[10px] font-bold ${msg.isSystem ? 'text-violet-400' : 'text-violet-300'} whitespace-nowrap`}>{msg.user}</span>
                        <span className="text-white/80 text-[11px] break-words">{msg.text}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex items-center gap-2 px-3 pb-2 pt-1">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Say something..."
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none"
                    />
                    <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-30 text-white transition-all active:scale-95">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* End Stream button */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-6 pt-4 safe-area-bottom">
              <div className="flex items-center justify-center">
                <button onClick={onEndLive} className="flex items-center gap-2 px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  <StopCircle className="w-5 h-5" />End Stream
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main LiveFeed Component ──────────────────────────────────────────────────

export function LiveFeed() {
  const { toggleLiveViewer, isLiveActive, startLive, endLive, setLiveViewerCount, currentLiveReelId, auraTokens, setView, showGoLiveSetup, setShowGoLiveSetup } = useAuraStore();
  const queryClient = useQueryClient();

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveCategory, setLiveCategory] = useState('Trending');
  const [isStartingLive, setIsStartingLive] = useState(false);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  // Fullscreen viewer state
  const [viewingStream, setViewingStream] = useState<LiveStream | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);

  const categories = ['All', 'Trending', 'Music', 'Dance', 'Comedy', 'Sports', 'Art', 'Lifestyle', 'Gaming'];
  const [activeCategory, setActiveCategory] = useState('All');

  // Deduplicate: remove seed streams whose creator already appears in API streams
  const mergeStreams = useCallback((apiStreams: LiveStream[], seedStreams: LiveStream[]): LiveStream[] => {
    const seedIds = new Set(seedStreams.map(s => s.id));
    // Filter out seed duplicates from API
    const uniqueApi = apiStreams.filter((s: LiveStream) => !seedIds.has(s.id));
    // Collect creator names from API streams to avoid duplicates (e.g. Luna appearing twice)
    const apiCreatorNames = new Set(uniqueApi.map((s: LiveStream) => s.creator?.name));
    // Remove seed streams whose creator name already appears in API streams
    const uniqueSeeds = seedStreams.filter((s: LiveStream) => !apiCreatorNames.has(s.creator?.name));
    return [...uniqueApi, ...uniqueSeeds];
  }, []);

  // Fetch live streams
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/livestreams');
        const data = await res.json();
        if (!cancelled && data.success) {
          const apiStreams = data.data || [];
          setLiveStreams(mergeStreams(apiStreams, SEED_LIVE_STREAMS));
        }
      } catch {
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mergeStreams]);

  // Refresh streams every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/livestreams');
        const data = await res.json();
        if (data.success) {
          const apiStreams = data.data || [];
          setLiveStreams(mergeStreams(apiStreams, SEED_LIVE_STREAMS));
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [mergeStreams]);

  // Simulated viewer count increment for own live
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      const current = useAuraStore.getState().liveViewerCount;
      const increment = Math.floor(Math.random() * 4);
      if (increment > 0) setLiveViewerCount(current + increment);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLiveActive, setLiveViewerCount]);

  // Camera preview for Go Live — uses refs to avoid infinite re-render loops
  // caused by callback dependencies changing on every state update
  const liveStreamRefInternal = useRef<MediaStream | null>(null);
  const showGoLiveSetupRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => { showGoLiveSetupRef.current = showGoLiveSetup; }, [showGoLiveSetup]);

  const startCameraPreview = useCallback(async () => {
    // Don't restart if camera is already running
    if (liveStreamRefInternal.current) {
      // Camera already running, just attach to video element
      if (liveVideoRef.current) liveVideoRef.current.srcObject = liveStreamRefInternal.current;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      liveStreamRefInternal.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera access failed:', err);
      toast.error('Camera access denied.');
    }
  }, []);

  const stopCameraPreview = useCallback(() => {
    if (liveStreamRefInternal.current) {
      liveStreamRefInternal.current.getTracks().forEach((track) => track.stop());
      liveStreamRefInternal.current = null;
    }
  }, []);

  // Start/stop camera when Go Live modal opens/closes
  // Only stop camera if user is NOT currently live
  useEffect(() => {
    if (showGoLiveSetup) {
      startCameraPreview();
    } else if (!isLiveActive) {
      // Only stop camera when closing Go Live modal if not actually streaming
      stopCameraPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGoLiveSetup, isLiveActive]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (liveStreamRefInternal.current) {
        liveStreamRefInternal.current.getTracks().forEach((track) => track.stop());
        liveStreamRefInternal.current = null;
      }
    };
  }, []);

  // Start live stream
  const handleStartLive = async () => {
    try {
      setIsStartingLive(true);
      const streamTitle = liveTitle.trim() || 'Live Now';
      const res = await fetch('/api/livestreams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: streamTitle, category: liveCategory }) });
      const data = await res.json();
      if (data.success && data.data) {
        startLive(data.data.id);
        // DON'T close the modal — just mark as live so the same view transitions
        // The video element stays mounted, no flash!
        setLiveTitle('');
        setLiveCategory('Trending');
        queryClient.invalidateQueries({ queryKey: ['livestreams'] });
        toast.success('You are now LIVE! +5 ORRA +10 XP 🔴');
        // Re-attach camera after a tick
        setTimeout(() => {
          if (liveVideoRef.current && liveStreamRefInternal.current) {
            liveVideoRef.current.srcObject = liveStreamRefInternal.current;
          }
        }, 100);
        const refreshRes = await fetch('/api/livestreams');
        const refreshData = await refreshRes.json();
        if (refreshData.success) setLiveStreams(mergeStreams(refreshData.data || [], SEED_LIVE_STREAMS));
      } else {
        toast.error(data.error || 'Failed to go live');
      }
    } catch {
      toast.error('Failed to go live. Please try again.');
    } finally {
      setIsStartingLive(false);
    }
  };

  // End live stream
  const handleEndLive = async () => {
    // Always stop camera and end live locally first, even if currentLiveReelId is null
    // (After page refresh, currentLiveReelId is null since it's not persisted in Zustand)
    stopCameraPreview();
    endLive();
    setShowGoLiveSetup(false);

    // Try to end the stream on the server too
    try {
      let reelIdToEnd = currentLiveReelId;

      // If currentLiveReelId is null (e.g. after page refresh), find the active livestream
      if (!reelIdToEnd) {
        const liveRes = await fetch('/api/livestreams');
        const liveData = await liveRes.json();
        if (liveData.success && liveData.data) {
          const myLive = liveData.data.find((s: any) => s.isLive && s.userId === (useAuraStore.getState().currentUserProfile as any)?.id);
          if (myLive) reelIdToEnd = myLive.id;
        }
      }

      if (reelIdToEnd) {
        await fetch('/api/reels-live', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reelId: reelIdToEnd }) });
      }

      queryClient.invalidateQueries({ queryKey: ['livestreams'] });
      toast.success('Live stream ended. Thanks for streaming! 🎬');
      const refreshRes = await fetch('/api/livestreams');
      const refreshData = await refreshRes.json();
      if (refreshData.success) setLiveStreams(mergeStreams(refreshData.data || [], SEED_LIVE_STREAMS));
    } catch {
      toast.success('Live stream ended.');
    }
  };

  // Filter streams by category
  const filteredStreams = activeCategory === 'All'
    ? liveStreams
    : liveStreams.filter((s) => s.category === activeCategory);

  // Navigate between streams in fullscreen viewer
  const goToStream = useCallback((index: number) => {
    if (index < 0 || index >= filteredStreams.length) return;
    setViewingIndex(index);
    setViewingStream(filteredStreams[index]);
  }, [filteredStreams]);

  // Open a stream in fullscreen
  const openStream = useCallback((stream: LiveStream, index: number) => {
    setViewingStream(stream);
    setViewingIndex(index);
  }, []);

  // Close fullscreen viewer
  const closeViewer = useCallback(() => {
    setViewingStream(null);
  }, []);

  // ── UNIFIED GO LIVE + ACTIVE STREAM VIEW ──
  // Merged into one view so the video element never unmounts — no flash!
  if (showGoLiveSetup || isLiveActive) {
    const liveViewerCount = useAuraStore.getState().liveViewerCount;

    return (
      <UnifiedLiveBroadcastView
        videoRef={liveVideoRef}
        cameraStream={liveStreamRefInternal.current}
        isSetup={showGoLiveSetup && !isLiveActive}
        isActive={isLiveActive}
        liveTitle={liveTitle}
        setLiveTitle={setLiveTitle}
        liveCategory={liveCategory}
        setLiveCategory={setLiveCategory}
        categories={categories.filter(c => c !== 'All')}
        isStartingLive={isStartingLive}
        viewerCount={liveViewerCount}
        onStartLive={handleStartLive}
        onEndLive={handleEndLive}
        onCloseSetup={() => { setShowGoLiveSetup(false); setLiveTitle(''); setLiveCategory('Trending'); }}
        onMinimize={() => setView('home')}
      />
    );
  }

  // ── FULLSCREEN VIEWER (when a stream is clicked) ──
  if (viewingStream) {
    return (
      <LiveFullScreenViewer
        stream={viewingStream}
        onClose={closeViewer}
        onPrev={viewingIndex > 0 ? () => goToStream(viewingIndex - 1) : undefined}
        onNext={viewingIndex < filteredStreams.length - 1 ? () => goToStream(viewingIndex + 1) : undefined}
        currentIndex={viewingIndex}
        totalCount={filteredStreams.length}
        isLast={viewingIndex === filteredStreams.length - 1}
      />
    );
  }

  // ── BROWSE VIEW: Grid of live cards (2-3 visible at once) ──
  return (
    <div className="fade-in px-4 py-2 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">LIVE</span>
          </div>
          <span className="text-sm font-bold text-white">
            {filteredStreams.length > 0 ? `${filteredStreams.length} Live Now` : 'Live'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <Zap className="w-3 h-3" />
            <span>{auraTokens.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowGoLiveSetup(true)}
            disabled={isLiveActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <MonitorUp className="w-3.5 h-3.5" />
            Go Live
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-red-600/30 text-red-300 border border-red-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Your own live stream card */}
      {isLiveActive && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-red-500/40 fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-black/60 to-fuchsia-900/30" />
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-red-600/80 text-[10px] font-bold text-white flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5" /> YOUR LIVE
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-xs text-white">
                <Eye className="w-3 h-3" />
                <span>{useAuraStore.getState().liveViewerCount.toLocaleString()}</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 mb-3">
              <video ref={liveVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!liveVideoRef.current?.srcObject && (
                  <div className="flex flex-col items-center gap-1.5 text-white/40">
                    <Video className="w-8 h-8" />
                    <span className="text-[10px]">Camera preview</span>
                  </div>
                )}
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600/90 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span></span>
                <span className="text-[9px] font-bold text-white">LIVE</span>
              </div>
            </div>
            <button onClick={handleEndLive} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-sm transition-all">
              <StopCircle className="w-4 h-4" />End Live Stream
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading live streams...</p>
        </div>
      ) : filteredStreams.length === 0 && !isLiveActive ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-red-600/10 flex items-center justify-center mb-4">
            <Radio className="w-10 h-10 text-red-500/50" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Live Streams Right Now</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm">
            Be the first to go live! Start streaming and your audience will find you here.
          </p>
          <button
            onClick={() => setShowGoLiveSetup(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            <MonitorUp className="w-5 h-5" />Go Live Now
          </button>
        </div>
      ) : (
        /* ── LIVE STREAM CARDS — scrollable, 2-3 visible at once ── */
        <div className="space-y-3">
          {filteredStreams.map((stream, index) => (
            <LiveBrowseCard
              key={stream.id}
              stream={stream}
              onClick={() => openStream(stream, index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
