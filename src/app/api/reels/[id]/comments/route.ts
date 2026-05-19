import { NextRequest, NextResponse } from "next/server";
import { db, writeQueue } from "@/lib/db";
import { getAuthUser, requireAuth } from "@/lib/auth-helpers";
import { sanitizeText, validateLength, CONTENT_LIMITS } from "@/lib/sanitize";

export const dynamic = 'force-dynamic';

// GET /api/reels/[id]/comments - Get comments for a reel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reelId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const reel = await db.reel.findUnique({ where: { id: reelId } });
    if (!reel) {
      return NextResponse.json(
        { success: false, error: "Reel not found" },
        { status: 404 }
      );
    }

    const [comments, total] = await Promise.all([
      db.reelComment.findMany({
        where: { reelId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
              verified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.reelComment.count({ where: { reelId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching reel comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/reels/[id]/comments - Add a comment to a reel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id: reelId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Comment text is required" },
        { status: 400 }
      );
    }

    const textError = validateLength(text, 1, CONTENT_LIMITS.COMMENT_TEXT, 'Comment');
    if (textError) {
      return NextResponse.json({ success: false, error: textError }, { status: 400 });
    }

    const reel = await db.reel.findUnique({ where: { id: reelId } });
    if (!reel) {
      return NextResponse.json(
        { success: false, error: "Reel not found" },
        { status: 404 }
      );
    }

    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.reelComment.create({
        data: {
          text: sanitizeText(text.trim()),
          reelId,
          authorId: auth.userId!,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
              verified: true,
            },
          },
        },
      });

      // Increment comments count on the reel
      await tx.reel.update({
        where: { id: reelId },
        data: { commentsCount: { increment: 1 } },
      });

      // Award +2 tokens + 5 XP for commenting
      const existingAction = await tx.tokenAction.findUnique({
        where: {
          userId_action_targetId: {
            userId: auth.userId!,
            action: "reel_comment",
            targetId: newComment.id,
          },
        },
      });

      if (!existingAction) {
        await tx.tokenAction.create({
          data: {
            userId: auth.userId!,
            action: "reel_comment",
            targetId: newComment.id,
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

      return newComment;
    });

    // Create notification for the reel creator (deferred, non-blocking)
    if (reel.creatorId !== auth.userId!) {
      writeQueue.run(async () => {
        try {
          const commenter = await db.user.findUnique({
            where: { id: auth.userId! },
            select: { name: true },
          });
          await db.notification.create({
            data: {
              userId: reel.creatorId,
              action: `${commenter?.name || 'Someone'} commented on your reel: "${text.trim().slice(0, 50)}${text.trim().length > 50 ? '…' : ''}"`,
              type: 'comment',
              thumbnail: reel.thumbnail || '',
              triggeredByUserId: auth.userId!,
            },
          });
        } catch {
          // Notification creation is best-effort
        }
      }).catch(() => {});
    }

    return NextResponse.json(
      { success: true, data: comment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating reel comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
