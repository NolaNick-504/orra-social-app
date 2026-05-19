import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction } from "@/lib/db";

// POST /api/auto-like — Internal auto-liker endpoint for bot engagement
// Creates a like/reaction from a bot user (uses NEXTAUTH_SECRET as API key)
export async function POST(req: NextRequest) {
  try {
    // Simple auth check to prevent abuse
    const authHeader = req.headers.get('x-autopost-key');
    const expectedKey = process.env.AUTOPOST_KEY || process.env.NEXTAUTH_SECRET || 'orra-internal';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetId, targetType, reactionType, userId } = body;

    if (!targetId || !targetType || !userId) {
      return NextResponse.json(
        { success: false, error: "targetId, targetType, and userId are required" },
        { status: 400 }
      );
    }

    const validTypes = ["post", "reel", "danceEntry", "hubPost", "comment"];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json(
        { success: false, error: `Invalid targetType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const VALID_REACTIONS = ["like", "wow", "omg", "wtf", "laughing", "sad", "care", "prayers"];
    const reaction = reactionType || "like";
    if (!VALID_REACTIONS.includes(reaction)) {
      return NextResponse.json(
        { success: false, error: `Invalid reactionType. Must be one of: ${VALID_REACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const LIKES_COUNT_FIELDS: Record<string, { model: string; field: string }> = {
      post: { model: "post", field: "likesCount" },
      reel: { model: "reel", field: "likesCount" },
      danceEntry: { model: "danceEntry", field: "likesCount" },
      hubPost: { model: "hubPost", field: "likesCount" },
    };

    // Use serialized transaction
    const result = await serializedTransaction(async (tx) => {
      // Check if already liked
      const existingLike = await tx.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId,
            targetType,
          },
        },
        select: { id: true, reactionType: true },
      });

      if (existingLike) {
        // Already liked — update reaction type if different
        if (existingLike.reactionType !== reaction) {
          const updated = await tx.like.update({
            where: { id: existingLike.id },
            data: { reactionType: reaction },
          });
          return { liked: true, reactionType: reaction, id: updated.id };
        }
        return { liked: true, reactionType: existingLike.reactionType, id: existingLike.id };
      }

      // New reaction - create the like
      const newLike = await tx.like.create({
        data: {
          userId,
          targetId,
          targetType,
          reactionType: reaction,
        },
      });

      // Increment likesCount if applicable
      const countConfig = LIKES_COUNT_FIELDS[targetType];
      if (countConfig) {
        await (tx as any)[countConfig.model].update({
          where: { id: targetId },
          data: { [countConfig.field]: { increment: 1 } },
        });
      }

      return { liked: true, reactionType: reaction, id: newLike.id };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Auto-like error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create like" },
      { status: 500 }
    );
  }
}
