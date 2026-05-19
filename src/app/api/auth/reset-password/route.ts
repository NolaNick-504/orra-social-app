import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/auth/reset-password - Reset password using a valid token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Require at least one letter and one number
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      );
    }

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { success: false, error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Extract user ID from identifier (format: "reset-password:{userId}")
    const identifierParts = verificationToken.identifier.split(':');
    if (identifierParts[0] !== 'reset-password' || !identifierParts[1]) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    const userId = identifierParts[1];

    // Check user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
