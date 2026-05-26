import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens } from '@/lib/db';
import { requireAuth, getAuthUserId } from '@/lib/auth-helpers';

// POST /api/connections - Send a connection request
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot connect with yourself' },
        { status: 400 }
      );
    }

    // Check target user exists
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if a follow/connection already exists
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.userId!,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      if (existingFollow.status === 'accepted') {
        return NextResponse.json(
          { success: false, error: 'Already connected with this user' },
          { status: 409 }
        );
      }
      if (existingFollow.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'Connection request already sent' },
          { status: 409 }
        );
      }
      if (existingFollow.status === 'rejected') {
        // Re-send: update from rejected to pending
        await db.follow.update({
          where: { id: existingFollow.id },
          data: { status: 'pending' },
        });

        // Create notification for the target user
        await db.notification.create({
          data: {
            userId,
            triggeredByUserId: auth.userId,
            action: 'sent you a connection request',
            type: 'follow',
          },
        });

        return NextResponse.json({
          success: true,
          data: { status: 'pending', message: 'Connection request re-sent' },
        });
      }
    }

    // Create a pending connection request
    await db.follow.create({
      data: {
        followerId: auth.userId!,
        followingId: userId,
        status: 'pending',
      },
    });

    // Create notification for the target user
    await db.notification.create({
      data: {
        userId,
        triggeredByUserId: auth.userId,
        action: 'sent you a connection request',
        type: 'follow',
      },
    });

    return NextResponse.json({
      success: true,
      data: { status: 'pending', message: 'Connection request sent' },
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send connection request' },
      { status: 500 }
    );
  }
}

// GET /api/connections - List connections for current user
// ?type=pending_received|pending_sent|accepted|all (default: all)
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const userSelect = {
      select: { id: true, name: true, handle: true, avatar: true, verified: true },
    };

    if (type === 'pending_received') {
      // Connection requests I've received (others want to follow me)
      const follows = await db.follow.findMany({
        where: { followingId: userId, status: 'pending' },
        include: { follower: userSelect },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await db.follow.count({
        where: { followingId: userId, status: 'pending' },
      });

      return NextResponse.json({
        success: true,
        data: follows.map((f) => ({ ...f.follower, requestId: f.id, requestedAt: f.createdAt })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (type === 'pending_sent') {
      // Connection requests I've sent (I want to follow others)
      const follows = await db.follow.findMany({
        where: { followerId: userId, status: 'pending' },
        include: { following: userSelect },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await db.follow.count({
        where: { followerId: userId, status: 'pending' },
      });

      return NextResponse.json({
        success: true,
        data: follows.map((f) => ({ ...f.following, requestId: f.id, requestedAt: f.createdAt })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (type === 'accepted') {
      // Accepted connections (mutual follows)
      const [following, followers] = await Promise.all([
        db.follow.findMany({
          where: { followerId: userId, status: 'accepted' },
          include: { following: userSelect },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.follow.findMany({
          where: { followingId: userId, status: 'accepted' },
          include: { follower: userSelect },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          following: following.map((f) => f.following),
          followers: followers.map((f) => f.follower),
        },
      });
    }

    // type === 'all' — return everything
    const [pendingReceived, pendingSent, following, followers, counts] = await Promise.all([
      db.follow.findMany({
        where: { followingId: userId, status: 'pending' },
        include: { follower: userSelect },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.follow.findMany({
        where: { followerId: userId, status: 'pending' },
        include: { following: userSelect },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.follow.findMany({
        where: { followerId: userId, status: 'accepted' },
        include: { following: userSelect },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.follow.findMany({
        where: { followingId: userId, status: 'accepted' },
        include: { follower: userSelect },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      {
        pendingReceived: await db.follow.count({ where: { followingId: userId, status: 'pending' } }),
        pendingSent: await db.follow.count({ where: { followerId: userId, status: 'pending' } }),
        following: await db.follow.count({ where: { followerId: userId, status: 'accepted' } }),
        followers: await db.follow.count({ where: { followingId: userId, status: 'accepted' } }),
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pendingReceived: pendingReceived.map((f) => ({ ...f.follower, requestId: f.id, requestedAt: f.createdAt })),
        pendingSent: pendingSent.map((f) => ({ ...f.following, requestId: f.id, requestedAt: f.createdAt })),
        following: following.map((f) => f.following),
        followers: followers.map((f) => f.follower),
        counts,
      },
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// PATCH /api/connections - Accept or reject a connection request
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: 'requestId and action (accept/reject) are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Find the pending connection request
    const followRequest = await db.follow.findUnique({
      where: { id: requestId },
      include: {
        follower: { select: { id: true, name: true } },
        following: { select: { id: true, name: true } },
      },
    });

    if (!followRequest) {
      return NextResponse.json(
        { success: false, error: 'Connection request not found' },
        { status: 404 }
      );
    }

    if (followRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Request is already ${followRequest.status}` },
        { status: 409 }
      );
    }

    // Only the person being followed (followingId) can accept/reject
    if (followRequest.followingId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only accept/reject requests sent to you' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Accept: update status to "accepted"
      await db.follow.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });

      // Award tokens + XP to the requester (same as direct follow)
      const existingAction = await db.tokenAction.findUnique({
        where: {
          userId_action_targetId: {
            userId: followRequest.followerId,
            action: 'follow',
            targetId: auth.userId!,
          },
        },
      });

      if (!existingAction) {
        await db.tokenAction.create({
          data: {
            userId: followRequest.followerId,
            action: 'follow',
            targetId: auth.userId!,
            tokensEarned: 2,
            xpEarned: 5,
          },
        });

        await awardXPAndTokens(followRequest.followerId, 2, 5);
      }

      // Create notification for the requester that their request was accepted
      await db.notification.create({
        data: {
          userId: followRequest.followerId,
          triggeredByUserId: auth.userId,
          action: 'accepted your connection request',
          type: 'follow',
        },
      });

      return NextResponse.json({
        success: true,
        data: { status: 'accepted', message: `Connected with ${followRequest.follower.name}` },
      });
    }

    // action === 'reject'
    await db.follow.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    return NextResponse.json({
      success: true,
      data: { status: 'rejected', message: 'Connection request rejected' },
    });
  } catch (error) {
    console.error('Error updating connection request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update connection request' },
      { status: 500 }
    );
  }
}
