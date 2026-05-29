import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({ success: false, error: 'Search query required' }, { status: 400 });
    }

    const currentUserId = await getAuthUserId();

    // Case-insensitive search using Prisma raw query for SQLite compatibility
    // SQLite doesn't support Prisma's mode: 'insensitive' - use LOWER() instead
    const lowerQ = q.toLowerCase();
    const likePattern = `%${lowerQ}%`;

    // Search users by name or handle (case-insensitive)
    const users = await db.$queryRaw<Array<{
      id: string; name: string; handle: string; avatar: string | null;
      verified: number; online: number; followersCount: number;
    }>>`
      SELECT u.id, u.name, u.handle, u.avatar, u.verified, u.online,
             (SELECT COUNT(*) FROM Follow WHERE followingId = u.id) as followersCount
      FROM User u
      WHERE (LOWER(u.name) LIKE ${likePattern} OR LOWER(u.handle) LIKE ${likePattern})
      LIMIT 10
    `;

    // Search posts by text content (case-insensitive)
    const posts = await db.$queryRaw<Array<{
      id: string; text: string; images: string | null; type: string;
      likesCount: number; commentsCount: number; sharesCount: number;
      createdAt: string; authorId: string;
      authorName: string; authorHandle: string; authorAvatar: string | null; authorVerified: number;
    }>>`
      SELECT p.id, p.text, p.images, p.type, p.likesCount, p.commentsCount, p.sharesCount, p.createdAt,
             p.authorId,
             a.name as authorName, a.handle as authorHandle, a.avatar as authorAvatar, a.verified as authorVerified
      FROM Post p
      JOIN User a ON p.authorId = a.id
      WHERE LOWER(p.text) LIKE ${likePattern}
      ORDER BY p.createdAt DESC
      LIMIT 10
    `;

    // Format results to match the expected API shape
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatar,
      verified: Boolean(u.verified),
      online: Boolean(u.online),
      _count: { followers: Number(u.followersCount) },
    }));

    const formattedPosts = posts.map(p => ({
      id: p.id,
      text: p.text,
      images: p.images,
      type: p.type,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      sharesCount: p.sharesCount,
      createdAt: p.createdAt,
      author: {
        id: p.authorId,
        name: p.authorName,
        handle: p.authorHandle,
        avatar: p.authorAvatar,
        verified: Boolean(p.authorVerified),
      },
    }));

    return NextResponse.json({
      success: true,
      data: { users: formattedUsers, posts: formattedPosts },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
