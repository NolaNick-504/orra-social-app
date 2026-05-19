'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { resolveImageUrl } from '@/lib/utils';
import { useToggleLike, useComments, useCreateComment } from '@/lib/api-hooks';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, BadgeCheck, Send, Waves } from 'lucide-react';
import { toast } from 'sonner';

// Reaction types
const REACTION_TYPES = [
  { key: 'like', emoji: '❤️', label: 'Like', color: 'text-red-400' },
  { key: 'wow', emoji: '😮', label: 'Wow', color: 'text-yellow-400' },
  { key: 'omg', emoji: '😱', label: 'OMG', color: 'text-orange-400' },
  { key: 'wtf', emoji: '🤯', label: 'WTF', color: 'text-purple-400' },
  { key: 'laughing', emoji: '😂', label: 'Laughing', color: 'text-amber-400' },
  { key: 'sad', emoji: '😢', label: 'Sad', color: 'text-blue-400' },
  { key: 'care', emoji: '🥰', label: 'Care', color: 'text-pink-400' },
  { key: 'prayers', emoji: '🙏', label: 'Prayers', color: 'text-emerald-400' },
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

export function PostDetail() {
  const { viewingPostId, setViewingPostId, setView, setViewingUser, likedPosts, postReactions, toggleLike, savedPosts, toggleSave, viewingEchoId, setViewingEchoId } = useAuraStore();
  const currentUser = useCurrentUser();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const isSubmittingRef = useRef(false);

  const toggleLikeApi = useToggleLike();
  const createCommentApi = useCreateComment();

  // Fetch the post by ID (with echo context if viewingEchoId is set)
  useEffect(() => {
    if (!viewingPostId) return;
    setLoading(true);
    const echoParam = viewingEchoId ? `?repostId=${viewingEchoId}` : '';
    fetch(`/api/posts/${viewingPostId}${echoParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPost(data.data);
        } else {
          toast.error('Post not found');
          setViewingPostId(null);
          setViewingEchoId(null);
          setView('home');
        }
      })
      .catch(() => {
        toast.error('Failed to load post');
        setViewingPostId(null);
        setViewingEchoId(null);
        setView('home');
      })
      .finally(() => setLoading(false));
  }, [viewingPostId, viewingEchoId, setViewingPostId, setViewingEchoId, setView]);

  // Fetch comments for this post (echo-scoped if viewingEchoId is set)
  const { data: commentsData } = useComments(viewingPostId || '', viewingEchoId);

  const comments = (() => {
    const raw = (commentsData?.comments || []).map((c: any) => ({
      id: c.id,
      userId: c.author?.id || '',
      userName: c.author?.name || 'Unknown',
      userAvatar: c.author?.avatar || '/api/uploads?path=images/orra-logo.png',
      text: c.text,
      createdAt: new Date(c.createdAt).getTime(),
      likesCount: c.likesCount || 0,
      isLiked: c.isLiked || false,
    }));
    const seen = new Set<string>();
    return raw.filter((c: any) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  })();

  const handleGoBack = () => {
    setViewingEchoId(null);
    setViewingPostId(null);
    setView('home');
  };

  const handleLike = () => {
    if (!post) return;
    const isLiked = likedPosts.has(post.id);
    toggleLike(post.id, 'like');
    toggleLikeApi.mutate({ targetId: post.id, targetType: 'post', reactionType: 'like' }, { onError: () => {} });
    if (!isLiked) {
      toast.success('+1 ORRA', { duration: 1500 });
    }
  };

  const handleSave = () => {
    if (!post) return;
    toggleSave(post.id);
    const isSaved = savedPosts.has(post.id);
    toast.success(isSaved ? 'Removed from saved' : 'Saved! +1 ORRA', { duration: 1500 });
  };

  const handleComment = () => {
    const text = commentText.trim();
    if (!text || !viewingPostId || createCommentApi.isPending || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setCommentText('');
    createCommentApi.mutate({ postId: viewingPostId, text, repostId: viewingEchoId }, {
      onSuccess: () => {
        toast.success('Comment added! +2 ORRA', { duration: 1500 });
      },
      onError: () => {
        toast.error('Comment failed');
        setCommentText(text);
      },
      onSettled: () => {
        isSubmittingRef.current = false;
      },
    });
  };

  if (loading) {
    return (
      <div className="fade-in flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const images: string[] = (() => {
    try {
      const parsed = JSON.parse(post.images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const isLiked = likedPosts.has(post.id);
  const currentReaction = postReactions[post.id] || 'like';
  const reactionDef = REACTION_TYPES.find(r => r.key === currentReaction);
  const displayEmoji = isLiked ? (reactionDef?.emoji || '❤️') : null;
  const displayLabel = isLiked ? (reactionDef?.label || 'Like') : 'Like';
  const displayColor = isLiked ? (reactionDef?.color || 'text-red-400') : 'text-slate-400';
  const isSaved = savedPosts.has(post.id);

  return (
    <div className="fade-in pb-4">
      {/* Back button */}
      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 px-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to feed</span>
      </button>

      {/* Echo banner */}
      {viewingEchoId && post && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Waves className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {post.echoedBy ? (
            <span className="text-xs text-slate-300">
              Echoed by{' '}
              <button onClick={(e) => { e.stopPropagation(); setViewingUser(post.echoedBy.id); setView('profile'); }} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                {post.echoedBy.name}
              </button>
            </span>
          ) : (
            <span className="text-xs text-slate-300">You&apos;re viewing an echoed post</span>
          )}
          <span className="text-[10px] text-slate-500 ml-auto">Comments are separate from original</span>
        </div>
      )}

      {/* Post Card */}
      <div className="glass-panel rounded-2xl overflow-hidden ring-2 ring-violet-500/30">
        {/* Post Header */}
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => { setViewingUser(post.author.id); setView('profile'); }}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
              <img
                src={resolveImageUrl(post.author.avatar || '/api/uploads?path=images/orra-logo.png')}
                alt={post.author.name}
                className="w-full h-full object-cover"
              />
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => { setViewingUser(post.author.id); setView('profile'); }}
              className="text-sm font-semibold text-white hover:text-violet-300 transition-colors flex items-center gap-1"
            >
              {post.author.name}
              {post.author.verified && <BadgeCheck className="w-3.5 h-3.5 text-violet-400" />}
            </button>
            <p className="text-[11px] text-slate-500">{timeAgo(post.createdAt)}</p>
          </div>
          {viewingEchoId && (
            <button
              onClick={() => { setViewingEchoId(null); }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              View original comments →
            </button>
          )}
        </div>

        {/* Post Text */}
        {post.text && (
          <div className="px-4 pb-3">
            <p className="text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{post.text}</p>
          </div>
        )}

        {/* Post Images */}
        {images.length > 0 && (
          <div className="px-4 pb-3">
            <div className={`rounded-xl overflow-hidden ${images.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
              {images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={resolveImageUrl(img)}
                  alt=""
                  className="w-full max-h-[400px] object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all ${displayColor} hover:scale-105`}
            >
              {isLiked ? <span className="text-base">{displayEmoji}</span> : <Heart className="w-4 h-4" />}
              <span>{displayLabel}</span>
              <span className="text-slate-500">({post.likesCount || 0})</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-400 transition-all">
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
              <span className="text-slate-500">({post.commentsCount || 0})</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className={`flex items-center gap-1 text-xs font-medium transition-all ${isSaved ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-400' : ''}`} />
            </button>
            <button className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-violet-400 transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="border-t border-white/5">
          {comments.length > 0 && (
            <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              {comments.sort((a: any, b: any) => a.createdAt - b.createdAt).map((c: any) => (
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
                      <button className="text-[10px] font-medium text-slate-600 hover:text-red-400 transition-colors">
                        {c.isLiked ? '❤️ Liked' : 'Like'}{c.likesCount > 0 ? ` ${c.likesCount}` : ''}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
              <img src={currentUser.avatar || '/api/uploads?path=images/orra-logo.png'} alt="" className="w-full h-full object-cover" />
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
              />
              <button
                onClick={handleComment}
                disabled={createCommentApi.isPending || !commentText.trim() || isSubmittingRef.current}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-violet-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {createCommentApi.isPending ? (
                  <div className="w-3.5 h-3.5 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
