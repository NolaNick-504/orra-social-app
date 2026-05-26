import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db, awardXPAndTokens } from "@/lib/db";

// POST /api/dance/entries - Submit dance entry
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { description, thumbnail, challengeId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: "challengeId is required" },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: "description is required" },
        { status: 400 }
      );
    }

    // Verify challenge exists and is active
    const challenge = await db.danceChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }
    if (!challenge.active) {
      return NextResponse.json({ success: false, error: "Challenge is no longer active" }, { status: 400 });
    }

    // Check if user already submitted (anti-farming via TokenAction)
    const existingAction = await db.tokenAction.findUnique({
      where: {
        userId_action_targetId: {
          userId,
          action: "dance_entry",
          targetId: challengeId,
        },
      },
    });

    if (existingAction) {
      return NextResponse.json(
        { success: false, error: "You have already submitted an entry for this challenge" },
        { status: 400 }
      );
    }

    // Create entry and track token action in a transaction
    const entry = await db.$transaction(async (tx) => {
      const newEntry = await tx.danceEntry.create({
        data: {
          description,
          thumbnail: thumbnail || "",
          authorId: userId,
          challengeId,
        },
        include: {
          author: {
            select: { id: true, name: true, handle: true, avatar: true },
          },
        },
      });

      // Track token action to prevent farming
      await tx.tokenAction.create({
        data: {
          userId,
          action: "dance_entry",
          targetId: challengeId,
          tokensEarned: 5,
          xpEarned: 10,
        },
      });

      return newEntry;
    });

    // Award +5 tokens + 10 XP (outside transaction — awardXPAndTokens has its own write queue)
    await awardXPAndTokens(userId, 5, 10);

    return NextResponse.json(
      {
        success: true,
        data: {
          entry,
          tokensAwarded: 5,
          xpAwarded: 10,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/dance/entries error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
