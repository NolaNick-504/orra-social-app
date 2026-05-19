import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db, serializedTransaction } from "@/lib/db";

// POST /api/shared-posts - Record that a post was shared via DM
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, chatId } = body;

    if (!postId || !chatId) {
      return NextResponse.json(
        { success: false, error: "postId and chatId are required" },
        { status: 400 }
      );
    }

    // Verify the post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Verify the user is a member of the chat
    const membership = await db.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Not a member of this chat" },
        { status: 403 }
      );
    }

    // Create the SharedPost record and increment sharesCount atomically
    const sharedPost = await serializedTransaction(async (tx) => {
      const result = await tx.sharedPost.create({
        data: {
          postId,
          userId,
          chatId,
        },
      });

      // Increment the post's sharesCount so the share counter is accurate
      await tx.post.update({
        where: { id: postId },
        data: { sharesCount: { increment: 1 } },
      });

      return result;
    });

    return NextResponse.json({ success: true, data: sharedPost }, { status: 201 });
  } catch (error) {
    console.error("POST /api/shared-posts error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/shared-posts - Get shared posts for a specific chat
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: "chatId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify the user is a member of the chat
    const membership = await db.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Not a member of this chat" },
        { status: 403 }
      );
    }

    const sharedPosts = await db.sharedPost.findMany({
      where: { chatId },
      include: {
        post: {
          select: {
            id: true,
            text: true,
            images: true,
            vibeTag: true,
            type: true,
            likesCount: true,
            commentsCount: true,
            sharesCount: true,
            createdAt: true,
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
        },
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: sharedPosts,
    });
  } catch (error) {
    console.error("GET /api/shared-posts error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
