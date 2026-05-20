import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Skip static assets, API routes, uploads, images, and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // SPA route protection: redirect all non-root paths to /
  // ORRA is a Single-Page Application — the only real page is /
  // All "routes" like /explore, /profile, etc. are client-side state changes
  // When a user refreshes on /explore, the server must redirect to / so the SPA can load
  if (pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  // Root path: serve the app with cache-busting headers
  // This ensures mobile browsers always get fresh JS chunk references after deploys
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes)
     * - uploads/images (file serving)
     */
    '/((?!_next/static|_next/image|api|uploads|images).*)',
  ],
};
