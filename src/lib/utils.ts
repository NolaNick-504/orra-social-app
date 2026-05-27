import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cache-bust version for avatar/profile images — bump this to force browsers to re-fetch images
const IMAGE_CACHE_VERSION = 'v2026.05.28-1';

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
