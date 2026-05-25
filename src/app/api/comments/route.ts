import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, requireAuth } from "@/lib/auth-helpers";

// Bot user IDs for auto-responses
const BOT_USER_IDS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'u14', 'u15', 'u16'];

// Response templates for auto-responses
const AUTO_RESPONSES = [
  "That's a great point! 🔥",
  "Facts! Couldn't agree more",
  "Real talk right here 💯",
  "This! So true",
  "You spoke nothing but facts",
  "I was just thinking the same thing!",
  "Preach! 🙌",
  "Nailed it! This needs to be said more",
  "Absolutely! More people need to hear this",
  "100% agree with you on that",
  "Spot on! No lies detected",
  "Yesss! Finally someone said it",
  "This comment hits different 💯",
  "W take 🔥",
  "No cap, this is exactly right",
  "Say it louder for the people in the back!",
  "Can we get this pinned? 📌",
  "The realest comment here",
  "Bro you took the words right out of my mouth",
  "Underrated comment fr fr",
];

// GET /api/comments?postId=xxx - Get comments for a post
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const repostId = searchParams.get("repostId") || null;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId query parameter is required" },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const currentUser = await getAuthUser();

    // If repostId is provided, filter by { postId, repostId } to get echo-specific comments.
    // If repostId is NOT provided, filter by { postId, repostId: null } to only get original post comments.
    const commentWhere: any = repostId
      ? { postId, repostId }
      : { postId, repostId: null };

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: commentWhere,
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
      db.comment.count({ where: commentWhere }),
    ]);

    // Get like counts and current user's likes for each comment
    const commentIds = comments.map((c) => c.id);

    const [likeCounts, userLikes] = await Promise.all([
      // Count likes per comment
      currentUser
        ? db.like.groupBy({
            by: ['targetId'],
            where: { targetId: { in: commentIds }, targetType: 'comment' },
            _count: { id: true },
          })
        : [],
      // Get current user's likes on these comments
      currentUser
        ? db.like.findMany({
            where: { userId: currentUser.id, targetId: { in: commentIds }, targetType: 'comment' },
            select: { targetId: true, reactionType: true },
          })
        : [],
    ]);

    const likeCountMap = Object.fromEntries(
      likeCounts.map((lc: any) => [lc.targetId, lc._count.id])
    );
    const userLikeMap = Object.fromEntries(
      userLikes.map((ul: any) => [ul.targetId, ul.reactionType || 'like'])
    );

    const commentsWithLikes = comments.map((comment) => ({
      ...comment,
      likesCount: likeCountMap[comment.id] || 0,
      isLiked: !!userLikeMap[comment.id],
      myReaction: userLikeMap[comment.id] || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        comments: commentsWithLikes,
        currentUserId: currentUser?.id || null,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/comments - Add a comment
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { postId, text, repostId, parentId, replyToName } = body;

    if (!postId || !text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "postId and text are required" },
        { status: 400 }
      );
    }

    // Validate parentId if provided
    if (parentId) {
      const parentComment = await db.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Validate repostId if provided
    if (repostId) {
      const repost = await db.repost.findUnique({ where: { id: repostId } });
      if (!repost) {
        return NextResponse.json(
          { success: false, error: "Repost not found" },
          { status: 404 }
        );
      }
    }

    // Check post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          text: text.trim(),
          postId,
          authorId: auth.userId!,
          repostId: repostId || null,
          parentId: parentId || null,
          replyToName: replyToName || null,
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

      // Increment comments count on the post
      await tx.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      });

      // Award +5 tokens + 10 XP for commenting (anti-farming check)
      const existingAction = await tx.tokenAction.findUnique({
        where: {
          userId_action_targetId: {
            userId: auth.userId!,
            action: "comment",
            targetId: newComment.id,
          },
        },
      });

      if (!existingAction) {
        await tx.tokenAction.create({
          data: {
            userId: auth.userId!,
            action: "comment",
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

    // Create notification for the post author (non-blocking, best-effort)
    if (post.authorId !== auth.userId) {
      try {
        await db.notification.create({
          data: {
            action: 'commented on your post',
            type: 'comment',
            userId: post.authorId,
            triggeredByUserId: auth.userId,
            thumbnail: '',
            postId: postId,
          },
        });
      } catch {
        // Notification creation is best-effort
      }
    }

    // Auto-response: Schedule a bot reply after 10-15 seconds (non-blocking)
    // This runs after the response is sent — the user won't wait for it
    const postAuthorId = post.authorId;
    const commenterId = auth.userId!;
    // Pick a random bot that isn't the commenter or the post author
    const eligibleBots = BOT_USER_IDS.filter(id => id !== commenterId && id !== postAuthorId);
    if (eligibleBots.length > 0) {
      const botId = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
      const responseText = AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)];
      const delay = 10000 + Math.floor(Math.random() * 5000); // 10-15 seconds
      const autoPostId = postId; // Capture for closure

      setTimeout(async () => {
        try {
          const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:3000`;
          const apiKey = process.env.AUTOPOST_KEY || process.env.NEXTAUTH_SECRET || 'orra-internal-autopost-2026';
          // 10s timeout to prevent hung connections accumulating
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10_000);
          try {
            await fetch(`${baseUrl}/api/auto-comment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-autopost-key': apiKey,
              },
              body: JSON.stringify({
                postId: autoPostId,
                text: responseText,
                authorId: botId,
              }),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeout);
          }
        } catch (err) {
          // Auto-response is best-effort; don't log errors loudly
        }
      }, delay);
    }

    return NextResponse.json(
      { success: true, data: comment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
