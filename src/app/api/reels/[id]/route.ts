import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/reels/[id] - Get a single reel (increments view count)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    // First check if the reel exists (return 404 instead of 500 for missing reels)
    const existingReel = await db.reel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingReel) {
      return NextResponse.json(
        { success: false, error: "Reel not found" },
        { status: 404 }
      );
    }

    // Increment view count atomically
    const reel = await db.reel.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        creator: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    // Check if the current user has liked/saved this reel
    let isLiked = false;
    let isSaved = false;

    if (userId) {
      const [like, save] = await Promise.all([
        db.like.findUnique({
          where: {
            userId_targetId_targetType: {
              userId,
              targetId: id,
              targetType: "reel",
            },
          },
        }),
        db.save.findUnique({
          where: {
            userId_targetId_targetType: {
              userId,
              targetId: id,
              targetType: "reel",
            },
          },
        }),
      ]);
      isLiked = !!like;
      isSaved = !!save;
    }

    return NextResponse.json({
      success: true,
      data: {
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
        isLiked,
        isSaved,
      },
    });
  } catch (error) {
    console.error("GET /api/reels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Reel not found or internal server error" },
      { status: 500 }
    );
  }
}
