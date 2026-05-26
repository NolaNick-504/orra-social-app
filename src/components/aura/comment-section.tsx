'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCreateComment, useComments } from '@/lib/api-hooks';
import { resolveImageUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect, useCallback } from 'react';

// Live-updating time-ago component
function timeAgo(dateStr: string | number): string {
  const now = Date.now();
  const then = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

function LiveTimeAgo({ date, suffix = true }: { date: string | number; suffix?: boolean }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const then = typeof date === 'number' ? date : new Date(date).getTime();
    const diffMs = Date.now() - then;
    let interval: ReturnType<typeof setInterval>;
    if (diffMs < 60_000) interval = setInterval(() => forceUpdate(n => n + 1), 10_000);
    else if (diffMs < 3_600_000) interval = setInterval(() => forceUpdate(n => n + 1), 30_000);
    else if (diffMs < 86_400_000) interval = setInterval(() => forceUpdate(n => n + 1), 60_000);
    else interval = setInterval(() => forceUpdate(n => n + 1), 600_000);
    return () => clearInterval(interval);
  }, [date]);
  const t = timeAgo(date);
  if (t === 'Just now') return <>{t}</>;
  return <>{suffix ? `${t} ago` : t}</>;
}
import { toast } from 'sonner';
import { Send, MessageCircle, X, CornerDownRight } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  currentUser: { id: string; name: string; avatar: string };
  show: boolean;
  onToggle?: () => void;
  commentCount?: number;
}

export function CommentSection({ postId, currentUser, show, onToggle, commentCount = 0 }: CommentSectionProps) {
  const { addComment, comments, setViewingUser, setView } = useAuraStore();
  const createCommentApi = useCreateComment();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [inputActive, setInputActive] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string | null>(null);

  // Fetch comments from API when shown
  const { data: apiCommentsData, isLoading } = useComments(show ? postId : null);

  // Map API comments to display format
  const apiComments = (apiCommentsData?.comments || []).map((c: any) => ({
    id: c.id,
    userId: c.author?.id || '',
    userName: c.author?.name || 'Unknown',
    userAvatar: c.author?.avatar || '/images/orra-logo.png',
    text: c.text,
    parentId: c.parentId || null,
    replyToName: c.replyToName || null,
    createdAt: new Date(c.createdAt).getTime(),
  }));

  // Merge: prefer API comments, add local only if not yet in API
  const localComments = comments[postId] || [];
  const apiIds = new Set(apiComments.map((c: any) => c.id));
  const localOnly = localComments.filter((lc: any) => !apiIds.has(lc.id));
  const mergedComments = [...localOnly, ...apiComments];

  // Sort by createdAt ascending (oldest first, like a conversation)
  mergedComments.sort((a: any, b: any) => a.createdAt - b.createdAt);

  // Separate top-level comments and replies
  const topLevelComments = mergedComments.filter((c: any) => !c.parentId);
  const getReplies = (parentId: string) => mergedComments.filter((c: any) => c.parentId === parentId);

  // Reset input state when section closes
  useEffect(() => {
    if (!show) {
      setInputActive(false);
      setCommentText('');
      setReplyToId(null);
      setReplyToName(null);
    }
  }, [show]);

  // Auto-resize textarea
  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  const handleComment = () => {
    const text = commentText.trim();
    if (!text) return;
    addComment(postId, currentUser.id, currentUser.name, currentUser.avatar, text, replyToId || undefined, replyToName || undefined);
    setCommentText('');
    setReplyToId(null);
    setReplyToName(null);
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    createCommentApi.mutate({ postId, text, parentId: replyToId || null, replyToName: replyToName || null }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['posts', 'infinite'] });
      },
      onError: () => {
        toast.error('Comment failed to sync');
      },
    });
    toast.success('Comment added! +2 ORRA', { duration: 1500 });
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 100);
  };

  const activateInput = () => {
    setInputActive(true);
    // Use requestAnimationFrame to ensure the input is in the DOM before focusing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    });
  };

  if (!show) return null;

  return (
    <div className="border-t border-white/5">
      {/* Close button */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-xs font-semibold text-slate-400">{mergedComments.length} comment{mergedComments.length !== 1 ? 's' : ''}</span>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-white/10 transition-all text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comments list */}
      <div ref={listRef} className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto no-scrollbar">
        {isLoading && mergedComments.length === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-slate-500 animate-pulse">Loading comments...</p>
          </div>
        )}
        {topLevelComments.length === 0 && !isLoading && (
          <div className="text-center py-2">
            <MessageCircle className="w-5 h-5 text-slate-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No comments yet. Be the first!</p>
          </div>
        )}
        {topLevelComments.map((c: any) => {
          const replies = getReplies(c.id);
          return (
            <div key={c.id}>
              <div className="flex gap-2 group">
                <button
                  onClick={() => { if (c.userId) { setViewingUser(c.userId); setView('profile'); } }}
                  className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <img src={resolveImageUrl(c.userAvatar || '/images/orra-logo.png')} alt={c.userName} className="w-full h-full object-cover" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="bg-white/5 rounded-xl px-3 py-2 group-hover:bg-white/[0.07] transition-colors">
                    <button
                      onClick={() => { if (c.userId) { setViewingUser(c.userId); setView('profile'); } }}
                      className="text-xs font-semibold text-white hover:text-violet-300 transition-colors"
                    >
                      {c.userName}
                    </button>
                    <p className="text-xs text-slate-300 break-words">{c.text}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 ml-1">
                    <p className="text-[10px] text-slate-600">
                      <LiveTimeAgo date={c.createdAt} />
                    </p>
                    <button
                      onClick={() => { setReplyToId(c.id); setReplyToName(c.userName); setInputActive(true); requestAnimationFrame(() => { requestAnimationFrame(() => { inputRef.current?.focus(); }); }); }}
                      className="text-[10px] text-slate-500 hover:text-violet-400 transition-colors font-medium"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
              {/* Threaded replies */}
              {replies.length > 0 && (
                <div className="ml-9 mt-1 space-y-2 border-l border-white/5 pl-3">
                  {replies.map((r: any) => (
                    <div key={r.id} className="flex gap-2 group">
                      <button
                        onClick={() => { if (r.userId) { setViewingUser(r.userId); setView('profile'); } }}
                        className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 hover:opacity-80 transition-opacity"
                      >
                        <img src={resolveImageUrl(r.userAvatar || '/images/orra-logo.png')} alt={r.userName} className="w-full h-full object-cover" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white/5 rounded-xl px-3 py-1.5 group-hover:bg-white/[0.07] transition-colors">
                          <button
                            onClick={() => { if (r.userId) { setViewingUser(r.userId); setView('profile'); } }}
                            className="text-xs font-semibold text-white hover:text-violet-300 transition-colors"
                          >
                            {r.userName}
                          </button>
                          <p className="text-xs text-slate-300 break-words">
                            {r.replyToName && <span className="text-violet-400">@{r.replyToName} </span>}
                            {r.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 ml-1">
                          <p className="text-[10px] text-slate-600">
                            <LiveTimeAgo date={r.createdAt} />
                          </p>
                          <button
                            onClick={() => { setReplyToId(r.id); setReplyToName(r.userName); setInputActive(true); requestAnimationFrame(() => { requestAnimationFrame(() => { inputRef.current?.focus(); }); }); }}
                            className="text-[10px] text-slate-500 hover:text-violet-400 transition-colors font-medium"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply indicator bar */}
      {replyToId && replyToName && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 border-t border-violet-500/20">
          <CornerDownRight className="w-3 h-3 text-violet-400" />
          <span className="text-[11px] text-violet-300">Replying to <strong>{replyToName}</strong></span>
          <button
            onClick={() => { setReplyToId(null); setReplyToName(null); }}
            className="ml-auto p-0.5 rounded hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Comment input - uses readOnly to prevent keyboard on open, only activates on explicit tap */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-white/5">
        <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 mb-0.5">
          <img src={resolveImageUrl(currentUser.avatar)} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            rows={1}
            value={commentText}
            onChange={handleTextareaInput}
            placeholder="Write a comment..."
            readOnly={!inputActive}
            inputMode={inputActive ? 'text' : 'none'}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all resize-none overflow-hidden"
            style={{ maxHeight: '120px' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
            onFocus={(e) => {
              // If somehow focused while not active, blur immediately
              if (!inputActive) {
                e.target.blur();
              }
            }}
          />
          {!inputActive && (
            <button
              onClick={activateInput}
              className="absolute inset-0 rounded-xl cursor-text"
              aria-label="Tap to write a comment"
            />
          )}
          {inputActive && (
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-all ${
                commentText.trim() ? 'text-violet-400' : 'text-slate-600'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
