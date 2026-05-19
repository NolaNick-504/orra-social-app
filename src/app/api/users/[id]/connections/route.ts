import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

// GET /api/users/[id]/connections?type=followers|following
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'followers';

    if (type === 'followers') {
      const follows = await db.follow.findMany({
        where: { followingId: id },
        include: {
          follower: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: follows.map((f) => f.follower),
      });
    } else {
      const follows = await db.follow.findMany({
        where: { followerId: id },
        include: {
          following: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: follows.map((f) => f.following),
      });
    }
  } catch (error) {
    console.error('User connections fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch connections' }, { status: 500 });
  }
}
