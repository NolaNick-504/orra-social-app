import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId, requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

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
          thumbnail: stream.thumbnail,
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
      thumbnail: stream.thumbnail,
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

    const body = await request.json();
    const { title, category } = body;
    const streamTitle = title?.trim() || 'Live Now';

    // End any existing live stream for this user
    await db.reel.updateMany({
      where: { creatorId: auth.userId!, isLive: true },
      data: { isLive: false },
    });

    const stream = await db.reel.create({
      data: {
        title: streamTitle,
        thumbnail: '',
        videoUrl: '',
        category: category || 'Live',
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

    return NextResponse.json({ success: true, data: stream }, { status: 201 });
  } catch (error) {
    console.error('POST /api/livestreams error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start live stream' },
      { status: 500 }
    );
  }
}
