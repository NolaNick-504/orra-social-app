import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db, serializedTransaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { postId, question, options, duration } = body;

    if (!postId || !question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { success: false, error: 'postId, question, and at least 2 options are required' },
        { status: 400 }
      );
    }

    if (options.length > 6) {
      return NextResponse.json(
        { success: false, error: 'Maximum 6 poll options allowed' },
        { status: 400 }
      );
    }

    const durationSeconds = duration || 86400; // Default 24 hours
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);

    const poll = await serializedTransaction(async (tx) => {
      const newPoll = await tx.poll.create({
        data: {
          question,
          postId,
          duration: durationSeconds,
          expiresAt,
          options: {
            create: options.map((text: string) => ({
              text: text.trim(),
            })),
          },
        },
        include: {
          options: true,
        },
      });

      return newPoll;
    });

    return NextResponse.json({
      success: true,
      data: poll,
    }, { status: 201 });
  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create poll' },
      { status: 500 }
    );
  }
}
