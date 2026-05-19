import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { postId } = await params;

    const poll = await db.poll.findUnique({
      where: { postId },
      include: {
        options: {
          include: {
            votes: {
              select: { id: true, userId: true },
            },
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Calculate total votes
    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + opt.votes.length,
      0
    );

    // Format options with vote counts and user vote status
    const options = poll.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      voteCount: opt.votes.length,
      voted: userId ? opt.votes.some((v) => v.userId === userId) : false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: poll.id,
        question: poll.question,
        options,
        totalVotes,
        expiresAt: poll.expiresAt,
        createdAt: poll.createdAt,
      },
    });
  } catch (error) {
    console.error('Get poll error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch poll' },
      { status: 500 }
    );
  }
}
