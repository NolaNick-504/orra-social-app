import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth-helpers';
import { checkRateLimit, getClientIdentifier, SIGNUP_RATE_LIMIT } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit signup attempts
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`signup:${clientId}`, SIGNUP_RATE_LIMIT);
    if (rateLimit.limited) {
      return NextResponse.json(
        { success: false, error: `Too many signup attempts. Try again in ${rateLimit.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await request.json();
    const { email, name, handle, password } = body;

    if (!email || !name || !handle || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, name, handle, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate handle format
    if (!handle.startsWith('@')) {
      return NextResponse.json(
        { success: false, error: 'Handle must start with @' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await registerUser(email, name, handle, password);

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    const message = error.message || 'Registration failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
