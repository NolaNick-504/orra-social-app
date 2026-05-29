import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { encode } from 'next-auth/jwt';
import { checkRateLimit, getClientIdentifier, LOGIN_RATE_LIMIT } from '@/lib/rate-limit';

const SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Rate limit login attempts (skip for auto-re-login to avoid lockouts)
    const isAutoRelogin = request.headers.get('x-orra-auto-relogin') === 'true';
    if (!isAutoRelogin) {
      const clientId = getClientIdentifier(request);
      const rateLimit = checkRateLimit(`login:${clientId}`, LOGIN_RATE_LIMIT);
      if (rateLimit.limited) {
        return NextResponse.json(
          { success: false, error: `Too many login attempts. Try again in ${rateLimit.retryAfter} seconds.` },
          { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
        );
      }
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!SECRET) {
      console.error('NEXTAUTH_SECRET is not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create a NextAuth JWT session token manually
    // This bypasses the CSRF flow that causes issues behind reverse proxies
    const token = await encode({
      token: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        auraTokens: user.auraTokens,
        auraLevel: user.auraLevel,
        profileSetupComplete: user.profileSetupComplete,
        sub: user.id,
      },
      secret: SECRET,
      maxAge: 30 * 24 * 60 * 60, // 30 days — matches auth.ts session.maxAge
    });

    // Determine if we should use Secure flag
    // Check X-Forwarded-Proto first (for reverse proxy), then the request protocol
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    // Set the session cookie and return success
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        avatar: user.avatar,
      },
    });

    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Also set the callback-url cookie so NextAuth client knows we're logged in
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const proto = forwardedProto || (request.nextUrl.protocol === 'https:' ? 'https' : 'http');
    response.cookies.set('next-auth.callback-url', `${proto}://${host}`, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
