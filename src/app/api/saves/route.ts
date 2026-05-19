import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { targetId, targetType = 'post' } = body;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'targetId is required' }, { status: 400 });
    }

    // Check if already saved
    const existing = await db.save.findUnique({
      where: {
        userId_targetId_targetType: { userId, targetId, targetType },
      },
    });

    if (existing) {
      // Unsave
      await db.save.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, data: { action: 'unsaved' } });
    }

    // Save
    await db.save.create({
      data: { userId, targetId, targetType },
    });

    return NextResponse.json({ success: true, data: { action: 'saved' } });
  } catch (error) {
    console.error('Save toggle error:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle save' }, { status: 500 });
  }
}

// GET: Check if current user has saved specific items
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const targetType = url.searchParams.get('targetType') || 'post';

    const saves = await db.save.findMany({
      where: { userId, targetType },
      select: { targetId: true },
    });

    return NextResponse.json({
      success: true,
      data: saves.map((s) => s.targetId),
    });
  } catch (error) {
    console.error('Saves fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch saves' }, { status: 500 });
  }
}
