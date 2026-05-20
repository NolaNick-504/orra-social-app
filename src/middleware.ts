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

  // SPA route handling: rewrite all non-root paths to render the root page
  // ORRA is a Single-Page Application — the only real page is /
  // All "routes" like /explore, /profile, etc. are client-side state changes
  // Using rewrite (not redirect) so the browser URL stays at /explore etc.
  // but the server renders the root page content
  if (pathname !== '/') {
    const response = NextResponse.rewrite(new URL('/', request.url));
    response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // Root path: serve the app with cache-busting headers
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api|uploads|images).*)',
  ],
};
