import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// POST /api/orra/streak - Check and update daily streak
export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, dailyStreak: true, lastActiveDate: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Already active today
    if (user.lastActiveDate === todayStr) {
      return NextResponse.json({
        success: true,
        data: {
          streak: user.dailyStreak,
          isActive: true,
          message: "Already active today",
        },
      });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = 1;
    let streakBroken = false;

    if (user.lastActiveDate === yesterdayStr) {
      newStreak = user.dailyStreak + 1;
    } else if (user.lastActiveDate && user.lastActiveDate !== yesterdayStr) {
      streakBroken = true;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        dailyStreak: newStreak,
        lastActiveDate: todayStr,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        streak: newStreak,
        streakBroken,
        isActive: true,
        message: streakBroken
          ? `Streak reset! New streak: Day ${newStreak}`
          : newStreak > 1
            ? `Streak continued! Day ${newStreak}`
            : "New streak started!",
      },
    });
  } catch (error) {
    console.error("POST /api/orra/streak error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
