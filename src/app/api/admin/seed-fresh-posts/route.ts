import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Seed 20 fresh posts with images matched to content and user profiles
// Usage: /api/admin/seed-fresh-posts?key=orra504
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== 'orra504') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results: string[] = [];

    // Find users by handle
    const userMap: Record<string, string> = {};
    const users = await db.user.findMany({
      select: { id: true, handle: true, name: true },
    });
    for (const u of users) {
      if (u.handle) userMap[u.handle] = u.id;
    }

    // 20 new posts - 12 with images, 8 text-only
    // Text matches the image AND the user's personality/profile
    // Using actual handles from the live database
    const newPosts = [
      // === POSTS WITH IMAGES (12) ===
      {
        text: "New pickup just landed 🔥 These kicks are limited edition and I waited 3 months for the restock. Worth every second. The colorway is insane in person",
        handle: "@zaramiles",
        vibeTag: "hyped",
        type: "image",
        image: "/images/posts/sneaker-collection.jpg"
      },
      {
        text: "Ranked grind paying off finally 💎 Hit Diamond last night after a 6-hour session. My teammates carried but I'll take the W. Who else grinding tonight?",
        handle: "@jayparker",
        vibeTag: "hyped",
        type: "image",
        image: "/images/posts/diamond-rank-achieved.jpg"
      },
      {
        text: "Hand-pulled noodles from scratch for the first time and I'm never going back to store-bought. The texture is completely different. Recipe dropping soon 🍜",
        handle: "@mayachen",
        vibeTag: "chill",
        type: "image",
        image: "/images/posts/hand-pulled-noodles.jpg"
      },
      {
        text: "Late night session in the lab. Made 6 beats tonight and 2 of them are fire. Sending pack to the label tomorrow. This the grind they don't see 🎵",
        handle: "@drewilliams",
        vibeTag: "focused",
        type: "image",
        image: "/images/posts/late-night-studio-session.jpg"
      },
      {
        text: "Mochi decided my watercolor palette was her new bed 😂 At least she has good taste in art supplies. Cats really do own everything they touch",
        handle: "@lunakim",
        vibeTag: "chill",
        type: "image",
        image: "/images/posts/funny-cat.jpg"
      },
      {
        text: "Morning run before the city wakes up. 10K done by 6am. There's something about empty streets and your playlist that just hits different 🏃‍♂️",
        handle: "@marcusr",
        vibeTag: "focused",
        type: "image",
        image: "/images/posts/running-trail.jpg"
      },
      {
        text: "Found this hidden alley in Barcelona and the light was perfect. Travel tip: always explore the side streets, that's where the real magic lives ✈️",
        handle: "@elenav",
        vibeTag: "peaceful",
        type: "image",
        image: "/images/posts/barcelona-alley.jpg"
      },
      {
        text: "New digital piece finished at 3am. The neon gradients took forever but the final result is exactly what I envisioned. Sometimes the late nights are worth it 🎨",
        handle: "@islabrennan",
        vibeTag: "dramatic",
        type: "image",
        image: "/images/posts/digital-art-screen.jpg"
      },
      {
        text: "Sunrise yoga session by the water. 30 minutes of mindfulness before the chaos of the day. Remember: your peace is worth protecting 🧘‍♀️",
        handle: "@niaokafor",
        vibeTag: "peaceful",
        type: "image",
        image: "/images/posts/sunrise-yoga.jpg"
      },
      {
        text: "Skate session at the park. Finally landed a tre flip after weeks of trying. The feeling when you stick a trick you've been working on is unmatched 🛹",
        handle: "@kaitanaka",
        vibeTag: "hyped",
        type: "image",
        image: "/images/posts/skateboard-park-trick.jpg"
      },
      {
        text: "Vinyl crate digging at the local shop. Found 4 samples I'm definitely flipping. The crackle of old records just hits different than digital 🎶",
        handle: "@drewilliams",
        vibeTag: "chill",
        type: "image",
        image: "/images/posts/vinyl-crate-digging.jpg"
      },
      {
        text: "Street art tour downtown and this mural stopped me in my tracks. The artist used the whole building as a canvas. Art belongs to everyone 🎨",
        handle: "@tashawash",
        vibeTag: "dramatic",
        type: "image",
        image: "/images/posts/street-art.jpg"
      },

      // === TEXT-ONLY POSTS (8) ===
      {
        text: "Hot take: the best fashion isn't about brands, it's about how you wear what you already have. Confidence is the ultimate accessory and it's free 💅",
        handle: "@sofiareyes",
        vibeTag: "dramatic",
        type: "text",
      },
      {
        text: "Just realized I've been coding for 12 hours straight. Forgot to eat lunch and dinner. The debugging rabbit hole is real. Someone send pizza 🍕",
        handle: "@rajp",
        vibeTag: "chill",
        type: "text",
      },
      {
        text: "Gaming hot take: single-player games > multiplayer. Fight me. I said what I said. The storytelling in single-player hits different and nobody can change my mind 🎮",
        handle: "@ethanpark",
        vibeTag: "dramatic",
        type: "text",
      },
      {
        text: "What if we measured success by how many people we helped instead of how much money we made? Imagine a world where kindness was the currency 🌍",
        handle: "@amiraj",
        vibeTag: "peaceful",
        type: "text",
      },
      {
        text: "ORRA update: just hit 500 Aura tokens and the marketplace has me tempted. That rainbow name effect is calling my name. Should I buy it or keep saving? 💎",
        handle: "@zaramiles",
        vibeTag: "hyped",
        type: "text",
      },
      {
        text: "Made butter chicken from my abuela's recipe tonight. The secret is the marinade — 24 hours minimum. Some things you just can't rush. Love = patience 🍛",
        handle: "@elenav",
        vibeTag: "chill",
        type: "text",
      },
      {
        text: "Day 14 of my meditation streak. The difference in my mental clarity is wild. Started with just 5 minutes a day and now I'm at 20. Small steps, big changes 🧠",
        handle: "@niaokafor",
        vibeTag: "peaceful",
        type: "text",
      },
      {
        text: "Just watched a documentary about street art in São Paulo and now I want to book a flight immediately. Art and travel are the best ways to understand the world ✈️🎨",
        handle: "@islabrennan",
        vibeTag: "hyped",
        type: "text",
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const post of newPosts) {
      const userId = userMap[post.handle];
      if (!userId) {
        results.push(`SKIP: User ${post.handle} not found in database`);
        skipped++;
        continue;
      }

      // Check for duplicate (exact text match)
      const existing = await db.post.findFirst({
        where: { text: post.text, authorId: userId },
      });

      if (existing) {
        results.push(`SKIP: Duplicate post by ${post.handle}`);
        skipped++;
        continue;
      }

      const images = post.image ? JSON.stringify([post.image]) : '[]';
      await db.post.create({
        data: {
          text: post.text,
          vibeTag: post.vibeTag,
          type: post.type,
          images: images,
          authorId: userId,
          likesCount: Math.floor(Math.random() * 40) + 5,
          commentsCount: Math.floor(Math.random() * 12),
          sharesCount: Math.floor(Math.random() * 8),
        },
      });
      created++;
      results.push(`CREATED: ${post.handle} - "${post.text.substring(0, 50)}..." ${post.image ? '[IMG]' : '[TEXT]'}`);
    }

    const totalPosts = await db.post.count();

    return NextResponse.json({
      success: true,
      created,
      skipped,
      totalPosts,
      results,
    });
  } catch (error: any) {
    console.error('Fresh seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seed failed' },
      { status: 500 }
    );
  }
}
