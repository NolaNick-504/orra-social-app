import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// POST /api/chats/[chatId]/read - Mark chat as read
export async function POST(
  _request: Request,
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

    // Set unreadCount to 0 for the current user
    await db.chatMember.update({
      where: { id: membership.id },
      data: { unreadCount: 0 },
    });

    return NextResponse.json({ success: true, data: { unreadCount: 0 } });
  } catch (error) {
    console.error("POST /api/chats/[chatId]/read error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
