import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

// Increase body size limit for story uploads (base64 images can be large)
export const maxBodyLength = 10 * 1024 * 1024; // 10MB

// Resolve public directories: standalone mode runs from .next/standalone/
const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public'),
  path.resolve(process.cwd(), '..', '..', 'public'),
];

/**
 * Save a base64 data URL as a file in public/uploads/stories/ and return the URL path.
 */
async function saveBase64AsFile(dataUrl: string, userId: string): Promise<string> {
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Sharp converts all images to JPEG for consistency and EXIF rotation
  const filename = `story-${userId.slice(0, 8)}-${crypto.createHash('md5').update(userId + 'story' + Date.now()).digest('hex').slice(0, 8)}.jpg`;

  const buffer = Buffer.from(base64Data, 'base64');

  for (const dir of PUBLIC_DIRS) {
    const uploadsDir = path.join(dir, 'uploads', 'stories');
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      // Use Sharp to auto-rotate based on EXIF and convert to JPEG
      const sharp = (await import('sharp')).default;
      await sharp(buffer)
        .rotate()
        .resize({ width: 1080, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(path.join(uploadsDir, filename));
    } catch (err) {
      console.warn(`Failed to save story to ${dir}:`, err);
    }
  }

  return `/api/uploads?path=uploads/stories/${filename}`;
}

// GET /api/stories - Get stories from users the current user follows (plus own stories)
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get all non-expired stories (for demo: show everyone's stories)
    // In production, you would filter by followed users only
    const now = new Date();
    const stories = await db.story.findMany({
      where: {
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true },
        },
      },
    });

    // Group stories by author
    const storiesByAuthor = stories.reduce(
      (acc, story) => {
        const authorId = story.authorId;
        if (!acc[authorId]) {
          acc[authorId] = {
            author: story.author,
            stories: [],
          };
        }
        acc[authorId].stories.push({
          id: story.id,
          image: story.image,
          viewed: story.viewed,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
        });
        return acc;
      },
      {} as Record<string, { author: { id: string; name: string; handle: string; avatar: string }; stories: { id: string; image: string; viewed: boolean; createdAt: Date; expiresAt: Date }[] }>
    );

    // Sort: own stories first, then by most recent story
    const sortedAuthors = Object.values(storiesByAuthor).sort((a, b) => {
      if (a.author.id === userId) return -1;
      if (b.author.id === userId) return 1;
      const aLatest = a.stories[0]?.createdAt.getTime() ?? 0;
      const bLatest = b.stories[0]?.createdAt.getTime() ?? 0;
      return bLatest - aLatest;
    });

    return NextResponse.json({ success: true, data: sortedAuthors });
  } catch (error) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/stories - Create a story
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image is required" },
        { status: 400 }
      );
    }

    // Handle base64 images by saving them as files
    let imageUrl = image;
    if (image.startsWith('data:')) {
      try {
        imageUrl = await saveBase64AsFile(image, userId);
      } catch (err) {
        console.error('Failed to save story image as file:', err);
        return NextResponse.json(
          { success: false, error: 'Failed to process image' },
          { status: 400 }
        );
      }
    } else if (image.startsWith('/images/') || image.startsWith('/uploads/')) {
      // Convert /images/... paths to API-served paths for consistency
      imageUrl = `/api/uploads?path=${image.slice(1)}`;
    }

    // Auto-set expiresAt to 24h from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await db.story.create({
      data: {
        image: imageUrl,
        authorId: userId,
        expiresAt,
      },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: story.id,
          image: story.image,
          viewed: story.viewed,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
          author: story.author,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/stories error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
