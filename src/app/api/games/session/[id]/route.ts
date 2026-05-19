import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { sanitizeText, validateLength, CONTENT_LIMITS } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// GET /api/games/session/[id] - Get game session state
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    
    const { id } = await params;

    const session = await db.gameSession.findUnique({
      where: { id },
      include: {
        player1: { select: { id: true, name: true, handle: true, avatar: true } },
        player2: { select: { id: true, name: true, handle: true, avatar: true } },
        rounds: { orderBy: { roundNumber: 'asc' } },
        votes: true,
      }
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (session.player1Id !== auth.userId && session.player2Id !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Not a player in this session' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get session' }, { status: 500 });
  }
}

// PATCH /api/games/session/[id] - Submit input or update game session
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { action, roundNumber, playerInput, isBot } = body;

    const session = await db.gameSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (session.player1Id !== auth.userId && session.player2Id !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Not a player in this session' }, { status: 403 });
    }

    if (action === 'submit_input') {
      // Submit player input for a round
      if (roundNumber === undefined || !playerInput) {
        return NextResponse.json({ success: false, error: 'roundNumber and playerInput are required' }, { status: 400 });
      }

      // Validate playerInput length
      if (typeof playerInput === 'string') {
        const inputError = validateLength(playerInput, 1, CONTENT_LIMITS.COMMENT_TEXT, 'Player input');
        if (inputError) {
          return NextResponse.json({ success: false, error: inputError }, { status: 400 });
        }
      }

      const isPlayer1 = session.player1Id === auth.userId;
      const inputField = isPlayer1 ? 'player1Input' : 'player2Input';
      const submittedField = isPlayer1 ? 'player1SubmittedAt' : 'player2SubmittedAt';

      const round = await db.gameRound.upsert({
        where: { sessionId_roundNumber: { sessionId: id, roundNumber } },
        create: {
          sessionId: id,
          roundNumber,
          promptText: '',
          [inputField]: typeof playerInput === 'string' ? sanitizeText(playerInput) : playerInput,
          [submittedField]: new Date(),
        },
        update: {
          [inputField]: typeof playerInput === 'string' ? sanitizeText(playerInput) : playerInput,
          [submittedField]: new Date(),
        },
      });

      // Check if both players have submitted
      const bothSubmitted = round.player1SubmittedAt !== null && round.player2SubmittedAt !== null;

      // If both submitted, move to voting phase
      if (bothSubmitted) {
        await db.gameSession.update({
          where: { id },
          data: { status: 'voting' },
        });
      }

      return NextResponse.json({
        success: true,
        data: { round, bothSubmitted, sessionStatus: bothSubmitted ? 'voting' : session.status },
      });
    }

    if (action === 'advance_round') {
      // Move to the next round
      await db.gameSession.update({
        where: { id },
        data: {
          currentRound: session.currentRound + 1,
          status: 'active',
          roundDeadline: new Date(Date.now() + 30000),
        },
      });
      return NextResponse.json({ success: true, data: { currentRound: session.currentRound + 1 } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Patch session error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update session' }, { status: 500 });
  }
}
