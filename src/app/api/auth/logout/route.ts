import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // DEBUG: Log what's calling logout
    const referer = request.headers.get('referer') || 'no-referer';
    const userAgent = request.headers.get('user-agent') || 'no-ua';
    console.warn(`ORRA LOGOUT called from: ${referer} | UA: ${userAgent.substring(0, 80)}`);

    // NextAuth v4 uses cookie name prefixes when running over HTTPS:
    //   __Secure-next-auth.session-token  (for session)
    //   __Secure-next-auth.callback-url   (for callback URL)
    //   __Host-next-auth.csrf-token       (for CSRF token)
    //
    // We MUST clear BOTH the prefixed AND non-prefixed versions because:
    // 1. The browser stores cookies with the prefix (e.g., __Secure-next-auth.session-token)
    // 2. Setting a cookie with just "next-auth.session-token" creates a DIFFERENT cookie
    // 3. The original prefixed cookie remains and the user stays logged in
    //
    // Always use Secure=true since the site is always served over HTTPS (Nginx proxy).

    const allCookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
    ];

    const response = NextResponse.json({ success: true });

    for (const name of allCookieNames) {
      // Clear each cookie with Secure=true and httpOnly
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, try to clear all possible cookie variants
    const response = NextResponse.json({ success: true });
    const allCookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
    ];
    for (const name of allCookieNames) {
      try {
        response.cookies.set(name, '', {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        });
      } catch {}
    }
    return response;
  }
}
