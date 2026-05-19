import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET /api/hubs - Get all hubs with member counts
export async function GET() {
  try {
    const userId = await getAuthUserId();

    const hubs = await db.hub.findMany({
      orderBy: { membersCount: "desc" },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
      },
    });

    // Check which hubs the user has joined
    let joinedHubIds: Set<string> = new Set();
    if (userId) {
      const memberships = await db.hubMember.findMany({
        where: { userId },
        select: { hubId: true },
      });
      joinedHubIds = new Set(memberships.map((m) => m.hubId));
    }

    const hubsWithMembership = hubs.map((hub) => ({
      id: hub.id,
      name: hub.name,
      icon: hub.icon,
      cover: hub.cover,
      description: hub.description,
      membersCount: hub._count.members,
      onlineCount: hub.onlineCount,
      postsCount: hub._count.posts,
      isMember: joinedHubIds.has(hub.id),
    }));

    return NextResponse.json({ success: true, data: hubsWithMembership });
  } catch (error) {
    console.error("GET /api/hubs error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
