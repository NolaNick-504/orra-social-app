'use client';

import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { useReels, useToggleLike, useToggleSave, useReelHistory, useRecordReelView } from '@/lib/api-hooks';
import type { ReelData } from '@/lib/api-hooks';
import { X, Heart, MessageCircle, Share2, Music, Bookmark, ChevronUp, ChevronDown, Radio, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';

// ─── Double-tap heart animation ───────────────────────────────────────────────

function DoubleTapHeart({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <Heart
        className="w-28 h-28 text-white fill-red-500 drop-shadow-lg animate-[reelHeartPop_0.8s_ease-out_forwards]"
      />
    </div>
  );
}

// ─── Time ago helper ──────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── History Panel ────────────────────────────────────────────────────────────

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onNavigateToReel: (reelId: string) => void;
}

function HistoryPanel({ open, onClose, onNavigateToReel }: HistoryPanelProps) {
  const { data: history, isLoading } = useReelHistory();

  const handleClick = (reelId: string) => {
    onNavigateToReel(reelId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`absolute top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">Watch History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
            aria-label="Close history panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-60px)]" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-3" />
              <p className="text-slate-400 text-xs">Loading history...</p>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Clock className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No watch history yet</p>
              <p className="text-slate-600 text-xs mt-1">Reels you watch will appear here</p>
            </div>
          ) : (
            <div className="py-2">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleClick(entry.reelId)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                    {entry.reel.thumbnail ? (
                      <img
                        src={resolveImageUrl(entry.reel.thumbnail)}
                        alt={entry.reel.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Radio className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    {/* Watch progress bar */}
                    {entry.watchProgress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                        <div
                          className="h-full bg-violet-500 rounded-r-full"
                          style={{ width: `${Math.min(entry.watchProgress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
                      {entry.reel.title}
                    </p>
                    <p className="text-slate-400 text-xs mt-1 truncate">
                      {entry.reel.creator?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-slate-500 text-[10px]">
                        {timeAgo(entry.watchedAt)}
                      </span>
                      {entry.watchProgress > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span className="text-violet-400 text-[10px] font-medium">
                            {Math.round(entry.watchProgress)}% watched
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Single Reel Slide ────────────────────────────────────────────────────────

interface ReelSlideProps {
  reel: ReelData;
  isActive: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onDoubleTap: () => void;
  onClose: () => void;
  onComment: () => void;
  onHistory: () => void;
  currentIndex: number;
  totalCount: number;
  onPrev?: () => void;
  onNext?: () => void;
  isLast?: boolean;
  onPullClose: () => void;
}

function ReelSlide({
  reel,
  isActive,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onDoubleTap,
  onClose,
  onComment,
  onHistory,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  isLast,
  onPullClose,
}: ReelSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heartVisible, setHeartVisible] = useState(false);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Pull-down-to-close gesture state
  const touchStartY = useRef<number>(0);
  const pullDistance = useRef<number>(0);
  const [pullOffset, setPullOffset] = useState(0);

  // Auto-play / pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  // Double-tap detection
  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Ignore if tap was on a button
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) return;

      const now = Date.now();
      const timeDiff = now - lastTapRef.current;
      lastTapRef.current = now;

      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap detected
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
          tapTimeoutRef.current = null;
        }
        onDoubleTap();
        if (!isLiked) onLike();
        setHeartVisible(true);
        setTimeout(() => setHeartVisible(false), 800);
      } else {
        // Single tap - set timeout to determine if it's a real single tap
        tapTimeoutRef.current = setTimeout(() => {
          tapTimeoutRef.current = null;
        }, 300);
      }
    },
    [onDoubleTap, onLike, isLiked]
  );

  // Touch handlers for pull-down-to-close
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      pullDistance.current = 0;
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      // Only allow pull-down if we're at the first reel
      if (deltaY > 0 && currentIndex === 0) {
        pullDistance.current = deltaY;
        setPullOffset(Math.min(deltaY * 0.5, 120));
      }
    },
    [currentIndex]
  );

  const handleTouchEnd = useCallback(() => {
    if (pullDistance.current > 150 && currentIndex === 0) {
      onPullClose();
    }
    setPullOffset(0);
    pullDistance.current = 0;
  }, [currentIndex, onPullClose]);

  const hasVideo = reel.videoUrl && reel.videoUrl.trim() !== '';

  return (
    <div
      ref={slideRef}
      className="snap-start snap-always shrink-0 w-full h-full relative bg-black flex items-center justify-center"
      style={{ transform: pullOffset > 0 ? `translateY(${pullOffset}px)` : undefined, opacity: pullOffset > 0 ? 1 - pullOffset / 240 : 1 }}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video or Image */}
      {hasVideo ? (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          loop
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={reel.thumbnail}
          alt={reel.title}
          className="w-full h-full object-cover"
        />
      )}

      {/* Double-tap heart animation */}
      <DoubleTapHeart visible={heartVisible} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Close button - top right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 active:scale-95 transition-all"
        aria-label="Close reel viewer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* History button - top left */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onHistory();
        }}
        className="absolute top-4 left-4 z-30 p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 active:scale-95 transition-all"
        aria-label="Watch history"
      >
        <Clock className="w-5 h-5" />
      </button>

      {/* Progress indicator - top center */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
        <Radio className="w-3.5 h-3.5 text-white/80" />
        <span className="text-white text-xs font-medium tabular-nums">
          {currentIndex + 1} / {totalCount}
        </span>
      </div>

      {/* Navigation arrows - desktop only */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 flex-col gap-2">
        {currentIndex > 0 && onPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 active:scale-90 transition-all"
            aria-label="Previous reel"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {!isLast && onNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 active:scale-90 transition-all"
            aria-label="Next reel"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom info - creator & title */}
      <div className="absolute bottom-0 left-0 right-16 pb-6 pl-4 pr-2 z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <img
            src={resolveImageUrl(reel.creator?.avatar)}
            alt={reel.creator?.name || 'Creator'}
            className="w-9 h-9 rounded-full ring-2 ring-white/20 object-cover"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm leading-tight">
              {reel.creator?.name || 'Unknown'}
            </span>
            {reel.creator?.verified && (
              <span className="text-[10px] text-emerald-400 font-medium">Verified Creator</span>
            )}
          </div>
        </div>
        <p className="text-white font-bold text-sm mb-1 line-clamp-2">{reel.title}</p>
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span>{formatViews(reel.views)} views</span>
          {reel.category && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-violet-300">{reel.category}</span>
            </>
          )}
        </div>
        {/* Song / Music info */}
        {(reel.song || hasVideo) && (
          <div className="flex items-center gap-1.5 mt-2">
            <Music className="w-3 h-3 text-white/60" />
            <span className="text-[11px] text-white/60 truncate max-w-[200px]">
              {reel.song || 'Original Sound'}
            </span>
          </div>
        )}
      </div>

      {/* Side action buttons */}
      <div className="absolute right-2.5 bottom-20 z-10 flex flex-col gap-3.5 items-center">
        {/* Like */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className="flex flex-col items-center active:scale-90 transition-transform"
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <div
            className={`w-11 h-11 rounded-full ${
              isLiked ? 'bg-red-500/30' : 'bg-white/10'
            } backdrop-blur-sm flex items-center justify-center transition-all`}
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'
              }`}
            />
          </div>
          <span className="text-[10px] text-white mt-0.5 font-medium tabular-nums">
            {formatCount(reel.likesCount || 0)}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComment();
          }}
          className="flex flex-col items-center active:scale-90 transition-transform"
          aria-label="Comments"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] text-white mt-0.5 font-medium tabular-nums">
            {formatCount(reel.commentsCount || 0)}
          </span>
        </button>

        {/* Save */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="flex flex-col items-center active:scale-90 transition-transform"
          aria-label={isSaved ? 'Unsave' : 'Save'}
        >
          <div
            className={`w-11 h-11 rounded-full ${
              isSaved ? 'bg-violet-500/30' : 'bg-white/10'
            } backdrop-blur-sm flex items-center justify-center transition-all`}
          >
            <Bookmark
              className={`w-5 h-5 transition-all ${
                isSaved ? 'fill-violet-400 text-violet-400 scale-110' : 'text-white'
              }`}
            />
          </div>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center active:scale-90 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied!');
          }}
          aria-label="Share"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Music spinning disc */}
        {(reel.song || hasVideo) && (
          <div className="flex flex-col items-center mt-1">
            <div
              className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/20 ${
                isActive ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '3s' }}
            >
              <div className="w-3 h-3 rounded-full bg-white/30" />
            </div>
          </div>
        )}
      </div>

      {/* Pull-down hint (only on first reel) */}
      {currentIndex === 0 && (
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center pointer-events-none transition-opacity"
          style={{ opacity: pullOffset > 20 ? Math.min(pullOffset / 60, 1) : 0 }}
        >
          <div className="mt-16 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
            Pull down to close
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ReelViewer Component ────────────────────────────────────────────────

export function ReelViewer() {
  const {
    showReelViewer,
    toggleReelViewer,
    selectedReelId,
    likedReels,
    toggleReelLike,
    savedReels,
    toggleSaveReel,
  } = useAuraStore();

  const { data: reelsData } = useReels();
  const toggleLikeApi = useToggleLike();
  const toggleSaveApi = useToggleSave();
  const recordReelView = useRecordReelView();

  // History panel state
  const [showHistory, setShowHistory] = useState(false);

  // Auto-track: timer for recording reel views after 3 seconds
  const viewTrackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedReelsRef = useRef<Set<string>>(new Set());

  // Derive reels array from API response
  const reels: ReelData[] = useMemo(() => {
    if (!reelsData) return [];
    if (Array.isArray(reelsData)) return reelsData as unknown as ReelData[];
    const rd = reelsData as { reels?: ReelData[] };
    return rd.reels || [];
  }, [reelsData]);

  // Find the starting index based on selectedReelId
  const startIndex = useMemo(() => {
    if (!selectedReelId || reels.length === 0) return 0;
    const idx = reels.findIndex((r) => r.id === selectedReelId);
    return idx >= 0 ? idx : 0;
  }, [selectedReelId, reels]);

  // Active reel tracking
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset active index when viewer opens with a new selectedReelId.
  useEffect(() => {
    setActiveIndex(startIndex);
  }, [startIndex]);

  // Auto-track: Record reel view after 3 seconds of watching
  useEffect(() => {
    // Clear previous timer
    if (viewTrackTimerRef.current) {
      clearTimeout(viewTrackTimerRef.current);
      viewTrackTimerRef.current = null;
    }

    if (!showReelViewer || reels.length === 0) return;

    const activeReel = reels[activeIndex];
    if (!activeReel) return;

    // Set a timer to record the view after 3 seconds
    viewTrackTimerRef.current = setTimeout(() => {
      // Track this reel view
      recordReelView.mutate(
        { reelId: activeReel.id, watchProgress: 50 },
        { onError: () => {} }
      );
      trackedReelsRef.current.add(activeReel.id);
    }, 3000);

    return () => {
      if (viewTrackTimerRef.current) {
        clearTimeout(viewTrackTimerRef.current);
        viewTrackTimerRef.current = null;
      }
    };
  }, [showReelViewer, activeIndex, reels, recordReelView]);

  // Scroll to the starting reel when viewer opens
  useEffect(() => {
    if (!showReelViewer || !scrollContainerRef.current || reels.length === 0) return;
    const raf = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const slideHeight = container.clientHeight;
      container.scrollTo({
        top: startIndex * slideHeight,
        behavior: 'instant' as ScrollBehavior,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [showReelViewer, startIndex, reels.length]);

  // Track scroll position to update active index (for auto-play/pause)
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const slideHeight = container.clientHeight;
    if (slideHeight === 0) return;
    const newIndex = Math.round(container.scrollTop / slideHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, reels.length]);

  // IntersectionObserver as backup for play/pause
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(idx) && entry.isIntersecting && idx !== activeIndex) {
            setActiveIndex(idx);
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    const slides = container.querySelectorAll('[data-index]');
    slides.forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, [reels.length, activeIndex]);

  const scrollToReel = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const slideHeight = container.clientHeight;
      container.scrollTo({
        top: index * slideHeight,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    },
    []
  );

  // Navigate to a specific reel by ID (from history panel)
  const navigateToReel = useCallback(
    (reelId: string) => {
      const idx = reels.findIndex((r) => r.id === reelId);
      if (idx >= 0) {
        scrollToReel(idx);
      } else {
        toast.info('This reel is not in the current feed');
      }
    },
    [reels, scrollToReel]
  );

  const handleLikeForReel = useCallback(
    (index: number) => {
      const reel = reels[index];
      if (!reel) return;
      const isLiked = likedReels.has(reel.id) || reel.isLiked;
      toggleReelLike(reel.id);
      toggleLikeApi.mutate(
        { targetId: reel.id, targetType: 'reel' },
        { onError: () => {} }
      );
      toast.success(isLiked ? 'Like removed' : 'Liked!');
    },
    [reels, likedReels, toggleReelLike, toggleLikeApi]
  );

  const handleSaveForReel = useCallback(
    (index: number) => {
      const reel = reels[index];
      if (!reel) return;
      const isSaved = savedReels.has(reel.id) || reel.isSaved;
      toggleSaveReel(reel.id);
      toggleSaveApi.mutate(
        { targetId: reel.id, targetType: 'reel' },
        { onError: () => {} }
      );
      toast.success(isSaved ? 'Reel unsaved' : 'Reel saved!');
    },
    [reels, savedReels, toggleSaveReel, toggleSaveApi]
  );

  const handleClose = useCallback(() => {
    toggleReelViewer();
  }, [toggleReelViewer]);

  // Keyboard navigation
  useEffect(() => {
    if (!showReelViewer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToReel(Math.min(activeIndex + 1, reels.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToReel(Math.max(activeIndex - 1, 0));
      } else if (e.key === 'Escape') {
        if (showHistory) {
          setShowHistory(false);
        } else {
          toggleReelViewer();
        }
      } else if (e.key === 'l') {
        handleLikeForReel(activeIndex);
      } else if (e.key === 'h') {
        setShowHistory((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReelViewer, activeIndex, reels.length, toggleReelViewer, handleLikeForReel, scrollToReel, showHistory]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (showReelViewer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showReelViewer]);

  if (!showReelViewer || reels.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-black">
      {/* Vertical scroll container with CSS scroll snap */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => {
          const isLiked = likedReels.has(reel.id) || reel.isLiked;
          const isSaved = savedReels.has(reel.id) || reel.isSaved;

          return (
            <div
              key={reel.id}
              data-index={index}
              className="w-full h-full"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ReelSlide
                reel={reel}
                isActive={index === activeIndex}
                isLiked={!!isLiked}
                isSaved={!!isSaved}
                onLike={() => handleLikeForReel(index)}
                onSave={() => handleSaveForReel(index)}
                onDoubleTap={() => {
                  if (!likedReels.has(reel.id) && !reel.isLiked) {
                    handleLikeForReel(index);
                  }
                }}
                onClose={handleClose}
                onComment={() => toast.success('Comments coming soon!')}
                onHistory={() => setShowHistory(true)}
                currentIndex={index}
                totalCount={reels.length}
                onPrev={index > 0 ? () => scrollToReel(index - 1) : undefined}
                onNext={index < reels.length - 1 ? () => scrollToReel(index + 1) : undefined}
                isLast={index === reels.length - 1}
                onPullClose={handleClose}
              />
            </div>
          );
        })}
      </div>

      {/* History Panel Overlay */}
      <HistoryPanel
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onNavigateToReel={navigateToReel}
      />

      {/* Hide scrollbar globally for this component */}
      <style jsx global>{`
        .snap-y::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// ─── Utility formatters ───────────────────────────────────────────────────────

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
