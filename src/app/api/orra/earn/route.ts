import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// POST /api/orra/earn - Earn tokens for actions (like, comment, follow, etc.)
// Body: { action: string, targetId: string, tokens?: number, xp?: number }
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetId, tokens, xp } = body;

    if (!action || !targetId) {
      return NextResponse.json({ success: false, error: "Missing required fields: action, targetId" }, { status: 400 });
    }

    // Validate action type
    const validActions = [
      "like_post", "like_reel", "follow", "repost", "share_dm",
      "comment", "post", "chat", "hub_join", "dance_entry",
      "dance_vote", "reel_view", "daily_streak", "game_reward",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    // Default token/XP rewards per action type (matching client-side rates)
    const REWARD_MAP: Record<string, { tokens: number; xp: number }> = {
      like_post:    { tokens: 1, xp: 2 },
      like_reel:    { tokens: 1, xp: 2 },
      follow:       { tokens: 2, xp: 5 },
      repost:       { tokens: 2, xp: 3 },
      share_dm:     { tokens: 2, xp: 5 },
      comment:      { tokens: 2, xp: 5 },
      post:         { tokens: 5, xp: 10 },
      chat:         { tokens: 1, xp: 2 },
      hub_join:     { tokens: 5, xp: 10 },
      dance_entry:  { tokens: 5, xp: 10 },
      dance_vote:   { tokens: 1, xp: 2 },
      reel_view:    { tokens: 1, xp: 1 },
      daily_streak: { tokens: 5, xp: 5 },
      game_reward:  { tokens: 10, xp: 20 },
    };

    const reward = REWARD_MAP[action] || { tokens: tokens || 1, xp: xp || 2 };
    const tokensEarned = tokens !== undefined ? tokens : reward.tokens;
    const xpEarned = xp !== undefined ? xp : reward.xp;

    if (tokensEarned < 0 || xpEarned < 0) {
      return NextResponse.json({ success: false, error: "Invalid token/XP amount" }, { status: 400 });
    }

    // Anti-farming: check if this action was already recorded (dedup via TokenAction unique constraint)
    const existingAction = await db.tokenAction.findUnique({
      where: {
        userId_action_targetId: {
          userId,
          action,
          targetId,
        },
      },
    });

    if (existingAction) {
      return NextResponse.json({
        success: true,
        data: {
          action,
          targetId,
          tokensEarned: 0,
          xpEarned: 0,
          message: "Already earned tokens for this action",
        },
      });
    }

    // Record the action and update user balance atomically
    const user = await db.$transaction(async (tx) => {
      await tx.tokenAction.create({
        data: {
          userId,
          action,
          targetId,
          tokensEarned,
          xpEarned,
        },
      });

      // Calculate new level (1000 XP per level, matching client)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          auraTokens: { increment: tokensEarned },
          auraXP: { increment: xpEarned },
        },
        select: { auraTokens: true, auraLevel: true, auraXP: true },
      });

      // Level up check: 1000 XP per level
      let newLevel = updatedUser.auraLevel;
      let remainingXP = updatedUser.auraXP;
      while (remainingXP >= 1000) {
        newLevel++;
        remainingXP -= 1000;
      }
      if (newLevel !== updatedUser.auraLevel) {
        await tx.user.update({
          where: { id: userId },
          data: { auraLevel: newLevel, auraXP: remainingXP },
        });
      }

      return { ...updatedUser, auraLevel: newLevel, auraXP: remainingXP };
    });

    return NextResponse.json({
      success: true,
      data: {
        action,
        targetId,
        tokensEarned,
        xpEarned,
        newBalance: user.auraTokens,
        newLevel: user.auraLevel,
        newXP: user.auraXP,
        message: `Earned ${tokensEarned} tokens and ${xpEarned} XP for ${action}`,
      },
    });
  } catch (error) {
    console.error("POST /api/orra/earn error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
