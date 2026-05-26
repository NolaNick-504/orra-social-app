'use client';

import { useReels, useCreateReel } from '@/lib/api-hooks';
import { resolveImageUrl } from '@/lib/utils';
import { Heart, MessageCircle, Share2, Play, Radio, Music, Bookmark, UserPlus, BadgeCheck, Zap, Plus, X, Upload, Loader2 } from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

const categories = ['For You', 'Trending', 'Music', 'Dance', 'Comedy', 'Sports', 'Art'];

const reelCategories = ['Trending', 'Dance', 'Music', 'Comedy', 'Art', 'Lifestyle'];

export function PrismReels() {
  const [activeCategory, setActiveCategory] = useState('For You');
  const { likedReels, toggleReelLike, toggleReelViewer, searchQuery, toggleFollow, followedUsers, savedReels, toggleSaveReel, auraTokens } = useAuraStore();

  // Create Reel modal state
  const [showCreateReel, setShowCreateReel] = useState(false);
  const [reelTitle, setReelTitle] = useState('');
  const [reelCategory, setReelCategory] = useState('Trending');
  const [reelSong, setReelSong] = useState('');
  const [reelVideoFile, setReelVideoFile] = useState<File | null>(null);
  const [reelVideoPreview, setReelVideoPreview] = useState<string | null>(null);
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const reelVideoInputRef = useRef<HTMLInputElement>(null);

  // Upload now done via base64 in reel creation (no separate upload API)
  const createReelMutation = useCreateReel();

  // Fetch reels from API
  const apiCategory = activeCategory === 'For You' ? undefined : activeCategory;
  const { data: reelsData, isLoading: reelsLoading } = useReels(apiCategory);

  // Map API reels to the format the component expects
  const allReels = (() => {
    if (!reelsData) return [];
    const raw = Array.isArray(reelsData) ? reelsData : (reelsData as any)?.reels || [];
    return raw.map((r: any) => ({
      id: r.id,
      title: r.title,
      thumbnail: r.thumbnail,
      videoUrl: r.videoUrl,
      views: r.views,
      viewsStr: r.views >= 1000000 ? `${(r.views / 1000000).toFixed(1)}M` : r.views >= 1000 ? `${(r.views / 1000).toFixed(0)}K` : String(r.views),
      likes: r.likesCount || 0,
      comments: r.commentsCount || 0,
      category: r.category,
      song: r.song,
      isRemix: r.isRemix || false,
      isLive: r.isLive || false,
      creator: r.creator || { id: '', name: 'Unknown', handle: '@unknown', avatar: '/api/uploads?path=images/orra-logo.png', verified: false },
    }));
  })();

  // Filter reels by category
  let filteredReels = allReels;
  if (activeCategory !== 'For You' && activeCategory !== 'Trending') {
    filteredReels = allReels.filter((r: any) => r.category === activeCategory);
  } else if (activeCategory === 'Trending') {
    filteredReels = allReels.filter((r: any) => r.category === 'Trending' || r.isRemix);
  }

  // Filter by search
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredReels = filteredReels.filter((r: any) =>
      r.title.toLowerCase().includes(q) || r.creator.name.toLowerCase().includes(q)
    );
  }

  const handleLike = (reelId: string) => {
    const isLiked = likedReels.has(reelId);
    const { likedReelsEarned } = useAuraStore.getState();
    const alreadyEarned = likedReelsEarned.has(reelId);
    toggleReelLike(reelId);
    if (!isLiked) {
      if (!alreadyEarned) {
        toast.success('+1 ORRA tokens', { duration: 1500 });
      }
    }
  };

  const handleSave = (reelId: string) => {
    toggleSaveReel(reelId);
    const isSaved = savedReels.has(reelId);
    toast.success(isSaved ? 'Reel unsaved' : 'Reel saved!', { duration: 1500 });
  };

  const handleFollow = (userId: string) => {
    const isFollowed = followedUsers.has(userId);
    const { followedUsersEarned } = useAuraStore.getState();
    const alreadyEarned = followedUsersEarned.has(userId);
    toggleFollow(userId);
    // Persist follow to the database
    fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
    if (!isFollowed) {
      if (!alreadyEarned) {
        toast.success('Following! +2 ORRA', { duration: 1500 });
      } else {
        toast.success('Following!', { duration: 1500 });
      }
    } else {
      toast.success('Unfollowed', { duration: 1500 });
    }
  };

  // Create Reel handlers
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB per video

  const handleReelVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error('Video exceeds 50MB limit. Please choose a smaller file.');
      return;
    }
    setReelVideoFile(file);
    setReelVideoPreview(URL.createObjectURL(file));
  };

  const handleCreateReel = async () => {
    if (!reelTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!reelVideoFile) {
      toast.error('Please select a video');
      return;
    }

    try {
      setIsCreatingReel(true);

      // Convert video to base64 and send with reel creation
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(reelVideoFile);
      });

      // Create reel with embedded video data
      await createReelMutation.mutateAsync({
        title: reelTitle.trim(),
        videoUrl: '',  // Will be set server-side from videoFile
        category: reelCategory,
        song: reelSong.trim(),
        videoFile: {
          data: videoBase64,
          filename: reelVideoFile.name,
          contentType: reelVideoFile.type,
        },
      } as any);

      toast.success('Reel created! +5 ORRA +10 XP 🎉');
      setShowCreateReel(false);
      setReelTitle('');
      setReelCategory('Trending');
      setReelSong('');
      setReelVideoFile(null);
      if (reelVideoPreview) URL.revokeObjectURL(reelVideoPreview);
      setReelVideoPreview(null);
    } catch (error) {
      console.error('Create reel failed:', error);
      toast.error('Failed to create reel. Please try again.');
    } finally {
      setIsCreatingReel(false);
    }
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Token Balance + Create Reel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <Zap className="w-3 h-3" />
          <span>{auraTokens.toLocaleString()} ORRA</span>
        </div>
        <button
          onClick={() => setShowCreateReel(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Reel
        </button>
      </div>

      {/* Create Reel Modal */}
      {showCreateReel && (
        <div className="glass-panel rounded-2xl p-5 border border-violet-500/20 fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Create Reel</h3>
            <button
              onClick={() => setShowCreateReel(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={reelTitle}
            onChange={(e) => setReelTitle(e.target.value)}
            placeholder="Reel title"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />

          {/* Category selector */}
          <div className="flex flex-wrap gap-1.5">
            {reelCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setReelCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reelCategory === cat
                    ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Video upload */}
          <input
            ref={reelVideoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleReelVideoSelect}
            className="hidden"
          />
          {reelVideoPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <video src={reelVideoPreview} className="w-full max-h-48 object-cover rounded-xl" />
              <button
                onClick={() => {
                  if (reelVideoPreview) URL.revokeObjectURL(reelVideoPreview);
                  setReelVideoFile(null);
                  setReelVideoPreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => reelVideoInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-sm text-slate-400 hover:text-white hover:border-violet-500/50 transition-all"
            >
              <Upload className="w-4 h-4" />
              Select video (MP4, WebM, MOV — max 50MB)
            </button>
          )}

          {/* Song name (optional) */}
          <input
            type="text"
            value={reelSong}
            onChange={(e) => setReelSong(e.target.value)}
            placeholder="Song name (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />

          <button
            onClick={handleCreateReel}
            disabled={isCreatingReel || !reelTitle.trim() || !reelVideoFile}
            className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreatingReel && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Reel
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search info */}
      {searchQuery && searchQuery.trim() && (
        <div className="text-xs text-slate-500">
          {filteredReels.length} reels for &quot;{searchQuery}&quot;
        </div>
      )}

      {/* Loading state */}
      {reelsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading reels...</p>
        </div>
      )}

      {/* Featured Reel */}
      {filteredReels.length > 0 && (
        <div
          className="relative rounded-2xl overflow-hidden h-72 md:h-96 group cursor-pointer"
          onClick={() => toggleReelViewer(filteredReels[0].id)}
        >
          {filteredReels[0].videoUrl ? (
            <video
              src={filteredReels[0].videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <img
              src={filteredReels[0].thumbnail}
              alt={filteredReels[0].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform glow-violet">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{filteredReels[0].title}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <img src={resolveImageUrl(filteredReels[0].creator.avatar)} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/20" />
                  <span className="font-medium">{filteredReels[0].creator.name}</span>
                  {filteredReels[0].creator.verified && <BadgeCheck className="w-4 h-4 text-violet-400 fill-violet-400/20" />}
                  <span className="text-slate-500">|</span>
                  <span>{filteredReels[0].viewsStr || filteredReels[0].views} views</span>
                </div>
                {filteredReels[0].song && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                    <Music className="w-3 h-3" />
                    <span>{filteredReels[0].song}</span>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleFollow(filteredReels[0].creator.id); }}
                  className={`mt-2 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    followedUsers.has(filteredReels[0].creator.id)
                      ? 'bg-white/10 text-slate-300'
                      : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  {followedUsers.has(filteredReels[0].creator.id) ? 'Following' : 'Follow'}
                </button>
              </div>
              <div className="flex flex-col gap-3 items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(filteredReels[0].id); }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-10 h-10 rounded-full ${likedReels.has(filteredReels[0].id) ? 'bg-red-500/30' : 'bg-white/10'} backdrop-blur-sm flex items-center justify-center hover:bg-red-500/30 transition-all`}>
                    <Heart className={`w-5 h-5 ${likedReels.has(filteredReels[0].id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </div>
                  <span className="text-[10px] text-white mt-1">{filteredReels[0].likes >= 1000 ? `${(filteredReels[0].likes / 1000).toFixed(0)}K` : filteredReels[0].likes}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSave(filteredReels[0].id); }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-10 h-10 rounded-full ${savedReels.has(filteredReels[0].id) ? 'bg-violet-500/30' : 'bg-white/10'} backdrop-blur-sm flex items-center justify-center hover:bg-violet-500/30 transition-all`}>
                    <Bookmark className={`w-5 h-5 ${savedReels.has(filteredReels[0].id) ? 'fill-violet-400 text-violet-400' : 'text-white'}`} />
                  </div>
                </button>
                <button className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] text-white mt-1">{filteredReels[0].comments > 0 ? `${Math.floor(filteredReels[0].comments / 1000)}K` : ''}</span>
                </button>
                <button className="flex flex-col items-center" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {filteredReels[0].isRemix && (
              <span className="px-3 py-1 rounded-lg bg-violet-600/80 backdrop-blur-sm text-xs font-bold text-white">REMIX</span>
            )}
            {filteredReels[0].isLive && (
              <span className="px-3 py-1 rounded-lg bg-red-600/80 backdrop-blur-sm text-xs font-bold text-white flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE
              </span>
            )}
          </div>
        </div>
      )}

      {/* Reels Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredReels.slice(1).map((reel: any) => {
          const isLiked = likedReels.has(reel.id);
          const isSaved = savedReels.has(reel.id);
          return (
            <div
              key={reel.id}
              className="relative rounded-xl overflow-hidden aspect-[9/16] group cursor-pointer glass-card"
              onClick={() => toggleReelViewer(reel.id)}
            >
              {reel.videoUrl ? (
                <video
                  src={reel.videoUrl}
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <img
                  src={reel.thumbnail}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {reel.isLive && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600/90 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE
                </span>
              )}
              {reel.isRemix && !reel.isLive && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-violet-600/80 backdrop-blur-sm text-[10px] font-bold text-white">
                  REMIX
                </span>
              )}

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </div>

              <div className="absolute right-2 bottom-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(reel.id); }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-8 h-8 rounded-full ${isLiked ? 'bg-red-500/30' : 'bg-white/10'} backdrop-blur-sm flex items-center justify-center hover:bg-red-500/30 transition-all`}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSave(reel.id); }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-8 h-8 rounded-full ${isSaved ? 'bg-violet-500/30' : 'bg-white/10'} backdrop-blur-sm flex items-center justify-center hover:bg-violet-500/30 transition-all`}>
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-violet-400 text-violet-400' : 'text-white'}`} />
                  </div>
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs font-bold text-white line-clamp-2 mb-1.5">{reel.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src={resolveImageUrl(reel.creator.avatar)} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/20" />
                    <span className="text-[10px] text-slate-300 font-medium">{reel.creator.name}</span>
                    {reel.creator.verified && <BadgeCheck className="w-3 h-3 text-violet-400 fill-violet-400/20" />}
                  </div>
                  <span className="text-[10px] text-slate-400">{reel.viewsStr || reel.views}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReels.length === 0 && !reelsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-400">No reels found for this category.</p>
        </div>
      )}
    </div>
  );
}
