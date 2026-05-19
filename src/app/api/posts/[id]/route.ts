import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, requireAuth } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

// GET /api/posts/[id] - Get single post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getAuthUser();

    // Check for optional repostId search param (echo context)
    const { searchParams } = new URL(req.url);
    const repostId = searchParams.get("repostId");

    const post = await db.post.findUnique({
      where: { id },
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
        _count: {
          select: {
            comments: true,
            reposts: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Get current user's like on this post (polymorphic Like model)
    let isLiked = false;
    let myReaction: string | null = null;
    let likesCount = post.likesCount;

    if (currentUser) {
      const userLike = await db.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: currentUser.id,
            targetId: id,
            targetType: 'post',
          },
        },
        select: { reactionType: true },
      });
      isLiked = !!userLike;
      myReaction = userLike?.reactionType || null;
    }

    // Check if saved (polymorphic Save model uses targetId/targetType)
    let isSaved = false;
    if (currentUser) {
      const save = await db.save.findFirst({
        where: { userId: currentUser.id, targetId: id, targetType: 'post' },
        select: { id: true },
      });
      isSaved = !!save;
    }

    // Check if reposted
    let isReposted = false;
    if (currentUser) {
      const repost = await db.repost.findFirst({
        where: { userId: currentUser.id, postId: id },
        select: { id: true },
      });
      isReposted = !!repost;
    }

    const postWithMeta = {
      id: post.id,
      text: post.text,
      images: post.images,
      vibeTag: post.vibeTag,
      type: post.type,
      likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      author: post.author,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked,
      isSaved,
      isReposted,
      myReaction,
      _count: post._count,
    };

    // If repostId is provided, look up the Repost record and include echo context
    if (repostId) {
      const repost = await db.repost.findUnique({
        where: { id: repostId },
        include: {
          user: {
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

      if (repost) {
        // Count echo-specific comments
        const echoCommentsCount = await db.comment.count({
          where: { postId: id, repostId },
        });

        (postWithMeta as any).echoedBy = {
          id: repost.user.id,
          name: repost.user.name,
          handle: repost.user.handle,
          avatar: repost.user.avatar,
          verified: repost.user.verified,
        };
        (postWithMeta as any).echoedAt = repost.createdAt;
        (postWithMeta as any)._isEcho = true;
        (postWithMeta as any)._echoId = repostId;
        (postWithMeta as any).echoCommentsCount = echoCommentsCount;
      }
    }

    return NextResponse.json({ success: true, data: postWithMeta });
  } catch (error) {
    console.error("Error fetching post:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch post";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete own post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id } = await params;

    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.authorId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    await db.post.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { message: "Post deleted" } });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
