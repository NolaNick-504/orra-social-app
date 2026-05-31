import { NextRequest, NextResponse } from 'next/server';
import { db, serializedTransaction } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/collections/items - Add a post to a collection
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
    const { collectionId, postId } = body;

    if (!collectionId || !postId) {
      return NextResponse.json(
        { success: false, error: 'collectionId and postId are required' },
        { status: 400 }
      );
    }

    // Verify the collection belongs to the user
    const collection = await db.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Collection not found or not owned by you' },
        { status: 404 }
      );
    }

    // Verify the post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already in collection
    const existing = await db.collectionItem.findUnique({
      where: {
        collectionId_postId: { collectionId, postId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Post already in this collection' },
        { status: 409 }
      );
    }

    const item = await serializedTransaction(async (tx) => {
      return tx.collectionItem.create({
        data: { collectionId, postId },
      });
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('Add collection item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add post to collection' },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/items - Remove a post from a collection
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { collectionId, postId } = body;

    if (!collectionId || !postId) {
      return NextResponse.json(
        { success: false, error: 'collectionId and postId are required' },
        { status: 400 }
      );
    }

    // Verify the collection belongs to the user
    const collection = await db.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Collection not found or not owned by you' },
        { status: 404 }
      );
    }

    // Find and delete the item
    const item = await db.collectionItem.findUnique({
      where: {
        collectionId_postId: { collectionId, postId },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Post not found in this collection' },
        { status: 404 }
      );
    }

    await serializedTransaction(async (tx) => {
      await tx.collectionItem.delete({ where: { id: item.id } });
    });

    return NextResponse.json({ success: true, data: { removed: true } });
  } catch (error) {
    console.error('Remove collection item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove post from collection' },
      { status: 500 }
    );
  }
}
