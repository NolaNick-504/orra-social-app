/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per IP address.
 * 
 * In production, you'd want to use Redis or a similar distributed store,
 * but for a single-instance app this is sufficient.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Check if a request should be rate limited.
 * Returns { limited: true, remaining: 0, retryAfter } if rate limited,
 * or { limited: false, remaining, retryAfter: 0 } if allowed.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { limited: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired — start fresh
    store.set(key, { count: 1, resetTime: now + options.windowMs });
    return { limited: false, remaining: options.limit - 1, retryAfter: 0 };
  }

  if (entry.count >= options.limit) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { limited: true, remaining: 0, retryAfter };
  }

  // Increment counter
  entry.count += 1;
  return { limited: false, remaining: options.limit - entry.count, retryAfter: 0 };
}

/**
 * Extract a client identifier from the request.
 * Uses X-Forwarded-For header (set by Caddy proxy) or falls back to IP.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim();
  }
  // Fallback (may be ::1 in dev)
  return request.headers.get('x-real-ip') || 'unknown';
}

/** Rate limit config for signup: 5 per hour per IP */
export const SIGNUP_RATE_LIMIT: RateLimitOptions = { limit: 5, windowMs: 60 * 60 * 1000 };

/** Rate limit config for forgot-password: 3 per 15 minutes per IP */
export const FORGOT_PASSWORD_RATE_LIMIT: RateLimitOptions = { limit: 3, windowMs: 15 * 60 * 1000 };

/** Rate limit config for login attempts: 30 per 5 minutes per IP */
export const LOGIN_RATE_LIMIT: RateLimitOptions = { limit: 30, windowMs: 5 * 60 * 1000 };
