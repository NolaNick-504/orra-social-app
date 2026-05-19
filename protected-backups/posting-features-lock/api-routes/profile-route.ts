import { NextRequest, NextResponse } from 'next/server';
import { db, writeQueue } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Increase body size limit for profile picture uploads (base64 images can be large)
export const maxBodyLength = 10 * 1024 * 1024; // 10MB
export const dynamic = 'force-dynamic';

// Resolve public directories: standalone mode runs from .next/standalone/
const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public'),
  path.resolve(process.cwd(), '..', '..', 'public'),
];

/**
 * Save a base64 data URL as a file in public/uploads/ and return the URL path.
 * This avoids storing large base64 strings in the database which causes:
 * 1. localStorage overflow on mobile (5MB limit)
 * 2. Avatar disappearing on refresh when localStorage is stripped
 * 3. Large DB entries
 */
async function saveBase64AsFile(dataUrl: string, userId: string, type: 'avatar' | 'cover'): Promise<string> {
  // Parse the data URL: data:image/jpeg;base64,/9j/4AAQ...
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }

  const base64Data = matches[2];

  // Sharp converts all images to JPEG for consistency and EXIF rotation
  const hash = crypto.createHash('md5').update(userId + type + Date.now()).digest('hex').slice(0, 8);
  const filename = `${type}-${userId.slice(0, 8)}-${hash}.jpg`;

  // Save to all public directories (standalone + project root)
  const buffer = Buffer.from(base64Data, 'base64');
  let savedPath = '';

  for (const dir of PUBLIC_DIRS) {
    const uploadsDir = path.join(dir, 'uploads');
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, filename);
      // Use Sharp to auto-rotate based on EXIF and convert to JPEG
      const sharp = (await import('sharp')).default;
      const pipeline = sharp(buffer).rotate().jpeg({ quality: 85 });
      if (type === 'avatar') {
        pipeline.resize(400, 400, { fit: 'cover' });
      } else {
        pipeline.resize({ width: 1200, withoutEnlargement: true });
      }
      await pipeline.toFile(filePath);
      if (!savedPath) savedPath = filePath;
    } catch (err) {
      console.warn(`Failed to save ${type} to ${dir}:`, err);
    }
  }

  // Return the URL path for serving via /api/uploads?file=filename
  return `/api/uploads?file=${filename}`;
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, handle, bio, location, website, avatar, coverImage, profileSetupComplete } = body;

    // If handle is being changed, check uniqueness (read - can be done outside queue)
    if (handle) {
      const existingUser = await db.user.findUnique({ where: { handle } });
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ success: false, error: 'Handle already taken' }, { status: 400 });
      }
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (handle !== undefined) updateData.handle = handle;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (profileSetupComplete !== undefined) updateData.profileSetupComplete = profileSetupComplete;

    // Handle avatar: save base64 as file, or use URL path, or reset to default
    if (avatar !== undefined) {
      if (avatar === '' || avatar === null) {
        // User removed custom avatar — reset to default
        updateData.avatar = '/api/uploads?path=images/orra-logo.png';
      } else if (avatar.startsWith('data:')) {
        // Base64 data URL — save as file to avoid localStorage issues
        try {
          const avatarUrl = await saveBase64AsFile(avatar, userId, 'avatar');
          updateData.avatar = avatarUrl;
        } catch (err) {
          console.error('Failed to save avatar as file:', err);
          // Fallback: store the base64 in DB (not ideal but better than losing the avatar)
          updateData.avatar = avatar;
        }
      } else {
        // It's already a URL path — use as-is
        updateData.avatar = avatar;
      }
    }

    // Handle cover image: same logic as avatar
    if (coverImage !== undefined) {
      if (coverImage === '' || coverImage === null) {
        updateData.coverImage = '/api/uploads?path=images/profile-cover.png';
      } else if (coverImage.startsWith('data:')) {
        try {
          const coverUrl = await saveBase64AsFile(coverImage, userId, 'cover');
          updateData.coverImage = coverUrl;
        } catch (err) {
          console.error('Failed to save cover image as file:', err);
          updateData.coverImage = coverImage;
        }
      } else {
        updateData.coverImage = coverImage;
      }
    }

    // Use the write queue to serialize this write and prevent lock contention
    const updatedUser = await writeQueue.run(async () => {
      return db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          handle: true,
          avatar: true,
          coverImage: true,
          bio: true,
          location: true,
          website: true,
          auraTokens: true,
          auraLevel: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
