import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/cron/publish-scheduled - Publish scheduled posts that are due
// Protected by admin API key (x-admin-key header must equal 'orra504')
export async function POST(req: NextRequest) {
  try {
    // Verify admin API key
    const adminKey = req.headers.get('x-admin-key');
    if (adminKey !== 'orra504') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: invalid admin key' },
        { status: 401 }
      );
    }

    // Find all scheduled posts that are due
    const duePosts = await db.scheduledPost.findMany({
      where: {
        isPublished: false,
        scheduledAt: {
          lte: new Date(),
        },
      },
    });

    let publishedCount = 0;

    for (const scheduledPost of duePosts) {
      try {
        await db.$transaction(async (tx) => {
          // Create the real Post record
          await tx.post.create({
            data: {
              text: scheduledPost.text,
              images: scheduledPost.images,
              vibeTag: scheduledPost.vibeTag,
              type: scheduledPost.type,
              authorId: scheduledPost.authorId,
              coAuthorId: scheduledPost.coAuthorId,
              closeFriendsOnly: scheduledPost.closeFriendsOnly,
            },
          });

          // Mark the scheduled post as published
          await tx.scheduledPost.update({
            where: { id: scheduledPost.id },
            data: { isPublished: true },
          });
        });

        // Award tokens for publishing (+3 ORRA + 5 XP like normal posts)
        await awardXPAndTokens(scheduledPost.authorId, 3, 5);

        publishedCount++;
      } catch (err) {
        console.error(`Failed to publish scheduled post ${scheduledPost.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        publishedCount,
        totalDue: duePosts.length,
        message: `Published ${publishedCount} of ${duePosts.length} scheduled posts`,
      },
    });
  } catch (error) {
    console.error('Publish scheduled posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish scheduled posts' },
      { status: 500 }
    );
  }
}
