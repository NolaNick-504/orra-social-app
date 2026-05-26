'use client';

import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { useReels, useToggleLike, useToggleSave } from '@/lib/api-hooks';
import { X, Heart, MessageCircle, Share2, Music, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { useMemo } from 'react';

export function ReelViewer() {
  const { showReelViewer, toggleReelViewer, selectedReelId, likedReels, toggleReelLike, savedReels, toggleSaveReel } = useAuraStore();
  const { data: reelsData } = useReels();
  const toggleLikeApi = useToggleLike();
  const toggleSaveApi = useToggleSave();

  // Find the selected reel from API data
  const reel = useMemo(() => {
    if (!selectedReelId || !reelsData) return null;
    const allReels = Array.isArray(reelsData) ? reelsData : (reelsData as any)?.reels || [];
    return allReels.find((r: any) => r.id === selectedReelId) || null;
  }, [selectedReelId, reelsData]);

  if (!showReelViewer || !selectedReelId || !reel) return null;

  const isLiked = likedReels.has(reel.id) || reel.isLiked;
  const isSaved = savedReels.has(reel.id) || reel.isSaved;
  const hasVideo = reel.videoUrl && reel.videoUrl.trim() !== '';

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleReelLike(reel.id);
    toggleLikeApi.mutate({ targetId: reel.id, targetType: 'reel' }, { onError: () => {} });
    toast.success(isLiked ? 'Like removed' : 'Liked!');
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaveReel(reel.id);
    toggleSaveApi.mutate({ targetId: reel.id, targetType: 'reel' }, { onError: () => {} });
    toast.success(isSaved ? 'Reel unsaved' : 'Reel saved!');
  };

  return (
    <div className="fixed inset-0 z-[55] bg-black flex items-center justify-center">
      <button onClick={() => toggleReelViewer()} className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all">
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-lg h-full max-h-[90vh] rounded-xl overflow-hidden">
        {/* Video or Image */}
        {hasVideo ? (
          <video
            src={reel.videoUrl}
            autoPlay
            loop
            playsInline
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            <img src={resolveImageUrl(reel.creator?.avatar)} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/20" />
            <span className="font-semibold text-white text-sm">{reel.creator?.name || 'Unknown'}</span>
          </div>
          <p className="text-white font-bold mb-1">{reel.title}</p>
          <p className="text-xs text-slate-300">{reel.views} views</p>
        </div>

        {/* Side actions */}
        <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center">
          <button
            onClick={handleLike}
            className="flex flex-col items-center"
          >
            <div className={`w-11 h-11 rounded-full ${isLiked ? 'bg-red-500/30' : 'bg-white/10'} backdrop-blur-sm flex items-center justify-center transition-all`}>
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </div>
            <span className="text-[10px] text-white mt-1">{reel.likesCount || 0}</span>
          </button>
          <button className="flex flex-col items-center" onClick={() => toast.success('Comments coming soon!')}>
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-white mt-1">{reel.commentsCount || 0}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex flex-col items-center"
          >
            <div className={`w-11 h-11 rounded-full ${isSaved ? 'bg-violet-500/30' : 'bg-white/10'} backdrop-blur-sm flex items-center justify-center transition-all`}>
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-violet-400 text-violet-400' : 'text-white'}`} />
            </div>
          </button>
          <button className="flex flex-col items-center" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
          </button>
          {(reel.song || hasVideo) && (
            <button className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                <Music className="w-5 h-5 text-white" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
