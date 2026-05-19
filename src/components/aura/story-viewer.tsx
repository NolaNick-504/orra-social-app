'use client';

import { useAuraStore } from '@/store/aura-store';
import { useStories, type StoryGroupData } from '@/lib/api-hooks';
import { useCurrentUser } from '@/lib/use-current-user';
import { X, ChevronLeft, ChevronRight, Plus, Camera } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function StoryViewer() {
  const { showStoryViewer, toggleStoryViewer, selectedStoryIndex, setSelectedStoryIndex, markStoryViewed } = useAuraStore();
  const [progress, setProgress] = useState(0);
  const { data: storyGroups } = useStories();

  // Memoize allStories to prevent infinite re-render loops.
  // Previously this was an IIFE that created a new array every render,
  // which caused an infinite loop when used as a useEffect dependency.
  const allStories = useMemo(() => {
    if (!storyGroups) return [];
    if (!Array.isArray(storyGroups)) return [];
    const flat: { id: string; image: string; viewed: boolean; author: { id: string; name: string; handle: string; avatar: string }; createdAt: string }[] = [];
    for (const group of storyGroups) {
      for (const story of group.stories) {
        flat.push({
          id: story.id,
          image: story.image,
          viewed: story.viewed,
          author: group.author,
          createdAt: story.createdAt,
        });
      }
    }
    return flat;
  }, [storyGroups]);

  const currentIndex = Math.min(selectedStoryIndex, allStories.length - 1);

  const goNext = useCallback(() => {
    if (currentIndex < allStories.length - 1) {
      setSelectedStoryIndex(currentIndex + 1);
      setProgress(0);
    } else {
      toggleStoryViewer();
    }
  }, [currentIndex, allStories.length, setSelectedStoryIndex, toggleStoryViewer]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedStoryIndex(currentIndex - 1);
      setProgress(0);
    }
  }, [currentIndex, setSelectedStoryIndex]);

  // Progress timer
  useEffect(() => {
    if (!showStoryViewer) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [showStoryViewer, currentIndex, goNext]);

  // Mark story as viewed — use a ref to track which stories we've already marked
  // to avoid calling markStoryViewed repeatedly (which would cause infinite re-renders)
  const markedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (showStoryViewer && allStories[currentIndex]) {
      const storyId = allStories[currentIndex].id;
      if (!markedRef.current.has(storyId)) {
        markedRef.current.add(storyId);
        markStoryViewed(storyId);
      }
    }
    // Reset marked set when viewer closes
    if (!showStoryViewer) {
      markedRef.current.clear();
    }
  }, [showStoryViewer, currentIndex, allStories, markStoryViewed]);

  if (!showStoryViewer) return null;

  const story = allStories[currentIndex];
  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {allStories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-8 left-4 z-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/30">
          <img src={resolveImageUrl(story.author.avatar) || '/api/uploads?path=images/orra-logo.png'} alt={story.author.name} className="w-full h-full object-cover" />
        </div>
        <span className="text-sm font-semibold text-white">{story.author.name}</span>
        <span className="text-xs text-white/60">
          {(() => {
            const diff = Date.now() - new Date(story.createdAt).getTime();
            const hrs = Math.floor(diff / 3600000);
            if (hrs < 1) return 'Just now';
            if (hrs < 24) return `${hrs}h ago`;
            return `${Math.floor(hrs / 24)}d ago`;
          })()}
        </span>
      </div>

      {/* Close */}
      <button onClick={toggleStoryViewer} className="absolute top-8 right-4 z-10 p-2 rounded-lg hover:bg-white/10 transition-all text-white">
        <X className="w-6 h-6" />
      </button>

      {/* Story Image */}
      <img src={resolveImageUrl(story.image)} alt="Story" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/api/uploads?path=images/orra-logo.png'; }} />

      {/* Navigation areas */}
      <div className="absolute inset-0 flex">
        <button onClick={goPrev} className="w-1/3 h-full cursor-pointer" />
        <div className="w-1/3 h-full" />
        <button onClick={goNext} className="w-1/3 h-full cursor-pointer" />
      </div>

      {/* Nav arrows on desktop */}
      {currentIndex > 0 && (
        <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all hidden md:block">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentIndex < allStories.length - 1 && (
        <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all hidden md:block">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

// Story Bar Component - horizontal scroll of story avatars shown on home page
export function StoryBar() {
  const queryClient = useQueryClient();
  const { data: storyGroups } = useStories();
  const { toggleStoryViewer, setSelectedStoryIndex, viewedStories } = useAuraStore();
  const currentUser = useCurrentUser();
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyImage, setStoryImage] = useState('');
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const storyFileRef = useRef<HTMLInputElement>(null);

  const groups = storyGroups || [];

  // Separate "Your story" from other groups
  const ownGroupIndex = groups.findIndex((g) => g.author.id === currentUser.id);
  const ownGroup = ownGroupIndex >= 0 ? groups[ownGroupIndex] : null;
  const otherGroups = groups.filter((_, i) => i !== ownGroupIndex);

  const handleOpenStory = (groupIndex: number) => {
    // Calculate the absolute story index using the full groups array
    let absIndex = 0;
    for (let i = 0; i < groupIndex; i++) {
      absIndex += groups[i].stories.length;
    }
    setSelectedStoryIndex(absIndex);
    toggleStoryViewer();
  };

  const handleStoryFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setStoryImage(result); // base64 data URL
        setStoryPreview(result);
      }
    };
    reader.readAsDataURL(file);
    if (storyFileRef.current) storyFileRef.current.value = '';
  }, []);

  const handleCreateStory = async () => {
    const imageUrl = storyImage.trim();
    if (!imageUrl) {
      toast.error('Please upload an image or enter a URL');
      return;
    }

    setCreating(true);
    try {
      // If it's a base64 data URL, upload it via the profile API first
      let finalUrl = imageUrl;
      // The /api/stories endpoint handles base64 data URLs directly via saveBase64AsFile

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: finalUrl }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Story created! +1 ORRA');
        setShowCreateStory(false);
        setStoryImage('');
        setStoryPreview(null);
        queryClient.invalidateQueries({ queryKey: ['stories'] });
      } else {
        toast.error(data.error || 'Failed to create story');
      }
    } catch {
      toast.error('Failed to create story');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Stories</h3>
        <button
          onClick={() => setShowCreateStory(!showCreateStory)}
          className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Create Story Form */}
      {showCreateStory && (
        <div className="glass-panel rounded-xl p-3 border border-violet-500/20 fade-in space-y-2">
          {/* Preview */}
          {storyPreview && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden">
              <img src={storyPreview} alt="Story preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setStoryImage(''); setStoryPreview(null); }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {/* File Upload Button */}
          <div className="flex gap-2">
            <button
              onClick={() => storyFileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/20 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-all border border-violet-500/20"
            >
              <Camera className="w-3.5 h-3.5" /> Upload Photo
            </button>
            <input
              ref={storyFileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              capture="environment"
              onChange={handleStoryFileSelect}
              className="hidden"
            />
          </div>
          {/* URL input (fallback) */}
          <input
            type="text"
            value={storyImage.startsWith('data:') ? '(Uploaded image)' : storyImage}
            onChange={(e) => { setStoryImage(e.target.value); setStoryPreview(e.target.value.startsWith('http') ? e.target.value : null); }}
            placeholder="Or paste an image URL..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />
          <button
            onClick={handleCreateStory}
            disabled={creating}
            className="w-full px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Post Story'}
          </button>
        </div>
      )}

      {/* Story Avatars */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* Always show "Your Story" bubble first */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <button
            onClick={() => {
              if (ownGroup && ownGroup.stories.length > 0) {
                // Open own stories for viewing
                handleOpenStory(ownGroupIndex);
              } else {
                // Open create story form
                setShowCreateStory(!showCreateStory);
              }
            }}
            className="relative"
          >
            <div className="w-14 h-14 rounded-full overflow-hidden p-[2px] bg-white/10">
              <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-[#050505]">
                <img
                  src={resolveImageUrl(currentUser.avatar) || '/api/uploads?path=images/orra-logo.png'}
                  alt="Your story"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center ring-2 ring-[#050505]">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </button>
          <button
            onClick={() => { useAuraStore.getState().setViewingUser(null); useAuraStore.getState().setView('profile'); }}
            className="text-[10px] text-slate-400 hover:text-violet-400 transition-colors truncate max-w-[56px]"
          >
            Your story
          </button>
        </div>

        {/* Other users' stories */}
        {otherGroups.map((group) => {
          const originalIdx = groups.indexOf(group);
          const hasUnviewed = group.stories.some((s) => !s.viewed && !viewedStories.has(s.id));
          return (
            <div key={group.author.id} className="flex-shrink-0 flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenStory(originalIdx)}
                className="relative"
              >
                <div className={`w-14 h-14 rounded-full overflow-hidden p-[2px] ${
                  hasUnviewed
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                    : 'bg-white/10'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-[#050505]">
                    <img
                      src={resolveImageUrl(group.author.avatar) || '/api/uploads?path=images/orra-logo.png'}
                      alt={group.author.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </button>
              <button
                onClick={() => { useAuraStore.getState().setViewingUser(group.author.id); useAuraStore.getState().setView('profile'); }}
                className="text-[10px] text-slate-400 hover:text-violet-400 transition-colors truncate max-w-[56px]"
              >
                {group.author.name?.split(' ')[0]}
              </button>
            </div>
          );
        })}

        {groups.length === 0 && !currentUser.id && (
          <p className="text-xs text-slate-500 py-2">No stories yet. Create one!</p>
        )}
      </div>
    </div>
  );
}
