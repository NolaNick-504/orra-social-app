import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/mutes - List muted users for current user
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const mutes = await db.mute.findMany({
      where: {
        muterId: auth.userId!,
      },
      select: {
        id: true,
        mutedId: true,
        muted: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: { mutes } });
  } catch (error) {
    console.error('Fetch mutes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mutes' },
      { status: 500 }
    );
  }
}

// POST /api/mutes - Toggle mute/unmute
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { mutedId } = body;

    if (!mutedId) {
      return NextResponse.json(
        { success: false, error: 'mutedId is required' },
        { status: 400 }
      );
    }

    if (mutedId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot mute yourself' },
        { status: 400 }
      );
    }

    // Check if the target user exists
    const targetUser = await db.user.findUnique({ where: { id: mutedId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already muted
    const existingMute = await db.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: auth.userId!,
          mutedId,
        },
      },
    });

    if (existingMute) {
      // Unmute
      await db.mute.delete({
        where: {
          muterId_mutedId: {
            muterId: auth.userId!,
            mutedId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: { isMuted: false },
      });
    } else {
      // Mute
      await db.mute.create({
        data: {
          muterId: auth.userId!,
          mutedId,
        },
      });

      return NextResponse.json({
        success: true,
        data: { isMuted: true },
      });
    }
  } catch (error) {
    console.error('Mute toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle mute' },
      { status: 500 }
    );
  }
}
