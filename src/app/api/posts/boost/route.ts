import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/posts/boost - Boost a post
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { postId, duration } = body;

    if (!postId || !duration) {
      return NextResponse.json(
        { success: false, error: 'postId and duration are required' },
        { status: 400 }
      );
    }

    // Duration should be in hours (minimum 1 hour)
    const durationHours = Math.max(1, Math.min(168, Number(duration))); // Max 7 days
    if (isNaN(durationHours)) {
      return NextResponse.json(
        { success: false, error: 'Duration must be a number (in hours)' },
        { status: 400 }
      );
    }

    // Check post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Calculate token cost (10 tokens per hour)
    const tokenCost = durationHours * 10;

    // Check user has enough tokens
    const user = await db.user.findUnique({ where: { id: auth.userId! } });
    if (!user || user.auraTokens < tokenCost) {
      return NextResponse.json(
        { success: false, error: `Not enough tokens. Boost costs ${tokenCost} tokens for ${durationHours}h` },
        { status: 400 }
      );
    }

    // Set boostedUntil
    const boostedUntil = new Date();
    boostedUntil.setHours(boostedUntil.getHours() + durationHours);

    // Update post and deduct tokens in a transaction
    await db.$transaction([
      db.post.update({
        where: { id: postId },
        data: {
          isBoosted: true,
          boostedUntil,
        },
      }),
      db.user.update({
        where: { id: auth.userId! },
        data: {
          auraTokens: { decrement: tokenCost },
        },
      }),
      db.tokenAction.create({
        data: {
          userId: auth.userId!,
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
