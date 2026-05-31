import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction, awardXPAndTokens } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/collections - List user's collections with item count
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const collections = await db.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = collections.map(({ _count, ...collection }) => ({
      ...collection,
      itemCount: _count.items,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('List collections error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create a new collection (earns +1 ORRA)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate, coverImage } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const collection = await serializedTransaction(async (tx) => {
      const created = await tx.collection.create({
        data: {
          name: name.trim(),
          description: description || '',
          coverImage: coverImage || '',
          isPrivate: isPrivate || false,
          userId,
        },
      });
      return created;
    });

    // Award +1 ORRA token and 2 XP for creating a collection
    await awardXPAndTokens(userId, 1, 2);

    return NextResponse.json({ success: true, data: collection }, { status: 201 });
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
