import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Determine if we should use Secure flag (match login route behavior)
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    const response = NextResponse.json({ success: true });

    // Clear the session cookie with the same flags used when setting it
    // This is critical: if the cookie was set with Secure, we must also
    // specify Secure when deleting it, otherwise the browser ignores the deletion
    response.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    response.cookies.set('next-auth.callback-url', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('next-auth.csrf-token', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, try to clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.set('next-auth.session-token', '', { path: '/', maxAge: 0 });
    response.cookies.set('next-auth.callback-url', '', { path: '/', maxAge: 0 });
    response.cookies.set('next-auth.csrf-token', '', { path: '/', maxAge: 0 });
    return response;
  }
}
