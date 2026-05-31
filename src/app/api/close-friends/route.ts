import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/close-friends - List user's close friends
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const closeFriends = await db.closeFriend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
            online: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = closeFriends.map((cf) => ({
      id: cf.id,
      createdAt: cf.createdAt,
      ...cf.friend,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('List close friends error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch close friends' },
      { status: 500 }
    );
  }
}

// POST /api/close-friends - Add a close friend
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json(
        { success: false, error: 'friendId is required' },
        { status: 400 }
      );
    }

    if (friendId === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot add yourself as a close friend' },
        { status: 400 }
      );
    }

    // Verify the friend exists
    const friend = await db.user.findUnique({ where: { id: friendId } });
    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already a close friend
    const existing = await db.closeFriend.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already a close friend' },
        { status: 409 }
      );
    }

    const closeFriend = await serializedTransaction(async (tx) => {
      return tx.closeFriend.create({
        data: { userId, friendId },
      });
    });

    return NextResponse.json({ success: true, data: closeFriend }, { status: 201 });
  } catch (error) {
    console.error('Add close friend error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add close friend' },
      { status: 500 }
    );
  }
}

// DELETE /api/close-friends - Remove a close friend
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json(
        { success: false, error: 'friendId is required' },
        { status: 400 }
      );
    }

    const existing = await db.closeFriend.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Not a close friend' },
        { status: 404 }
      );
    }

    await serializedTransaction(async (tx) => {
      await tx.closeFriend.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ success: true, data: { removed: true } });
  } catch (error) {
    console.error('Remove close friend error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove close friend' },
      { status: 500 }
    );
  }
}
