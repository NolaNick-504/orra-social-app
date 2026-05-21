import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // SPA route handling is now done via next.config.ts rewrites
  // (processed BEFORE routing, so RSC data is correct)
  // This middleware only handles cache-busting headers
  const { pathname } = request.nextUrl;

  // Skip static assets, API routes, uploads, images, and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/videos/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // All HTML page requests get cache-busting headers
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
