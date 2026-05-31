import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens, serializedTransaction } from '@/lib/db';
import { requireAuth, getAuthUserId, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/events - List events with optional category filter
// Query params: category (optional), page (optional, default 1), limit (optional, default 20)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const userId = await getAuthUserId();

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    // Fetch events with creator info and RSVP count
    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
            },
          },
          _count: {
            select: { rsvps: true },
          },
        },
      }),
      db.event.count({ where }),
    ]);

    // If user is authenticated, check which events they've RSVPed to
    let userRsvpMap: Map<string, string> = new Map();
    if (userId) {
      const eventIds = events.map((e) => e.id);
      if (eventIds.length > 0) {
        const userRsvps = await db.eventRSVP.findMany({
          where: {
            userId,
            eventId: { in: eventIds },
          },
          select: {
            eventId: true,
            status: true,
          },
        });
        userRsvpMap = new Map(userRsvps.map((r) => [r.eventId, r.status]));
      }
    }

    const eventsWithMeta = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      coverImage: event.coverImage,
      location: event.location,
      isVirtual: event.isVirtual,
      meetLink: event.meetLink,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      maxAttendees: event.maxAttendees,
      tokenCost: event.tokenCost,
      isActive: event.isActive,
      creatorId: event.creatorId,
      creator: event.creator,
      rsvpCount: event._count.rsvps,
      userRsvpStatus: userRsvpMap.get(event.id) || null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        events: eventsWithMeta,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(error, 'Events GET');
  }
}

// POST /api/events - Create a new event (requires auth, earns +3 ORRA tokens)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const {
      title,
      description,
      coverImage,
      location,
      isVirtual,
      meetLink,
      category,
      startDate,
      endDate,
      maxAttendees,
      tokenCost,
    } = body;

    // Validate required fields
    if (!title || !startDate) {
      return NextResponse.json(
        { success: false, error: 'title and startDate are required' },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Validate startDate is a valid date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid startDate' },
        { status: 400 }
      );
    }

    // Validate endDate if provided
    let parsedEndDate: Date | null = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid endDate' },
          { status: 400 }
        );
      }
      if (parsedEndDate <= parsedStartDate) {
        return NextResponse.json(
          { success: false, error: 'endDate must be after startDate' },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    const validCategories = ['social', 'music', 'art', 'tech', 'fitness', 'party', 'meetup', 'other'];
    const eventCategory = category || 'social';
    if (!validCategories.includes(eventCategory)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate tokenCost is non-negative
    const eventTokenCost = tokenCost ?? 0;
    if (eventTokenCost < 0) {
      return NextResponse.json(
        { success: false, error: 'tokenCost must be non-negative' },
        { status: 400 }
      );
    }

    // Validate maxAttendees is non-negative
    const eventMaxAttendees = maxAttendees ?? 0;
    if (eventMaxAttendees < 0) {
      return NextResponse.json(
        { success: false, error: 'maxAttendees must be non-negative' },
        { status: 400 }
      );
    }

    // Create the event
    const event = await db.event.create({
      data: {
        title,
        description: description || '',
        coverImage: coverImage || '',
        location: location || '',
        isVirtual: isVirtual ?? false,
        meetLink: meetLink || '',
        category: eventCategory,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        maxAttendees: eventMaxAttendees,
        tokenCost: eventTokenCost,
        creatorId: auth.userId!,
      },
      include: {
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

    // Award +3 ORRA tokens for creating an event (with XP)
    const TOKEN_REWARD = 3;
    const XP_REWARD = 5;
    const rewardResult = await awardXPAndTokens(auth.userId!, TOKEN_REWARD, XP_REWARD);

    // Record token action for anti-farming tracking
    await db.tokenAction.create({
      data: {
        userId: auth.userId!,
        action: 'event_create',
        targetId: event.id,
        tokensEarned: TOKEN_REWARD,
        xpEarned: XP_REWARD,
      },
    });

    // Create notification about token reward
    await db.notification.create({
      data: {
        userId: auth.userId!,
        action: `You earned ${TOKEN_REWARD} ORRA tokens for creating an event!`,
        type: 'token',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        rsvpCount: 0,
        userRsvpStatus: null,
        tokensEarned: TOKEN_REWARD,
        newTokenBalance: rewardResult.auraTokens,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Events POST');
  }
}

// PUT /api/events - Update an event (requires auth, only creator can update)
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const {
      eventId,
      title,
      description,
      coverImage,
      location,
      isVirtual,
      meetLink,
      category,
      startDate,
      endDate,
      maxAttendees,
      tokenCost,
      isActive,
    } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Check that the event exists and the user is the creator
    const existingEvent = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.creatorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the event creator can update this event' },
        { status: 403 }
      );
    }

    // Build update data from provided fields
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      if (!title || title.length > 200) {
        return NextResponse.json(
          { success: false, error: 'Title must be 1-200 characters' },
          { status: 400 }
        );
      }
      updateData.title = title;
    }
    if (description !== undefined) updateData.description = description;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (location !== undefined) updateData.location = location;
    if (isVirtual !== undefined) updateData.isVirtual = isVirtual;
    if (meetLink !== undefined) updateData.meetLink = meetLink;
    if (category !== undefined) {
      const validCategories = ['social', 'music', 'art', 'tech', 'fitness', 'party', 'meetup', 'other'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.category = category;
    }
    if (startDate !== undefined) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid startDate' },
          { status: 400 }
        );
      }
      updateData.startDate = parsedStartDate;
    }
    if (endDate !== undefined) {
      if (endDate === null || endDate === '') {
        updateData.endDate = null;
      } else {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid endDate' },
            { status: 400 }
          );
        }
        updateData.endDate = parsedEndDate;
      }
    }
    if (maxAttendees !== undefined) {
      if (maxAttendees < 0) {
        return NextResponse.json(
          { success: false, error: 'maxAttendees must be non-negative' },
          { status: 400 }
        );
      }
      updateData.maxAttendees = maxAttendees;
    }
    if (tokenCost !== undefined) {
      if (tokenCost < 0) {
        return NextResponse.json(
          { success: false, error: 'tokenCost must be non-negative' },
          { status: 400 }
        );
      }
      updateData.tokenCost = tokenCost;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        coverImage: updatedEvent.coverImage,
        location: updatedEvent.location,
        isVirtual: updatedEvent.isVirtual,
        meetLink: updatedEvent.meetLink,
        category: updatedEvent.category,
        startDate: updatedEvent.startDate,
        endDate: updatedEvent.endDate,
        maxAttendees: updatedEvent.maxAttendees,
        tokenCost: updatedEvent.tokenCost,
        isActive: updatedEvent.isActive,
        creatorId: updatedEvent.creatorId,
        creator: updatedEvent.creator,
        rsvpCount: updatedEvent._count.rsvps,
        createdAt: updatedEvent.createdAt,
        updatedAt: updatedEvent.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Events PUT');
  }
}

// DELETE /api/events - Cancel (soft-delete) an event (requires auth, only creator can cancel)
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

    // Check that the event exists and the user is the creator
    const existingEvent = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.creatorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the event creator can cancel this event' },
        { status: 403 }
      );
    }

    if (!existingEvent.isActive) {
      return NextResponse.json(
        { success: false, error: 'Event is already cancelled' },
        { status: 400 }
      );
    }

    // Soft delete: set isActive to false
    await db.event.update({
      where: { id: eventId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: eventId,
        isActive: false,
        message: 'Event has been cancelled',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Events DELETE');
  }
}
