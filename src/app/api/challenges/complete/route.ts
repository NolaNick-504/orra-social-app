import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens } from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/challenges/complete - Complete a challenge session and award tokens/XP server-side
// This is the ONLY way to earn tokens/XP from challenges - prevents client-side manipulation
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { sessionId, score, result, gameType } = body;

    if (!sessionId || !gameType) {
      return NextResponse.json({ success: false, error: 'sessionId and gameType are required' }, { status: 400 });
    }

    // 1. Validate the session exists and is active
    const challengeSession = await db.challengeSession.findUnique({
      where: { id: sessionId },
      include: { game: true, participants: true },
    });

    if (!challengeSession) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (challengeSession.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Session already completed' }, { status: 400 });
    }

    // 2. Validate the user is a participant
    const participant = challengeSession.participants.find((p) => p.userId === auth.userId);
    if (!participant) {
      return NextResponse.json({ success: false, error: 'You are not a participant in this session' }, { status: 403 });
    }

    // 3. Anti-cheat: Check if user already claimed rewards for this session
    const existingClaim = await db.tokenAction.findUnique({
      where: {
        userId_action_targetId: {
          userId: auth.userId!,
          action: 'challenge_complete',
          targetId: sessionId,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json({ success: false, error: 'Rewards already claimed for this session' }, { status: 400 });
    }

    // 4. Anti-cheat: Validate minimum game duration
    const gameDurationMs = Date.now() - challengeSession.createdAt.getTime();
    const game = challengeSession.game;
    const expectedMinDurationSec = (game.players === 1 ? 5 : 15);

    if (gameDurationMs < expectedMinDurationSec * 1000) {
      return NextResponse.json(
        { success: false, error: 'Game completed too fast - minimum play time not met' },
        { status: 400 }
      );
    }

    // 5. Anti-cheat: Validate score is within reasonable bounds
    const maxReasonableScore = (10 + 5) * (game.players === 1 ? 1 : 5) * 2;
    if (score && (score < 0 || score > maxReasonableScore)) {
      return NextResponse.json(
        { success: false, error: 'Invalid score' },
        { status: 400 }
      );
    }

    // 6. Anti-cheat: Rate limit - max 10 challenges per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCompletions = await db.tokenAction.count({
      where: {
        userId: auth.userId!,
        action: 'challenge_complete',
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCompletions >= 10) {
      return NextResponse.json(
        { success: false, error: 'Challenge limit reached. Try again later.' },
        { status: 429 }
      );
    }

    // 7. Calculate rewards based on game definition (server-side, not client)
    const tokenReward = game.tokenReward;
    const xpReward = game.xpReward;

    // 8. Update participant score and winner status
    const isWinner = score >= 0;
    await db.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        score: score || 0,
        isWinner,
        data: result ? JSON.stringify(result) : undefined,
      },
    });

    // 9. Mark session as completed
    await db.challengeSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        winnerId: isWinner ? auth.userId : null,
        result: result ? JSON.stringify(result) : undefined,
      },
    });

    // 10. Award tokens and XP server-side
    await awardXPAndTokens(auth.userId!, tokenReward, xpReward);

    // 11. Record the TokenAction for anti-farming
    await db.tokenAction.create({
      data: {
        userId: auth.userId!,
        action: 'challenge_complete',
        targetId: sessionId,
        tokensEarned: tokenReward,
        xpEarned: xpReward,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tokensEarned: tokenReward,
        xpEarned: xpReward,
        isWinner,
        score: score || 0,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Challenge complete');
  }
}
