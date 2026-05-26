import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db, serializedTransaction, awardXPAndTokens } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/challenges/invite - Accept or decline a challenge invite
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const userId = auth.userId!;

    const body = await req.json();
    const { inviteId, action } = body; // action: "accept" or "decline"

    if (!inviteId || !action) {
      return NextResponse.json({ success: false, error: 'inviteId and action are required' }, { status: 400 });
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ success: false, error: 'Invalid action. Use "accept" or "decline"' }, { status: 400 });
    }

    const invite = await db.challengeInvite.findUnique({
      where: { id: inviteId },
      include: { session: { include: { game: true, participants: true } } },
    });

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Invite not found' }, { status: 404 });
    }

    if (invite.receiverId !== userId) {
      return NextResponse.json({ success: false, error: 'Not your invite' }, { status: 403 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Invite already responded to' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (action === 'accept') {
      await serializedTransaction(async (tx) => {
        // Update invite status
        await tx.challengeInvite.update({
          where: { id: inviteId },
          data: { status: 'accepted', respondedAt: new Date() },
        });

        // Add user as participant
        await tx.challengeParticipant.create({
          data: {
            sessionId: invite.sessionId,
            userId,
          },
        });

        // If we have enough players, start the session
        const participantCount = invite.session.participants.length + 1; // +1 for the new participant
        if (participantCount >= invite.session.game.players) {
          await tx.challengeSession.update({
            where: { id: invite.sessionId },
            data: { status: 'active' },
          });
        }

        // Award XP for accepting (moved outside transaction — awardXPAndTokens has its own write queue)

        // Notify the challenger
        await tx.notification.create({
          data: {
            userId: invite.senderId,
            action: `${user.name} accepted your ${invite.session.game.name} challenge!`,
            type: 'challenge',
            triggeredByUserId: userId,
          },
        });
      });

      // Award XP for accepting (outside transaction — awardXPAndTokens has its own write queue)
      await awardXPAndTokens(userId, 0, 5);

      return NextResponse.json({ success: true, data: { status: 'accepted' } });
    } else {
      // Decline
      await serializedTransaction(async (tx) => {
        await tx.challengeInvite.update({
          where: { id: inviteId },
          data: { status: 'declined', respondedAt: new Date() },
        });

        // Notify the challenger
        await tx.notification.create({
          data: {
            userId: invite.senderId,
            action: `${user.name} declined your ${invite.session.game.name} challenge`,
            type: 'challenge',
            triggeredByUserId: userId,
          },
        });
      });

      return NextResponse.json({ success: true, data: { status: 'declined' } });
    }
  } catch (error: any) {
    console.error('Challenge invite error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process invite' }, { status: 500 });
  }
}
