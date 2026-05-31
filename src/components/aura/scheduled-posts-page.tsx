'use client';

import {
  Clock,
  Plus,
  Trash2,
  X,
  Loader2,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  Timer,
  Send,
} from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { timeAgo } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScheduledPost {
  id: string;
  text: string;
  images: string;
  vibeTag: string;
  type: string;
  closeFriendsOnly: boolean;
  scheduledAt: string;
  isPublished: boolean;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const VIBE_OPTIONS = [
  { key: 'hyped', label: '🔥 Hyped' },
  { key: 'chill', label: '😎 Chill' },
  { key: 'deep', label: '🌊 Deep' },
  { key: 'funny', label: '😂 Funny' },
  { key: 'vibing', label: '✨ Vibing' },
  { key: 'grateful', label: '🙏 Grateful' },
  { key: 'motivated', label: '💪 Motivated' },
  { key: 'creative', label: '🎨 Creative' },
];

// ─── Create Scheduled Post Modal ────────────────────────────────────────────

function CreateScheduledPostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [text, setText] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [vibeTag, setVibeTag] = useState('hyped');
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCreate = async () => {
    if (!text.trim()) {
      toast.error('Post text is required');
      return;
    }
    if (!scheduledDate) {
      toast.error('Schedule date is required');
      return;
    }

    const scheduledAt = scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : new Date(scheduledDate).toISOString();

    if (new Date(scheduledAt) <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          scheduledAt,
          vibeTag,
          closeFriendsOnly,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Post scheduled! 🗓️', { duration: 2500 });
        onCreated();
        onClose();
      } else {
        toast.error(data.error || 'Failed to schedule post');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative glass-panel rounded-2xl p-6 w-full max-w-lg fade-in border border-violet-500/20 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Schedule Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Post Text <span className="text-red-400">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Vibe Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Vibe
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VIBE_OPTIONS.map((vibe) => (
                <button
                  key={vibe.key}
                  onClick={() => setVibeTag(vibe.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    vibeTag === vibe.key
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {vibe.label}
                </button>
              ))}
            </div>
          </div>

          {/* Close Friends Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Close Friends Only</label>
            <button
              onClick={() => setCloseFriendsOnly(!closeFriendsOnly)}
              className={`relative w-10 h-5 rounded-full transition-all ${
                closeFriendsOnly ? 'bg-violet-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  closeFriendsOnly ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || !text.trim() || !scheduledDate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-violet"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Schedule Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Scheduled Posts Page ──────────────────────────────────────────────

export function ScheduledPostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduled-posts');
      const data = await res.json();
      if (data.success) {
        setPosts(data.data || []);
      } else {
        setError(data.error || 'Failed to load scheduled posts');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success('Scheduled post cancelled');
      } else {
        toast.error(data.error || 'Failed to cancel');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const formatScheduledTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getVibeEmoji = (tag: string) => {
    const vibes: Record<string, string> = {
      hyped: '🔥', chill: '😎', deep: '🌊', funny: '😂',
      vibing: '✨', grateful: '🙏', motivated: '💪', creative: '🎨',
    };
    return vibes[tag] || '✨';
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Scheduled Posts</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all glow-violet"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Schedule Post</span>
          <span className="sm:hidden">Schedule</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-white/5 mb-3" />
              <div className="h-3 w-1/2 rounded bg-white/5 mb-2" />
              <div className="h-3 w-1/3 rounded bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchPosts}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* Posts List */}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-0.5 custom-scrollbar">
          {posts.map((post) => (
            <div
              key={post.id}
              className="glass-panel rounded-2xl p-4 hover:border-violet-500/20 transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                  <Clock className="w-5 h-5 text-violet-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug mb-1.5 line-clamp-2">
                    {post.text}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatScheduledTime(post.scheduledAt)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      {getVibeEmoji(post.vibeTag)} {post.vibeTag}
                    </span>
                    {post.closeFriendsOnly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Close Friends
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      post.isPublished
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {post.isPublished ? (
                        <span className="flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40"
                >
                  {deletingId === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
            <CalendarDays className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Scheduled Posts</h3>
          <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
            Schedule posts to be published at the perfect time!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all glow-violet"
          >
            <Plus className="w-4 h-4" />
            Schedule Post
          </button>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {!loading && posts.length > 0 && (
        <p className="text-[10px] text-slate-600 text-center flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" /> Auto-refreshes every 30s
        </p>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateScheduledPostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchPosts}
        />
      )}
    </div>
  );
}
