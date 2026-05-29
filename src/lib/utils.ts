import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cache-bust version for avatar/profile images — bump this to force browsers to re-fetch images
const IMAGE_CACHE_VERSION = 'v2025.05.23-3';

/**
 * Convert /images/ and /uploads/ paths to API-served paths for standalone mode compatibility.
 * In Next.js standalone mode, static files in public/ are not served directly (404).
 * The /api/uploads?path= endpoint serves these files reliably.
 * Also adds cache-busting parameter for avatar/cover images to prevent stale cached 404s.
 *
 * - /images/orra-logo.png → /api/uploads?path=images/orra-logo.png&_v=v2025.05.23-3
 * - /uploads/avatar.jpg → /api/uploads?file=avatar.jpg (already API path)
 * - http://... or data:... → unchanged
 */
export function resolveImageUrl(url: string | null | undefined, cacheBust: boolean = false): string {
  if (!url) return `/api/uploads?path=images/orra-logo.png&_v=${IMAGE_CACHE_VERSION}`;
  // If already an API path, add cache-bust for uploads paths (avatars, covers, etc.)
  // Always cache-bust /api/uploads paths since Samsung Internet aggressively caches them
  if (url.startsWith('/api/')) {
    if (!url.includes('_v=')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}_v=${IMAGE_CACHE_VERSION}`;
    }
    return url;
  }
  // External URLs or data URLs — use as-is
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  // Convert /images/... and /uploads/... paths to API-served paths
  if (url.startsWith('/images/') || url.startsWith('/uploads/')) {
    return `/api/uploads?path=${url.slice(1)}&_v=${IMAGE_CACHE_VERSION}`;
  }
  return url;
}

/**
 * Get initials from a name for avatar fallback.
 * e.g., "Nick Joseph" → "NJ", "ORRA" → "OR"
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Format a date/timestamp into a human-readable relative time string.
 * Handles: Just now, Xm ago, Xh ago, Xd ago, Xw ago, Xmo ago, and full dates.
 * Also handles NaN/invalid dates gracefully.
 */
export function timeAgo(date: Date | string | number | null | undefined): string {
  if (!date) return 'Just now';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Just now';
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 0) return 'Just now';
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return d.toLocaleDateString();
}
