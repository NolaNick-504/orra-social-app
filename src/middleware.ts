import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Service Worker — MUST NEVER be cached
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

  // 4. Next.js static paths — handled by custom server.js now
  //    The custom server intercepts /_next/static/chunks/*.js and /_next/static/css/*.css
  //    requests, serving real files directly and returning 404 for non-existent ones.
  //    This prevents the catch-all route from returning HTML for chunk requests.
  //    NOTE: Next.js middleware is NOT invoked for /_next/static/ paths — this is a
  //    built-in behavior that can't be overridden. That's why we use server.js instead.
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // 5. HTML files in public/ (join.html, clear-cache.html) — no-cache
  if (pathname.endsWith('.html')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // 6. File extensions (likely static assets) — cache fonts aggressively
  if (pathname.includes('.') && !pathname.endsWith('/')) {
    const response = NextResponse.next();
    if (pathname.match(/\.(woff2?|ttf|otf|eot)$/i)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=3600');
    }
    return response;
  }

  // 7. ALL other HTML page requests — aggressive no-cache
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: '/:path*',
};
