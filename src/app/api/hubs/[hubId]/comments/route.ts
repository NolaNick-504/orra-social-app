import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

// GET /api/hubs/[hubId]/comments?hubPostId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  try {
    const { hubId } = await params;
    const url = new URL(request.url);
    const hubPostId = url.searchParams.get('hubPostId');

    if (!hubPostId) {
      return NextResponse.json({ success: false, error: 'hubPostId is required' }, { status: 400 });
    }

    const comments = await db.hubPostComment.findMany({
      where: { hubPostId },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error('Hub comments fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/hubs/[hubId]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  try {
    const { hubId } = await params;

    // Support both auth and auto-post key
    const autopostKey = request.headers.get('x-autopost-key');
    let userId: string | null = null;

    if (autopostKey) {
      const expectedKey = process.env.NEXTAUTH_SECRET || 'orra-internal';
      if (autopostKey !== expectedKey) {
        return NextResponse.json({ success: false, error: 'Invalid auto-post key' }, { status: 403 });
      }
      const body = await request.json();
      userId = body.authorId;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'authorId required for auto-post' }, { status: 400 });
      }
      const { text, hubPostId } = body;
      if (!text?.trim() || !hubPostId) {
        return NextResponse.json({ success: false, error: 'Text and hubPostId are required' }, { status: 400 });
      }

      const comment = await db.hubPostComment.create({
        data: { text: text.trim(), hubPostId, authorId: userId },
        include: {
          author: { select: { id: true, name: true, handle: true, avatar: true, verified: true } },
        },
      });

      // Update comments count
      await db.hubPost.update({
        where: { id: hubPostId },
        data: { commentsCount: { increment: 1 } },
      });

      return NextResponse.json({ success: true, data: comment }, { status: 201 });
    }

    // Regular auth flow
    userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { text, hubPostId } = body;

    if (!text?.trim() || !hubPostId) {
      return NextResponse.json({ success: false, error: 'Text and hubPostId are required' }, { status: 400 });
    }

    // Verify membership
    const membership = await db.hubMember.findUnique({
      where: { userId_hubId: { userId, hubId } },
    });

    if (!membership) {
      return NextResponse.json({ success: false, error: 'Must be a hub member to comment' }, { status: 403 });
    }

    const comment = await db.hubPostComment.create({
      data: { text: text.trim(), hubPostId, authorId: userId },
      include: {
        author: { select: { id: true, name: true, handle: true, avatar: true, verified: true } },
      },
    });

    // Update comments count
    await db.hubPost.update({
      where: { id: hubPostId },
      data: { commentsCount: { increment: 1 } },
    });

    // Award tokens for comment
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      const newXP = user.auraXP + 5;
      const leveledUp = newXP >= 1000;
      await db.user.update({
        where: { id: userId },
        data: {
          auraTokens: user.auraTokens + 2,
          auraXP: leveledUp ? newXP - 1000 : newXP,
          auraLevel: leveledUp ? user.auraLevel + 1 : user.auraLevel,
        },
      });
    }

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error('Hub comment create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create comment' }, { status: 500 });
  }
}
