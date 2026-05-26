'use client';

import { useAuraStore } from '@/store/aura-store';
import { usePosts, useCreatePost, useToggleLike, useToggleSave, useToggleRepost, useVotePoll, useCreateComment, useComments } from '@/lib/api-hooks';
import { resolveImageUrl } from '@/lib/utils';
import { vibeLabels } from '@/lib/data';
import { useCurrentUser } from '@/lib/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Bookmark, Plus, Image as ImageIcon, Video, MoreHorizontal, BadgeCheck, Repeat2, BarChart3, Play, Send, X, Trash2, Zap, Waves, Sparkles, Radio, Trophy, CheckCircle2 } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// Reaction Orb Component - floating energy orbs when you like
function ReactionOrbs({ show }: { show: boolean }) {
  if (!show) return null;
  const orbs = [
    { color: 'from-violet-500 to-fuchsia-500', x: -8, delay: 0 },
    { color: 'from-fuchsia-500 to-pink-500', x: 4, delay: 100 },
    { color: 'from-cyan-500 to-violet-500', x: -4, delay: 200 },
  ];
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={`reaction-orb absolute w-5 h-5 rounded-full bg-gradient-to-br ${orb.color} orb-glow`}
          style={{
            left: `${orb.x}px`,
            animationDelay: `${orb.delay}ms`,
            boxShadow: `0 0 10px rgba(139, 92, 246, 0.6)`,
          }}
        />
      ))}
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

// Helper: format time ago from date string
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

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

// Comment Section Component - fetches comments from API when expanded
function PostCommentsSection({ postId, currentUser, commentCount }: { postId: string; currentUser: { id: string; name: string; avatar: string }; commentCount: number }) {
  const { setViewingUser, setView } = useAuraStore();
  const createCommentApi = useCreateComment();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  // Fetch comments from API — single source of truth (no local Zustand comments)
  const { data: apiCommentsData } = useComments(postId);

  // Map API comments to display format
  const apiComments = (apiCommentsData?.comments || []).map((c: any) => ({
    id: c.id,
    userId: c.author?.id || '',
    userName: c.author?.name || 'Unknown',
    userAvatar: c.author?.avatar || '/api/uploads?path=images/orra-logo.png',
    text: c.text,
    createdAt: new Date(c.createdAt).getTime(),
  }));

  // Sort by creation time (oldest first for conversation flow)
  const sortedComments = [...apiComments].sort((a: any, b: any) => a.createdAt - b.createdAt);

  // Show limited or all comments
  const INITIAL_SHOW = 5;
  const visibleComments = showAllComments ? sortedComments : sortedComments.slice(-INITIAL_SHOW);
  const hasMore = sortedComments.length > INITIAL_SHOW;

  const handleComment = () => {
    const text = commentText.trim();
    if (!text || createCommentApi.isPending) return;
    setCommentText('');
    createCommentApi.mutate({ postId, text }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        toast.success('Comment added! +2 ORRA', { duration: 1500 });
      },
      onError: () => {
        toast.error('Comment failed to post');
      },
    });
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
          {visibleComments.map((c: any) => (
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
                <p className="text-[10px] text-slate-600 mt-0.5 ml-1">
                  {Math.floor((Date.now() - c.createdAt) / 60000) < 1
                    ? 'Just now'
                    : `${Math.floor((Date.now() - c.createdAt) / 60000)}m ago`}
                </p>
              </div>
            </div>
          ))}
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
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all disabled:opacity-50"
            disabled={createCommentApi.isPending}
            onKeyDown={(e) => { if (e.key === 'Enter' && !createCommentApi.isPending) handleComment(); }}
          />
          <button
            onClick={handleComment}
            disabled={createCommentApi.isPending || !commentText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-violet-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {createCommentApi.isPending ? <div className="w-3.5 h-3.5 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PulseFeed() {
  const {
    likedPosts, savedPosts, toggleLike, toggleSave, toggleCreatePost, toggleShareModal,
    currentVibe, selectedVibes, searchQuery,
    expandedComments, toggleComments,
    repostIds, toggleRepost, deleteUserPost, auraTokens, auraLevel,
    sharedViaDM, setViewingUser, setView,
  } = useAuraStore();
  const currentUser = useCurrentUser();

  // Fetch real posts from the API - use first selected vibe or currentVibe
  const activeVibeFilter = (selectedVibes && selectedVibes.length > 0) ? selectedVibes[0] : currentVibe;
  const { data: postsData, isLoading: postsLoading, error: postsError } = usePosts(activeVibeFilter || undefined);
  const createPost = useCreatePost();
  const toggleLikeApi = useToggleLike();
  const toggleSaveApi = useToggleSave();
  const toggleRepostApi = useToggleRepost();
  const queryClient = useQueryClient();
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [likeAnimation, setLikeAnimation] = useState<string | null>(null);
  const [showOrbs, setShowOrbs] = useState<string | null>(null);
  const [echoAnimation, setEchoAnimation] = useState<string | null>(null);
  const displayName = currentUser.name;
  const displayAvatar = currentUser.avatar;

  // Map API posts to the format the component expects
  const apiPosts = (postsData?.posts || []).map((post) => {
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
      vibeTag: post.vibeTag || 'hyped',
      isLiked: post.isLiked,
      isSaved: post.isSaved,
      isReposted: post.isReposted,
      isUserPost: post.author.id === currentUser.id,
      createdAt: post.createdAt,
      poll: (post as any).poll || undefined,
    };
  });

  // Filter by search and by selected vibes (client-side multi-vibe filter)
  let filteredPosts = apiPosts;
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
    toggleLike(postId);
    // Persist to database so other users see the like
    toggleLikeApi.mutate({ targetId: postId, targetType: 'post' }, { onError: () => {} });
    if (!isLiked) {
      setLikeAnimation(postId);
      setShowOrbs(postId);
      setTimeout(() => setLikeAnimation(null), 600);
      setTimeout(() => setShowOrbs(null), 1200);
      // Only show token toast on first-ever like for this post
      if (!alreadyEarned) {
        toast.success('+1 ORRA tokens', { duration: 1500 });
      }
    }
  };

  const handleEcho = (postId: string) => {
    toggleRepost(postId);
    // Persist to database so other users see the repost
    toggleRepostApi.mutate({ postId }, { onError: () => {} });
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

      {/* Dance Off Promo Card */}
      <button
        onClick={() => useAuraStore.getState().setView('dance')}
        className="w-full glass-panel rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all group"
      >
        <div className="relative h-28 md:h-32">
          <img src="/api/uploads?path=images/dance-banner.png" alt="Dance Off" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">Live Now</span>
              </div>
              <p className="text-lg font-black text-white leading-tight">ORRA DANCE OFF</p>
              <p className="text-[11px] text-slate-300">100K ORRA + Champion Plaque</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold group-hover:opacity-90 transition-all">
              Join →
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

      {/* Loading State */}
      {postsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading posts...</p>
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

      {filteredPosts.map((post) => {
        const isLiked = likedPosts.has(post.id) || post.isLiked;
        const showComments = expandedComments.has(post.id);
        const totalComments = post.comments || 0;
        const isReposted = repostIds.has(post.id) || post.isReposted;
        const isUserPost = post.isUserPost;
        const isSaved = savedPosts.has(post.id) || post.isSaved;
        const isShared = sharedViaDM.has(post.id);

        return (
          <div key={post.id} className={`glass-panel rounded-2xl overflow-hidden hover:border-violet-500/20 transition-all relative ${echoAnimation === post.id ? 'echo-ripple' : ''}`}>
            {/* Like Animation Burst */}
            {likeAnimation === post.id && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <Heart className="w-20 h-20 text-red-500 fill-red-500 animate-ping opacity-60" />
              </div>
            )}

            {/* Reaction Orbs - ORRA EXCLUSIVE */}
            <ReactionOrbs show={showOrbs === post.id} />

            {/* Echo Indicator (was Repost) */}
            {isReposted && !isShared && (
              <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-emerald-400">
                <Waves className="w-3 h-3" />
                <span>{displayName} echoed</span>
              </div>
            )}

            {/* Shared Indicator */}
            {isShared && (
              <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-violet-400">
                <Share2 className="w-3 h-3" />
                <span>{displayName} shared</span>
              </div>
            )}

            {/* Post Header */}
            <div className="flex items-center gap-3 p-4 pb-2">
              <button
                onClick={() => { setViewingUser(post.user.id); setView('profile'); }}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <AuraGlowAvatar src={post.user.avatar} alt={post.user.name} level={auraLevel} vibeTag={currentVibe || undefined} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setViewingUser(post.user.id); setView('profile'); }}
                    className="font-semibold text-white text-sm hover:text-violet-300 transition-colors"
                  >
                    {post.user.name}
                  </button>
                  {post.verified && <BadgeCheck className="w-4 h-4 text-violet-400 fill-violet-400/20" />}
                  {isUserPost && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 font-bold">YOU</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{post.time} ago</span>
                  {post.type === 'text' && <span className="text-slate-600">•</span>}
                  {post.type === 'text' && <span className="text-slate-600">Pulse</span>}
                  {post.type === 'poll' && <span className="text-slate-600">•</span>}
                  {post.type === 'poll' && <span className="text-violet-400">Poll</span>}
                  {post.type === 'video' && <span className="text-slate-600">•</span>}
                  {post.type === 'video' && <span className="text-red-400">Reel</span>}
                  {post.type === 'image' && <span className="text-slate-600">•</span>}
                  {post.type === 'image' && <span className="text-emerald-400">Photo</span>}
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
              {isUserPost ? (
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
                          // Also delete from database so it disappears for all users
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

            {/* Post Content */}
            <div className="px-4 pb-3">
              <p className="text-sm text-slate-200 leading-relaxed">{post.text}</p>
            </div>

            {/* Poll Rendering */}
            {post.poll && (
              <PollRenderer poll={post.poll} postId={post.id} />
            )}

            {/* Post Images */}
            {post.images.length > 0 && post.type !== 'video' && (
              <div className={`${post.images.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''} mx-4 mb-3 rounded-xl overflow-hidden`}>
                {post.images.map((img, i) => (
                  <div key={i} className={`relative overflow-hidden group cursor-pointer ${post.images.length === 1 ? 'max-h-[400px]' : 'aspect-square'}`}>
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.currentTarget;
                        // Hide broken image and show a placeholder instead
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
                ))}
              </div>
            )}

            {/* Post Video (for reel/video type posts) */}
            {post.type === 'video' && post.images.length > 0 && (
              <div className="mx-4 mb-3 rounded-xl overflow-hidden">
                <video
                  src={post.images[0]}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-[400px] object-cover rounded-xl"
                />
              </div>
            )}

            {/* Engagement Stats - Comments are toggleable */}
            {(post.likes > 0 || totalComments > 0) && (
              <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <span>{(post.likes + (likedPosts.has(post.id) && !post.isLiked ? 1 : 0)).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1 transition-colors ${showComments ? 'text-violet-400' : 'text-slate-500 hover:text-white'}`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>{totalComments} comments</span>
                    <svg className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <span>{(post.shares + (repostIds.has(post.id) && !post.isReposted ? 1 : 0))} echoes</span>
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
              <div className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 group flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-all relative"
                >
                  <Heart className={`w-[18px] h-[18px] transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 group-hover:text-red-400'}`} />
                  <span className={`text-xs ${isLiked ? 'text-red-400' : 'text-slate-400'}`}>Like</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                  <span className="text-xs">Comment</span>
                </button>
                <button
                  onClick={() => handleEcho(post.id)}
                  className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <Waves className={`w-[18px] h-[18px] transition-all ${isReposted ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'} ${echoAnimation === post.id ? 'echo-wave-icon' : ''}`} />
                  <span className={`text-xs transition-colors ${isReposted ? 'text-emerald-400' : 'text-slate-400'}`}>Echo</span>
                </button>
                <button
                  onClick={() => toggleShareModal(post.id)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <Share2 className="w-[18px] h-[18px]" />
                  <span className="text-xs">Share</span>
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
        );
      })}
    </div>
  );
}
