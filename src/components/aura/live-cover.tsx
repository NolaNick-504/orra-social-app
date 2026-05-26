'use client';

import { resolveImageUrl } from '@/lib/utils';
import { Radio } from 'lucide-react';

/**
 * Category-themed gradient backgrounds for live streams.
 * Each category gets a unique visual identity.
 */
const CATEGORY_GRADIENTS: Record<string, string> = {
  Music: 'from-violet-900/90 via-purple-800/70 to-indigo-950/90',
  Gaming: 'from-indigo-900/90 via-blue-800/70 to-cyan-950/90',
  Dance: 'from-pink-900/90 via-rose-800/70 to-fuchsia-950/90',
  Comedy: 'from-amber-900/90 via-orange-800/70 to-yellow-950/90',
  Sports: 'from-emerald-900/90 via-green-800/70 to-teal-950/90',
  Art: 'from-cyan-900/90 via-teal-800/70 to-sky-950/90',
  Lifestyle: 'from-rose-900/90 via-pink-800/70 to-red-950/90',
  Trending: 'from-red-900/90 via-violet-800/70 to-fuchsia-950/90',
  Cooking: 'from-orange-900/90 via-amber-800/70 to-red-950/90',
  Fitness: 'from-lime-900/90 via-green-800/70 to-emerald-950/90',
  Tech: 'from-blue-900/90 via-indigo-800/70 to-violet-950/90',
  Fashion: 'from-fuchsia-900/90 via-pink-800/70 to-rose-950/90',
  Education: 'from-sky-900/90 via-blue-800/70 to-indigo-950/90',
  Talk: 'from-slate-800/90 via-gray-700/70 to-zinc-950/90',
  Live: 'from-red-900/90 via-violet-800/70 to-fuchsia-950/90',
  Food: 'from-orange-900/90 via-amber-800/70 to-red-950/90',
};

/**
 * Category-specific cover images — AI-generated covers matching each category.
 */
const CATEGORY_COVERS: Record<string, string> = {
  music: '/uploads/live-covers/late-night-vibes.jpg',
  gaming: '/uploads/live-covers/ranked-grind.jpg',
  dance: '/uploads/live-covers/dance-challenge.jpg',
  comedy: '/uploads/live-covers/storytime-qa.jpg',
  sports: '/uploads/live-covers/pregame-warmup.jpg',
  art: '/uploads/live-covers/painting-session.jpg',
  lifestyle: '/uploads/live-covers/cooking-special.jpg',
  trending: '/uploads/live-covers/just-chatting.jpg',
  cooking: '/uploads/live-covers/making-ramen.jpg',
  food: '/uploads/live-covers/cooking-special.jpg',
  fitness: '/uploads/live-covers/morning-yoga.jpg',
  tech: '/uploads/live-covers/tech-news.jpg',
  fashion: '/uploads/live-covers/fashion-lookbook.jpg',
  education: '/uploads/live-covers/study-session.jpg',
  talk: '/uploads/live-covers/storytime-qa.jpg',
  live: '/uploads/live-covers/just-chatting.jpg',
};

/**
 * Get the category-specific cover image URL for a given category.
 */
function getCategoryCover(category: string): string {
  const normalized = (category || 'trending').toLowerCase().trim();
  return CATEGORY_COVERS[normalized] || CATEGORY_COVERS.trending;
}

interface LiveCoverProps {
  /** Thumbnail URL (may be empty string for live streams) */
  thumbnail: string;
  /** Stream category (Music, Gaming, etc.) */
  category?: string;
  /** Creator's avatar URL for fallback */
  creatorAvatar?: string;
  /** Creator's name for fallback */
  creatorName?: string;
  /** Stream title */
  title?: string;
  /** Whether to show LIVE badge */
  showLiveBadge?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Image className override */
  imgClassName?: string;
  /** Opacity for the background image */
  opacity?: number;
}

/**
 * LiveCover - A reusable component for displaying live stream covers.
 * 
 * - If a thumbnail exists, shows it with a dark overlay gradient
 * - If no thumbnail, falls back to the category-specific cover image
 * - If the category cover also fails, shows a category-themed gradient with icon
 */
export function LiveCover({
  thumbnail,
  category = 'Trending',
  creatorAvatar,
  creatorName,
  title,
  showLiveBadge = false,
  className = '',
  imgClassName = '',
  opacity = 90,
}: LiveCoverProps) {
  const hasThumbnail = thumbnail && thumbnail.trim() !== '';
  // Use the provided thumbnail, or fall back to the category-specific cover image
  const coverSrc = hasThumbnail ? thumbnail : getCategoryCover(category);
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.Trending;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <img
        src={resolveImageUrl(coverSrc)}
        alt={title || 'Live stream'}
        className={`w-full h-full object-cover ${imgClassName}`}
        style={{ opacity: opacity / 100 }}
        onError={(e) => {
          // If the image fails to load, hide it and show the gradient fallback
          const img = e.currentTarget;
          img.style.display = 'none';
          // Add gradient fallback class to parent
          const parent = img.parentElement;
          if (parent && !parent.dataset.gradientFallback) {
            parent.dataset.gradientFallback = 'true';
            parent.classList.add('bg-gradient-to-br', ...gradient.split(' '));
          }
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      {showLiveBadge && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-sm z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-white text-[9px] font-black uppercase tracking-widest">LIVE</span>
        </div>
      )}
    </div>
  );
}
