import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/blocks - List blocked users for the current authenticated user
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const blocked = await db.block.findMany({
      where: { blockerId: auth.userId! },
      select: {
        id: true,
        blockedId: true,
        blocked: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { blocked },
    });
  } catch (error) {
    console.error('List blocks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list blocked users' },
      { status: 500 }
    );
  }
}

// POST /api/blocks - Toggle block/unblock
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { blockedId } = body;

    if (!blockedId) {
      return NextResponse.json(
        { success: false, error: 'blockedId is required' },
        { status: 400 }
      );
    }

    if (blockedId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    // Check if the target user exists
    const targetUser = await db.user.findUnique({ where: { id: blockedId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already blocked
    const existingBlock = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: auth.userId!,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      // Unblock
      await db.block.delete({
        where: {
          blockerId_blockedId: {
            blockerId: auth.userId!,
            blockedId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: { isBlocked: false },
      });
    } else {
      // Block
      await db.block.create({
        data: {
          blockerId: auth.userId!,
          blockedId,
        },
      });

      return NextResponse.json({
        success: true,
        data: { isBlocked: true },
      });
    }
  } catch (error) {
    console.error('Block toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle block' },
      { status: 500 }
    );
  }
}
