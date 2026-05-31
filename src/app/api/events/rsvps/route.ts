import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens, serializedTransaction } from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/events/rsvps - RSVP to an event (requires auth, earns +2 ORRA tokens)
// Body: { eventId: string, status: "going" | "interested" | "maybe" }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { eventId, status } = body;

    // Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['going', 'interested', 'maybe'];
    const rsvpStatus = status || 'going';
    if (!validStatuses.includes(rsvpStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check that the event exists and is active
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { rsvps: true } },
        creator: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.isActive) {
      return NextResponse.json(
        { success: false, error: 'This event is no longer active' },
        { status: 400 }
      );
    }

    // Check if the event has already ended
    if (event.startDate && new Date(event.startDate) < new Date() && !event.endDate) {
      return NextResponse.json(
        { success: false, error: 'This event has already started' },
        { status: 400 }
      );
    }
    if (event.endDate && new Date(event.endDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This event has already ended' },
        { status: 400 }
      );
    }

    // Check if user already RSVPed
    const existingRsvp = await db.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: auth.userId!,
        },
      },
    });

    if (existingRsvp) {
      // If user already RSVPed with the same status, return existing
      if (existingRsvp.status === rsvpStatus) {
        return NextResponse.json({
          success: true,
          data: {
            id: existingRsvp.id,
            eventId: existingRsvp.eventId,
            userId: existingRsvp.userId,
            status: existingRsvp.status,
            createdAt: existingRsvp.createdAt,
            message: 'Already RSVPed with this status',
          },
        });
      }

      // Otherwise, update the RSVP status (no additional tokens for updating)
      const updatedRsvp = await db.eventRSVP.update({
        where: { id: existingRsvp.id },
        data: { status: rsvpStatus },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedRsvp.id,
          eventId: updatedRsvp.eventId,
          userId: updatedRsvp.userId,
          status: updatedRsvp.status,
          createdAt: updatedRsvp.createdAt,
          message: `RSVP updated to ${rsvpStatus}`,
        },
      });
    }

    // Check maxAttendees capacity
    if (event.maxAttendees > 0) {
      const goingCount = await db.eventRSVP.count({
        where: {
          eventId,
          status: 'going',
        },
      });
      if (rsvpStatus === 'going' && goingCount >= event.maxAttendees) {
        return NextResponse.json(
          { success: false, error: 'This event has reached its maximum attendee capacity' },
          { status: 400 }
        );
      }
    }

    // Check if event requires tokens and user has enough
    if (event.tokenCost > 0) {
      try {
        await serializedTransaction(async (tx) => {
          const currentUser = await tx.user.findUnique({
            where: { id: auth.userId! },
            select: { auraTokens: true },
          });
          if (!currentUser || currentUser.auraTokens < event.tokenCost) {
            throw new Error('INSUFFICIENT_TOKENS');
          }
          await tx.user.update({
            where: { id: auth.userId! },
            data: { auraTokens: { decrement: event.tokenCost } },
          });
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'INSUFFICIENT_TOKENS') {
          return NextResponse.json(
            { success: false, error: `Insufficient ORRA tokens. This event costs ${event.tokenCost} tokens to attend.` },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // Create the RSVP
    const rsvp = await db.eventRSVP.create({
      data: {
        eventId,
        userId: auth.userId!,
        status: rsvpStatus,
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

    // Award +2 ORRA tokens for RSVPing (with XP)
    const TOKEN_REWARD = 2;
    const XP_REWARD = 3;
    const rewardResult = await awardXPAndTokens(auth.userId!, TOKEN_REWARD, XP_REWARD);

    // Record token action for anti-farming tracking
    await db.tokenAction.create({
      data: {
        userId: auth.userId!,
        action: 'event_rsvp',
        targetId: rsvp.id,
        tokensEarned: TOKEN_REWARD,
        xpEarned: XP_REWARD,
      },
    });

    // Notify the event creator
    if (event.creatorId !== auth.userId!) {
      const rsvpUser = await db.user.findUnique({
        where: { id: auth.userId! },
        select: { name: true, handle: true },
      });

      await db.notification.create({
        data: {
          userId: event.creatorId,
          action: `${rsvpUser?.name || 'Someone'} is ${rsvpStatus} to your event "${event.title}"`,
          type: 'hub', // using hub type for event-related notifications
          triggeredByUserId: auth.userId!,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rsvp.id,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
        user: rsvp.user,
        createdAt: rsvp.createdAt,
        tokensEarned: TOKEN_REWARD,
        tokenCostPaid: event.tokenCost,
        newTokenBalance: rewardResult.auraTokens,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Event RSVPs POST');
  }
}

// DELETE /api/events/rsvps - Cancel an RSVP (requires auth)
// Body: { eventId: string }
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Find the existing RSVP
    const existingRsvp = await db.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: auth.userId!,
        },
      },
    });

    if (!existingRsvp) {
      return NextResponse.json(
        { success: false, error: 'No RSVP found for this event' },
        { status: 404 }
      );
    }

    // Check if the event had a token cost — refund if applicable
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { tokenCost: true, title: true, creatorId: true },
    });

    // Wrap RSVP deletion and token refund in a transaction to prevent race condition
    await db.$transaction(async (tx) => {
      await tx.eventRSVP.delete({
        where: { id: existingRsvp.id },
      });

      if (event && event.tokenCost > 0) {
        // Refund the token cost
        await tx.user.update({
          where: { id: auth.userId! },
          data: { auraTokens: { increment: event.tokenCost } },
        });

        // Record refund in token actions
        await tx.tokenAction.create({
          data: {
            userId: auth.userId!,
            action: 'event_rsvp_cancel',
            targetId: existingRsvp.id,
            tokensEarned: -event.tokenCost, // negative to indicate refund reversal
            xpEarned: 0,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: existingRsvp.id,
        eventId: existingRsvp.eventId,
        userId: existingRsvp.userId,
        previousStatus: existingRsvp.status,
        tokenRefund: event?.tokenCost || 0,
        message: 'RSVP cancelled successfully',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Event RSVPs DELETE');
  }
}
