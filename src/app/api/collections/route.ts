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

      // Fetch post details for each collection item
      const itemPostIds = collection.items.map(item => item.postId);
      const posts = itemPostIds.length > 0 ? await db.post.findMany({
        where: { id: { in: itemPostIds } },
        include: {
          author: {
            select: { id: true, name: true, handle: true, avatar: true },
          },
        },
      }) : [];

      const postsMap = new Map(posts.map(p => [p.id, p]));

      return NextResponse.json({
        success: true,
        data: {
          collection: {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            coverImage: collection.coverImage,
            isPrivate: collection.isPrivate,
            userId: collection.userId,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
            postsCount: collection.items.length,
            posts: collection.items.map(item => {
              const post = postsMap.get(item.postId);
              return post ? {
                id: post.id,
                text: post.text,
                images: typeof post.images === 'string' ? JSON.parse(post.images || '[]') : (post.images || []),
                createdAt: post.createdAt,
                author: post.author,
              } : { id: item.postId, text: '[Post unavailable]', images: [], createdAt: item.addedAt, author: { id: '', name: 'Unknown', handle: '', avatar: '' } };
            }),
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

    // Fetch first 4 post images for each collection's mosaic cover
    const collectionIds = collections.map(c => c.id);
    const allItems = collectionIds.length > 0 ? await db.collectionItem.findMany({
      where: { collectionId: { in: collectionIds } },
      include: {
        // We don't have a direct relation, so we'll get postIds and fetch separately
      },
      orderBy: { addedAt: 'desc' },
    }) : [];

    // Get post images for mosaic covers
    const postIds = [...new Set(allItems.map(i => i.postId))];
    const postsData = postIds.length > 0 ? await db.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, images: true },
    }) : [];
    const postsMap = new Map(postsData.map(p => [p.id, typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || [])]));

    // Group items by collectionId
    const itemsByCollection = new Map<string, string[]>();
    for (const item of allItems) {
      const arr = itemsByCollection.get(item.collectionId) || [];
      arr.push(item.postId);
      itemsByCollection.set(item.collectionId, arr);
    }

    const data = collections.map(({ _count, ...collection }) => {
      const itemPostIds = (itemsByCollection.get(collection.id) || []).slice(0, 4);
      const coverImages = itemPostIds
        .map(pid => postsMap.get(pid))
        .filter(Boolean)
        .flat()
        .slice(0, 4);

      return {
        ...collection,
        postsCount: _count.items,
        posts: itemPostIds.map(pid => ({
          id: pid,
          images: postsMap.get(pid) || [],
        })),
      };
    });

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
