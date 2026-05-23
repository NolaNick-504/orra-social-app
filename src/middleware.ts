import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API routes — pass through unchanged
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Static assets (images, uploads, videos, favicon) — pass through with short cache
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

  // 3. Next.js static chunks — CACHE FOREVER (content-hashed filenames)
  //    These files have content hashes in their names (e.g. webpack-abc123.js).
  //    When content changes, the filename changes, so caching is ALWAYS safe.
  //    Caching these is CRITICAL for performance — without it, browsers re-download
  //    ALL JavaScript on every page load, causing 5+ second white screens.
  if (pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return response;
  }

  // 4. Other _next paths (image optimization, etc.) — pass through
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // 5. File extensions (likely static assets like .css, .js, .map, .woff, etc.)
  //    Cache font files aggressively — they never change
  if (pathname.includes('.') && !pathname.endsWith('/')) {
    const response = NextResponse.next();
    if (pathname.match(/\.(woff2?|ttf|otf|eot)$/i)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=3600');
    }
    return response;
  }

  // 6. ALL other HTML page requests — aggressive no-cache + SPA rewrite
  //    This ensures the browser NEVER serves stale HTML from cache
  //    and always gets fresh HTML with the correct JS chunk references
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  // Also prevent service workers from caching
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  // Match ALL paths — we handle each type explicitly above
  matcher: '/:path*',
};
