import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
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
