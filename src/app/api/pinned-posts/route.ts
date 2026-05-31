import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/pinned-posts - List pinned posts for a user (supports userId query param)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');

    if (!targetUserId) {
      // If no userId provided, require auth and use current user
      const userId = await getAuthUserId();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Authentication required or provide userId parameter' },
          { status: 401 }
        );
      }

      const pinnedPosts = await db.pinnedPost.findMany({
        where: { userId },
        include: {
          post: {
            select: {
              id: true,
              text: true,
              images: true,
              vibeTag: true,
              type: true,
              audioUrl: true,
              likesCount: true,
              commentsCount: true,
              sharesCount: true,
              createdAt: true,
              closeFriendsOnly: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: pinnedPosts });
    }

    // Public: anyone can view pinned posts for a given userId
    const pinnedPosts = await db.pinnedPost.findMany({
      where: { userId: targetUserId },
      include: {
        post: {
          select: {
            id: true,
            text: true,
            images: true,
            vibeTag: true,
            type: true,
            audioUrl: true,
            likesCount: true,
            commentsCount: true,
            sharesCount: true,
            createdAt: true,
            closeFriendsOnly: true,
            author: {
              select: {
                id: true,
                name: true,
                handle: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: pinnedPosts });
  } catch (error) {
    console.error('List pinned posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pinned posts' },
      { status: 500 }
    );
  }
}

// POST /api/pinned-posts - Pin a post (max 3 pins per user)
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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      );
    }

    // Verify the post exists and belongs to the user
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only pin your own posts' },
        { status: 403 }
      );
    }

    // Check if already pinned
    const existingPin = await db.pinnedPost.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingPin) {
      return NextResponse.json(
        { success: false, error: 'Post is already pinned' },
        { status: 409 }
      );
    }

    // Check pin count limit (max 3)
    const pinCount = await db.pinnedPost.count({
      where: { userId },
    });

    if (pinCount >= 3) {
      return NextResponse.json(
        { success: false, error: 'Maximum of 3 pinned posts allowed. Unpin a post first.' },
        { status: 400 }
      );
    }

    const pinnedPost = await serializedTransaction(async (tx) => {
      return tx.pinnedPost.create({
        data: { userId, postId },
      });
    });

    return NextResponse.json({ success: true, data: pinnedPost }, { status: 201 });
  } catch (error) {
    console.error('Pin post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to pin post' },
      { status: 500 }
    );
  }
}

// DELETE /api/pinned-posts - Unpin a post
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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      );
    }

    const existingPin = await db.pinnedPost.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!existingPin) {
      return NextResponse.json(
        { success: false, error: 'Post is not pinned' },
        { status: 404 }
      );
    }

    await serializedTransaction(async (tx) => {
      await tx.pinnedPost.delete({ where: { id: existingPin.id } });
    });

    return NextResponse.json({ success: true, data: { unpinned: true } });
  } catch (error) {
    console.error('Unpin post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unpin post' },
      { status: 500 }
    );
  }
}
