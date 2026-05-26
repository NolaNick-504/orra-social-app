import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction } from "@/lib/db";

// POST /api/auto-hub-post — Internal auto-poster endpoint for hub posts
// Creates a hub post from a bot user (uses NEXTAUTH_SECRET as API key)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-autopost-key');
    const expectedKey = process.env.NEXTAUTH_SECRET || 'orra-internal';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { hubId, text, authorId, images } = body;

    if (!hubId || !text?.trim() || !authorId) {
      return NextResponse.json(
        { success: false, error: "hubId, text, and authorId are required" },
        { status: 400 }
      );
    }

    // Verify user exists and is a hub member
    const user = await db.user.findUnique({ where: { id: authorId } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const membership = await db.hubMember.findUnique({
      where: { userId_hubId: { userId: authorId, hubId } },
    });

    if (!membership) {
      return NextResponse.json({ success: false, error: "User is not a hub member" }, { status: 403 });
    }

    const postImages = images && images.length > 0 ? JSON.stringify(images) : '[]';

    const post = await serializedTransaction(async (tx) => {
      const newPost = await tx.hubPost.create({
        data: {
          text: text.trim(),
          images: postImages,
          authorId,
          hubId,
          likesCount: Math.floor(Math.random() * 15),
          commentsCount: 0,
        },
        include: {
          author: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
        },
      });
      return newPost;
    });

    return NextResponse.json({ success: true, data: { post } }, { status: 201 });
  } catch (error) {
    console.error("Auto-hub-post error:", error);
    return NextResponse.json({ success: false, error: "Failed to create hub post" }, { status: 500 });
  }
}
