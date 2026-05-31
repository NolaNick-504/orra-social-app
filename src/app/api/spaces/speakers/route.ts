import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/spaces/speakers - Raise hand / become a speaker
// Body: { spaceId }
// A listener can raise their hand (isHandRaised = true) or be promoted to speaker by host
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { spaceId, userId: targetUserId } = body;

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

    // If targetUserId provided, host is promoting a listener to speaker
    if (targetUserId) {
      // Only the host can promote listeners
      if (space.hostId !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Only the host can promote listeners to speakers' },
          { status: 403 }
        );
      }

      // Check current speaker count
      const currentSpeakerCount = await db.spaceSpeaker.count({
        where: { spaceId },
      });

      if (currentSpeakerCount >= space.maxSpeakers) {
        return NextResponse.json(
          { success: false, error: 'Maximum number of speakers reached' },
          { status: 400 }
        );
      }

      // Find the listener to promote
      const listener = await db.spaceListener.findUnique({
        where: { spaceId_userId: { spaceId, userId: targetUserId } },
      });

      if (!listener) {
        return NextResponse.json(
          { success: false, error: 'User is not a listener in this space' },
          { status: 400 }
        );
      }

      // Promote: remove from listeners, add as speaker, update listener count
      const newSpeaker = await serializedTransaction(async (tx) => {
        await tx.spaceListener.delete({
          where: { id: listener.id },
        });

        await tx.space.update({
          where: { id: spaceId },
          data: { listenerCount: { decrement: 1 } },
        });

        const speaker = await tx.spaceSpeaker.create({
          data: {
            spaceId,
            userId: targetUserId,
            isMuted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                handle: true,
                avatar: true,
              },
            },
          },
        });

        return speaker;
      });

      return NextResponse.json({
        success: true,
        data: {
          spaceId,
          action: 'promoted_to_speaker',
          speaker: {
            id: newSpeaker.id,
            userId: newSpeaker.userId,
            isMuted: newSpeaker.isMuted,
            joinedAt: newSpeaker.joinedAt,
            user: newSpeaker.user,
          },
        },
      }, { status: 201 });
    }

    // No targetUserId — current user raises hand or self-promotes
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

    // Check if a listener
    const listener = await db.spaceListener.findUnique({
      where: { spaceId_userId: { spaceId, userId: auth.userId! } },
    });

    if (!listener) {
      return NextResponse.json(
        { success: false, error: 'You must be a listener in this space to raise your hand' },
        { status: 400 }
      );
    }

    // If user is the host, auto-promote to speaker
    if (space.hostId === auth.userId) {
      const currentSpeakerCount = await db.spaceSpeaker.count({
        where: { spaceId },
      });

      if (currentSpeakerCount >= space.maxSpeakers) {
        return NextResponse.json(
          { success: false, error: 'Maximum number of speakers reached' },
          { status: 400 }
        );
      }

      const newSpeaker = await serializedTransaction(async (tx) => {
        await tx.spaceListener.delete({
          where: { id: listener.id },
        });

        await tx.space.update({
          where: { id: spaceId },
          data: { listenerCount: { decrement: 1 } },
        });

        const speaker = await tx.spaceSpeaker.create({
          data: {
            spaceId,
            userId: auth.userId!,
            isMuted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                handle: true,
                avatar: true,
              },
            },
          },
        });

        return speaker;
      });

      return NextResponse.json({
        success: true,
        data: {
          spaceId,
          action: 'promoted_to_speaker',
          speaker: {
            id: newSpeaker.id,
            userId: newSpeaker.userId,
            isMuted: newSpeaker.isMuted,
            joinedAt: newSpeaker.joinedAt,
            user: newSpeaker.user,
          },
        },
      }, { status: 201 });
    }

    // Regular listener — raise hand
    await db.spaceListener.update({
      where: { id: listener.id },
      data: { isHandRaised: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        spaceId,
        action: 'hand_raised',
        message: 'Hand raised. The host can now promote you to speaker.',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Spaces Speakers POST');
  }
}

// PUT /api/spaces/speakers - Mute/unmute a speaker
// Body: { spaceId, userId? (defaults to self), isMuted }
// Only the host or the speaker themselves can toggle mute
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { spaceId, userId: targetUserId, isMuted } = body;

    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: 'spaceId is required' },
        { status: 400 }
      );
    }

    if (typeof isMuted !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isMuted must be a boolean' },
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

    const speakerUserId = targetUserId || auth.userId!;

    // Permission check: host can mute/unmute anyone, users can only mute/unmute themselves
    if (speakerUserId !== auth.userId && space.hostId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the host or the speaker themselves can toggle mute' },
        { status: 403 }
      );
    }

    // Find the speaker
    const speaker = await db.spaceSpeaker.findUnique({
      where: { spaceId_userId: { spaceId, userId: speakerUserId } },
    });

    if (!speaker) {
      return NextResponse.json(
        { success: false, error: 'User is not a speaker in this space' },
        { status: 404 }
      );
    }

    // Update mute status
    const updatedSpeaker = await db.spaceSpeaker.update({
      where: { id: speaker.id },
      data: { isMuted },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        spaceId,
        speaker: {
          id: updatedSpeaker.id,
          userId: updatedSpeaker.userId,
          isMuted: updatedSpeaker.isMuted,
          joinedAt: updatedSpeaker.joinedAt,
          user: updatedSpeaker.user,
        },
      },
    });
  } catch (error) {
    return handleApiError(error, 'Spaces Speakers PUT');
  }
}

// DELETE /api/spaces/speakers - Remove a speaker (host removes, or speaker steps down)
// Body: { spaceId, userId? (defaults to self) }
// Host can remove any speaker; a speaker can remove themselves (step down to listener)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { spaceId, userId: targetUserId } = body;

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

    const speakerUserId = targetUserId || auth.userId!;

    // Permission check: host can remove anyone, users can only remove themselves
    if (speakerUserId !== auth.userId && space.hostId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the host or the speaker themselves can remove a speaker' },
        { status: 403 }
      );
    }

    // Cannot remove the host as a speaker
    if (speakerUserId === space.hostId) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the host as a speaker. End the space instead.' },
        { status: 400 }
      );
    }

    // Find the speaker
    const speaker = await db.spaceSpeaker.findUnique({
      where: { spaceId_userId: { spaceId, userId: speakerUserId } },
    });

    if (!speaker) {
      return NextResponse.json(
        { success: false, error: 'User is not a speaker in this space' },
        { status: 404 }
      );
    }

    // Remove speaker and optionally add back as listener
    await serializedTransaction(async (tx) => {
      await tx.spaceSpeaker.delete({
        where: { id: speaker.id },
      });

      // Add back as a listener
      await tx.spaceListener.create({
        data: {
          spaceId,
          userId: speakerUserId,
          isHandRaised: false,
        },
      });

      await tx.space.update({
        where: { id: spaceId },
        data: { listenerCount: { increment: 1 } },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        spaceId,
        action: 'removed_speaker',
        message: 'Speaker has been moved to listener',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Spaces Speakers DELETE');
  }
}
