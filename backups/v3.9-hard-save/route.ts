import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auto-post — Internal auto-poster endpoint
// Creates a post from a specified user (uses NEXTAUTH_SECRET as API key)
export async function POST(req: NextRequest) {
  try {
    // Simple auth check to prevent abuse
    const authHeader = req.headers.get('x-autopost-key');
    const expectedKey = process.env.NEXTAUTH_SECRET || 'orra-internal';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, vibeTag, authorId } = body;

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

    // Create the post
    const post = await db.post.create({
      data: {
        text,
        vibeTag: vibeTag || 'chill',
        type: 'text',
        authorId,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
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

    // Award tokens to the user for posting
    await db.user.update({
      where: { id: authorId },
      data: {
        auraTokens: { increment: 5 },
        auraXP: { increment: 10 },
      },
    });

    return NextResponse.json({ success: true, data: { post } }, { status: 201 });
  } catch (error) {
    console.error("Auto-post error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
