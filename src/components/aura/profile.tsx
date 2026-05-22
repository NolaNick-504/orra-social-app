'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { usePosts, useUserPosts, useHubs } from '@/lib/api-hooks';
import { resolveImageUrl } from '@/lib/utils';
import { MapPin, Link as LinkIcon, Calendar, Grid3X3, Clapperboard, Trophy, Bookmark, Heart, Share2, Edit3, Zap, Users, X, MessageCircle, Waves, Sparkles, ArrowLeft, Crown, Star, Rocket, Music, QrCode } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProfileMusicPlayer } from './profile-music-player';

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
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId }),
      });
      if (res.status === 403) {
        // Can't unfollow founder — revert local state
        toggleFollow(targetId);
        toast.error("You can't unfollow the ORRA Founder");
        return;
      }
    } catch {
      // Revert on network error too
      toggleFollow(targetId);
    }
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
                    <img src={resolveImageUrl(user.avatar || '/api/uploads?path=images/orra-logo.png')} alt={user.name} className="w-full h-full object-cover" />
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

// Founder QR Code - Quick scan to follow/become friends
function FounderQRCode({ handle, name, isFounder, level }: { handle: string; name: string; isFounder?: boolean; level: number }) {
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/${handle.replace('@', '')}` : `/${handle.replace('@', '')}`;

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border ${isFounder ? 'bg-gradient-to-br from-amber-950/30 via-black/40 to-violet-950/20 border-amber-500/20' : 'bg-black/40 border-white/5'}`}>
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-500/5 border-b border-amber-500/10">
        <QrCode className="w-3 h-3 text-amber-400" />
        <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">
          {isFounder ? 'Founder QR Code' : 'QR Code'}
        </span>
        <span className="text-[8px] text-slate-500 ml-auto">Scan to follow</span>
      </div>

      <div className="flex items-center justify-center p-4 gap-4">
        {/* QR Code */}
        <div className="relative bg-white rounded-xl p-2.5 flex-shrink-0 shadow-lg shadow-amber-500/10">
          <QRCodeSVG
            value={profileUrl}
            size={120}
            bgColor="#ffffff"
            fgColor="#1a1a2e"
            level="H"
            includeMargin={false}
          />
          {/* ORRA logo overlay in center of QR */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm border border-amber-200">
              <span className="text-[7px] font-black text-amber-600 tracking-tight">ORRA</span>
            </div>
          </div>
        </div>

        {/* Info next to QR */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="text-sm font-bold text-white truncate">{name}</p>
          <p className="text-[10px] text-slate-400 truncate">{handle}</p>
          {isFounder && (
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Founder</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-violet-400" />
            <span className="text-[9px] text-slate-500">Lvl {level}</span>
          </div>
          <p className="text-[8px] text-slate-600 mt-1 leading-relaxed">Scan with your camera<br/>to connect instantly</p>
        </div>
      </div>
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
  const { toggleEditProfile, userPosts, savedPosts, likedPosts, toggleLike, auraTokens, auraLevel, auraXP, joinedHubs, danceEntries, repostIds, viewingUserId, setViewingUser, setView, followedUsers, toggleFollow, setViewingPostId, setViewingEchoId, clearStaleUserPosts } = useAuraStore();
  const currentUser = useCurrentUser();
  const { data: apiHubs } = useHubs();
  const queryClient = useQueryClient();

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

  // Clean up stale local posts when API data arrives
  // Local posts have "up-" prefix IDs that never match API CUIDs, so they linger forever.
  // When API confirms a post exists, remove the local copy with matching text+time.
  useEffect(() => {
    if (!userPostsData?.posts || isViewingOther || userPosts.length === 0) return;
    const apiPosts = userPostsData.posts as any[];
    const staleIds: string[] = [];
    for (const lp of userPosts) {
      // If a local post's text and approximate creation time match an API post, it's stale
      const isStale = apiPosts.some((ap: any) =>
        ap.text === lp.text && Math.abs(new Date(ap.createdAt).getTime() - lp.createdAt) < 5000
      );
      if (isStale) staleIds.push(lp.id);
    }
    if (staleIds.length > 0) {
      clearStaleUserPosts(staleIds);
    }
  }, [userPostsData?.posts, isViewingOther, userPosts.length]);

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
      {/* Founder Tagline Bar - simple gold text like reference */}
      {profileIsFounder && (
        <div className="flex items-center justify-center py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[11px] font-semibold text-amber-400 tracking-wide">The architect behind the universe</span>
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
                <img src={resolveImageUrl(profileAvatar)} alt={profileName} className="w-full h-full object-cover" />
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
                  onClick={async () => {
                    const wasFollowing = isFollowing;
                    toggleFollow(viewingUserId!);
                    try {
                      const res = await fetch('/api/follows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: viewingUserId }) });
                      if (res.status === 403) {
                        toggleFollow(viewingUserId!);
                        toast.error("You can't unfollow the ORRA Founder");
                        return;
                      }
                    } catch { toggleFollow(viewingUserId!); }
                    toast.success(wasFollowing ? `Unfollowed ${profileName}` : `Following ${profileName}`);
                  }}
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
            {/* Profile Song Indicator */}
            {(() => {
              const songUrl = isViewingOther ? (otherUserData?.profileSongUrl || '') : (currentUser.profileSongUrl || '');
              const songTitle = isViewingOther ? (otherUserData?.profileSongTitle || '') : (currentUser.profileSongTitle || '');
              const songArtist = isViewingOther ? (otherUserData?.profileSongArtist || '') : (currentUser.profileSongArtist || '');
              return songUrl ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1 profile-song-indicator">
                  <Music className="w-2.5 h-2.5" /> {songTitle} - {songArtist}
                </span>
              ) : null;
            })()}
          </div>
          <p className={`text-sm ${profileIsFounder ? 'text-amber-400' : 'text-slate-400'}`}>{profileHandle}</p>
          <p className={`text-sm mt-2 leading-relaxed ${profileIsFounder ? 'text-amber-100/90 font-medium' : 'text-slate-300'}`}>{profileBio}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            {profileLocation && <span className={`flex items-center gap-1 ${profileIsFounder ? 'text-amber-400' : ''}`}><MapPin className="w-3 h-3" /> {profileLocation}</span>}
            {profileWebsite && <span className={`flex items-center gap-1 ${profileIsFounder ? 'text-amber-400' : ''}`}><LinkIcon className="w-3 h-3" /> {profileWebsite}</span>}
            {!isViewingOther && <span className={`flex items-center gap-1 ${profileIsFounder ? 'text-amber-400' : ''}`}><Calendar className="w-3 h-3" /> Joined {currentUser.joinDate}</span>}
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

        {/* Founder QR Code - Scan to follow */}
        <div className="mt-4">
          <FounderQRCode handle={profileHandle || displayHandle} name={profileName || 'ORRA User'} isFounder={profileIsFounder} level={profileLevel} />
        </div>

        {/* Stats - Simple 3-column row like reference */}
        <div className={`flex items-center justify-around mt-4 py-3 ${
          profileIsFounder
            ? 'founder-stat-highlight rounded-xl'
            : 'border-y border-white/5'
        }`}>
          <button onClick={() => setShowFollowers('followers')} className="text-center hover:bg-white/5 rounded-lg px-4 py-1 transition-all">
            <p className="font-bold text-white text-sm">{profileFollowerCount >= 1000 ? (profileFollowerCount / 1000).toFixed(1) + 'K' : profileFollowerCount}</p>
            <p className="text-[10px] text-slate-500">Followers</p>
          </button>
          <button onClick={() => setShowFollowers('following')} className="text-center hover:bg-white/5 rounded-lg px-4 py-1 transition-all">
            <p className="font-bold text-white text-sm">{profileFollowingCount}</p>
            <p className="text-[10px] text-slate-500">Following</p>
          </button>
          <div className="text-center px-4 py-1">
            <p className="font-bold text-white text-sm">{profilePostCount}</p>
            <p className="text-[10px] text-slate-500">Pulses</p>
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

        {/* Profile Song Player - MySpace Style */}
        {(() => {
          const songUrl = isViewingOther ? (otherUserData?.profileSongUrl || '') : (currentUser.profileSongUrl || '');
          const songTitle = isViewingOther ? (otherUserData?.profileSongTitle || '') : (currentUser.profileSongTitle || '');
          const songArtist = isViewingOther ? (otherUserData?.profileSongArtist || '') : (currentUser.profileSongArtist || '');
          
          if (!songUrl) return null;
          
          return (
            <div className="mt-4">
              <ProfileMusicPlayer
                songUrl={songUrl}
                songTitle={songTitle}
                songArtist={songArtist}
                isOwnProfile={!isViewingOther}
                onRemove={async () => {
                  try {
                    await fetch('/api/users/profile', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ profileSongUrl: '', profileSongTitle: '', profileSongArtist: '' }),
                    });
                    toast.success('Profile song removed');
                    // Refresh the data
                    queryClient.invalidateQueries({ queryKey: ['user-profile', viewingUserId] });
                    queryClient.invalidateQueries({ queryKey: ['me'] });
                  } catch {
                    toast.error('Failed to remove song');
                  }
                }}
              />
            </div>
          );
        })()}
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
            _isEcho: p._isEcho || p.isEcho || false,
            _echoId: p._echoId || null,
            echoedBy: p.echoedBy || null,
          }));

          // For own profile, merge with local posts
          // Dedup by ID first, then by text+time as safety net for stale local posts
          const localPosts = !isViewingOther ? userPosts
            .filter((lp) => {
              // Skip if ID matches an API post
              if (apiPosts.some((ap: any) => ap.id === lp.id)) return false;
              // Safety net: skip if text and approximate time match an API post (within 5 seconds)
              // This catches stale local posts with different IDs but same content
              if (apiPosts.some((ap: any) =>
                ap.text === lp.text && Math.abs(ap.createdAt - lp.createdAt) < 5000
              )) return false;
              return true;
            })
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
                <div
                  key={post.id}
                  onClick={() => {
                    const isEcho = post._isEcho === true;
                    if (isEcho) {
                      useAuraStore.getState().setViewingEchoId(post._echoId || null);
                      useAuraStore.getState().setViewingPostId(post.id);
                      useAuraStore.getState().setView('postDetail');
                    }
                  }}
                  className={`glass-panel rounded-xl p-4 hover:bg-white/[0.04] transition-all group ${post._isEcho ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                      <img src={resolveImageUrl(profileAvatar || '/api/uploads?path=images/orra-logo.png')} alt="" className="w-full h-full object-cover" />
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
                              <img src={resolveImageUrl(img)} alt="" className="w-full h-32 object-cover" />
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
                      <img src={resolveImageUrl(post.user.avatar)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-semibold text-white">{post.user.name}</span>
                  </div>
                  <p className="text-sm text-slate-300">{post.text}</p>
                  {post.images.length > 0 && (
                    <div className="mt-2 rounded-xl overflow-hidden max-h-40">
                      <img src={resolveImageUrl(post.images[0])} alt="" className="w-full object-cover max-h-40" />
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
