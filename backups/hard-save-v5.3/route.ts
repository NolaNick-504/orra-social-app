import { NextRequest, NextResponse } from "next/server";
import { db, serializedTransaction, writeQueue } from "@/lib/db";
import { getAuthUser, requireAuth } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
// Fallback for standalone mode: also check project root
const PROJECT_UPLOAD_DIR = path.resolve(process.cwd(), "..", "..", "public", "uploads");

function getUploadDir(): string {
  // Use project root if running in standalone mode (cwd is .next/standalone/)
  if (existsSync(PROJECT_UPLOAD_DIR)) {
    return PROJECT_UPLOAD_DIR;
  }
  return UPLOAD_DIR;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

// Helper to build post metadata with echo support
function buildPostMeta(
  post: any,
  currentUser: { id: string } | null,
  userLikes: Set<string>,
  userReactions: Record<string, string>,
  userSaves: Set<string>,
  userReposts: Set<string>,
  echoedBy: { id: string; name: string; handle: string; avatar: string; verified: boolean } | null = null,
  echoedAt: Date | null = null,
) {
  // Build poll data if present
  let pollData: {
    id: string;
    question: string;
    options: { id: string; text: string; voteCount: number; voted: boolean }[];
    totalVotes: number;
    expiresAt: Date;
  } | undefined = undefined;
  if (post.poll) {
    const totalVotes = post.poll.options.reduce(
      (sum: number, opt: any) => sum + opt.votes.length,
      0,
    );
    pollData = {
      id: post.poll.id,
      question: post.poll.question,
      options: post.poll.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.votes.length,
        voted: currentUser
          ? opt.votes.some((v: any) => v.userId === currentUser.id)
          : false,
      })),
      totalVotes,
      expiresAt: post.poll.expiresAt,
    };
  }

  return {
    id: post.id,
    text: post.text,
    images: post.images,
    vibeTag: post.vibeTag,
    type: post.type,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    sharesCount: post.sharesCount,
    author: post.author,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isLiked: currentUser ? userLikes.has(post.id) : false,
    myReaction: currentUser ? (userReactions[post.id] || null) : null,
    isSaved: currentUser ? userSaves.has(post.id) : false,
    isReposted: currentUser ? userReposts.has(post.id) : false,
    echoedBy,
    echoedAt,
    _isEcho: echoedBy !== null,
    _count: post._count,
    poll: pollData,
  };
}

// GET /api/posts - Get feed posts (paginated)
// Supports: ?authorId=xxx → posts by that author AND posts they echoed
// Main feed merges regular posts + echo (repost) entries so echoed posts surface at the top
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const vibeTag = searchParams.get("vibeTag") || undefined;
    const authorId = searchParams.get("authorId") || undefined;

    const currentUser = await getAuthUser();
    const skip = (page - 1) * limit;

    const where: any = {};
    if (vibeTag) where.vibeTag = vibeTag;
    if (authorId) {
      // Include both authored posts AND posts echoed by this user
      where.OR = [
        { authorId },
        { reposts: { some: { userId: authorId } } },
      ];
    }

    // Fetch current user's likes/saves/reposts in bulk (one query each instead of per-post sub-queries)
    let userLikes = new Set<string>();
    let userReactions: Record<string, string> = {}; // postId -> reactionType
    let userSaves = new Set<string>();
    let userReposts = new Set<string>();
    // Track who echoed posts (for showing "echoed by" on profile)
    let echoUsers: Record<string, { id: string; name: string; handle: string; avatar: string; verified: boolean }> = {};

    if (authorId) {
      // When viewing a profile, fetch echo user info for reposted posts
      const userRepostsData = await db.repost.findMany({
        where: { userId: authorId },
        select: { postId: true, user: { select: { id: true, name: true, handle: true, avatar: true, verified: true } } },
      });
      userRepostsData.forEach(r => {
        echoUsers[r.postId] = r.user;
      });
    }

    if (currentUser) {
      const [likes, saves, reposts] = await Promise.all([
        db.like.findMany({ where: { userId: currentUser.id, targetType: 'post' }, select: { targetId: true, reactionType: true } }),
        db.save.findMany({ where: { userId: currentUser.id, targetType: 'post' }, select: { targetId: true } }),
        db.repost.findMany({ where: { userId: currentUser.id }, select: { postId: true } }),
      ]);
      userLikes = new Set(likes.map(l => l.targetId));
      likes.forEach(l => { userReactions[l.targetId] = l.reactionType; });
      userSaves = new Set(saves.map(s => s.targetId));
      userReposts = new Set(reposts.map(r => r.postId));
    }

    // Fetch regular posts
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
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
          poll: {
            include: {
              options: {
                include: {
                  votes: {
                    select: { id: true, userId: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              postSaves: true,
              reposts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit * 3, // Fetch extra so we have room after merging with echo entries
      }),
      db.post.count({ where }),
    ]);

    // Also fetch recent reposts so echoed posts surface at the top of the feed
    // Only for the main feed (no authorId filter) — profile view already handles echoes via where.OR
    let echoEntries: any[] = [];
    if (!authorId) {
      const reposts = await db.repost.findMany({
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        include: {
          user: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
          post: {
            include: {
              author: {
                select: { id: true, name: true, handle: true, avatar: true, verified: true },
              },
              poll: {
                include: {
                  options: {
                    include: {
                      votes: { select: { id: true, userId: true } },
                    },
                  },
                },
              },
              _count: {
                select: { comments: true, postSaves: true, reposts: true },
              },
            },
          },
        },
      });

      // Convert each repost into a virtual "echo post" entry
      // Each echo gets a unique _echoId (the repost's own ID) so it doesn't clash with the original post
      echoEntries = reposts
        .filter(r => r.post !== null) // safety: skip if original post was deleted
        .map(r => {
          const meta = buildPostMeta(r.post, currentUser ? { id: currentUser.id } : null, userLikes, userReactions, userSaves, userReposts, r.user, r.createdAt);
          return { ...meta, _echoId: r.id }; // unique per-repost ID
        });
    }

    // Build regular post entries (with echoedBy for profile view)
    const postsWithMeta = posts.map((post) =>
      buildPostMeta(post, currentUser ? { id: currentUser.id } : null, userLikes, userReactions, userSaves, userReposts, echoUsers[post.id] || null, null),
    );

    // Merge regular posts + echo entries and sort by effective date
    // For regular posts the effective date is post.createdAt
    // For echo entries the effective date is echoedAt (the repost time)
    const allEntries = [...postsWithMeta, ...echoEntries];

    // Deduplicate only exact duplicates (same post, same echo context)
    // Regular posts and echo entries are DIFFERENT feed items — the original stays and the echo is a separate card
    // We use a composite key: for echoes it's "echo:<repostId>", for regular posts it's just the postId
    const seen = new Map<string, number>();
    allEntries.forEach((entry, idx) => {
      const key = entry._isEcho && entry._echoId ? `echo:${entry._echoId}` : entry.id;
      if (!seen.has(key)) {
        seen.set(key, idx);
      }
    });
    const dedupedEntries = Array.from(seen.values()).map(idx => allEntries[idx]);

    // Sort: echo entries use echoedAt, regular entries use createdAt
    dedupedEntries.sort((a, b) => {
      const dateA = a._isEcho && a.echoedAt ? new Date(a.echoedAt).getTime() : new Date(a.createdAt).getTime();
      const dateB = b._isEcho && b.echoedAt ? new Date(b.echoedAt).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // Apply pagination on the merged & sorted result
    const paginatedEntries = dedupedEntries.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        posts: paginatedEntries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post (with optional file uploads as base64)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { text, images, vibeTag, type, uploadedFiles } = body;

    // Text is required for text/poll posts, but optional for image/video posts (caption is optional)
    const postTypeRequested = type || (images && images.length > 0 ? "image" : "text");
    if ((!text || text.trim().length === 0) && (postTypeRequested === 'text' || postTypeRequested === 'poll')) {
      return NextResponse.json(
        { success: false, error: "Post text is required" },
        { status: 400 }
      );
    }

    // Determine post type
    const postType = type || (images && images.length > 0 ? "image" : "text");

    // Process uploaded files (base64) if present
    let processedImageUrls: string[] = images || [];
    const uploadDir = getUploadDir();
    if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      // Ensure upload directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      for (const fileData of uploadedFiles) {
        const { data: base64Data, filename, contentType } = fileData;
        const isImage = ALLOWED_IMAGE_TYPES.has(contentType);
        const isVideo = ALLOWED_VIDEO_TYPES.has(contentType);

        if (!isImage && !isVideo) continue;

        // Extract raw base64 data (remove data:xxx;base64, prefix)
        const base64Match = base64Data.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) continue;

        const buffer = Buffer.from(base64Match[1], "base64");

        // Validate file size (10MB for images, 50MB for videos)
        const maxImageSize = 10 * 1024 * 1024;
        const maxVideoSize = 50 * 1024 * 1024;
        const maxSize = isImage ? maxImageSize : maxVideoSize;
        if (buffer.length > maxSize) {
          return NextResponse.json(
            { success: false, error: `File too large. Maximum size is ${isImage ? '10MB' : '50MB'}` },
            { status: 400 }
          );
        }

        // Generate unique filename
        // NOTE: sharp converts ALL images to JPEG, so always use .jpg for images
        // Keeping the original extension (e.g. .webp) after JPEG conversion causes browser rendering failures
        const ext = isImage ? ".jpg" : (path.extname(filename || "") || ".mp4");
        const safeFilename = `${crypto.randomUUID()}${ext}`;
        const filepath = path.join(uploadDir, safeFilename);

        if (isImage) {
          // Dynamic import sharp to avoid build-time issues
          const sharp = (await import("sharp")).default;
          await sharp(buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(filepath);
        } else {
          await writeFile(filepath, buffer);
        }

        processedImageUrls.push(`/uploads/${safeFilename}`);
      }
    }

    // Use serialized transaction for the critical path (post creation only)
    // Token/XP awards are deferred to avoid blocking the write queue
    const post = await serializedTransaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          text: text ? text.trim() : "",
          images: JSON.stringify(processedImageUrls),
          vibeTag: vibeTag || "hyped",
          type: postType,
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

      return newPost;
    });

    // Defer token/XP award to background write queue (non-blocking for the response)
    // This keeps the critical transaction short and fast
    // Post rewards: 5 tokens, 10 XP per post
    const userId = auth.userId!;
    const postId = post.id;
    writeQueue.run(async () => {
      try {
        await db.tokenAction.create({
          data: {
            userId,
            action: "post",
            targetId: postId,
            tokensEarned: 5,
            xpEarned: 10,
          },
        });
        await db.user.update({
          where: { id: userId },
          data: {
            auraTokens: { increment: 5 },
            auraXP: { increment: 10 },
          },
        });
      } catch {
        // Token award is best-effort; if it fails (e.g., duplicate), skip silently
      }
    }).catch(() => {});

    return NextResponse.json(
      { success: true, data: { ...post, isLiked: false, isSaved: false, isReposted: false, poll: null } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
