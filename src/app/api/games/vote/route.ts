import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db, serializedTransaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/games/vote - Vote on a game round
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { sessionId, roundId, votedForId, voteType, voteValue } = await req.json();
    
    if (!sessionId || !votedForId) {
      return NextResponse.json({ success: false, error: 'sessionId and votedForId are required' }, { status: 400 });
    }

    const session = await db.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Note: Players CAN vote on their own game in head-to-head games (Roast Battle, Clapback, Truth or Dare)
    // where voting is part of the gameplay mechanic. Spectators can also vote.

    // Check for duplicate vote
    const existingVote = await db.gameVote.findFirst({
      where: {
        voterId: auth.userId!,
        sessionId,
        roundId: roundId || null,
      }
    });

    if (existingVote) {
      return NextResponse.json({ success: false, error: 'Already voted' }, { status: 400 });
    }

    // Use serialized transaction for vote creation + round update + token award
    const vote = await serializedTransaction(async (tx) => {
      // Create vote
      const newVote = await tx.gameVote.create({
        data: {
          sessionId,
          roundId: roundId || null,
          voterId: auth.userId!,
          votedForId,
          voteType: voteType || 'pick',
          voteValue: voteValue || '',
        }
      });

      // Update round vote counts if roundId provided
      if (roundId) {
        const round = await tx.gameRound.findUnique({ where: { id: roundId } });
        if (round) {
          const isForPlayer1 = votedForId === session.player1Id;
          await tx.gameRound.update({
            where: { id: roundId },
            data: {
              player1Votes: isForPlayer1 ? { increment: 1 } : undefined,
              player2Votes: !isForPlayer1 ? { increment: 1 } : undefined,
            }
          });
        }
      }

      // Award voter 1 token atomically
      await tx.user.update({
        where: { id: auth.userId! },
        data: { auraTokens: { increment: 1 }, auraXP: { increment: 1 } },
      });

      return newVote;
    });

    return NextResponse.json({ success: true, data: vote });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ success: false, error: 'Vote failed' }, { status: 500 });
  }
}
