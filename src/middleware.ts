import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply to HTML page requests (not static assets, API routes, or uploads)
  const url = request.nextUrl;
  const isHtmlPage = url.pathname === '/' || (
    !url.pathname.startsWith('/_next/') &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/uploads/') &&
    !url.pathname.startsWith('/images/') &&
    !url.pathname.includes('.')
  );

  if (isHtmlPage) {
    const response = NextResponse.next();
    // Prevent caching of HTML pages so browsers always get fresh JS chunk references
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  return NextResponse.next();
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
