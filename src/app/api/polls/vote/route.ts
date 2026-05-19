import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { optionId } = body;

    if (!optionId) {
      return NextResponse.json(
        { success: false, error: 'optionId is required' },
        { status: 400 }
      );
    }

    // Check if the option exists
    const option = await db.pollOption.findUnique({
      where: { id: optionId },
      include: { poll: true },
    });

    if (!option) {
      return NextResponse.json(
        { success: false, error: 'Poll option not found' },
        { status: 404 }
      );
    }

    // Check if user already voted on this option
    const existingVote = await db.pollVote.findUnique({
      where: {
        userId_optionId: {
          userId: auth.userId!,
          optionId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { success: false, error: 'You already voted on this option' },
        { status: 400 }
      );
    }

    // Create the vote
    await db.pollVote.create({
      data: {
        userId: auth.userId!,
        optionId,
      },
    });

    // Get total vote count for this option
    const voteCount = await db.pollVote.count({
      where: { optionId },
    });

    return NextResponse.json({
      success: true,
      data: { optionId, voteCount },
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
