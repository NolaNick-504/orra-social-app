import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId, requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { generateLiveCover, getFallbackCover } from '@/lib/live-cover';

export const dynamic = 'force-dynamic';

// GET /api/livestreams — Get a single live stream by ID or all live streams
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('id');

    if (streamId) {
      // Fetch single stream
      const stream = await db.reel.findUnique({
        where: { id: streamId },
        include: {
          creator: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
        },
      });

      if (!stream) {
        return NextResponse.json(
          { success: false, error: 'Stream not found' },
          { status: 404 }
        );
      }

      // Check if current user is the host
      const isHost = userId === stream.creatorId;

      return NextResponse.json({
        success: true,
        data: {
          id: stream.id,
          title: stream.title,
          thumbnail: (!stream.thumbnail || stream.thumbnail.trim() === '') ? getFallbackCover(stream.category) : stream.thumbnail,
          videoUrl: stream.videoUrl,
          views: stream.views,
          likesCount: stream.likesCount,
          commentsCount: stream.commentsCount,
          category: stream.category,
          isLive: stream.isLive,
          createdAt: stream.createdAt,
          creator: stream.creator,
          isHost,
          viewerCount: Math.max(stream.views, Math.floor(Math.random() * 500) + 23), // Simulated viewer count
        },
      });
    }

    // Fetch all live streams
    const liveStreams = await db.reel.findMany({
      where: { isLive: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        creator: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    const data = liveStreams.map((stream) => ({
      id: stream.id,
      title: stream.title,
      thumbnail: (!stream.thumbnail || stream.thumbnail.trim() === '') ? getFallbackCover(stream.category) : stream.thumbnail,
      views: stream.views,
      likesCount: stream.likesCount,
      commentsCount: stream.commentsCount,
      category: stream.category,
      isLive: stream.isLive,
      createdAt: stream.createdAt,
      creator: stream.creator,
      viewerCount: Math.min(Math.max(stream.views, Math.floor(Math.random() * 500) + 23), 9999),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/livestreams error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/livestreams — Start a new live stream
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { title, category } = body;
    const streamTitle = title?.trim() || 'Live Now';

    // End any existing live stream for this user
    await db.reel.updateMany({
      where: { creatorId: auth.userId!, isLive: true },
      data: { isLive: false },
    });

    // Use fallback cover immediately — don't block on AI generation
    const streamCategory = category || 'Live';
    const thumbnailUrl = getFallbackCover(streamCategory);

    const stream = await db.reel.create({
      data: {
        title: streamTitle,
        thumbnail: thumbnailUrl,
        videoUrl: '',
        category: streamCategory,
        song: '',
        isLive: true,
        creatorId: auth.userId!,
      },
      include: {
        creator: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    // Generate AI cover in the background (non-blocking) — update the reel when done
    const reelId = stream.id;
    generateLiveCover(streamTitle, streamCategory)
      .then((aiCoverUrl) => {
        if (aiCoverUrl && aiCoverUrl !== thumbnailUrl) {
          db.reel.update({ where: { id: reelId }, data: { thumbnail: aiCoverUrl } })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return NextResponse.json({ success: true, data: stream }, { status: 201 });
  } catch (error) {
    console.error('POST /api/livestreams error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start live stream' },
      { status: 500 }
    );
  }
}

// PATCH /api/livestreams — End a live stream (set isLive to false)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Stream ID is required' },
        { status: 400 }
      );
    }

    // Verify the stream belongs to the user
    const stream = await db.reel.findUnique({ where: { id } });

    if (!stream || stream.creatorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Stream not found or not owned by you' },
        { status: 404 }
      );
    }

    // End the live stream
    await db.reel.update({
      where: { id },
      data: { isLive: false },
    });

    return NextResponse.json({ success: true, message: 'Live stream ended' });
  } catch (error) {
    console.error('PATCH /api/livestreams error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end live stream' },
      { status: 500 }
    );
  }
}
