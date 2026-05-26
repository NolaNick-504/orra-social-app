import { NextRequest, NextResponse } from 'next/server';
import { db, awardXPAndTokens, serializedTransaction } from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Seed the 10 challenge games if they don't exist yet
async function ensureGames() {
  const count = await db.challengeGame.count();
  if (count > 0) return;

  const games = [
    { type: 'roast_battle', name: 'Roast Battle', description: 'Head-to-head roasting! The audience votes on who delivered the best burns. Funniest roaster wins!', icon: '🔥', color: 'from-red-600 to-orange-500', tokenCost: 5, tokenReward: 25, xpReward: 30, players: 2 },
    { type: 'hot_take', name: 'Hot Take', description: 'Drop a controversial take in 15 seconds. Others vote W or L in real-time. Most agreed-with takes climb the leaderboard!', icon: '🌶️', color: 'from-orange-600 to-yellow-500', tokenCost: 0, tokenReward: 15, xpReward: 20, players: 2 },
    { type: 'first_impression', name: 'First Impression', description: 'Two users match and have 10 seconds to describe each other based purely on their profile. The reveal is always hilarious!', icon: '👀', color: 'from-blue-600 to-cyan-500', tokenCost: 3, tokenReward: 20, xpReward: 25, players: 2 },
    { type: 'rate_my_fit', name: 'Rate My Fit', description: 'Post your outfit, the community rates it 1-10 in real-time with a live scoreboard. Best fits earn the most tokens!', icon: '👔', color: 'from-purple-600 to-pink-500', tokenCost: 0, tokenReward: 20, xpReward: 25, players: 2 },
    { type: 'story_challenge', name: 'Story Challenge', description: 'Daily challenge prompt — show your weirdest habit, best trick, or wildest moment. Best stories get featured and earn tokens!', icon: '📖', color: 'from-emerald-600 to-green-500', tokenCost: 0, tokenReward: 15, xpReward: 20, players: 2 },
    { type: 'who_said_it', name: 'Who Said It', description: 'Guess which friend said a quote! Pulls real posts and turns them into a quiz. The more you guess right, the more you earn!', icon: '🤔', color: 'from-indigo-600 to-violet-500', tokenCost: 2, tokenReward: 20, xpReward: 25, players: 2 },
    { type: 'vibe_check_game', name: 'Vibe Check', description: 'Post a 5-second video and the community tags your vibe in real-time. Most popular tag wins. Results are hilarious and shareable!', icon: '✨', color: 'from-fuchsia-600 to-pink-400', tokenCost: 0, tokenReward: 10, xpReward: 15, players: 2 },
    { type: 'clapback', name: 'Clapback', description: 'Someone posts a statement, you post a video clapback. The pair gets shown together and people vote who won. Chain clapbacks go mega-viral!', icon: '💥', color: 'from-amber-600 to-red-500', tokenCost: 5, tokenReward: 30, xpReward: 35, players: 2 },
    { type: 'aura_drop', name: 'Aura Drop', description: 'Exclusive limited-time avatar effects and badges that drop at random times like sneaker drops. Creates FOMO and drives traffic spikes!', icon: '👑', color: 'from-yellow-600 to-amber-400', tokenCost: 10, tokenReward: 50, xpReward: 50, players: 1 },
    { type: 'truth_or_dare', name: 'Truth or Dare', description: 'Audience sends dares, you pick one and do it live! Tokens to submit dares. Wildly engaging and clips spread everywhere!', icon: '🎯', color: 'from-rose-600 to-red-500', tokenCost: 3, tokenReward: 25, xpReward: 30, players: 2 },
  ];

  await db.challengeGame.createMany({ data: games });
}

// GET /api/challenges - List all challenge games + user's active sessions + pending invites
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    await ensureGames();

    // Get all challenge games
    const games = await db.challengeGame.findMany({
      where: { active: true },
      orderBy: { playsCount: 'desc' },
    });

    // Get user's pending invites
    const pendingInvites = await db.challengeInvite.findMany({
      where: { receiverId: auth.userId!, status: 'pending' },
      include: {
        sender: { select: { id: true, name: true, handle: true, avatar: true } },
        session: {
          include: {
            game: true,
            participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user's active sessions
    const activeSessions = await db.challengeParticipant.findMany({
      where: { userId: auth.userId!, session: { status: { in: ['waiting', 'active'] } } },
      include: {
        session: {
          include: {
            game: true,
            participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Get recent completed sessions for the feed
    const recentCompleted = await db.challengeSession.findMany({
      where: { status: 'completed' },
      include: {
        game: true,
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        winner: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        games,
        pendingInvites,
        activeSessions: activeSessions.map((p) => p.session),
        recentCompleted,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Challenges GET');
  }
}

// POST /api/challenges - Create a new challenge session (optionally invite a friend)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { gameType, inviteUserId, message } = body;

    if (!gameType) {
      return NextResponse.json({ success: false, error: 'gameType is required' }, { status: 400 });
    }

    const game = await db.challengeGame.findFirst({ where: { type: gameType, active: true } });
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    // Check user has enough tokens
    const user = await db.user.findUnique({ where: { id: auth.userId! } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check token cost and deduct atomically inside a transaction to prevent race conditions
    if (game.tokenCost > 0) {
      // Use serializedTransaction to check balance and deduct in one atomic operation
      // Previously this was two separate operations (check then deduct), allowing double-spend
      await serializedTransaction(async (tx) => {
        const currentUser = await tx.user.findUnique({
          where: { id: auth.userId! },
          select: { auraTokens: true },
        });
        if (!currentUser || currentUser.auraTokens < game.tokenCost) {
          throw new Error('INSUFFICIENT_TOKENS');
        }
        await tx.user.update({
          where: { id: auth.userId! },
          data: { auraTokens: { decrement: game.tokenCost } },
        });
      });
    }

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
    const challengeSession = await db.challengeSession.create({
      data: {
        gameId: game.id,
        status: 'waiting',
        expiresAt,
        participants: {
          create: {
            userId: auth.userId!,
          },
        },
      },
    });

    // Increment plays count
    await db.challengeGame.update({
      where: { id: game.id },
      data: { playsCount: { increment: 1 } },
    });

    // If inviting a friend, create the invite
    if (inviteUserId) {
      // Don't invite yourself
      if (inviteUserId === auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot invite yourself' }, { status: 400 });
      }

      const invitee = await db.user.findUnique({ where: { id: inviteUserId } });
      if (!invitee) {
        return NextResponse.json({ success: false, error: 'Invitee not found' }, { status: 404 });
      }

      await db.challengeInvite.create({
        data: {
          sessionId: challengeSession.id,
          senderId: auth.userId!,
          receiverId: inviteUserId,
          message: message || `${user.name} challenged you to ${game.name}!`,
        },
      });

      // Create notification for the invitee
      await db.notification.create({
        data: {
          userId: inviteUserId,
          action: `${user.name} challenged you to ${game.name}!`,
          type: 'challenge',
          triggeredByUserId: auth.userId!,
        },
      });
    }

    // Award XP for starting
    await awardXPAndTokens(auth.userId!, 0, 5);

    // Record token action
    if (game.tokenCost > 0) {
      await db.tokenAction.create({
        data: {
          userId: auth.userId!,
          action: 'challenge_start',
          targetId: challengeSession.id,
          tokensEarned: -game.tokenCost,
          xpEarned: 5,
        },
      });
    }

    const result = await db.challengeSession.findUnique({
      where: { id: challengeSession.id },
      include: {
        game: true,
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        invites: { include: { receiver: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    // Handle known transaction errors
    if (error?.message === 'INSUFFICIENT_TOKENS') {
      return NextResponse.json({ success: false, error: 'Insufficient ORRA tokens to start this challenge' }, { status: 400 });
    }
    return handleApiError(error, 'Challenges POST');
  }
}
