import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction, writeQueue, awardXPAndTokens } from "@/lib/db";

// POST /api/auto-post — Internal auto-poster endpoint
// Creates a post from a specified user (uses NEXTAUTH_SECRET as API key)
export async function POST(req: NextRequest) {
  try {
    // Simple auth check to prevent abuse
    const authHeader = req.headers.get('x-autopost-key');
    const expectedKey = process.env.AUTOPOST_KEY || process.env.NEXTAUTH_SECRET || 'orra-internal';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, vibeTag, authorId, type, images } = body;

    if (!text || !authorId) {
      return NextResponse.json(
        { success: false, error: "text and authorId are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: authorId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Determine post type and images
    const postType = type || (images && images.length > 0 ? 'image' : 'text');
    const postImages = images && images.length > 0 ? JSON.stringify(images) : '[]';

    // Use serialized transaction to prevent SQLite lock contention
    const post = await serializedTransaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          text,
          vibeTag: vibeTag || 'chill',
          type: postType,
          images: postImages,
          authorId,
          likesCount: Math.floor(Math.random() * 50), // Start with some likes for realism
          commentsCount: 0,
          sharesCount: Math.floor(Math.random() * 15),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
              verified: true,
            },
          },
        },
      });
      return newPost;
    });

    // Award tokens to the user for posting
    writeQueue.run(async () => {
      try {
        await db.user.update({ where: { id: authorId }, data: { auraTokens: { increment: 5 } } });
        await awardXPAndTokens(authorId, 0, 10);
      } catch {
        // Best-effort token award
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, data: { post } }, { status: 201 });
  } catch (error) {
    console.error("Auto-post error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
