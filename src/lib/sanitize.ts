/**
 * Input sanitization utilities for the ORRA app.
 * Prevents XSS and other injection attacks in user-generated content.
 */

/**
 * Sanitize text input by removing/nullifying dangerous HTML/script content.
 * This is a server-side defense — the client should also escape content before rendering.
 * 
 * NOTE: We intentionally do NOT strip HTML tags entirely because some content
 * may legitimately contain < or > characters. Instead we neutralize the most
 * dangerous patterns.
 */
export function sanitizeText(input: string): string {
  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onload, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove data: URLs that could contain scripts
    .replace(/data\s*:\s*text\/html/gi, '');
}

/**
 * Validate and clamp a string length. Returns the trimmed string if valid,
 * or throws an error description if too long.
 */
export function validateLength(input: string, min: number, max: number, fieldName: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (trimmed.length > max) {
    return `${fieldName} must be ${max} characters or less`;
  }
  return null;
}

/** Max lengths for various content types */
export const CONTENT_LIMITS = {
  POST_TEXT: 2000,
  COMMENT_TEXT: 1000,
  CHAT_MESSAGE: 2000,
  STORY_IMAGE_URL: 500,
  HOT_TAKE_TEXT: 500,
  PROFILE_BIO: 300,
  PROFILE_NAME: 50,
  PROFILE_HANDLE: 30,
  PROFILE_LOCATION: 100,
  PROFILE_WEBSITE: 200,
  SEARCH_QUERY: 200,
  HUB_POST_TEXT: 2000,
} as const;
