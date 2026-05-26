import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/auth/delete-account - Delete a user account
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify the authenticated user matches the requested userId
    if (userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own account' },
        { status: 403 }
      );
    }

    // Delete the user - cascade will clean related data
    await db.user.delete({
      where: { id: userId },
    });

    // Clear session cookies so the deleted user cannot remain authenticated
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || req.nextUrl.protocol === 'https:';

    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });

    response.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
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
    console.error('Delete account error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
