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

    // Search users by name or handle (case-insensitive for SQLite)
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { handle: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        handle: true,
        avatar: true,
        verified: true,
        online: true,
        _count: { select: { followers: true } },
      },
      take: 10,
    });

    // Search posts by text content (case-insensitive for SQLite)
    const posts = await db.post.findMany({
      where: {
        text: { contains: q, mode: 'insensitive' },
      },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: { users, posts },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
