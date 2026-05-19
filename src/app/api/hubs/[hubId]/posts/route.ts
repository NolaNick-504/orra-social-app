import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  try {
    const { hubId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const posts = await db.hubPost.findMany({
      where: { hubId },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error('Hub posts fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch hub posts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { hubId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: 'Post text is required' }, { status: 400 });
    }

    // Verify user is a member
    const membership = await db.hubMember.findUnique({
      where: { userId_hubId: { userId, hubId } },
    });

    if (!membership) {
      return NextResponse.json({ success: false, error: 'Must be a hub member to post' }, { status: 403 });
    }

    const post = await db.hubPost.create({
      data: { text: text.trim(), authorId: userId, hubId },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    // Award tokens for hub post
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      await db.user.update({
        where: { id: userId },
        data: {
          auraTokens: user.auraTokens + 5,
          auraXP: user.auraXP + 10 >= 1000 ? (user.auraXP + 10) - 1000 : user.auraXP + 10,
          auraLevel: user.auraXP + 10 >= 1000 ? user.auraLevel + 1 : user.auraLevel,
        },
      });
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error('Hub post create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create hub post' }, { status: 500 });
  }
}
