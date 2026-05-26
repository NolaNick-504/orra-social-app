import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db, awardXPAndTokens } from '@/lib/db';
import { sanitizeText, validateLength, CONTENT_LIMITS } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// GET /api/games/hot-take - Get hot takes to vote on
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 10;

    // Get active hot takes that the user hasn't voted on yet
    const takes = await db.hotTake.findMany({
      where: {
        status: 'active',
        expiresAt: { gte: new Date() },
        authorId: { not: auth.userId! },
        votes: { none: { voterId: auth.userId! } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, handle: true, avatar: true } },
      }
    });

    return NextResponse.json({ success: true, data: takes });
  } catch (error) {
    console.error('Get hot takes error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get hot takes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/games/hot-take - Submit or vote on a hot take
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { action, text, category, takeId, vote } = await req.json();

    if (action === 'submit') {
      // Submit a new hot take
      if (!text || text.trim().length < 5) {
        return NextResponse.json({ success: false, error: 'Take must be at least 5 characters' }, { status: 400 });
      }

      // Validate and sanitize hot take text length
      const takeError = validateLength(text, 5, CONTENT_LIMITS.HOT_TAKE_TEXT, 'Hot take');
      if (takeError) {
        return NextResponse.json({ success: false, error: takeError }, { status: 400 });
      }

      // Rate limit: max 5 takes per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await db.hotTake.count({
        where: { authorId: auth.userId!, createdAt: { gte: today } }
      });
      if (todayCount >= 5) {
        return NextResponse.json({ success: false, error: 'Max 5 takes per day' }, { status: 429 });
      }

      const take = await db.hotTake.create({
        data: {
          authorId: auth.userId!,
          text: sanitizeText(text.trim()),
          category: category || 'wildcard',
          expiresAt: new Date(Date.now() + 86400000), // 24 hours
        }
      });

      return NextResponse.json({ success: true, data: take });
    }

    if (action === 'vote') {
      // Vote W or L on a take
      if (!takeId || !vote || !['W', 'L'].includes(vote)) {
        return NextResponse.json({ success: false, error: 'takeId and vote (W/L) required' }, { status: 400 });
      }

      // Check for duplicate vote
      const existing = await db.hotTakeVote.findUnique({
        where: { voterId_takeId: { voterId: auth.userId!, takeId } }
      });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Already voted' }, { status: 400 });
      }

      const take = await db.hotTake.findUnique({ where: { id: takeId } });
      if (!take) {
        return NextResponse.json({ success: false, error: 'Take not found' }, { status: 404 });
      }

      // Create vote
      await db.hotTakeVote.create({
        data: { takeId, voterId: auth.userId!, vote }
      });

      // Update take counts atomically using increment (avoids race conditions)
      const isVoteW = vote === 'W';
      const [updatedTake] = await db.$transaction([
        db.hotTake.update({
          where: { id: takeId },
          data: {
            wVotes: { increment: isVoteW ? 1 : 0 },
            lVotes: { increment: isVoteW ? 0 : 1 },
            totalVotes: { increment: 1 },
          },
        }),
      ]);

      // Recalculate ratio and check nuclear status in a second update
      const newWVotes = updatedTake.wVotes;
      const newLVotes = updatedTake.lVotes;
      const newTotal = updatedTake.totalVotes;
      const newWRatio = newTotal > 0 ? newWVotes / newTotal : 0;
      const isNuclear = newWRatio >= 0.9 && newTotal >= 30;

      await db.hotTake.update({
        where: { id: takeId },
        data: {
          wRatio: newWRatio,
          isNuclear,
          status: newTotal >= 30 ? 'finalized' : 'active',
        }
      });

      // Award voter 1 token + 1 XP
      await awardXPAndTokens(auth.userId!, 1, 1);

      return NextResponse.json({ 
        success: true, 
        data: { wVotes: newWVotes, lVotes: newLVotes, wRatio: newWRatio, isNuclear } 
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Hot take error:', error);
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}
