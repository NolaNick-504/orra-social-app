import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction, writeQueue, awardXPAndTokens } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// POST /api/reposts - Toggle repost
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId is required" },
        { status: 400 }
      );
    }

    // Check post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Check existing repost INSIDE the transaction to prevent race conditions
    const result = await serializedTransaction(async (tx) => {
      const existingRepost = await tx.repost.findUnique({
        where: {
          userId_postId: {
            userId: auth.userId!,
            postId,
          },
        },
      });

      if (existingRepost) {
        // Remove repost
        await tx.repost.delete({ where: { id: existingRepost.id } });

        // Decrement shares count
        await tx.post.update({
          where: { id: postId },
          data: { sharesCount: { decrement: 1 } },
        });

        return { reposted: false, shouldAward: false };
      } else {
        // Add repost
        await tx.repost.create({
          data: {
            userId: auth.userId!,
            postId,
          },
        });

        // Increment shares count
        await tx.post.update({
          where: { id: postId },
          data: { sharesCount: { increment: 1 } },
        });

        // Award tokens ONLY if no TokenAction for "repost" + postId
        const existingAction = await tx.tokenAction.findUnique({
          where: {
            userId_action_targetId: {
              userId: auth.userId!,
              action: "repost",
              targetId: postId,
            },
          },
        });

        if (!existingAction) {
          await tx.tokenAction.create({
            data: {
              userId: auth.userId!,
              action: "repost",
              targetId: postId,
              tokensEarned: 2,
              xpEarned: 3,
            },
          });
        }

        return { reposted: true, shouldAward: !existingAction };
      }
    });

    // Award tokens + XP outside transaction (awardXPAndTokens has its own write queue)
    if (result.shouldAward) {
      await awardXPAndTokens(auth.userId!, 2, 3);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error toggling repost:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle repost" },
      { status: 500 }
    );
  }
}
