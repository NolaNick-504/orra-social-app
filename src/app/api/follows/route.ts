import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// POST /api/follows - Toggle follow
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    if (userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check target user exists
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.userId!,
          followingId: userId,
        },
      },
    });

    // Prevent unfollowing the founder (@nickorraceo) — founder follow is permanent
    if (existingFollow) {
      const targetUser = await db.user.findUnique({ where: { id: userId }, select: { handle: true } });
      if (targetUser?.handle === '@nickorraceo') {
        return NextResponse.json(
          { success: false, error: "You cannot unfollow the ORRA Founder", data: { following: true } },
          { status: 403 }
        );
      }
    }

    const result = await db.$transaction(async (tx) => {
      if (existingFollow) {
        // Unfollow
        await tx.follow.delete({ where: { id: existingFollow.id } });
        return { following: false };
      } else {
        // Follow
        await tx.follow.create({
          data: {
            followerId: auth.userId!,
            followingId: userId,
          },
        });

        // Award +5 tokens + 10 XP ONLY if no TokenAction for "follow" + targetId
        const existingAction = await tx.tokenAction.findUnique({
          where: {
            userId_action_targetId: {
              userId: auth.userId!,
              action: "follow",
              targetId: userId,
            },
          },
        });

        if (!existingAction) {
          await tx.tokenAction.create({
            data: {
              userId: auth.userId!,
              action: "follow",
              targetId: userId,
              tokensEarned: 2,
              xpEarned: 5,
            },
          });

          await tx.user.update({
            where: { id: auth.userId },
            data: {
              auraTokens: { increment: 2 },
              auraXP: { increment: 5 },
            },
          });
        }

        // Create notification for the followed user
        await tx.notification.create({
          data: {
            action: "started following you",
            type: "follow",
            userId,
            triggeredByUserId: auth.userId,
            thumbnail: "",
          },
        });

        return { following: true };
      }
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle follow" },
      { status: 500 }
    );
  }
}
