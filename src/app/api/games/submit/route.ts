import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { sanitizeText, validateLength, CONTENT_LIMITS } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// POST /api/games/submit - Submit input for a game round
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { sessionId, roundNumber, input } = await req.json();
    
    if (!sessionId || roundNumber === undefined || !input) {
      return NextResponse.json({ success: false, error: 'sessionId, roundNumber, and input are required' }, { status: 400 });
    }

    // Validate roundNumber is a positive integer
    if (typeof roundNumber !== 'number' || roundNumber < 1 || !Number.isInteger(roundNumber)) {
      return NextResponse.json({ success: false, error: 'roundNumber must be a positive integer' }, { status: 400 });
    }

    // Validate input is a non-empty string
    if (typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'input must be a non-empty string' }, { status: 400 });
    }

    // Validate input length to prevent abuse
    const inputError = validateLength(input, 1, CONTENT_LIMITS.COMMENT_TEXT, 'Game input');
    if (inputError) {
      return NextResponse.json({ success: false, error: inputError }, { status: 400 });
    }

    const session = await db.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Game is not active' }, { status: 400 });
    }

    if (session.player1Id !== auth.userId && session.player2Id !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Not a player in this session' }, { status: 403 });
    }

    const isPlayer1 = session.player1Id === auth.userId;
    const inputField = isPlayer1 ? 'player1Input' : 'player2Input';
    const submittedField = isPlayer1 ? 'player1SubmittedAt' : 'player2SubmittedAt';

    // Upsert the round
    const round = await db.gameRound.upsert({
      where: {
        sessionId_roundNumber: { sessionId, roundNumber }
      },
      create: {
        sessionId,
        roundNumber,
        promptText: '', // Will be filled by client
        [inputField]: sanitizeText(input),
        [submittedField]: new Date(),
      },
      update: {
        [inputField]: sanitizeText(input),
        [submittedField]: new Date(),
      }
    });

    // Check if both players have submitted
    const bothSubmitted = round.player1SubmittedAt !== null && round.player2SubmittedAt !== null;

    // If both submitted, move to voting phase
    if (bothSubmitted) {
      await db.gameSession.update({
        where: { id: sessionId },
        data: { status: 'voting' },
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        round,
        bothSubmitted,
        sessionStatus: bothSubmitted ? 'voting' : 'active'
      }
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Submit failed' }, { status: 500 });
  }
}
