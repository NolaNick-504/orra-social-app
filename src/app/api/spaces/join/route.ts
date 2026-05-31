import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens, serializedTransaction } from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/spaces/join - Join a space as a listener (requires auth, earns +1 ORRA)
// Body: { spaceId }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { spaceId } = body;

    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: 'spaceId is required' },
        { status: 400 }
      );
    }

    // Check if space exists and is active
    const space = await db.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    if (!space.isActive) {
      return NextResponse.json(
        { success: false, error: 'Space is no longer active' },
        { status: 400 }
      );
    }

    // Check if already a speaker
    const existingSpeaker = await db.spaceSpeaker.findUnique({
      where: { spaceId_userId: { spaceId, userId: auth.userId! } },
    });

    if (existingSpeaker) {
      return NextResponse.json(
        { success: false, error: 'You are already a speaker in this space' },
        { status: 400 }
      );
    }

    // Check if already a listener
    const existingListener = await db.spaceListener.findUnique({
      where: { spaceId_userId: { spaceId, userId: auth.userId! } },
    });

    if (existingListener) {
      return NextResponse.json(
        { success: false, error: 'You are already a listener in this space' },
        { status: 400 }
      );
    }

    // Join as listener and update listener count
    await serializedTransaction(async (tx) => {
      await tx.spaceListener.create({
        data: {
          spaceId,
          userId: auth.userId!,
          isHandRaised: false,
        },
      });

      await tx.space.update({
        where: { id: spaceId },
        data: { listenerCount: { increment: 1 } },
      });
    });

    // Award +1 ORRA token for joining a space (anti-farming: only once per space)
    const existingAction = await db.tokenAction.findUnique({
      where: { userId_action_targetId: { userId: auth.userId!, action: 'space_join', targetId: spaceId } },
    });

    let tokensAwarded = 0;
    let xpAwarded = 0;
    let newTokenBalance: number | null = null;

    if (!existingAction) {
      tokensAwarded = 1;
      xpAwarded = 2;

      await db.tokenAction.create({
        data: {
          userId: auth.userId!,
          action: 'space_join',
          targetId: spaceId,
          tokensEarned: tokensAwarded,
          xpEarned: xpAwarded,
        },
      });
      const rewardResult = await awardXPAndTokens(auth.userId!, tokensAwarded, xpAwarded);
      newTokenBalance = rewardResult.auraTokens;
    }

    return NextResponse.json({
      success: true,
      data: {
        spaceId,
        role: 'listener',
        tokensAwarded,
        xpAwarded,
        newTokenBalance,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Spaces Join POST');
  }
}

// DELETE /api/spaces/join - Leave a space (as listener or speaker)
// Body: { spaceId }
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { spaceId } = body;

    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: 'spaceId is required' },
        { status: 400 }
      );
    }

    // Check if space exists
    const space = await db.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    // If the user is the host, end the space
    if (space.hostId === auth.userId) {
      await serializedTransaction(async (tx) => {
        await tx.space.update({
          where: { id: spaceId },
          data: { isActive: false },
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          spaceId,
          action: 'space_ended',
          message: 'Space has been ended by the host',
        },
      });
    }

    // Check if user is a listener
    const listener = await db.spaceListener.findUnique({
      where: { spaceId_userId: { spaceId, userId: auth.userId! } },
    });

    if (listener) {
      await serializedTransaction(async (tx) => {
        await tx.spaceListener.delete({
          where: { id: listener.id },
        });

        await tx.space.update({
          where: { id: spaceId },
          data: { listenerCount: { decrement: 1 } },
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          spaceId,
          action: 'left_listener',
          message: 'You have left the space as a listener',
        },
      });
    }

    // Check if user is a speaker
    const speaker = await db.spaceSpeaker.findUnique({
      where: { spaceId_userId: { spaceId, userId: auth.userId! } },
    });

    if (speaker) {
      await serializedTransaction(async (tx) => {
        await tx.spaceSpeaker.delete({
          where: { id: speaker.id },
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          spaceId,
          action: 'left_speaker',
          message: 'You have left the space as a speaker',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'You are not in this space' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, 'Spaces Join DELETE');
  }
}
