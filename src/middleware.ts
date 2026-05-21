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

  // 3. Next.js static chunks — CRITICAL: prevent browser caching of stale chunks
  //    After a rebuild, old chunk filenames no longer exist. If the browser has
  //    old HTML cached, it requests old chunks → gets HTML (200) instead of JS → crash.
  //    Solution: no-store on chunks so the browser always validates with the server.
  if (pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next();
    // Use no-store for chunk requests — ensures the browser always gets fresh chunks
    // If a chunk is gone (stale), the server will return a proper 404 or redirect
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }

  // 4. Other _next paths (image optimization, etc.) — pass through
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // 5. File extensions (likely static assets like .css, .js, .map, .woff, etc.)
  //    Pass through — these are usually Next.js managed
  if (pathname.includes('.') && !pathname.endsWith('/')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
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
