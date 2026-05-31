import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens } from '@/lib/db';
import { requireAuth, getAuthUserId, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/spaces - List active spaces with host info, speaker count, listener count
// Query params: category (optional), page (default 1), limit (default 20)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    const [spaces, total] = await Promise.all([
      db.space.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
            },
          },
          speakers: {
            select: {
              id: true,
              userId: true,
              isMuted: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              speakers: true,
              listeners: true,
            },
          },
        },
      }),
      db.space.count({ where }),
    ]);

    const spacesWithMeta = spaces.map((space) => ({
      id: space.id,
      title: space.title,
      description: space.description,
      category: space.category,
      coverImage: space.coverImage,
      isActive: space.isActive,
      isRecording: space.isRecording,
      maxSpeakers: space.maxSpeakers,
      listenerCount: space.listenerCount,
      hostId: space.hostId,
      host: space.host,
      speakers: space.speakers,
      speakerCount: space._count.speakers,
      totalListenerCount: space._count.listeners,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        spaces: spacesWithMeta,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(error, 'Spaces GET');
  }
}

// POST /api/spaces - Create a new space (requires auth, earns +2 ORRA)
// Body: { title, description?, category?, coverImage?, maxSpeakers? }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { title, description, category, coverImage, maxSpeakers } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['chill', 'music', 'debate', 'ama', 'gaming', 'creative', 'tech'];
    const spaceCategory = category || 'chill';
    if (!validCategories.includes(spaceCategory)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate maxSpeakers
    const spaceMaxSpeakers = maxSpeakers ?? 10;
    if (spaceMaxSpeakers < 1 || spaceMaxSpeakers > 50) {
      return NextResponse.json(
        { success: false, error: 'maxSpeakers must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Create space and add host as first speaker in a transaction
    const space = await db.$transaction(async (tx) => {
      const newSpace = await tx.space.create({
        data: {
          title: title.trim(),
          description: description || '',
          category: spaceCategory,
          coverImage: coverImage || '',
          maxSpeakers: spaceMaxSpeakers,
          hostId: auth.userId!,
          listenerCount: 0,
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
            },
          },
          speakers: {
            select: {
              id: true,
              userId: true,
              isMuted: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              speakers: true,
              listeners: true,
            },
          },
        },
      });

      // Auto-add host as first (unmuted) speaker
      await tx.spaceSpeaker.create({
        data: {
          spaceId: newSpace.id,
          userId: auth.userId!,
          isMuted: false,
        },
      });

      return newSpace;
    });

    // Award +2 ORRA tokens for creating a space
    const TOKEN_REWARD = 2;
    const XP_REWARD = 5;
    const rewardResult = await awardXPAndTokens(auth.userId!, TOKEN_REWARD, XP_REWARD);

    // Record token action for anti-farming tracking
    await db.tokenAction.create({
      data: {
        userId: auth.userId!,
        action: 'space_create',
        targetId: space.id,
        tokensEarned: TOKEN_REWARD,
        xpEarned: XP_REWARD,
      },
    });

    // Create notification about token reward
    await db.notification.create({
      data: {
        userId: auth.userId!,
        action: `You earned ${TOKEN_REWARD} ORRA tokens for starting a Space!`,
        type: 'token',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: space.id,
        title: space.title,
        description: space.description,
        category: space.category,
        coverImage: space.coverImage,
        isActive: space.isActive,
        isRecording: space.isRecording,
        maxSpeakers: space.maxSpeakers,
        listenerCount: space.listenerCount,
        hostId: space.hostId,
        host: space.host,
        speakers: space.speakers,
        speakerCount: space._count.speakers + 1, // +1 for host just added
        totalListenerCount: space._count.listeners,
        tokensEarned: TOKEN_REWARD,
        newTokenBalance: rewardResult.auraTokens,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Spaces POST');
  }
}
