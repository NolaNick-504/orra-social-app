import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle: rawHandle } = await params;
    // Normalize handle: ensure it has @ prefix for DB lookup
    const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
    const currentUserId = await getAuthUserId();

    const user = await db.user.findUnique({
      where: { handle },
      select: {
        id: true,
        name: true,
        handle: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        verified: true,
        online: true,
        auraTokens: true,
        auraLevel: true,
        auraXP: true,
        badges: true,
        _count: {
          select: {
            posts: true,
            follows: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        isFollowing,
        isSelf: currentUserId === user.id,
      },
    });
  } catch (error) {
    console.error('Handle lookup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to lookup user' }, { status: 500 });
  }
}
