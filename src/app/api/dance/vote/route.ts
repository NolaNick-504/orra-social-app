import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db, awardXPAndTokens } from "@/lib/db";

// POST /api/dance/vote - Vote for a dance entry
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json(
        { success: false, error: "entryId is required" },
        { status: 400 }
      );
    }

    // Check if entry exists
    const entry = await db.danceEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    // Can't vote for own entry
    if (entry.authorId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot vote for your own entry" },
        { status: 400 }
      );
    }

    // Check if already voted (anti-farming via TokenAction)
    const existingAction = await db.tokenAction.findUnique({
      where: {
        userId_action_targetId: {
          userId,
          action: "dance_vote",
          targetId: entryId,
        },
      },
    });

    if (existingAction) {
      return NextResponse.json(
        { success: false, error: "You have already voted for this entry" },
        { status: 400 }
      );
    }

    // Vote and track token action in a transaction
    await db.$transaction(async (tx) => {
      // Increment entry likes
      await tx.danceEntry.update({
        where: { id: entryId },
        data: { likesCount: { increment: 1 } },
      });

      // Track token action
      await tx.tokenAction.create({
        data: {
          userId,
          action: "dance_vote",
          targetId: entryId,
          tokensEarned: 1,
          xpEarned: 2,
        },
      });
    });

    // Award +1 token + 2 XP to voter (outside transaction — awardXPAndTokens has its own write queue)
    await awardXPAndTokens(userId, 1, 2);

    return NextResponse.json({
      success: true,
      data: {
        tokensAwarded: 1,
        xpAwarded: 2,
      },
    });
  } catch (error) {
    console.error("POST /api/dance/vote error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
