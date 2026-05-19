import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/notifications - Get notifications for authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          triggeredByUser: {
            select: { id: true, name: true, handle: true, avatar: true },
          },
        },
      }),
      db.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await db.notification.count({
      where: { userId, read: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notifications - Mark notification(s) as read
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, all } = body;

    if (all) {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, data: { message: "All notifications marked as read" } });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification id or { all: true } is required" },
        { status: 400 }
      );
    }

    // Mark single notification as read
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }

    if (notification.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true, data: { message: "Notification marked as read" } });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
