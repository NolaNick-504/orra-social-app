import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/games/complete - Complete a game and distribute rewards
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    const session = await db.gameSession.findUnique({
      where: { id: sessionId },
      include: { rounds: true, votes: true }
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (session.player1Id !== auth.userId && session.player2Id !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Not a player in this session' }, { status: 403 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Game already completed' }, { status: 400 });
    }

    // Calculate scores from round votes
    let p1Score = 0;
    let p2Score = 0;
    
    for (const round of session.rounds) {
      if (round.player1Votes > round.player2Votes) p1Score += 10;
      else if (round.player2Votes > round.player1Votes) p2Score += 10;
      // Tie = no points for either
    }

    const winnerId = p1Score > p2Score ? session.player1Id : 
                     p2Score > p1Score ? session.player2Id : null;

    // Game-specific rewards
    const rewards: Record<string, { winnerTokens: number; winnerXP: number; loserTokens: number; loserXP: number }> = {
      roast_battle: { winnerTokens: 25, winnerXP: 30, loserTokens: 8, loserXP: 10 },
      hot_take: { winnerTokens: 15, winnerXP: 20, loserTokens: 5, loserXP: 8 },
      first_impression: { winnerTokens: 20, winnerXP: 25, loserTokens: 7, loserXP: 10 },
      rate_my_fit: { winnerTokens: 20, winnerXP: 25, loserTokens: 7, loserXP: 10 },
      story_challenge: { winnerTokens: 15, winnerXP: 20, loserTokens: 5, loserXP: 8 },
      who_said_it: { winnerTokens: 20, winnerXP: 25, loserTokens: 7, loserXP: 10 },
      vibe_check_game: { winnerTokens: 10, winnerXP: 15, loserTokens: 3, loserXP: 5 },
      clapback: { winnerTokens: 30, winnerXP: 35, loserTokens: 10, loserXP: 12 },
      truth_or_dare: { winnerTokens: 25, winnerXP: 30, loserTokens: 8, loserXP: 10 },
    };

    const reward = rewards[session.gameType] || { winnerTokens: 15, winnerXP: 20, loserTokens: 5, loserXP: 8 };

    const isP1Winner = winnerId === session.player1Id;
    const isP2Winner = winnerId === session.player2Id;
    const isTie = winnerId === null;

    // Update player tokens and XP
    const p1Tokens = isP1Winner ? reward.winnerTokens : isTie ? Math.floor(reward.winnerTokens / 2) : reward.loserTokens;
    const p1XP = isP1Winner ? reward.winnerXP : isTie ? Math.floor(reward.winnerXP / 2) : reward.loserXP;
    const p2Tokens = isP2Winner ? reward.winnerTokens : isTie ? Math.floor(reward.winnerTokens / 2) : reward.loserTokens;
    const p2XP = isP2Winner ? reward.winnerXP : isTie ? Math.floor(reward.winnerXP / 2) : reward.loserXP;

    await db.user.update({ where: { id: session.player1Id }, data: { auraTokens: { increment: p1Tokens }, auraXP: { increment: p1XP } } });
    if (session.player2Id) {
      await db.user.update({ where: { id: session.player2Id }, data: { auraTokens: { increment: p2Tokens }, auraXP: { increment: p2XP } } });
    }

    // Mark session as completed
    await db.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        player1Score: p1Score,
        player2Score: p2Score,
        winnerId,
        result: JSON.stringify({ p1Score, p2Score, p1Tokens, p1XP, p2Tokens, p2XP }),
        completedAt: new Date(),
      }
    });

    const isCurrentPlayer1 = session.player1Id === auth.userId;
    const tokensEarned = isCurrentPlayer1 ? p1Tokens : p2Tokens;
    const xpEarned = isCurrentPlayer1 ? p1XP : p2XP;

    return NextResponse.json({
      success: true,
      data: {
        tokensEarned,
        xpEarned,
        isWinner: isCurrentPlayer1 ? isP1Winner : isP2Winner,
        isTie,
        player1Score: p1Score,
        player2Score: p2Score,
      }
    });
  } catch (error) {
    console.error('Complete game error:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete game' }, { status: 500 });
  }
}
