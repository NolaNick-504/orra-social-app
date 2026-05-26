'use client';

import { useAuraStore } from '@/store/aura-store';
import { usePost, useToggleLike, useToggleSave, useToggleRepost, useCreateComment, useComments, useVotePoll } from '@/lib/api-hooks';
import { resolveImageUrl } from '@/lib/utils';
import { useCurrentUser } from '@/lib/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Bookmark, X, Send, Repeat2, BadgeCheck, CheckCircle2, Trophy, Trash2, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Reaction types (same as pulse-feed)
const REACTION_TYPES = [
  { key: 'like', emoji: '\u2764\uFE0F', label: 'Like', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  { key: 'wow', emoji: '\uD83D\uDE2E', label: 'Wow', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { key: 'omg', emoji: '\uD83D\uDE31', label: 'OMG', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  { key: 'wtf', emoji: '\uD83E\uDD2F', label: 'WTF', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { key: 'laughing', emoji: '\uD83D\uDE02', label: 'LOL', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { key: 'sad', emoji: '\uD83D\uDE22', label: 'Sad', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { key: 'care', emoji: '\uD83E\uDD70', label: 'Care', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  { key: 'prayers', emoji: '\uD83D\uDE4F', label: 'Prayers', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
] as const;

type ReactionKey = typeof REACTION_TYPES[number]['key'];

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

export function PostDetailModal() {
  const { showPostDetail, selectedPostId, closePostDetail, likedPosts, savedPosts, repostIds, postReactions, setViewingUser, setView, toggleLike, toggleSave, toggleRepost, setPostReaction, toggleShareModal } = useAuraStore();
  const currentUser = useCurrentUser();

  if (!showPostDetail || !selectedPostId) return null;

  return (
    <PostDetailContent postId={selectedPostId} onClose={closePostDetail} currentUser={currentUser} />
  );
}

function PostDetailContent({ postId, onClose, currentUser }: { postId: string; onClose: () => void; currentUser: { id: string; name: string; avatar: string } }) {
  const { likedPosts, savedPosts, repostIds, postReactions, setViewingUser, setView, toggleLike, toggleSave, toggleRepost, setPostReaction, toggleShareModal } = useAuraStore();
  const { data: postData, isLoading, error } = usePost(postId);
  const toggleLikeApi = useToggleLike();
  const toggleSaveApi = useToggleSave();
  const toggleRepostApi = useToggleRepost();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleLike = () => {
    const isLiked = likedPosts.has(postId);
    const currentReaction = postReactions[postId] || 'like';
    if (isLiked && currentReaction === 'like') {
      toggleLike(postId, 'like');
      toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType: 'like' }, { onError: () => {} });
    } else {
      toggleLike(postId, 'like');
      toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType: 'like' }, { onError: () => {} });
    }
  };

  const handleReaction = (reactionType: ReactionKey) => {
    const isLiked = likedPosts.has(postId);
    const currentReaction = postReactions[postId];
    if (isLiked && currentReaction === reactionType) {
      toggleLike(postId, reactionType);
      toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType }, { onError: () => {} });
      return;
    }
    setPostReaction(postId, reactionType);
    toggleLikeApi.mutate({ targetId: postId, targetType: 'post', reactionType }, { onError: () => {} });
  };

  const handleEcho = () => {
    toggleRepost(postId);
    toggleRepostApi.mutate({ postId }, { onError: () => {} });
    const isReposted = repostIds.has(postId);
    if (!isReposted) {
      toast.success('Echoed! +2 ORRA', { duration: 1500 });
    } else {
      toast.success('Echo removed', { duration: 1500 });
    }
  };

  const handleSave = () => {
    toggleSave(postId);
    toggleSaveApi.mutate({ postId }, { onError: () => {} });
    const isSaved = savedPosts.has(postId);
    toast.success(isSaved ? 'Removed from saved' : 'Saved! +1 ORRA', { duration: 1500 });
  };

  const handleShare = () => {
    toggleShareModal(postId);
  };

  const post = postData as any;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] mx-4 rounded-2xl overflow-hidden bg-[#0a0a0f] border border-white/10 shadow-2xl shadow-black/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : error || !post ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-400 text-sm">Post not found</p>
            </div>
          ) : (
            <PostContent
              post={post}
              currentUser={currentUser}
              isLiked={likedPosts.has(postId)}
              isSaved={savedPosts.has(postId)}
              isReposted={repostIds.has(postId)}
              myReaction={postReactions[postId] || null}
              onLike={handleLike}
              onReaction={handleReaction}
              onEcho={handleEcho}
              onSave={handleSave}
              onShare={handleShare}
              onUserClick={(userId) => { setViewingUser(userId); setView('profile'); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PostContent({ post, currentUser, isLiked, isSaved, isReposted, myReaction, onLike, onReaction, onEcho, onSave, onShare, onUserClick }: {
  post: any;
  currentUser: { id: string; name: string; avatar: string };
  isLiked: boolean;
  isSaved: boolean;
  isReposted: boolean;
  myReaction: string | null;
  onLike: () => void;
  onReaction: (reaction: ReactionKey) => void;
  onEcho: () => void;
  onSave: () => void;
  onShare: () => void;
  onUserClick: (userId: string) => void;
}) {
  const images: string[] = (() => {
    try {
      const parsed = JSON.parse(post.images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const activeReaction = myReaction || (isLiked ? 'like' : null);
  const reactionDef = activeReaction ? REACTION_TYPES.find(r => r.key === activeReaction) : null;
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  return (
    <>
      {/* Author */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => onUserClick(post.author.id)}
          className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-violet-500/30 transition-all flex-shrink-0"
        >
          <img src={resolveImageUrl(post.author.avatar)} alt={post.author.name} className="w-full h-full object-cover" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button onClick={() => onUserClick(post.author.id)} className="text-sm font-semibold text-white hover:text-violet-300 transition-colors truncate">
              {post.author.name}
            </button>
            {post.author.verified && <BadgeCheck className="w-4 h-4 text-violet-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-slate-500">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Post text */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{post.text}</p>
        </div>
      )}

      {/* Post images */}
      {images.length > 0 && (
        <div className="px-4 pb-3">
          <div className={`rounded-xl overflow-hidden ${images.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
            {images.slice(0, 4).map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={resolveImageUrl(img)}
                  alt=""
                  className="w-full h-auto max-h-80 object-cover rounded-lg"
                />
                {images.length > 4 && i === 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                    <span className="text-white font-bold text-lg">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-b border-white/5">
        <div className="flex items-center gap-5">
          {/* Like button with reaction picker */}
          <div className="relative">
            {showReactionPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowReactionPicker(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-50 reaction-picker-enter">
                  <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-0 border border-white/10 shadow-xl shadow-black/40">
                    {REACTION_TYPES.map((reaction) => (
                      <button
                        key={reaction.key}
                        onClick={(e) => { e.stopPropagation(); onReaction(reaction.key); setShowReactionPicker(false); }}
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
            )}
            <button
              onClick={onLike}
              onContextMenu={(e) => { e.preventDefault(); setShowReactionPicker(!showReactionPicker); }}
              onMouseDown={() => {
                const timer = setTimeout(() => setShowReactionPicker(true), 500);
                setLongPressTimer(timer);
              }}
              onMouseUp={() => { if (longPressTimer) clearTimeout(longPressTimer); setLongPressTimer(null); }}
              onMouseLeave={() => { if (longPressTimer) clearTimeout(longPressTimer); setLongPressTimer(null); }}
              className="flex items-center gap-1.5 group transition-all"
            >
              {activeReaction ? (
                <>
                  <span className="text-base">{reactionDef?.emoji || '\u2764\uFE0F'}</span>
                  <span className={`text-xs font-medium ${reactionDef?.color || 'text-red-400'}`}>{reactionDef?.label || 'Like'}</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
                  <span className="text-xs text-slate-400 group-hover:text-red-400 transition-colors">Like</span>
                </>
              )}
              {post.likesCount > 0 && <span className="text-xs text-slate-500">{post.likesCount}</span>}
            </button>
          </div>

          {/* Echo (Repost) */}
          <button onClick={onEcho} className="flex items-center gap-1.5 group transition-all">
            <Repeat2 className={`w-5 h-5 ${isReposted ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'} transition-colors`} />
            <span className={`text-xs ${isReposted ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'} transition-colors`}>Echo</span>
            {post.sharesCount > 0 && <span className="text-xs text-slate-500">{post.sharesCount}</span>}
          </button>

          {/* Share */}
          <button onClick={onShare} className="flex items-center gap-1.5 group transition-all">
            <Share2 className="w-5 h-5 text-slate-400 group-hover:text-violet-400 transition-colors" />
          </button>
        </div>

        {/* Save */}
        <button onClick={onSave} className="group transition-all">
          <Bookmark className={`w-5 h-5 ${isSaved ? 'text-amber-400 fill-amber-400' : 'text-slate-400 group-hover:text-amber-400'} transition-colors`} />
        </button>
      </div>

      {/* Comments section - always expanded */}
      <CommentsSection postId={post.id} currentUser={currentUser} commentCount={post.commentsCount} />
    </>
  );
}

function CommentsSection({ postId, currentUser, commentCount }: { postId: string; currentUser: { id: string; name: string; avatar: string }; commentCount: number }) {
  const { setViewingUser, setView } = useAuraStore();
  const createCommentApi = useCreateComment();
  const toggleLikeApi = useToggleLike();
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const isSubmittingRef = useRef(false);

  // Fetch comments from API
  const { data: apiCommentsData } = useComments(postId);

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
    const seen = new Set<string>();
    return raw.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  })();

  const sortedComments = [...apiComments].sort((a: any, b: any) => a.createdAt - b.createdAt);
  const INITIAL_SHOW = 5;
  const visibleComments = showAllComments ? sortedComments : sortedComments.slice(-INITIAL_SHOW);
  const hasMore = sortedComments.length > INITIAL_SHOW;

  const handleComment = () => {
    const text = commentText.trim();
    if (!text || createCommentApi.isPending || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setCommentText('');
    createCommentApi.mutate({ postId, text }, {
      onSuccess: () => {
        toast.success('Comment added! +2 ORRA', { duration: 1500 });
      },
      onError: () => {
        toast.error('Comment failed to post');
        setCommentText(text);
      },
      onSettled: () => {
        isSubmittingRef.current = false;
      },
    });
  };

  return (
    <div className="border-t border-white/5">
      {/* Comment count header */}
      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-slate-400">{commentCount} comment{commentCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Existing comments */}
      {sortedComments.length > 0 && (
        <div className="px-4 pb-3 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
          {hasMore && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-xs text-slate-500 hover:text-violet-400 transition-colors mb-1"
            >
              View all {sortedComments.length} comments
            </button>
          )}
          {visibleComments.map((c: any) => {
            const reactionDef = c.myReaction ? REACTION_TYPES.find(r => r.key === c.myReaction) : null;
            const displayEmoji = reactionDef?.emoji || '\u2764\uFE0F';
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
                  <div className="flex items-center gap-3 mt-1 ml-1">
                    <p className="text-[10px] text-slate-600">
                      {Math.floor((Date.now() - c.createdAt) / 60000) < 1
                        ? 'Just now'
                        : `${Math.floor((Date.now() - c.createdAt) / 60000)}m ago`}
                    </p>
                    <button
                      onClick={() => {
                        toggleLikeApi.mutate(
                          { targetId: c.id, targetType: 'comment', reactionType: c.isLiked ? 'like' : 'like' },
                          { onError: () => {} }
                        );
                      }}
                      className={`text-[10px] font-medium transition-colors flex items-center gap-0.5 ${c.isLiked ? displayColor : 'text-slate-600 hover:text-red-400'}`}
                    >
                      {c.isLiked ? (
                        <>
                          <span className="text-xs">{displayEmoji}</span>
                          <span>{displayLabel}</span>
                        </>
                      ) : 'Like'}
                      {c.likesCount > 0 ? ` ${c.likesCount}` : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No comments yet */}
      {sortedComments.length === 0 && (
        <div className="px-4 pb-3 text-center">
          <p className="text-xs text-slate-500">No comments yet. Be the first!</p>
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
            onKeyDown={(e) => { if (e.key === 'Enter' && !createCommentApi.isPending && !isSubmittingRef.current) handleComment(); }}
            autoFocus
          />
          <button
            onClick={handleComment}
            disabled={createCommentApi.isPending || !commentText.trim() || isSubmittingRef.current}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-violet-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {createCommentApi.isPending ? <div className="w-3.5 h-3.5 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
