import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUserId = await getAuthUserId();

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        handle: true,
        email: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        profileSongUrl: true,
        profileSongTitle: true,
        profileSongArtist: true,
        verified: true,
        online: true,
        auraTokens: true,
        auraLevel: true,
        auraXP: true,
        dailyStreak: true,
        badges: true,
        createdAt: true,
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
    if (currentUserId && currentUserId !== id) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: id,
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
        isSelf: currentUserId === id,
      },
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}
