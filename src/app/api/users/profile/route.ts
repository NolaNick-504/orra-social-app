import { NextRequest, NextResponse } from 'next/server';
import { db, writeQueue } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Founder profile backup file — survives container restarts and re-seeding
const FOUNDER_BACKUP_PATH = path.join(process.cwd(), '..', '..', 'founder-profile-backup.json');
// Also try the project root directly (for non-standalone mode)
const FOUNDER_BACKUP_ALT = path.join(process.cwd(), 'founder-profile-backup.json');

async function backupFounderProfile(user: Record<string, any>) {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        location: user.location,
        website: user.website,
        profileSongUrl: user.profileSongUrl || '',
        profileSongTitle: user.profileSongTitle || '',
        profileSongArtist: user.profileSongArtist || '',
        auraTokens: user.auraTokens,
        auraLevel: user.auraLevel,
        auraXP: user.auraXP,
        badges: user.badges || '[]',
      }
    };
    const json = JSON.stringify(backup, null, 2);
    // Save to both possible locations
    for (const p of [FOUNDER_BACKUP_PATH, FOUNDER_BACKUP_ALT]) {
      try {
        const dir = path.dirname(p);
        if (!existsSync(dir)) await mkdir(dir, { recursive: true });
        await writeFile(p, json, 'utf-8');
      } catch { /* one location may not be writable */ }
    }
    console.log('[PROFILE BACKUP] Founder profile backed up');
  } catch (err) {
    console.error('[PROFILE BACKUP] Failed:', err);
  }
}

// Increase body size limit for profile picture uploads (base64 images can be large)
export const maxBodyLength = 10 * 1024 * 1024; // 10MB
export const dynamic = 'force-dynamic';

// Resolve public directories: standalone mode runs from .next/standalone/
const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public'),
];

/**
 * Save a base64 data URL as a file in public/uploads/ and return the URL path.
 * This avoids storing large base64 strings in the database which causes:
 * 1. localStorage overflow on mobile (5MB limit)
 * 2. Avatar disappearing on refresh when localStorage is stripped
 * 3. Large DB entries
 *
 * For the founder account, images are also saved to public/images/ (which is
 * persisted in git and survives container restarts), and the returned URL uses
 * the /api/uploads?path= format instead of /api/uploads?file= format.
 */
async function saveBase64AsFile(dataUrl: string, userId: string, type: 'avatar' | 'cover'): Promise<string> {
  // Parse the data URL: data:image/jpeg;base64,/9j/4AAQ...
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }

  const base64Data = matches[2];
  const isFounder = userId === 'founder' || userId.startsWith('founder');

  // For founder: use a stable filename so the path never changes across saves
  // This prevents the "profile keeps changing" issue where new hashes create new URLs
  const filename = isFounder
    ? `founder-${type}-saved.jpg`
    : `${type}-${userId.slice(0, 8)}-${crypto.createHash('md5').update(userId + type + Date.now()).digest('hex').slice(0, 8)}.jpg`;

  const buffer = Buffer.from(base64Data, 'base64');

  // Process image with Sharp
  const sharp = (await import('sharp')).default;
  const pipeline = sharp(buffer).rotate().jpeg({ quality: 85 });
  if (type === 'avatar') {
    pipeline.resize(400, 400, { fit: 'cover' });
  } else {
    pipeline.resize({ width: 1200, withoutEnlargement: true });
  }
  const processedBuffer = await pipeline.toBuffer();

  // Save to all public directories (standalone + project root)
  for (const dir of PUBLIC_DIRS) {
    // Save to uploads/ (ephemeral but needed for runtime)
    const uploadsDir = path.join(dir, 'uploads');
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      await writeFile(path.join(uploadsDir, filename), processedBuffer);
    } catch (err) {
      console.warn(`Failed to save ${type} to uploads in ${dir}:`, err);
    }

    // For founder: ALSO save to images/ directory which is persisted in git
    // This ensures images survive container restarts and node_modules wipes
    if (isFounder) {
      const imagesDir = type === 'avatar'
        ? path.join(dir, 'images', 'avatars')
        : path.join(dir, 'images', 'covers');
      try {
        if (!existsSync(imagesDir)) {
          await mkdir(imagesDir, { recursive: true });
        }
        await writeFile(path.join(imagesDir, filename), processedBuffer);
        console.log(`[FOUNDER] ${type} saved to persistent images dir: ${imagesDir}`);
      } catch (err) {
        console.warn(`Failed to save founder ${type} to images dir ${dir}:`, err);
      }
    }
  }

  // Return the URL path
  // For founder: use /api/uploads?path= format pointing to the persistent images/ directory
  // For others: use /api/uploads?file= format pointing to the uploads/ directory
  if (isFounder) {
    const imagesPath = type === 'avatar'
      ? `images/avatars/${filename}`
      : `images/covers/${filename}`;
    return `/api/uploads?path=${imagesPath}`;
  }
  return `/api/uploads?file=${filename}`;
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, handle, bio, location, website, avatar, coverImage, profileSetupComplete, profileSongUrl, profileSongTitle, profileSongArtist } = body;

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
    if (profileSongUrl !== undefined) updateData.profileSongUrl = profileSongUrl;
    if (profileSongTitle !== undefined) updateData.profileSongTitle = profileSongTitle;
    if (profileSongArtist !== undefined) updateData.profileSongArtist = profileSongArtist;

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
          profileSongUrl: true,
          profileSongTitle: true,
          profileSongArtist: true,
          auraTokens: true,
          auraLevel: true,
          auraXP: true,
          badges: true,
        },
      });
    });

    // Auto-backup founder profile so it survives re-seeding
    if (userId === 'founder') {
      await backupFounderProfile(updatedUser);
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
