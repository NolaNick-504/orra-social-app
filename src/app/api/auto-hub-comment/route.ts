import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction } from "@/lib/db";

// POST /api/auto-hub-comment — Internal auto-poster endpoint for hub comments
// Creates a comment on a hub post from a bot user (uses NEXTAUTH_SECRET as API key)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-autopost-key');
    const expectedKey = process.env.NEXTAUTH_SECRET || 'orra-internal';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, text, authorId } = body;

    if (!postId || !text?.trim() || !authorId) {
      return NextResponse.json(
        { success: false, error: "postId, text, and authorId are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: authorId } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Verify post exists
    const post = await db.hubPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ success: false, error: "Hub post not found" }, { status: 404 });
    }

    const comment = await serializedTransaction(async (tx) => {
      const newComment = await tx.hubComment.create({
        data: {
          text: text.trim(),
          hubPostId: postId,
          authorId,
        },
        include: {
          author: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
        },
      });

      // Increment comments count
      await tx.hubPost.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      });

      return newComment;
    });

    return NextResponse.json({ success: true, data: { comment } }, { status: 201 });
  } catch (error) {
    console.error("Auto-hub-comment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create hub comment" }, { status: 500 });
  }
}
