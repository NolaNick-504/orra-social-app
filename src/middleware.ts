import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Service Worker — MUST NEVER be cached
  //    Browsers check for SW updates on navigation; if this is cached,
  //    old SWs never get replaced, causing stale content issues.
  if (pathname === '/sw.js') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Service-Worker-Allowed', '/');
    return response;
  }

  // 2. API routes — pass through unchanged
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 3. Static assets (images, uploads, videos, favicon) — pass through with short cache
  if (
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/videos/') ||
    pathname === '/favicon.ico'
  ) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=3600');
    return response;
  }

  // 4. Next.js static chunks — CACHE FOREVER but ONLY if they're real static files
  //    CRITICAL: Non-existent chunk paths fall through to the catch-all route
  //    which returns HTML with Content-Type: text/html. If we cache this as
  //    immutable, the browser caches HTML as JS, causing parse errors.
  //    Fix: Only set immutable cache for paths that match the chunk hash pattern.
  if (pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next();
    // Real chunk files have content hashes: webpack-abc123.js, 4bd1b696-bf5e0dbacfa5baef.js
    // Non-existent chunks won't match this pattern and shouldn't be cached forever
    const isRealChunk = pathname.match(/\/_next\/static\/(chunks|css|media)\/[a-z0-9-]+\.[a-z0-9-]+\.(js|css|woff2?|ttf|otf|eot|png|jpg|svg|webp|ico|json|wasm)$/i);
    if (isRealChunk) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Could be a non-existent path that falls through to catch-all
      // Don't cache it as immutable — let the browser revalidate
      response.headers.set('Cache-Control', 'no-cache, must-revalidate');
    }
    return response;
  }

  // 5. Other _next paths (image optimization, etc.) — pass through
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // 6. HTML files in public/ (join.html, clear-cache.html) — no-cache
  //    These need to always be fresh so testers get the latest version.
  //    Must come before the generic "file extensions" rule below.
  if (pathname.endsWith('.html')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // 7. File extensions (likely static assets like .css, .js, .map, .woff, etc.)
  //    Cache font files aggressively — they never change
  //    NOTE: sw.js is handled above (rule #1) so it won't reach here
  if (pathname.includes('.') && !pathname.endsWith('/')) {
    const response = NextResponse.next();
    if (pathname.match(/\.(woff2?|ttf|otf|eot)$/i)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=3600');
    }
    return response;
  }

  // 8. ALL other HTML page requests — aggressive no-cache
  //    This ensures the browser NEVER serves stale HTML from cache
  //    and always gets fresh HTML with the correct JS chunk references.
  //    NOTE: We do NOT use Clear-Site-Data here because it clears ALL HTTP cache
  //    including the static JS chunks, which causes React hydration failures.
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  // Match ALL paths — we handle each type explicitly above
  matcher: '/:path*',
};
