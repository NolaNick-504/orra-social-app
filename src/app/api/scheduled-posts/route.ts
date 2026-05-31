import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/scheduled-posts - List user's scheduled posts (only unpublished)
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const scheduledPosts = await db.scheduledPost.findMany({
      where: {
        authorId: userId,
        isPublished: false,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: scheduledPosts });
  } catch (error) {
    console.error('List scheduled posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

// POST /api/scheduled-posts - Create a scheduled post
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
    const { text, scheduledAt, images, vibeTag, type, closeFriendsOnly, coAuthorId } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Post text is required' },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { success: false, error: 'scheduledAt is required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduledAt date' },
        { status: 400 }
      );
    }

    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'scheduledAt must be in the future' },
        { status: 400 }
      );
    }

    const scheduledPost = await serializedTransaction(async (tx) => {
      return tx.scheduledPost.create({
        data: {
          text: text.trim(),
          images: images || '[]',
          vibeTag: vibeTag || 'hyped',
          type: type || 'text',
          closeFriendsOnly: closeFriendsOnly || false,
          coAuthorId: coAuthorId || null,
          authorId: userId,
          scheduledAt: scheduledDate,
          isPublished: false,
        },
      });
    });

    return NextResponse.json({ success: true, data: scheduledPost }, { status: 201 });
  } catch (error) {
    console.error('Create scheduled post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create scheduled post' },
      { status: 500 }
    );
  }
}

// DELETE /api/scheduled-posts - Cancel a scheduled post
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

    const scheduledPost = await db.scheduledPost.findUnique({
      where: { id: postId },
    });

    if (!scheduledPost || scheduledPost.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    if (scheduledPost.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel an already published post' },
        { status: 400 }
      );
    }

    await serializedTransaction(async (tx) => {
      await tx.scheduledPost.delete({ where: { id: postId } });
    });

    return NextResponse.json({ success: true, data: { cancelled: true } });
  } catch (error) {
    console.error('Cancel scheduled post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel scheduled post' },
      { status: 500 }
    );
  }
}
