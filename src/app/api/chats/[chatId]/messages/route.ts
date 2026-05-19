import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET /api/chats/[chatId]/messages - Get messages for a chat (paginated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    // Verify user is a member of this chat
    const membership = await db.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) {
      return NextResponse.json({ success: false, error: "Not a member of this chat" }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      db.directMessage.findMany({
        where: { chatId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, name: true, handle: true, avatar: true },
          },
        },
      }),
      db.directMessage.count({ where: { chatId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/chats/[chatId]/messages error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/chats/[chatId]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    // Verify user is a member of this chat
    const membership = await db.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) {
      return NextResponse.json({ success: false, error: "Not a member of this chat" }, { status: 403 });
    }

    const body = await request.json();
    const { text, imageUrl } = body;

    if (!text && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Message text or image is required" },
        { status: 400 }
      );
    }

    // Create the message
    const message = await db.directMessage.create({
      data: {
        text: text || "",
        imageUrl: imageUrl || "",
        chatId,
        senderId: userId,
      },
      include: {
        sender: {
          select: { id: true, name: true, handle: true, avatar: true },
        },
      },
    });

    // Increment other member's unread count
    await db.chatMember.updateMany({
      where: {
        chatId,
        userId: { not: userId },
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Update chat's updatedAt
    await db.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Award tokens for first message per chat per day (anti-farming via TokenAction)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAction = await db.tokenAction.findUnique({
      where: {
        userId_action_targetId: {
          userId,
          action: "chat",
          targetId: chatId,
        },
      },
    });

    let tokensAwarded = 0;
    let xpAwarded = 0;

    // Check if the existing action was today
    if (!existingAction || existingAction.createdAt < today) {
      // Award +1 token + 2 XP for first message per chat per day
      await db.tokenAction.upsert({
        where: {
          userId_action_targetId: {
            userId,
            action: "chat",
            targetId: chatId,
          },
        },
        update: {
          tokensEarned: { increment: 1 },
          xpEarned: { increment: 2 },
          createdAt: new Date(),
        },
        create: {
          userId,
          action: "chat",
          targetId: chatId,
          tokensEarned: 1,
          xpEarned: 2,
        },
      });

      await db.user.update({
        where: { id: userId },
        data: {
          auraTokens: { increment: 1 },
          auraXP: { increment: 2 },
        },
      });

      tokensAwarded = 1;
      xpAwarded = 2;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message,
          tokensAwarded,
          xpAwarded,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/chats/[chatId]/messages error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
