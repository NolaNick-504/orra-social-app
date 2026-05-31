import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { getAuthUserId, requireAuth, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/subscriber-tiers - Get the current user's subscriber tier
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const tier = await db.subscriberTier.findUnique({
      where: { creatorId: userId },
    });

    if (!tier) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: tier });
  } catch (error) {
    return handleApiError(error, 'SubscriberTiers GET');
  }
}

// POST /api/subscriber-tiers - Create a subscriber tier
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { tierName, price, description, perks } = body;

    if (!tierName || !tierName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tier name is required' },
        { status: 400 }
      );
    }

    if (!price || price < 1) {
      return NextResponse.json(
        { success: false, error: 'Price must be at least 1 ORRA' },
        { status: 400 }
      );
    }

    // Check if user already has a tier
    const existing = await db.subscriberTier.findUnique({
      where: { creatorId: auth.userId! },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You already have a subscriber tier. Use PUT to update it.' },
        { status: 409 }
      );
    }

    const tier = await db.subscriberTier.create({
      data: {
        creatorId: auth.userId!,
        tierName: tierName.trim(),
        price: Math.max(1, price),
        description: description || '',
        perks: perks || '[]',
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: tier }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'SubscriberTiers POST');
  }
}

// PUT /api/subscriber-tiers - Update the current user's subscriber tier
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { tierName, price, description, perks, isActive } = body;

    const existing = await db.subscriberTier.findUnique({
      where: { creatorId: auth.userId! },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'No subscriber tier found. Use POST to create one.' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (tierName !== undefined) updateData.tierName = tierName.trim();
    if (price !== undefined) updateData.price = Math.max(1, price);
    if (description !== undefined) updateData.description = description;
    if (perks !== undefined) updateData.perks = perks;
    if (isActive !== undefined) updateData.isActive = isActive;

    const tier = await db.subscriberTier.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: tier });
  } catch (error) {
    return handleApiError(error, 'SubscriberTiers PUT');
  }
}
