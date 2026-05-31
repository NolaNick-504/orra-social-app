import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction, awardXPAndTokens } from '@/lib/db';
import { getAuthUserId, requireAuth, handleApiError } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/collections - List user's collections with item count, or get single collection
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get('collectionId');

    // Single collection GET with items
    if (collectionId) {
      const collection = await db.collection.findUnique({
        where: { id: collectionId, userId },
        include: {
          items: {
            orderBy: { addedAt: 'desc' },
          },
        },
      });

      if (!collection) {
        return NextResponse.json(
          { success: false, error: 'Collection not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          collections: {
            ...collection,
            itemCount: collection.items.length,
          },
        },
      });
    }

    // List all collections
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

    return NextResponse.json({ success: true, data: { collections: data } });
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

// DELETE /api/collections - Delete a collection and its items
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { collectionId } = body;

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'collectionId is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const collection = await db.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (collection.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this collection' },
        { status: 403 }
      );
    }

    // Delete all CollectionItem records and the collection in a transaction
    await serializedTransaction(async (tx) => {
      await tx.collectionItem.deleteMany({
        where: { collectionId },
      });
      await tx.collection.delete({
        where: { id: collectionId },
      });
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true, collectionId },
    });
  } catch (error) {
    return handleApiError(error, 'Collections DELETE');
  }
}
