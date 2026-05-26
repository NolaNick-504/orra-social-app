import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

// POST /api/hubs/[hubId]/posts/[postId]/like — Like/unlike a hub post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string; postId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { hubId, postId } = await params;
    const body = await request.json().catch(() => ({}));
    const reactionType = body.reactionType || 'like';

    const VALID_REACTIONS = ['like', 'wow', 'omg', 'wtf', 'laughing', 'sad', 'care'];
    if (!VALID_REACTIONS.includes(reactionType)) {
      return NextResponse.json({ success: false, error: 'Invalid reaction type' }, { status: 400 });
    }

    // Verify the post exists in this hub
    const post = await db.hubPost.findFirst({
      where: { id: postId, hubId },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const result = await serializedTransaction(async (tx) => {
      // Check if already liked
      const existingLike = await tx.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: postId,
            targetType: 'hubPost',
          },
        },
      });

      if (existingLike) {
        // Unlike — remove the like
        await tx.like.delete({
          where: { id: existingLike.id },
        });

        // Decrement likesCount
        await tx.hubPost.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        });

        return { action: 'unliked', reactionType: existingLike.reactionType };
      }

      // Like — create the like
      await tx.like.create({
        data: {
          userId,
          targetId: postId,
          targetType: 'hubPost',
          reactionType,
        },
      });

      // Increment likesCount
      await tx.hubPost.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      return { action: 'liked', reactionType };
    });

    // Award tokens for liking (only on like, not unlike)
    if (result.action === 'liked') {
      try {
        await db.user.update({
          where: { id: userId },
          data: { auraTokens: { increment: 1 } },
        });
      } catch {
        // Best-effort
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Hub post like error:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle like' }, { status: 500 });
  }
}
