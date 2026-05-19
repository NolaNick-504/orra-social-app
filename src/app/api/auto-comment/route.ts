import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction, writeQueue } from "@/lib/db";

// POST /api/auto-comment — Internal auto-responder endpoint
// Creates a comment from a bot user (uses NEXTAUTH_SECRET as API key)
export async function POST(req: NextRequest) {
  try {
    // Simple auth check to prevent abuse
    const authHeader = req.headers.get('x-autopost-key');
    const expectedKey = process.env.AUTOPOST_KEY || process.env.NEXTAUTH_SECRET || 'orra-internal';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, text, authorId } = body;

    if (!postId || !text || !authorId) {
      return NextResponse.json(
        { success: false, error: "postId, text, and authorId are required" },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
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

    // Use serialized transaction to prevent SQLite lock contention
    const comment = await serializedTransaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          text: text.trim(),
          postId,
          authorId,
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

      // Increment comments count on the post
      await tx.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      });

      return newComment;
    });

    return NextResponse.json({ success: true, data: { comment } }, { status: 201 });
  } catch (error) {
    console.error("Auto-comment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
