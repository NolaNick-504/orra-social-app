import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET /api/chats - Get all chats for the authenticated user
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const chatMembers = await db.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, handle: true, avatar: true, online: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { chat: { updatedAt: "desc" } },
    });

    const chats = chatMembers.map((cm) => {
      const otherMember = cm.chat.members.find((m) => m.userId !== userId);
      const lastMessage = cm.chat.messages[0];

      return {
        id: cm.chat.id,
        otherUser: otherMember?.user ?? null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              imageUrl: lastMessage.imageUrl,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: cm.unreadCount,
        updatedAt: cm.chat.updatedAt,
      };
    });

    return NextResponse.json({ success: true, data: chats });
  } catch (error) {
    console.error("GET /api/chats error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/chats - Create or get a chat with another user
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json({ success: false, error: "otherUserId is required" }, { status: 400 });
    }

    if (otherUserId === userId) {
      return NextResponse.json({ success: false, error: "Cannot create chat with yourself" }, { status: 400 });
    }

    // Check if other user exists
    const otherUser = await db.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if chat already exists between these two users
    const myChats = await db.chatMember.findMany({
      where: { userId },
      select: { chatId: true },
    });
    const chatIds = myChats.map((c) => c.chatId);

    let existingChat: any = null;
    if (chatIds.length > 0) {
      // Find a chat where the other user is also a member (only 2-member chats)
      const sharedChat = await db.chatMember.findFirst({
        where: {
          userId: otherUserId,
          chatId: { in: chatIds },
        },
        include: {
          chat: {
            include: {
              members: {
                include: {
                  user: {
                    select: { id: true, name: true, handle: true, avatar: true, online: true },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      // Verify it's only a 2-member chat
      if (sharedChat && sharedChat.chat.members.length === 2) {
        existingChat = sharedChat.chat;
      }
    }

    if (existingChat) {
      const myMember = existingChat.members.find((m) => m.userId === userId);
      return NextResponse.json({
        success: true,
        data: {
          id: existingChat.id,
          otherUser: otherUser,
          lastMessage: existingChat.messages[0] ?? null,
          unreadCount: myMember?.unreadCount ?? 0,
          updatedAt: existingChat.updatedAt,
        },
      });
    }

    // Create new chat with both members
    const newChat = await db.chat.create({
      data: {
        members: {
          create: [
            { userId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, handle: true, avatar: true, online: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newChat.id,
          otherUser,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: newChat.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/chats error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
