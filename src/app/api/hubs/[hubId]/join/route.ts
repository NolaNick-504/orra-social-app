import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { hubId } = await params;

    // Check if hub exists
    const hub = await db.hub.findUnique({ where: { id: hubId } });
    if (!hub) {
      return NextResponse.json({ success: false, error: 'Hub not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.hubMember.findUnique({
      where: { userId_hubId: { userId, hubId } },
    });

    if (existing) {
      // Leave the hub
      await db.hubMember.delete({ where: { id: existing.id } });
      await db.hub.update({
        where: { id: hubId },
        data: { membersCount: { decrement: 1 } },
      });
      return NextResponse.json({ success: true, data: { action: 'left' } });
    }

    // Join the hub
    await db.hubMember.create({
      data: { userId, hubId },
    });
    await db.hub.update({
      where: { id: hubId },
      data: { membersCount: { increment: 1 } },
    });

    // Award tokens (anti-farming: only once per hub)
    const existingAction = await db.tokenAction.findUnique({
      where: { userId_action_targetId: { userId, action: 'hub_join', targetId: hubId } },
    });

    let tokensAwarded = 0;
    let xpAwarded = 0;

    if (!existingAction) {
      tokensAwarded = 5;
      xpAwarded = 10;

      await db.tokenAction.create({
        data: { userId, action: 'hub_join', targetId: hubId, tokensEarned: tokensAwarded, xpEarned: xpAwarded },
      });
      await awardXPAndTokens(userId, tokensAwarded, xpAwarded);
    }

    return NextResponse.json({
      success: true,
      data: { action: 'joined', tokensAwarded, xpAwarded },
    });
  } catch (error) {
    console.error('Hub join error:', error);
    return NextResponse.json({ success: false, error: 'Failed to join hub' }, { status: 500 });
  }
}
