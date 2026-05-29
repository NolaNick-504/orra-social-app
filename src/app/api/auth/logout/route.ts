import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Determine if we should use Secure flag (match login route behavior)
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

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
    // The __Host- prefix requires: Secure, no Domain attribute, Path=/
    // The __Secure- prefix requires: Secure flag

    const cookieNames = [
      { name: 'next-auth.session-token', prefix: '__Secure-', hostPrefix: false },
      { name: 'next-auth.callback-url', prefix: '__Secure-', hostPrefix: false },
      { name: 'next-auth.csrf-token', prefix: '__Host-', hostPrefix: true },
    ];

    for (const { name, prefix, hostPrefix } of cookieNames) {
      // Clear non-prefixed version
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      // Clear prefixed version (this is what actually holds the session over HTTPS)
      if (isSecure) {
        const prefixedName = `${prefix}${name}`;
        response.cookies.set(prefixedName, '', {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
          // __Host- prefix cookies must NOT have a Domain attribute
          // The cookies.set API doesn't set domain by default, which is correct
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, try to clear all possible cookie variants
    const response = NextResponse.json({ success: true });
    const names = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
    ];
    for (const name of names) {
      response.cookies.set(name, '', { path: '/', maxAge: 0, secure: true, httpOnly: true, sameSite: 'lax' });
    }
    return response;
  }
}
