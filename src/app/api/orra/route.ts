import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET /api/orra - Get current user's ORRA stats
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        handle: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        auraTokens: true,
        auraLevel: true,
        auraXP: true,
        dailyStreak: true,
        lastActiveDate: true,
        badges: true,
        profileSetupComplete: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Calculate level progress (1000 XP per level, resets at 1000)
    const xpForNextLevel = 1000;
    const xpProgress = user.auraXP % 1000;

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        badges: JSON.parse(user.badges),
        xpForNextLevel,
        xpProgress,
      },
    });
  } catch (error) {
    console.error("GET /api/orra error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/orra - Check daily streak and award tokens if new day
export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, dailyStreak: true, lastActiveDate: true, auraTokens: true, auraXP: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Check if already claimed today
    if (user.lastActiveDate === todayStr) {
      return NextResponse.json({
        success: true,
        data: {
          streak: user.dailyStreak,
          tokensAwarded: 0,
          xpAwarded: 0,
          message: "Daily streak already claimed today",
        },
      });
    }

    // Check if yesterday was the last active day (streak continues)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = 1;
    if (user.lastActiveDate === yesterdayStr) {
      newStreak = user.dailyStreak + 1;
    }

    // Award tokens based on streak (consecutive = 5 tokens, new = 2 tokens)
    const tokensAwarded = newStreak > 1 ? 5 : 2;
    const xpAwarded = newStreak > 1 ? 5 : 2;

    // Check if already awarded today via TokenAction
    const existingAction = await db.tokenAction.findFirst({
      where: {
        userId,
        action: "daily_streak",
        targetId: todayStr,
      },
    });

    if (existingAction) {
      // Already awarded but date not updated (shouldn't happen, but safety check)
      return NextResponse.json({
        success: true,
        data: {
          streak: newStreak,
          tokensAwarded: 0,
          xpAwarded: 0,
          message: "Daily streak already claimed today",
        },
      });
    }

    await db.$transaction([
      db.tokenAction.create({
        data: {
          userId,
          action: "daily_streak",
          targetId: todayStr,
          tokensEarned: tokensAwarded,
          xpEarned: xpAwarded,
        },
      }),
      db.user.update({
        where: { id: userId },
        data: {
          dailyStreak: newStreak,
          lastActiveDate: todayStr,
          auraTokens: { increment: tokensAwarded },
          auraXP: { increment: xpAwarded },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        streak: newStreak,
        tokensAwarded,
        xpAwarded,
        message: newStreak > 1 ? `Streak continued! Day ${newStreak}` : "New streak started!",
      },
    });
  } catch (error) {
    console.error("POST /api/orra error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
