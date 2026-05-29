import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // DEBUG: Log what's calling logout
    const referer = request.headers.get('referer') || 'no-referer';
    const userAgent = request.headers.get('user-agent') || 'no-ua';
    console.warn(`ORRA LOGOUT called from: ${referer} | UA: ${userAgent.substring(0, 80)}`);

    const response = NextResponse.json({ success: true });

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
    // Also set raw Set-Cookie headers without Secure as belt-and-suspenders fallback.

    const cookieNames = [
      { name: 'next-auth.session-token', prefix: '__Secure-', hostPrefix: false },
      { name: 'next-auth.callback-url', prefix: '__Secure-', hostPrefix: false },
      { name: 'next-auth.csrf-token', prefix: '__Host-', hostPrefix: true },
    ];

    for (const { name, prefix } of cookieNames) {
      // Clear non-prefixed version with Secure=true
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      // Clear prefixed version (this is what actually holds the session over HTTPS)
      const prefixedName = `${prefix}${name}`;
      response.cookies.set(prefixedName, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      // Also add raw Set-Cookie headers without Secure as belt-and-suspenders fallback
      response.appendHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
      response.appendHeader('Set-Cookie', `${prefixedName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, try to clear all possible cookie variants using raw headers
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
      // With Secure
      response.appendHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      // Without Secure (fallback)
      response.appendHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    }
    return response;
  }
}
