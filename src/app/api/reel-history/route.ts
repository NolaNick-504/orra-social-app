import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/reel-history — Returns the current user's last 20 watched reels
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const history = await db.reelHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take: 20,
      include: {
        reel: {
          include: {
            creator: {
              select: { id: true, name: true, handle: true, avatar: true, verified: true },
            },
          },
        },
      },
    });

    const data = history.map((entry) => ({
      id: entry.id,
      reelId: entry.reelId,
      watchProgress: entry.watchProgress,
      watchedAt: entry.watchedAt,
      reel: {
        id: entry.reel.id,
        title: entry.reel.title,
        thumbnail: entry.reel.thumbnail,
        videoUrl: entry.reel.videoUrl,
        views: entry.reel.views,
        likesCount: entry.reel.likesCount,
        commentsCount: entry.reel.commentsCount,
        category: entry.reel.category,
        song: entry.reel.song,
        creator: entry.reel.creator,
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/reel-history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reel-history — Record a reel view
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
    const { reelId, watchProgress } = body;

    if (!reelId) {
      return NextResponse.json(
        { success: false, error: 'reelId is required' },
        { status: 400 }
      );
    }

    // Verify reel exists
    const reel = await db.reel.findUnique({ where: { id: reelId } });
    if (!reel) {
      return NextResponse.json(
        { success: false, error: 'Reel not found' },
        { status: 404 }
      );
    }

    const progress = typeof watchProgress === 'number' ? Math.min(Math.max(watchProgress, 0), 100) : 0;

    // Upsert: create or update the history entry
    await db.reelHistory.upsert({
      where: {
        userId_reelId: { userId, reelId },
      },
      update: {
        watchProgress: progress,
        watchedAt: new Date(),
      },
      create: {
        userId,
        reelId,
        watchProgress: progress,
      },
    });

    // If user has > 20 entries, delete the oldest
    const count = await db.reelHistory.count({ where: { userId } });
    if (count > 20) {
      const oldest = await db.reelHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'asc' },
        take: count - 20,
        select: { id: true },
      });
      await db.reelHistory.deleteMany({
        where: { id: { in: oldest.map((e) => e.id) } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/reel-history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
