import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Add likes from new bots to existing posts
// Usage: /api/admin/seed-likes?key=orra504
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== 'orra504') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newBotIds = ['bot26', 'bot27', 'bot28', 'bot29', 'bot30', 'bot31', 'bot32', 'bot33', 'bot34', 'bot35'];
    
    const posts = await db.post.findMany({
      take: 60,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    let likesCreated = 0;
    for (const post of posts) {
      const numLikes = Math.floor(Math.random() * 4) + 2;
      const shuffled = [...newBotIds].sort(() => Math.random() - 0.5).slice(0, numLikes);
      for (const userId of shuffled) {
        try {
          await db.like.create({
            data: {
              userId,
              targetId: post.id,
              targetType: 'post',
              reactionType: ['like', 'wow', 'care', 'hyped'][Math.floor(Math.random() * 4)],
            },
          });
          likesCreated++;
        } catch (e) {
          // Duplicate, skip
        }
      }
    }

    return NextResponse.json({ success: true, likesCreated, postsProcessed: posts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
