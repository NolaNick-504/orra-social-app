import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/posts/boost - Boost a post
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { postId, duration, itemId } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      );
    }

    // Duration should be in hours (minimum 1 hour)
    const durationHours = duration ? Math.max(1, Math.min(168, Number(duration))) : 1;
    if (isNaN(durationHours)) {
      return NextResponse.json(
        { success: false, error: 'Duration must be a number (in hours)' },
        { status: 400 }
      );
    }

    // Calculate token cost based on boost type
    let tokenCost: number;
    if (itemId === 'boost_mega') {
      tokenCost = 40; // Mega boost: 6 hours
    } else if (itemId === 'reach-amplifier') {
      tokenCost = 500;
    } else if (itemId === 'hub-spotlight') {
      tokenCost = 350;
    } else if (itemId === 'post-boost') {
      tokenCost = 200;
    } else {
      tokenCost = durationHours * 10; // Default: 10 tokens per hour
    }

    // Check post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check user has enough tokens
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.auraTokens < tokenCost) {
      return NextResponse.json(
        { success: false, error: `Not enough tokens. Boost costs ${tokenCost} tokens` },
        { status: 400 }
      );
    }

    // Set boostedUntil
    const boostedUntil = new Date();
    boostedUntil.setHours(boostedUntil.getHours() + durationHours);

    // Update post and deduct tokens
    await db.$transaction([
      db.post.update({
        where: { id: postId },
        data: {
          isBoosted: true,
          boostedUntil,
        },
      }),
      db.user.update({
        where: { id: userId },
        data: {
          auraTokens: { decrement: tokenCost },
        },
      }),
      db.tokenAction.create({
        data: {
          userId,
          action: 'boost_post',
          targetId: postId,
          tokensEarned: -tokenCost,
          xpEarned: 0,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        postId,
        isBoosted: true,
        boostedUntil,
        tokensSpent: tokenCost,
        tokensRemaining: user.auraTokens - tokenCost,
      },
    });
  } catch (error) {
    console.error('Boost post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to boost post' },
      { status: 500 }
    );
  }
}
