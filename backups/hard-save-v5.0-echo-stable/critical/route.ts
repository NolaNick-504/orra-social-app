import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

// GET /api/users?handle=@alexriv — look up user by handle
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const handle = url.searchParams.get('handle');

    if (handle) {
      const user = await db.user.findUnique({
        where: { handle },
        select: {
          id: true,
          name: true,
          handle: true,
          avatar: true,
          coverImage: true,
          bio: true,
          location: true,
          website: true,
          verified: true,
          online: true,
          auraTokens: true,
          auraLevel: true,
          badges: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              follows: true,
              followers: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: user });
    }

    // No handle specified — return a list of suggested users
    const currentUserId = await getAuthUserId();
    const users = await db.user.findMany({
      where: currentUserId ? { id: { not: currentUserId } } : {},
      select: {
        id: true,
        name: true,
        handle: true,
        avatar: true,
        verified: true,
        online: true,
        auraLevel: true,
        _count: {
          select: { followers: true },
        },
      },
      take: 20,
      orderBy: { auraLevel: 'desc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
