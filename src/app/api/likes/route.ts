import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction, writeQueue, awardXPBackground } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

const VALID_REACTIONS = ["like", "wow", "omg", "wtf", "laughing", "sad", "care", "prayers"];

const TOKEN_AWARDS: Record<string, { tokens: number; xp: number; action: string }> = {
  post: { tokens: 1, xp: 2, action: "like_post" },
  reel: { tokens: 1, xp: 2, action: "like_reel" },
  danceEntry: { tokens: 1, xp: 2, action: "like_dance_entry" },
  hubPost: { tokens: 1, xp: 2, action: "like_hub_post" },
};

const LIKES_COUNT_FIELDS: Record<string, { model: string; field: string }> = {
  post: { model: "post", field: "likesCount" },
  reel: { model: "reel", field: "likesCount" },
  danceEntry: { model: "danceEntry", field: "likesCount" },
  hubPost: { model: "hubPost", field: "likesCount" },
  // Comments don't have a likesCount column — likes are counted via Like table aggregation
};

// POST /api/likes - Toggle reaction
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { targetId, targetType, reactionType } = body;

    if (!targetId || !targetType) {
      return NextResponse.json(
        { success: false, error: "targetId and targetType are required" },
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

    // Default to "like" if no reaction type specified
    const reaction = reactionType || "like";
    if (!VALID_REACTIONS.includes(reaction)) {
      return NextResponse.json(
        { success: false, error: `Invalid reactionType. Must be one of: ${VALID_REACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Use serialized transaction for the critical path (like toggle + count update only)
    const result = await serializedTransaction(async (tx) => {
      const existingLike = await tx.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: auth.userId!,
            targetId,
            targetType,
          },
        },
        select: { id: true, reactionType: true },
      });

      if (existingLike) {
        // If same reaction type — remove it (toggle off)
        if (existingLike.reactionType === reaction) {
          const deleteOp = tx.like.delete({ where: { id: existingLike.id } });
          const countConfig = LIKES_COUNT_FIELDS[targetType];
          const countOp = countConfig
            ? (tx as any)[countConfig.model].update({
                where: { id: targetId },
                data: { [countConfig.field]: { decrement: 1 } },
              })
            : Promise.resolve();
          await Promise.all([deleteOp, countOp]);
          return { liked: false, reactionType: null };
        } else {
          // Different reaction type — update the reaction (no count change)
          const updated = await tx.like.update({
            where: { id: existingLike.id },
            data: { reactionType: reaction },
          });
          return { liked: true, reactionType: reaction };
        }
      } else {
        // New reaction - add the like and increment count in parallel
        const createOp = tx.like.create({
          data: {
            userId: auth.userId!,
            targetId,
            targetType,
            reactionType: reaction,
          },
        });
        const countConfig = LIKES_COUNT_FIELDS[targetType];
        const countOp = countConfig
          ? (tx as any)[countConfig.model].update({
              where: { id: targetId },
              data: { [countConfig.field]: { increment: 1 } },
            })
          : Promise.resolve();
        await Promise.all([createOp, countOp]);
        return { liked: true, reactionType: reaction };
      }
    });

    // Defer token/XP award and notification to background write queue (non-blocking for the response)
    if (result.liked) {
      const award = TOKEN_AWARDS[targetType];
      if (award) {
        const userId = auth.userId!;
        writeQueue.run(async () => {
          try {
            await db.tokenAction.create({
              data: {
                userId,
                action: award.action,
                targetId,
                tokensEarned: award.tokens,
                xpEarned: award.xp,
              },
            });
            await awardXPBackground(userId, award.tokens, award.xp);
          } catch {
            // Token award is best-effort; if it fails (e.g., duplicate), skip silently
          }
        }).catch(() => {});
      }

      // Create notification for the content owner (non-blocking)
      const targetOwnerQuery: Record<string, () => Promise<{ ownerId: string; id: string; postId?: string } | null>> = {
        post: () => db.post.findUnique({ where: { id: targetId }, select: { authorId: true, id: true } }).then(p => p ? { ownerId: p.authorId, id: p.id, postId: p.id } : null),
        reel: () => db.reel.findUnique({ where: { id: targetId }, select: { creatorId: true, id: true } }).then(r => r ? { ownerId: r.creatorId, id: r.id } : null),
        danceEntry: () => db.danceEntry.findUnique({ where: { id: targetId }, select: { authorId: true, id: true } }).then(e => e ? { ownerId: e.authorId, id: e.id } : null),
        hubPost: () => db.hubPost.findUnique({ where: { id: targetId }, select: { authorId: true, id: true } }).then(h => h ? { ownerId: h.authorId, id: h.id } : null),
        comment: () => db.comment.findUnique({ where: { id: targetId }, select: { authorId: true, id: true, postId: true } }).then(c => c ? { ownerId: c.authorId, id: c.id, postId: c.postId } : null),
      };

      const ownerQuery = targetOwnerQuery[targetType];
      if (ownerQuery) {
        writeQueue.run(async () => {
          try {
            const target = await ownerQuery();
            if (target && target.ownerId !== auth.userId) {
              const reactionEmojis: Record<string, string> = {
                like: '❤️',
                wow: '😮',
                omg: '😱',
                wtf: '🤯',
                laughing: '😂',
                sad: '😢',
                care: '🥰',
                prayers: '🙏',
              };
              const emoji = reactionEmojis[reaction] || '❤️';
              const actionText = targetType === 'post' ? `reacted ${emoji} to your post`
                : targetType === 'reel' ? `reacted ${emoji} to your reel`
                : targetType === 'danceEntry' ? `reacted ${emoji} to your dance entry`
                : targetType === 'comment' ? `reacted ${emoji} to your comment`
                : `reacted ${emoji} to your hub post`;
              await db.notification.create({
                data: {
                  action: actionText,
                  type: 'like',
                  userId: target.ownerId,
                  triggeredByUserId: auth.userId,
                  thumbnail: '',
                  postId: target.postId || (targetType === 'post' ? targetId : null),
                },
              });
            }
          } catch {
            // Notification creation is best-effort
          }
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
