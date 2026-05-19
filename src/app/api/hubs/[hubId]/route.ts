import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  try {
    const { hubId } = await params;
    const userId = await getAuthUserId();

    const hub = await db.hub.findUnique({
      where: { id: hubId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, handle: true, avatar: true, online: true, verified: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        posts: {
          include: {
            author: {
              select: { id: true, name: true, handle: true, avatar: true, verified: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!hub) {
      return NextResponse.json({ success: false, error: 'Hub not found' }, { status: 404 });
    }

    const isMember = userId
      ? hub.members.some((m) => m.userId === userId)
      : false;

    return NextResponse.json({
      success: true,
      data: {
        ...hub,
        isMember,
      },
    });
  } catch (error) {
    console.error('Hub detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch hub' }, { status: 500 });
  }
}
