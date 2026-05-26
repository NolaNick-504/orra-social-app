import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, requireAuth } from "@/lib/auth-helpers";
import { db, writeQueue, awardXPBackground } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
// Fallback for standalone mode: also check project root
const PROJECT_UPLOAD_DIR = path.resolve(process.cwd(), "..", "..", "public", "uploads");

function getUploadDir(): string {
  if (existsSync(PROJECT_UPLOAD_DIR)) {
    return PROJECT_UPLOAD_DIR;
  }
  return UPLOAD_DIR;
}

// GET /api/reels - Get reels (paginated, filtered by category)
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();

    const url = new URL(request.url);
    const category = url.searchParams.get("category") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const where = category ? { category } : {};

    const [reels, total] = await Promise.all([
      db.reel.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
        },
      }),
      db.reel.count({ where }),
    ]);

    // Check likes and saves for the current user
    let likedTargetIds: Set<string> = new Set();
    let savedTargetIds: Set<string> = new Set();

    if (userId && reels.length > 0) {
      const reelIds = reels.map((r) => r.id);

      const [likes, saves] = await Promise.all([
        db.like.findMany({
          where: {
            userId,
            targetType: "reel",
            targetId: { in: reelIds },
          },
          select: { targetId: true },
        }),
        db.save.findMany({
          where: {
            userId,
            targetType: "reel",
            targetId: { in: reelIds },
          },
          select: { targetId: true },
        }),
      ]);

      likedTargetIds = new Set(likes.map((l) => l.targetId));
      savedTargetIds = new Set(saves.map((s) => s.targetId));
    }

    const reelsWithInteractions = reels.map((reel) => ({
      id: reel.id,
      title: reel.title,
      thumbnail: reel.thumbnail,
      videoUrl: reel.videoUrl,
      views: reel.views,
      likesCount: reel.likesCount,
      commentsCount: reel.commentsCount,
      category: reel.category,
      song: reel.song,
      isRemix: reel.isRemix,
      isLive: reel.isLive,
      createdAt: reel.createdAt,
      creator: reel.creator,
      isLiked: likedTargetIds.has(reel.id),
      isSaved: savedTargetIds.has(reel.id),
    }));

    return NextResponse.json({
      success: true,
      data: {
        reels: reelsWithInteractions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/reels error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/reels - Create a new reel (supports base64 video upload)
// Also supports auto-poster via x-autopost-key header
export async function POST(req: NextRequest) {
  try {
    // Check for auto-poster key first
    const autopostKey = req.headers.get('x-autopost-key');
    const expectedKey = process.env.NEXTAUTH_SECRET || 'orra-internal';
    let creatorId: string | null = null;

    if (autopostKey === expectedKey) {
      // Auto-poster mode: use creatorId from body
      const body = await req.json();
      creatorId = body.creatorId || null;
      if (!creatorId) {
        return NextResponse.json(
          { success: false, error: "creatorId required for auto-post" },
          { status: 400 }
        );
      }

      // Verify user exists
      const user = await db.user.findUnique({ where: { id: creatorId } });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Creator not found" },
          { status: 404 }
        );
      }

      const { title, thumbnail, videoUrl, category, song } = body;
      if (!title || !title.trim()) {
        return NextResponse.json(
          { success: false, error: "Title is required" },
          { status: 400 }
        );
      }

      const reel = await db.reel.create({
        data: {
          title: title.trim(),
          thumbnail: thumbnail || "",
          videoUrl: videoUrl || "",
          category: category || "Trending",
          song: song || "",
          creatorId,
          views: Math.floor(Math.random() * 500000) + 10000,
          likesCount: Math.floor(Math.random() * 5000) + 100,
          commentsCount: Math.floor(Math.random() * 200) + 5,
        },
        include: {
          creator: {
            select: { id: true, name: true, handle: true, avatar: true, verified: true },
          },
        },
      });

      return NextResponse.json({ success: true, data: reel }, { status: 201 });
    }

    // Normal authenticated user flow
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { title, thumbnail, videoUrl, category, song, videoFile } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Process video file if provided as base64
    let finalVideoUrl = videoUrl || "";
    const uploadDir = getUploadDir();
    if (videoFile && videoFile.data) {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const { data: base64Data, filename, contentType } = videoFile;
      const base64Match = base64Data.match(/^data:[^;]+;base64,(.+)$/);
      if (base64Match) {
        const buffer = Buffer.from(base64Match[1], "base64");
        const ext = path.extname(filename || "") || ".mp4";
        const safeFilename = `${crypto.randomUUID()}${ext}`;
        const filepath = path.join(uploadDir, safeFilename);
        await writeFile(filepath, buffer);
        finalVideoUrl = `/uploads/${safeFilename}`;
      }
    }

    if (!finalVideoUrl) {
      return NextResponse.json(
        { success: false, error: "Video is required" },
        { status: 400 }
      );
    }

    const reel = await db.reel.create({
      data: {
        title: title.trim(),
        thumbnail: thumbnail || "",
        videoUrl: finalVideoUrl,
        category: category || "Trending",
        song: song || "",
        creatorId: auth.userId!,
      },
      include: {
        creator: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    // Award 10 tokens + 20 XP for creating a reel
    const userId = auth.userId!;
    const reelId = reel.id;
    writeQueue.run(async () => {
      try {
        await db.tokenAction.create({
          data: {
            userId,
            action: "reel_create",
            targetId: reelId,
            tokensEarned: 10,
            xpEarned: 20,
          },
        });
        await awardXPBackground(userId, 10, 20);
      } catch {
        // Token award is best-effort
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: reel,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reels error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create reel" },
      { status: 500 }
    );
  }
}
