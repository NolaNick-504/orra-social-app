import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/games/matchmake - Find or create a game session
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { gameType, friendId } = await req.json();
    
    if (!gameType) {
      return NextResponse.json({ success: false, error: 'gameType is required' }, { status: 400 });
    }

    const validGameTypes = [
      'roast_battle', 'hot_take', 'first_impression', 'rate_my_fit',
      'story_challenge', 'who_said_it', 'vibe_check_game', 'clapback',
      'aura_drop', 'truth_or_dare'
    ];

    // Solo/async games that don't need an opponent — start immediately as 'active'
    const soloGameTypes = ['hot_take', 'rate_my_fit', 'story_challenge', 'who_said_it', 'vibe_check_game', 'aura_drop'];
    
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json({ success: false, error: 'Invalid game type' }, { status: 400 });
    }

    // Check rate limit: max 10 games per hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentGames = await db.gameSession.count({
      where: {
        OR: [
          { player1Id: auth.userId! },
          { player2Id: auth.userId! }
        ],
        createdAt: { gte: oneHourAgo }
      }
    });
    
    if (recentGames >= 10) {
      return NextResponse.json({ success: false, error: 'Rate limit: max 10 games per hour' }, { status: 429 });
    }

    const gameConfig: Record<string, { rounds: number; timerSec: number }> = {
      roast_battle: { rounds: 3, timerSec: 30 },
      hot_take: { rounds: 3, timerSec: 15 },
      first_impression: { rounds: 4, timerSec: 20 },
      rate_my_fit: { rounds: 3, timerSec: 20 },
      story_challenge: { rounds: 3, timerSec: 30 },
      who_said_it: { rounds: 5, timerSec: 10 },
      vibe_check_game: { rounds: 3, timerSec: 15 },
      clapback: { rounds: 3, timerSec: 20 },
      truth_or_dare: { rounds: 4, timerSec: 20 },
    };

    // If friendId provided, create a direct challenge
    if (friendId) {
      const friend = await db.user.findUnique({ where: { id: friendId } });
      if (!friend) {
        return NextResponse.json({ success: false, error: 'Friend not found' }, { status: 404 });
      }

      // Check if friend has blocked you
      const block = await db.block.findFirst({
        where: {
          OR: [
            { blockerId: auth.userId!, blockedId: friendId },
            { blockerId: friendId, blockedId: auth.userId! }
          ]
        }
      });
      if (block) {
        return NextResponse.json({ success: false, error: 'Cannot challenge this user' }, { status: 403 });
      }

      const config = gameConfig[gameType] || { rounds: 3, timerSec: 20 };
      
      // Generate random prompt indices
      const promptIndices = Array.from({ length: config.rounds }, () => Math.floor(Math.random() * 20));

      const session = await db.gameSession.create({
        data: {
          gameType,
          player1Id: auth.userId!,
          player2Id: friendId,
          status: 'active',
          totalRounds: config.rounds,
          promptIds: JSON.stringify(promptIndices),
          roundDeadline: new Date(Date.now() + config.timerSec * 1000),
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
        include: {
          player1: { select: { id: true, name: true, handle: true, avatar: true } },
          player2: { select: { id: true, name: true, handle: true, avatar: true } },
        }
      });

      return NextResponse.json({ success: true, data: session });
    }

    // Random matchmaking: find an existing waiting session
    const waitingSession = await db.gameSession.findFirst({
      where: {
        gameType,
        status: 'waiting',
        player1Id: { not: auth.userId! },
        player2Id: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (waitingSession) {
      // Join existing session
      const updated = await db.gameSession.update({
        where: { id: waitingSession.id },
        data: {
          player2Id: auth.userId!,
          status: 'active',
          roundDeadline: new Date(Date.now() + 30000),
        },
        include: {
          player1: { select: { id: true, name: true, handle: true, avatar: true } },
          player2: { select: { id: true, name: true, handle: true, avatar: true } },
        }
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // No waiting session, create one
    const config = gameConfig[gameType] || { rounds: 3, timerSec: 20 };
    const promptIndices = Array.from({ length: config.rounds }, () => Math.floor(Math.random() * 20));

    // Solo/async games start as 'active' immediately (no opponent needed)
    const isSoloGame = soloGameTypes.includes(gameType);
    const initialStatus = isSoloGame ? 'active' : 'waiting';
    const sessionExpiry = isSoloGame
      ? new Date(Date.now() + 3600000)  // 1 hour for solo games
      : new Date(Date.now() + 300000);  // 5 min to find opponent for 1v1

    const session = await db.gameSession.create({
      data: {
        gameType,
        player1Id: auth.userId!,
        status: initialStatus,
        totalRounds: config.rounds,
        promptIds: JSON.stringify(promptIndices),
        roundDeadline: isSoloGame ? new Date(Date.now() + config.timerSec * 1000) : null,
        expiresAt: sessionExpiry,
      },
      include: {
        player1: { select: { id: true, name: true, handle: true, avatar: true } },
        player2: { select: { id: true, name: true, handle: true, avatar: true } },
      }
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Matchmaking error:', error);
    return NextResponse.json({ success: false, error: 'Matchmaking failed' }, { status: 500 });
  }
}
