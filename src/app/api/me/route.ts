import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET /api/me - Get current user's full state for store hydration
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Fetch user profile and all social state in a single parallel batch
    const [user, likes, follows, saves, reposts, hubMembers, chatMembers, danceVotes] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          handle: true,
          avatar: true,
          coverImage: true,
          bio: true,
          location: true,
          website: true,
          profileSongUrl: true,
          profileSongTitle: true,
          profileSongArtist: true,
          verified: true,
          online: true,
          auraTokens: true,
          auraLevel: true,
          auraXP: true,
          dailyStreak: true,
          badges: true,
          profileSetupComplete: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              follows: true,
              followers: true,
            },
          },
        },
      }),
      db.like.findMany({
        where: { userId },
        select: { targetId: true, targetType: true, reactionType: true },
      }),
      db.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      db.save.findMany({
        where: { userId },
        select: { targetId: true, targetType: true },
      }),
      db.repost.findMany({
        where: { userId },
        select: { postId: true },
      }),
      db.hubMember.findMany({
        where: { userId },
        select: { hubId: true },
      }),
      db.chatMember.findMany({
        where: { userId },
        select: { chatId: true, unreadCount: true },
      }),
      db.tokenAction.findMany({
        where: { userId, action: 'dance_vote' },
        select: { targetId: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Auto-migrate founder avatar/cover URLs from ephemeral uploads/ to persistent images/
    // The uploads/ directory gets wiped on container restart, causing profile images to disappear.
    // The images/ directory is part of the git repo and survives restarts.
    if (userId === 'founder') {
      const needsUpdate: Record<string, string> = {};
      if (user.avatar && user.avatar.includes('/api/uploads?file=')) {
        needsUpdate.avatar = '/api/uploads?path=images/avatars/founder-avatar-saved.jpg';
      }
      if (user.coverImage && user.coverImage.includes('/api/uploads?file=')) {
        needsUpdate.coverImage = '/api/uploads?path=images/covers/founder-cover-saved.jpg';
      }
      if (Object.keys(needsUpdate).length > 0) {
        console.log('[FOUNDER MIGRATION] Migrating avatar/cover to persistent paths:', needsUpdate);
        try {
          await db.user.update({ where: { id: 'founder' }, data: needsUpdate });
          if (needsUpdate.avatar) user.avatar = needsUpdate.avatar;
          if (needsUpdate.coverImage) user.coverImage = needsUpdate.coverImage;
        } catch (e) {
          console.warn('[FOUNDER MIGRATION] Failed to migrate:', e);
        }
      }
    }

    // Auto-backup founder profile on every /api/me call (fire-and-forget)
    // This ensures the backup always has the latest data
    if (userId === 'founder') {
      const backupPaths = [
        path.join(process.cwd(), '..', '..', 'founder-profile-backup.json'),
        path.join(process.cwd(), 'founder-profile-backup.json'),
      ];
      const backup = { timestamp: new Date().toISOString(), data: user };
      const json = JSON.stringify(backup, null, 2);
      for (const p of backupPaths) {
        try {
          const dir = path.dirname(p);
          if (!existsSync(dir)) await mkdir(dir, { recursive: true });
          await writeFile(p, json, 'utf-8');
        } catch { /* one location may not be writable */ }
      }
    }

    // Organize likes by type
    const likedPostIds = likes.filter(l => l.targetType === 'post').map(l => l.targetId);
    const likedReelIds = likes.filter(l => l.targetType === 'reel').map(l => l.targetId);
    const postReactions: Record<string, string> = {};
    likes.filter(l => l.targetType === 'post').forEach(l => {
      postReactions[l.targetId] = l.reactionType || 'like';
    });
    const followedUserIds = follows.map(f => f.followingId);
    const savedPostIds = saves.filter(s => s.targetType === 'post').map(s => s.targetId);
    const savedReelIds = saves.filter(s => s.targetType === 'reel').map(s => s.targetId);
    const repostedIds = reposts.map(r => r.postId);
    const joinedHubIds = hubMembers.map(h => h.hubId);

    const unreadMessages: Record<string, number> = {};
    chatMembers.forEach(cm => {
      if (cm.unreadCount > 0) {
        unreadMessages[cm.chatId] = cm.unreadCount;
      }
    });

    const votedEntryIds = danceVotes.map(v => v.targetId);

    return NextResponse.json({
      success: true,
      data: {
        user,
        likedPostIds,
        likedReelIds,
        postReactions,
        followedUserIds,
        savedPostIds,
        savedReelIds,
        repostedIds,
        joinedHubIds,
        unreadMessages,
        votedEntryIds,
      },
    });
  } catch (error) {
    console.error('GET /api/me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
