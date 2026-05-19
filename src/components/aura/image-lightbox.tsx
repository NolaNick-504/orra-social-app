'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, open, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [swipeStart, setSwipeStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigation helpers
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < images.length - 1) {
        setZoomed(false);
        setPan({ x: 0, y: 0 });
        return prev + 1;
      }
      return prev;
    });
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        setZoomed(false);
        setPan({ x: 0, y: 0 });
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const toggleZoom = useCallback(() => {
    setZoomed((prev) => !prev);
    setPan({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case '+':
        case '=':
          toggleZoom();
          break;
        case '-':
          if (zoomed) toggleZoom();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose, goPrev, goNext, toggleZoom, zoomed]);

  // Click on image to toggle zoom
  const handleImageClick = useCallback(
    () => {
      // Only toggle zoom if not dragging
      if (!isDragging) {
        toggleZoom();
      }
    },
    [isDragging, toggleZoom]
  );

  // Pan/drag handlers for zoomed state
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!zoomed) {
        // Track for swipe on mobile
        setSwipeStart(e.clientX);
        return;
      }
      setIsDragging(false);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: pan.x, y: pan.y });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [zoomed, pan.x, pan.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!zoomed) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        setIsDragging(true);
      }
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy,
      });
    },
    [zoomed, dragStart, panStart]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!zoomed && swipeStart !== null) {
        const diff = e.clientX - swipeStart;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            goPrev();
          } else {
            goNext();
          }
        }
        setSwipeStart(null);
        return;
      }
      setIsDragging(false);
    },
    [zoomed, swipeStart, goPrev, goNext]
  );

  // Touch swipe support for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoomed) return;
      if (e.touches.length === 1) {
        setSwipeStart(e.touches[0].clientX);
      }
    },
    [zoomed]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (zoomed || swipeStart === null) return;
      const touch = e.changedTouches[0];
      const diff = touch.clientX - swipeStart;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goPrev();
        } else {
          goNext();
        }
      }
      setSwipeStart(null);
    },
    [zoomed, swipeStart, goPrev, goNext]
  );

  // Backdrop click to close (only when not zoomed and not dragging)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !zoomed && !isDragging) {
        onClose();
      }
    },
    [onClose, zoomed, isDragging]
  );

  if (!open || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={handleBackdropClick}
      ref={containerRef}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 right-4 z-[110] px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-24 z-[110] flex items-center gap-1">
        <button
          onClick={() => {
            if (zoomed) toggleZoom();
          }}
          disabled={!zoomed}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            if (!zoomed) toggleZoom();
          }}
          disabled={zoomed}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Left arrow */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right arrow */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image container */}
      <div
        className="flex items-center justify-center w-full h-full select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Prevent backdrop close when clicking on image area
          e.stopPropagation();
          handleImageClick();
        }}
      >
        <img
          src={resolveImageUrl(currentImage)}
          alt=""
          className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
            zoomed ? 'cursor-grab' : 'cursor-pointer'
          } ${isDragging && zoomed ? 'cursor-grabbing' : ''}`}
          style={{
            transform: zoomed
              ? `scale(2) translate(${pan.x / 2}px, ${pan.y / 2}px)`
              : 'scale(1)',
            transition: isDragging ? 'none' : 'transform 0.3s ease',
          }}
          draggable={false}
        />
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
                setZoomed(false);
                setPan({ x: 0, y: 0 });
              }}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
