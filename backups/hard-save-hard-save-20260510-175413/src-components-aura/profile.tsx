'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { usePosts, useUserPosts, useHubs } from '@/lib/api-hooks';
import { MapPin, Link as LinkIcon, Calendar, Grid3X3, Clapperboard, Trophy, Bookmark, Heart, Share2, Edit3, Zap, Users, X, MessageCircle, Waves, Sparkles, ArrowLeft, Crown, Star, Rocket } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// Followers/Following Modal Component
function FollowersFollowingModal({ userId, type, onClose }: { userId: string; type: 'followers' | 'following'; onClose: () => void }) {
  const { followedUsers, toggleFollow } = useAuraStore();

  const { data: listData, isLoading } = useQuery({
    queryKey: ['user-connections', userId, type],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/connections?type=${type}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data as Array<{ id: string; name: string; handle: string; avatar: string; verified: boolean }>;
    },
    enabled: !!userId,
  });

  const handleFollow = async (targetId: string, name: string) => {
    const isFollowed = followedUsers.has(targetId);
    toggleFollow(targetId);
    try {
      await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId }),
      });
    } catch {}
    toast.success(isFollowed ? `Unfollowed ${name}` : `Following ${name}`);
  };

  const users = listData || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-sm fade-in border border-violet-500/20 max-h-[70vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-white mb-4">{type === 'followers' ? 'Followers' : 'Following'}</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const isFollowed = followedUsers.has(user.id);
              return (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                    <img src={user.avatar || '/api/uploads?path=images/orra-logo.png'} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.handle}</p>
                  </div>
                  <button
                    onClick={() => handleFollow(user.id, user.name)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isFollowed
                        ? 'bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ORRA Signature - Cursive handwritten signature unique per profile
function AuraSignature({ level, tokens, postCount, userId, name, isFounder }: { level: number; tokens: number; postCount: number; userId: string; name: string; isFounder?: boolean }) {
  // Generate deterministic seed from userId
  const seed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < userId.length; i++) s += userId.charCodeAt(i) * (i + 1);
    return s;
  }, [userId]);

  const rng = useMemo(() => {
    return (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };
  }, [seed]);

  // Tier color palette
  const colors = useMemo(() => {
    if (isFounder) return ['#fbbf24', '#f59e0b', '#d97706']; // Gold
    if (level >= 75) return ['#d946ef', '#a855f7', '#8b5cf6']; // Legend purple
    if (level >= 50) return ['#06b6d4', '#8b5cf6', '#a855f7']; // Diamond cyan
    if (level >= 25) return ['#fbbf24', '#f59e0b', '#d97706']; // Gold tier
    return ['#cd7f32', '#b8651a', '#92400e']; // Bronze
  }, [isFounder, level]);

  const safeName = String(name || 'ORRA');
  const nameWords = safeName.split(' ');

  // Font size class based on name length
  const nameSizeClass = useMemo(() => {
    const totalLen = safeName.length;
    if (nameWords.length === 1) {
      return totalLen > 12 ? 'text-2xl' : totalLen > 8 ? 'text-3xl' : 'text-4xl';
    }
    return totalLen > 16 ? 'text-xl' : totalLen > 10 ? 'text-2xl' : 'text-3xl';
  }, [safeName, nameWords.length]);

  // Unique underline swash per user
  const swashPath = useMemo(() => {
    const curve1 = 15 + rng(1) * 20;
    const curve2 = 5 + rng(2) * 15;
    const startX = 15 + rng(3) * 10;
    const endX = 170 + rng(4) * 20;
    const midY = 76 + rng(5) * 8;
    return `M ${startX} ${midY} C ${startX + 30} ${midY - curve1}, ${endX - 50} ${midY - curve2}, ${endX} ${midY + 3}`;
  }, [rng]);

  // Secondary thin swash
  const thinSwashPath = useMemo(() => {
    const offset = 3 + rng(6) * 5;
    const startX = 25 + rng(7) * 10;
    const endX = 160 + rng(8) * 25;
    const midY = 82 + rng(9) * 6;
    return `M ${startX} ${midY} Q ${(startX + endX) / 2} ${midY - offset * 2}, ${endX} ${midY + offset}`;
  }, [rng]);

  // Sparkle positions from name chars
  const sparkles = useMemo(() => {
    const pts: { x: number; y: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < safeName.length; i++) {
      const code = safeName.charCodeAt(i);
      pts.push({
        x: 8 + (code * 3 + rng(i + 10) * 40) % 184,
        y: 10 + ((code * 7 + rng(i + 20) * 30) % 70),
        size: 0.4 + rng(i + 30) * 1.2,
        opacity: 0.2 + rng(i + 40) * 0.5,
      });
    }
    for (let i = 0; i < (isFounder ? 14 : 6); i++) {
      pts.push({
        x: rng(i + 50) * 200,
        y: rng(i + 60) * 90,
        size: 0.3 + rng(i + 70) * 0.7,
        opacity: 0.15 + rng(i + 80) * 0.3,
      });
    }
    return pts;
  }, [safeName, rng, isFounder]);

  // Flourish paths
  const leftFlourish = useMemo(() => {
    const h = 8 + rng(100) * 15;
    const w = 6 + rng(101) * 8;
    return `M 8 52 C 4 52, 2 ${52 - h}, ${2 + w} ${52 - h + 3}`;
  }, [rng]);

  const rightFlourish = useMemo(() => {
    const h = 8 + rng(102) * 15;
    const w = 6 + rng(103) * 8;
    return `M 192 52 C 196 52, 198 ${52 - h}, ${198 - w} ${52 - h + 3}`;
  }, [rng]);

  // CSS gradient for the name text
  const nameGradientStyle = useMemo(() => ({
    background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }), [colors]);

  // Glow filter as CSS text-shadow
  const glowStyle = useMemo(() => {
    if (isFounder) {
      return {
        textShadow: `0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3), 0 0 60px rgba(139, 92, 246, 0.2)`,
      };
    }
    return {
      textShadow: `0 0 15px ${colors[0]}66, 0 0 30px ${colors[1]}44`,
    };
  }, [isFounder, colors]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border ${isFounder ? 'bg-gradient-to-br from-amber-950/30 via-black/40 to-violet-950/20 border-amber-500/20' : 'bg-black/40 border-white/5'}`}>
      {/* SVG decorative layer */}
      <svg viewBox="0 0 200 100" className="w-full" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`sig-swash-${userId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors[2]} stopOpacity="0.3" />
          </linearGradient>
          {isFounder && (
            <linearGradient id={`sig-shimmer-${userId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
              <stop offset="30%" stopColor="#fef3c7" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#fef3c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
          )}
          <filter id={`sig-sparkle-${userId}`}>
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>

        {/* Subtle background texture */}
        <g opacity="0.04">
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`diag-${i}`} x1={i * 12} y1="0" x2={i * 12 + 10} y2="100" stroke={isFounder ? '#fbbf24' : '#8b5cf6'} strokeWidth="0.2" />
          ))}
        </g>

        {/* Founder shimmer sweep */}
        {isFounder && (
          <rect x="-50" y="0" width="300" height="100" fill={`url(#sig-shimmer-${userId})`} opacity="0.15">
            <animate attributeName="x" values="-50;250" dur="3s" repeatCount="indefinite" />
          </rect>
        )}

        {/* Sparkle stars */}
        {sparkles.map((pt, i) => (
          <g key={`spark-${i}`} transform={`translate(${pt.x}, ${pt.y})`} opacity={pt.opacity}>
            <line x1={-pt.size} y1="0" x2={pt.size} y2="0" stroke={colors[i % colors.length]} strokeWidth="0.2" />
            <line x1="0" y1={-pt.size} x2="0" y2={pt.size} stroke={colors[i % colors.length]} strokeWidth="0.2" />
          </g>
        ))}

        {/* Side flourishes */}
        <path d={leftFlourish} fill="none" stroke={colors[0]} strokeWidth="0.6" opacity="0.35" />
        <path d={rightFlourish} fill="none" stroke={colors[2]} strokeWidth="0.6" opacity="0.35" />

        {/* Underline swash */}
        <path
          d={swashPath}
          fill="none"
          stroke={`url(#sig-swash-${userId})`}
          strokeWidth={isFounder ? '1.2' : '0.8'}
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Secondary thin swash */}
        <path
          d={thinSwashPath}
          fill="none"
          stroke={colors[2]}
          strokeWidth="0.3"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Founder: Crown + extra swash */}
        {isFounder && (
          <>
            <path
              d="M 85 14 L 90 6 L 95 14 L 100 4 L 105 14 L 110 6 L 115 14"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.6"
              opacity="0.5"
            />
            <circle cx="100" cy="5" r="1" fill="#fbbf24" opacity="0.7" filter={`url(#sig-sparkle-${userId})`} />
            <path
              d={`M 30 85 Q 80 ${80 + rng(110) * 10}, 130 84 T 175 ${82 + rng(111) * 5}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.35"
              strokeLinecap="round"
              opacity="0.25"
            />
          </>
        )}

        {/* Corner brackets */}
        <path d="M 1 6 L 1 1 L 6 1" fill="none" stroke={colors[0]} strokeWidth="0.5" opacity="0.3" />
        <path d="M 194 1 L 199 1 L 199 6" fill="none" stroke={colors[1]} strokeWidth="0.5" opacity="0.3" />
        <path d="M 1 94 L 1 99 L 6 99" fill="none" stroke={colors[1]} strokeWidth="0.5" opacity="0.3" />
        <path d="M 194 99 L 199 99 L 199 94" fill="none" stroke={colors[2]} strokeWidth="0.5" opacity="0.3" />

        {/* Watermark */}
        <text x="100" y="97" textAnchor="middle" fill={isFounder ? '#fbbf24' : '#8b5cf6'} opacity="0.15" fontSize="2.5" fontFamily="monospace" letterSpacing="1">
          {isFounder ? 'FOUNDER' : 'LVL ' + level} | {tokens.toLocaleString()} ORRA | {postCount}P
        </text>
      </svg>

      {/* HTML overlay for cursive name — uses actual web fonts */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ fontFamily: "'Dancing Script', 'Segoe Script', 'Apple Chancery', cursive" }}>
        {nameWords.length === 1 ? (
          <span className={`${nameSizeClass} font-bold ${isFounder ? 'founder-sig-glow' : ''}`} style={{ ...nameGradientStyle, ...glowStyle }}>
            {safeName}
          </span>
        ) : nameWords.length === 2 ? (
          <>
            <span className={`${nameSizeClass} font-bold ${isFounder ? 'founder-sig-glow' : ''}`} style={{ ...nameGradientStyle, ...glowStyle }}>
              {nameWords[0]}
            </span>
            <span className={`${nameSizeClass} font-bold -mt-1 ${isFounder ? 'founder-sig-glow' : ''}`} style={{ ...nameGradientStyle, ...glowStyle }}>
              {nameWords[1]}
            </span>
          </>
        ) : (
          <>
            <span className={`${nameSizeClass} font-bold ${isFounder ? 'founder-sig-glow' : ''}`} style={{ ...nameGradientStyle, ...glowStyle }}>
              {nameWords[0]}
            </span>
            <span className={`${nameSizeClass} font-bold -mt-1 ${isFounder ? 'founder-sig-glow' : ''}`} style={{ ...nameGradientStyle, ...glowStyle, fontSize: '0.85em' }}>
              {nameWords.slice(1, -1).join(' ')}
            </span>
            <span className={`${nameSizeClass} font-bold -mt-1 ${isFounder ? 'founder-sig-glow' : ''}`} style={{ ...nameGradientStyle, ...glowStyle }}>
              {nameWords[nameWords.length - 1]}
            </span>
          </>
        )}
      </div>

      {/* Label overlay — only shown when not wrapped by external header (i.e. non-Founder) */}
      {!isFounder && (
        <div className="absolute top-1.5 left-2 flex items-center gap-1 opacity-60">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-violet-300">
            ORRA Signature
          </span>
        </div>
      )}
    </div>
  );
}

const profileTabs = [
  { key: 'posts', label: 'Posts', icon: Grid3X3 },
  { key: 'reels', label: 'Reels', icon: Clapperboard },
  { key: 'challenges', label: 'Challenges', icon: Trophy },
  { key: 'saved', label: 'Saved', icon: Bookmark },
];

const otherUserTabs = [
  { key: 'posts', label: 'Posts', icon: Grid3X3 },
];

export function Profile() {
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowers, setShowFollowers] = useState<'followers' | 'following' | null>(null);
  const { toggleEditProfile, userPosts, savedPosts, likedPosts, toggleLike, auraTokens, auraLevel, auraXP, joinedHubs, danceEntries, repostIds, viewingUserId, setViewingUser, setView, followedUsers, toggleFollow } = useAuraStore();
  const currentUser = useCurrentUser();
  const { data: apiHubs } = useHubs();

  const displayName = currentUser.name;
  const displayHandle = currentUser.handle;
  const displayBio = currentUser.bio;
  const displayLocation = currentUser.location;
  const displayWebsite = currentUser.website;
  const displayCover = currentUser.coverImage;
  const displayAvatar = currentUser.avatar;
  const totalPosts = currentUser.posts + userPosts.length;
  const totalFollowers = currentUser.followers;

  // Determine if we're viewing another user's profile
  const isViewingOther = viewingUserId && viewingUserId !== currentUser.id;

  // Fetch user's posts from API (for own profile and other user's profile)
  const profileUserId = isViewingOther ? viewingUserId : currentUser.id;
  const { data: userPostsData } = useUserPosts(profileUserId);

  // Founder detection - check badges for Founder tag
  const isFounder = (() => {
    try {
      const badges = typeof currentUser.badges === 'string' ? JSON.parse(currentUser.badges) : currentUser.badges;
      return Array.isArray(badges) && badges.some((b: string) => b === 'Founder');
    } catch { return false; }
  })();

  // Fetch other user's profile data — MUST come before any code that references otherUserData
  const { data: otherUserData, isLoading: otherUserLoading } = useQuery({
    queryKey: ['user-profile', viewingUserId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${viewingUserId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: !!isViewingOther,
    staleTime: 30000,
  });

  const isOtherUserFounder = (() => {
    try {
      const badges = typeof otherUserData?.badges === 'string' ? JSON.parse(otherUserData.badges) : otherUserData?.badges;
      return Array.isArray(badges) && badges.some((b: string) => b === 'Founder');
    } catch { return false; }
  })();
  const profileIsFounder = isViewingOther ? isOtherUserFounder : isFounder;

  // If viewing another user, use their data; otherwise use current user data
  const profileName = isViewingOther ? (otherUserData?.name || '') : displayName;
  const profileHandle = isViewingOther ? (otherUserData?.handle || '') : displayHandle;
  const profileBio = isViewingOther ? (otherUserData?.bio || '') : displayBio;
  const profileLocation = isViewingOther ? (otherUserData?.location || '') : displayLocation;
  const profileWebsite = isViewingOther ? (otherUserData?.website || '') : displayWebsite;
  const profileCover = isViewingOther ? (otherUserData?.coverImage || '/api/uploads?path=images/profile-cover.png') : displayCover;
  const profileAvatar = isViewingOther ? (otherUserData?.avatar || '/api/uploads?path=images/orra-logo.png') : displayAvatar;
  const profileLevel = isViewingOther ? (otherUserData?.auraLevel || 1) : auraLevel;
  const profileTokens = isViewingOther ? (otherUserData?.auraTokens || 0) : auraTokens;
  const profileXP = isViewingOther ? (otherUserData?.auraXP || 0) : auraXP;
  const profileVerified = isViewingOther ? (otherUserData?.verified || false) : currentUser.verified;
  const profileFollowerCount = isViewingOther ? (otherUserData?._count?.followers || 0) : totalFollowers;
  const profileFollowingCount = isViewingOther ? (otherUserData?._count?.follows || 0) : currentUser.following;
  const profilePostCount = isViewingOther ? (otherUserData?._count?.posts || 0) : totalPosts;
  const isFollowing = isViewingOther ? (otherUserData?.isFollowing || followedUsers.has(viewingUserId!)) : false;

  // Fetch real posts from API for the Saved tab
  const { data: savedPostsData } = usePosts();
  const savedPostsList = (savedPostsData?.posts || []).filter((p) => savedPosts.has(p.id)).map((p) => ({
    id: p.id,
    user: {
      name: p.author.name,
      avatar: p.author.avatar || '/api/uploads?path=images/orra-logo.png',
    },
    text: p.text,
    images: (() => { try { return JSON.parse(p.images); } catch { return []; } })(),
    likes: p.likesCount,
    comments: p.commentsCount,
  }));

  // Get joined hubs
  const joinedHubsList = (apiHubs || []).filter((h: any) => joinedHubs.has(h.id));

  // Determine level tier
  const levelTier = profileIsFounder ? 'Founder' : profileLevel >= 75 ? 'Legend' : profileLevel >= 50 ? 'Diamond' : profileLevel >= 25 ? 'Gold' : 'Bronze';
  const levelColor = profileIsFounder ? 'text-amber-400' : profileLevel >= 75 ? 'text-fuchsia-400' : profileLevel >= 50 ? 'text-cyan-400' : profileLevel >= 25 ? 'text-yellow-400' : 'text-amber-600';

  const handleShareProfile = () => {
    const handleForLink = profileHandle.replace('@', '');
    navigator.clipboard.writeText(`https://orra.link/${handleForLink}`);
    toast.success('Profile link copied!');
  };

  // Loading state for other user
  if (isViewingOther && otherUserLoading) {
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state for other user
  if (isViewingOther && !otherUserData) {
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-red-400 text-sm mb-3">User not found</p>
          <button
            onClick={() => { setViewingUser(null); setView('home'); }}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  // Which tabs to show
  const activeTabs = isViewingOther ? otherUserTabs : profileTabs;

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Founder Banner */}
      {profileIsFounder && (
        <div className="founder-banner-shimmer rounded-2xl p-3 flex items-center gap-3 border border-amber-500/20">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-amber-500/30 founder-badge-glow">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-300">ORRA Founder</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-wider border border-amber-500/30">Exclusive</span>
            </div>
            <p className="text-[10px] text-amber-400/60 mt-0.5">The architect behind the universe</p>
          </div>
          <Rocket className="w-5 h-5 text-amber-400/40" />
        </div>
      )}

      {/* Cover Image */}
      <div className={`relative h-40 md:h-56 rounded-2xl overflow-hidden group ${profileIsFounder ? 'founder-cover-glow' : ''}`}>
        <img
          src={profileCover}
          alt="Cover"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className={`absolute inset-0 ${profileIsFounder ? 'bg-gradient-to-t from-[#050505] via-[#050505]/20 to-amber-500/5' : 'bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent'}`} />
        {isViewingOther ? (
          <button
            onClick={() => { setViewingUser(null); setView('home'); }}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/60 transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        ) : (
          <button
            onClick={toggleEditProfile}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/60 transition-all flex items-center gap-1.5"
          >
            <Edit3 className="w-3 h-3" /> Edit Cover
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="relative -mt-16 px-4">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0">
            <div className={`absolute inset-0 rounded-full p-[3px] aura-glow-ring ${
              profileIsFounder ? 'level-founder bg-gradient-to-br from-amber-400 via-violet-500 to-fuchsia-500' :
              profileLevel >= 75 ? 'level-legend bg-gradient-to-br from-violet-600 to-fuchsia-600' :
              profileLevel >= 50 ? 'level-diamond bg-gradient-to-br from-violet-600 to-fuchsia-600' :
              profileLevel >= 25 ? 'level-gold bg-gradient-to-br from-violet-600 to-fuchsia-600' :
              'level-bronze bg-gradient-to-br from-violet-600 to-fuchsia-600'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-[#050505]">
                <img src={profileAvatar} alt={profileName} className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Level Badge / Founder Crown */}
            {profileIsFounder ? (
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-black border border-amber-400 founder-badge-glow flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" /> {profileLevel}
              </div>
            ) : (
              <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-black/80 border ${
                profileLevel >= 75 ? 'border-fuchsia-500' : profileLevel >= 50 ? 'border-cyan-500' : profileLevel >= 25 ? 'border-yellow-500' : 'border-amber-600'
              } ${levelColor}`}>
                {profileLevel}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2 pb-2">
            {isViewingOther ? (
              <>
                <button
                  onClick={() => { toggleFollow(viewingUserId!); fetch('/api/follows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: viewingUserId }) }).catch(() => {}); toast.success(isFollowing ? `Unfollowed ${profileName}` : `Following ${profileName}`); }}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    isFollowing
                      ? 'bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                      : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button onClick={handleShareProfile} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleEditProfile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all"
                >
                  Edit Profile
                </button>
                <button onClick={handleShareProfile} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-bold ${profileIsFounder ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-violet-300' : 'text-white'}`}>{profileName}</h1>
            {profileVerified && (
              profileIsFounder ? (
                <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 founder-badge-glow">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="text-[8px] font-black text-amber-300 uppercase tracking-wider">Founder</span>
                </div>
              ) : (
                <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              )
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              profileIsFounder ? 'bg-gradient-to-r from-amber-500/20 to-violet-500/20 text-amber-300 border border-amber-500/30' :
              profileLevel >= 75 ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30' :
              profileLevel >= 50 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
              profileLevel >= 25 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
              'bg-amber-600/20 text-amber-400 border border-amber-600/30'
            }`}>{levelTier} Tier</span>
          </div>
          <p className={`text-sm ${profileIsFounder ? 'text-amber-400/70' : 'text-slate-400'}`}>{profileHandle}</p>
          <p className={`text-sm mt-2 leading-relaxed ${profileIsFounder ? 'text-amber-100/90 font-medium' : 'text-slate-300'}`}>{profileBio}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            {profileLocation && <span className={`flex items-center gap-1 ${profileIsFounder ? 'text-amber-400/60' : ''}`}><MapPin className="w-3 h-3" /> {profileLocation}</span>}
            {profileWebsite && <span className={`flex items-center gap-1 ${profileIsFounder ? 'text-amber-400/60' : ''}`}><LinkIcon className="w-3 h-3" /> {profileWebsite}</span>}
            {!isViewingOther && <span className={`flex items-center gap-1 ${profileIsFounder ? 'text-amber-400/60' : ''}`}><Calendar className="w-3 h-3" /> Joined {currentUser.joinDate}</span>}
          </div>

          {/* Badges - Founder gets special styling */}
          {!isViewingOther && (() => {
            try {
              const badges = typeof currentUser.badges === 'string' ? JSON.parse(currentUser.badges) : currentUser.badges;
              return Array.isArray(badges) && badges.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {badges.map((badge: string, i: number) => {
                    const isFounderBadge = badge === 'Founder' || badge === 'Visionary' || badge === 'ORRA Architect';
                    const isOGBadge = badge === 'Early Adopter' || badge === 'ORRA OG';
                    return (
                      <span key={i} className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isFounderBadge
                          ? 'bg-gradient-to-r from-amber-500/20 to-violet-500/20 text-amber-300 border border-amber-500/30 founder-badge-glow'
                          : isOGBadge
                          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}>
                        {isFounderBadge && <Star className="w-2.5 h-2.5 text-amber-400" />}
                        {badge}
                      </span>
                    );
                  })}
                </div>
              ) : null;
            } catch {
              return null;
            }
          })()}
        </div>

        {/* ORRA Signature - ORRA EXCLUSIVE */}
        <div className={`mt-4 ${profileIsFounder ? 'rounded-xl overflow-hidden border border-amber-500/20' : ''}`}>
          {profileIsFounder && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/5 border-b border-amber-500/10">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">Founder Signature</span>
            </div>
          )}
          <AuraSignature level={profileLevel} tokens={profileTokens} postCount={profilePostCount} userId={viewingUserId || currentUser.id} name={profileName || 'ORRA User'} isFounder={profileIsFounder} />
        </div>

        {/* Stats - 3x2 Grid for mobile-friendly layout */}
        <div className={`grid grid-cols-3 gap-2 mt-4 py-3 ${
          profileIsFounder
            ? 'founder-stat-highlight rounded-xl px-3'
            : 'border-y border-white/5'
        }`}>
          <button onClick={() => setShowFollowers('followers')} className="text-center hover:bg-white/5 rounded-lg px-2 py-2 transition-all">
            <p className="font-bold text-white text-sm">{profileFollowerCount >= 1000 ? (profileFollowerCount / 1000).toFixed(1) + 'K' : profileFollowerCount}</p>
            <p className="text-[10px] text-slate-500">Followers</p>
          </button>
          <button onClick={() => setShowFollowers('following')} className="text-center hover:bg-white/5 rounded-lg px-2 py-2 transition-all">
            <p className="font-bold text-white text-sm">{profileFollowingCount}</p>
            <p className="text-[10px] text-slate-500">Following</p>
          </button>
          <div className="text-center px-2 py-2">
            <p className="font-bold text-white text-sm">{profilePostCount}</p>
            <p className="text-[10px] text-slate-500">Pulses</p>
          </div>
          <div className="text-center px-2 py-2">
            <p className="font-bold gradient-text flex items-center justify-center gap-1 text-sm"><Zap className="w-3 h-3" />Lvl {profileLevel}</p>
            <p className="text-[10px] text-slate-500">ORRA Level</p>
          </div>
          <div className="text-center px-2 py-2">
            <p className="font-bold text-amber-400 text-sm">{profileTokens.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">ORRA Tokens</p>
          </div>
          <div className="text-center px-2 py-2">
            <p className="font-bold text-violet-400 text-sm">{joinedHubsList.length}</p>
            <p className="text-[10px] text-slate-500">Hubs</p>
          </div>
        </div>

        {/* XP Progress Bar - only for own profile */}
        {!isViewingOther && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>XP to Level {auraLevel + 1}</span>
              <span>{auraXP}/1000</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all duration-500"
                style={{ width: `${(auraXP / 1000) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Hub Memberships - only for own profile */}
        {!isViewingOther && joinedHubsList.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1.5">Hubs</p>
            <div className="flex gap-1.5 flex-wrap">
              {joinedHubsList.map((hub) => (
                <span key={hub.id} className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 text-[10px] font-semibold border border-white/10 flex items-center gap-1">
                  {hub.icon} {hub.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-white/10">
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'text-violet-400 border-violet-400'
                  : 'text-slate-500 border-transparent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Grid - Posts (Feed-style cards) */}
      {activeTab === 'posts' && (
        (() => {
          const apiPosts = (userPostsData?.posts || []).map((p: any) => ({
            id: p.id,
            text: p.text,
            images: (() => { try { return JSON.parse(p.images); } catch { return []; } })(),
            likes: p.likesCount,
            comments: p.commentsCount,
            isLocal: false,
            createdAt: new Date(p.createdAt).getTime(),
          }));

          // For own profile, merge with local posts
          const localPosts = !isViewingOther ? userPosts
            .filter((lp) => !apiPosts.some((ap: any) => ap.id === lp.id))
            .map((p) => ({
              id: p.id,
              text: p.text,
              images: p.images,
              likes: 0,
              comments: 0,
              isLocal: true,
              createdAt: p.createdAt,
            })) : [];

          const allPosts = [...apiPosts, ...localPosts].sort((a: any, b: any) => b.createdAt - a.createdAt);

          return allPosts.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <Grid3X3 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allPosts.map((post: any) => (
                <div key={post.id} className="glass-panel rounded-xl p-4 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                      <img src={profileAvatar || '/api/uploads?path=images/orra-logo.png'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{profileName}</span>
                        <span className="text-[10px] text-slate-500">{profileHandle}</span>
                        {post.isLocal && <span className="text-[9px] text-amber-400">syncing...</span>}
                      </div>
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                      {post.images.length > 0 && (
                        <div className={`mt-2 grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {post.images.slice(0, 4).map((img: string, idx: number) => (
                            <div key={idx} className="rounded-lg overflow-hidden">
                              <img src={img} alt="" className="w-full h-32 object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2.5 text-slate-500">
                        <button className="flex items-center gap-1 text-xs hover:text-red-400 transition-colors">
                          <Heart className={`w-3.5 h-3.5 ${likedPosts.has(post.id) ? 'fill-red-400 text-red-400' : ''}`} /> <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-xs hover:text-violet-400 transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" /> <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-1 text-xs hover:text-cyan-400 transition-colors">
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="flex items-center gap-1 text-xs hover:text-amber-400 transition-colors">
                          <Bookmark className={`w-3.5 h-3.5 ${savedPosts.has(post.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}

      {/* Content Grid - Reels (own profile only) */}
      {!isViewingOther && activeTab === 'reels' && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <Clapperboard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No reels yet</p>
          <p className="text-xs text-slate-600 mt-1">Create your first reel to see it here</p>
        </div>
      )}

      {/* Content Grid - Challenges (own profile only) */}
      {!isViewingOther && activeTab === 'challenges' && (
        <div className="space-y-3">
          {[
            { name: '#OrraDanceOff2027', result: danceEntries.length > 0 ? `${danceEntries.length} entries submitted` : 'Currently competing', badge: 'LIVE' },
            { name: '#NeonNights', result: '1st Place - Champion', badge: 'WIN' },
            { name: '#BeatDrop', result: 'Top 10 Finisher', badge: 'TOP' },
          ].map((c, i) => (
            <div key={i} className="glass-panel rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{c.name}</p>
                <p className="text-xs text-slate-400">{c.result}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.badge === 'LIVE' ? 'bg-red-500/20 text-red-400' : c.badge === 'WIN' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-violet-500/20 text-violet-400'}`}>
                {c.badge}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Content Grid - Saved (own profile only) */}
      {!isViewingOther && activeTab === 'saved' && (
        savedPostsList.length > 0 ? (
          <div className="space-y-3">
            {savedPostsList.map((post) => {
              const isLiked = likedPosts.has(post.id);
              return (
                <div key={post.id} className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                      <img src={post.user.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-semibold text-white">{post.user.name}</span>
                  </div>
                  <p className="text-sm text-slate-300">{post.text}</p>
                  {post.images.length > 0 && (
                    <div className="mt-2 rounded-xl overflow-hidden max-h-40">
                      <img src={post.images[0]} alt="" className="w-full object-cover max-h-40" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <button onClick={() => { toggleLike(post.id); toast.success(isLiked ? 'Like removed' : 'Post liked! +1 ORRA', { duration: 1500 }); }} className="flex items-center gap-1 hover:text-red-400 transition-all">
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      {(isLiked ? post.likes + 1 : post.likes).toLocaleString()}
                    </button>
                    <span>{post.comments} comments</span>
                    {repostIds.has(post.id) && <span className="text-emerald-400 flex items-center gap-1"><Waves className="w-3 h-3" /> Echoed</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No saved posts yet</p>
            <p className="text-xs text-slate-600 mt-1">Bookmark posts to save them here</p>
          </div>
        )
      )}

      {/* Followers/Following Modal */}
      {showFollowers && (
        <FollowersFollowingModal
          userId={isViewingOther ? viewingUserId! : currentUser.id}
          type={showFollowers}
          onClose={() => setShowFollowers(null)}
        />
      )}
    </div>
  );
}
