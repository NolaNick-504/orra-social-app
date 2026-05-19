import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET /api/dance - Get active dance challenge with leaderboard
export async function GET() {
  try {
    const userId = await getAuthUserId();

    const challenge = await db.danceChallenge.findFirst({
      where: { active: true },
      include: {
        entries: {
          orderBy: { likesCount: "desc" },
          take: 20,
          include: {
            author: {
              select: { id: true, name: true, handle: true, avatar: true },
            },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({
        success: true,
        data: { challenge: null, leaderboard: [] },
      });
    }

    // Check if current user has already submitted an entry
    let hasSubmitted = false;
    if (userId) {
      const existingEntry = await db.danceEntry.findFirst({
        where: { challengeId: challenge.id, authorId: userId },
      });
      hasSubmitted = !!existingEntry;
    }

    const leaderboard = challenge.entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      data: {
        challenge: {
          id: challenge.id,
          name: challenge.name,
          hashtag: challenge.hashtag,
          song: challenge.song,
          description: challenge.description,
          prize: challenge.prize,
          secondPrize: challenge.secondPrize,
          thirdPrize: challenge.thirdPrize,
          bannerImage: challenge.bannerImage,
          timeRemaining: challenge.timeRemaining,
          active: challenge.active,
          hasSubmitted,
          totalEntries: challenge.entries.length,
        },
        leaderboard,
      },
    });
  } catch (error) {
    console.error("GET /api/dance error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
