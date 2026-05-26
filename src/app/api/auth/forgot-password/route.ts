import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { checkRateLimit, getClientIdentifier, FORGOT_PASSWORD_RATE_LIMIT } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// POST /api/auth/forgot-password - Generate a password reset token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Rate limit forgot-password attempts
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`forgot-password:${clientId}`, FORGOT_PASSWORD_RATE_LIMIT);
    if (rateLimit.limited) {
      return NextResponse.json(
        { success: false, error: `Too many attempts. Try again in ${rateLimit.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether a user exists with this email
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a reset token has been generated.',
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store token in VerificationToken model
    // Expires in 1 hour
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await db.verificationToken.create({
      data: {
        identifier: `reset-password:${user.id}`,
        token: resetToken,
        expires,
      },
    });

    // SECURITY: Never return the reset token in the API response or log it.
    // In production, send the token via email. The token is stored in the
    // VerificationToken table and can be looked up directly in the database if needed.
    // DO NOT log the reset token — it allows account takeover if logs are exposed.
    console.log(`[AUTH] Password reset token generated for ${email}`);

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset token has been generated.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process forgot password request' },
      { status: 500 }
    );
  }
}
