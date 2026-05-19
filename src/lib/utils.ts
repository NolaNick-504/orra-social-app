import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert /images/ and /uploads/ paths to API-served paths for standalone mode compatibility.
 * In Next.js standalone mode, static files in public/ are not served directly (404).
 * The /api/uploads?path= endpoint serves these files reliably.
 *
 * - /images/orra-logo.png → /api/uploads?path=images/orra-logo.png
 * - /uploads/avatar.jpg → /api/uploads?file=avatar.jpg (already API path)
 * - http://... or data:... → unchanged
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '/api/uploads?path=images/orra-logo.png';
  // If already an API path, external URL, or data URL, use as-is
  if (url.startsWith('/api/') || url.startsWith('http') || url.startsWith('data:')) return url;
  // Convert /images/... and /uploads/... paths to API-served paths
  if (url.startsWith('/images/') || url.startsWith('/uploads/')) return `/api/uploads?path=${url.slice(1)}`;
  return url;
}
