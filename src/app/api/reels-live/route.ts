import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/reels/live - Get currently live reels
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();

    const liveReels = await db.reel.findMany({
      where: { isLive: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        creator: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    // Check likes and saves for the current user
    let likedTargetIds: Set<string> = new Set();
    let savedTargetIds: Set<string> = new Set();

    if (userId && liveReels.length > 0) {
      const reelIds = liveReels.map((r) => r.id);
      const [likes, saves] = await Promise.all([
        db.like.findMany({
          where: { userId, targetType: "reel", targetId: { in: reelIds } },
          select: { targetId: true },
        }),
        db.save.findMany({
          where: { userId, targetType: "reel", targetId: { in: reelIds } },
          select: { targetId: true },
        }),
      ]);
      likedTargetIds = new Set(likes.map((l) => l.targetId));
      savedTargetIds = new Set(saves.map((s) => s.targetId));
    }

    const reelsWithInteractions = liveReels.map((reel) => ({
      id: reel.id,
      title: reel.title,
      thumbnail: reel.thumbnail,
      videoUrl: reel.videoUrl,
      views: reel.views,
      likesCount: reel.likesCount,
      commentsCount: reel.commentsCount,
      category: reel.category,
      song: reel.song,
      isRemix: reel.isRemix,
      isLive: reel.isLive,
      createdAt: reel.createdAt,
      creator: reel.creator,
      isLiked: likedTargetIds.has(reel.id),
      isSaved: savedTargetIds.has(reel.id),
    }));

    return NextResponse.json({
      success: true,
      reels: reelsWithInteractions,
    });
  } catch (error) {
    console.error("GET /api/reels/live error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/reels/live - Create a live reel (going live)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { title, category } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // End any existing live reel for this user before creating a new one
    await db.reel.updateMany({
      where: { creatorId: auth.userId!, isLive: true },
      data: { isLive: false },
    });

    // Create a live reel
    const reel = await db.reel.create({
      data: {
        title: title.trim(),
        thumbnail: "",
        videoUrl: "",
        category: category || "Trending",
        song: "",
        isLive: true,
        creatorId: auth.userId!,
      },
      include: {
        creator: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    // Award tokens for going live
    const userId = auth.userId!;
    const reelId = reel.id;
    try {
      await db.tokenAction.create({
        data: {
          userId,
          action: "live_start",
          targetId: reelId,
          tokensEarned: 5,
          xpEarned: 10,
        },
      });
      await db.user.update({
        where: { id: userId },
        data: {
          auraTokens: { increment: 5 },
          auraXP: { increment: 10 },
        },
      });
    } catch {
      // Token award is best-effort
    }

    return NextResponse.json({
      success: true,
      data: reel,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reels/live error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to go live" },
      { status: 500 }
    );
  }
}

// DELETE /api/reels/live - End a live stream
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { reelId } = body;

    if (!reelId) {
      return NextResponse.json(
        { success: false, error: "Reel ID is required" },
        { status: 400 }
      );
    }

    // Verify the reel belongs to the user and is live
    const reel = await db.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel || reel.creatorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: "Reel not found or not owned by you" },
        { status: 404 }
      );
    }

    // End the live stream
    await db.reel.update({
      where: { id: reelId },
      data: { isLive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Live stream ended",
    });
  } catch (error) {
    console.error("DELETE /api/reels/live error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to end live stream" },
      { status: 500 }
    );
  }
}
