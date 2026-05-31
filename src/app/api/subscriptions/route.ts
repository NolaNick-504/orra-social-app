import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/subscriptions - List user's subscriptions (as subscriber and as creator)
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Subscriptions where the user is the subscriber
    const subscribedTo = await db.subscription.findMany({
      where: { subscriberId: userId, isActive: true },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
        tier: {
          select: {
            id: true,
            tierName: true,
            price: true,
            perks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Subscriptions where the user is the creator (with subscriber count)
    const subscribers = await db.subscription.findMany({
      where: { creatorId: userId, isActive: true },
      include: {
        subscriber: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
        tier: {
          select: {
            id: true,
            tierName: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Total active subscriber count for the creator
    const subscriberCount = await db.subscription.count({
      where: { creatorId: userId, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscribedTo,
        subscribers,
        subscriberCount,
      },
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Subscribe to a creator
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
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (creatorId === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot subscribe to yourself' },
        { status: 400 }
      );
    }

    // Verify the creator exists and has a tier
    const creator = await db.user.findUnique({
      where: { id: creatorId },
      include: { subscriberTier: true },
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    if (!creator.subscriberTier || !creator.subscriberTier.isActive) {
      return NextResponse.json(
        { success: false, error: 'This creator does not have an active subscription tier' },
        { status: 400 }
      );
    }

    const tier = creator.subscriberTier;
    const price = tier.price;

    // Check if user has enough tokens
    const subscriber = await db.user.findUnique({
      where: { id: userId },
      select: { auraTokens: true },
    });

    if (!subscriber || subscriber.auraTokens < price) {
      return NextResponse.json(
        { success: false, error: `Insufficient ORRA tokens. Required: ${price}, Available: ${subscriber?.auraTokens ?? 0}` },
        { status: 400 }
      );
    }

    // Check for existing active subscription
    const existing = await db.subscription.findUnique({
      where: {
        subscriberId_creatorId: { subscriberId: userId, creatorId },
      },
    });

    if (existing && existing.isActive) {
      return NextResponse.json(
        { success: false, error: 'Already subscribed to this creator' },
        { status: 409 }
      );
    }

    // Create subscription with 30-day expiry, deduct tokens
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const subscription = await serializedTransaction(async (tx) => {
      // Deduct tokens from subscriber
      await tx.user.update({
        where: { id: userId },
        data: { auraTokens: { decrement: price } },
      });

      // Credit tokens to creator
      await tx.user.update({
        where: { id: creatorId },
        data: { auraTokens: { increment: price } },
      });

      // Create or reactivate subscription
      if (existing) {
        return tx.subscription.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            tierId: tier.id,
            expiresAt,
          },
        });
      }

      return tx.subscription.create({
        data: {
          subscriberId: userId,
          creatorId,
          tierId: tier.id,
          expiresAt,
          isActive: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: subscription }, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
