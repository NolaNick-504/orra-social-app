'use client';

import { useAuraStore } from '@/store/aura-store';
import { useToggleRepost } from '@/lib/api-hooks';
import { X, Link2, Waves, Send, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function ShareModal() {
  const { showShareModal, toggleShareModal, sharePostId } = useAuraStore();
  const toggleRepostApi = useToggleRepost();
  const queryClient = useQueryClient();

  if (!showShareModal) return null;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?view=post&id=${sharePostId || 'shared'}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.success('Link copied!');
    });
    toggleShareModal();
  };

  const handleEcho = () => {
    if (sharePostId) {
      // Update local store
      useAuraStore.getState().toggleRepost(sharePostId);
      // Persist echo (repost) to the database
      toggleRepostApi.mutate({ postId: sharePostId }, { 
        onSuccess: () => {
          // Refresh the feed so the echo shows up
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          toast.success('Echoed to your feed! +2 ORRA', { duration: 1500 });
        },
        onError: () => {
          toast.error('Echo failed to sync');
        }
      });
    }
    toggleShareModal();
  };

  const handleShareDM = () => {
    if (sharePostId) {
      // Track share locally
      useAuraStore.getState().shareViaDM(sharePostId);
      // Persist share via DM to the database
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: sharePostId }),
      }).catch(() => {
        // Non-critical: DM share failure shouldn't block UX
      });
      toast.success('Shared via DM! +2 ORRA', { duration: 1500 });
      // Refresh feed
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
    toggleShareModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => toggleShareModal()} />
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-sm fade-in border border-violet-500/20">
        <button onClick={() => toggleShareModal()} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-white mb-1">Share</h2>
        <p className="text-xs text-slate-500 mb-5">Amplify this post across ORRA</p>

        <div className="space-y-2">
          <button
            onClick={handleEcho}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Waves className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Echo</p>
              <p className="text-xs text-slate-500">Repost to your followers' feed</p>
            </div>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">+2 ORRA</span>
          </button>

          <button
            onClick={handleShareDM}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Share via DM</p>
              <p className="text-xs text-slate-500">Send in a direct message</p>
            </div>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold">+2 ORRA</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Link2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Copy Link</p>
              <p className="text-xs text-slate-500">Copy post link to clipboard</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
