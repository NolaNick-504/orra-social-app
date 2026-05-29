import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Admin endpoint to seed sample posts for the feed
// Usage: /api/admin/seed-posts?key=orra504
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== 'orra504') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check existing post count
    const existingCount = await db.post.count();

    // Get all users for seeding
    const users = await db.user.findMany({
      select: { id: true, name: true, handle: true, email: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found in database' }, { status: 400 });
    }

    const results: string[] = [];

    // Create bot users for a more realistic feed
    const botUsers = [
      { email: 'bot13@orra.app', name: 'Zara Miles', handle: '@zaramiles', bio: 'Fashion & Lifestyle ✨', badges: '["Fire","Star"]' },
      { email: 'bot14@orra.app', name: 'Jaylen Parker', handle: '@jaylenp', bio: 'Gamer & Streamer 🎮', badges: '["Star"]' },
      { email: 'bot12@orra.app', name: 'Maya Chen', handle: '@mayachen', bio: 'Food Blogger 🍜', badges: '["Fire"]' },
      { email: 'bot15@orra.app', name: 'Dre Williams', handle: '@drewilliams', bio: 'Music Producer 🎵', badges: '["Star","Fire"]' },
      { email: 'bot10@orra.app', name: 'Luna Kim', handle: '@lunakim', bio: 'Illustrator & Cat Mom 🐱', badges: '["Star"]' },
    ];

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const bot of botUsers) {
      const existing = await db.user.findUnique({ where: { email: bot.email } });
      if (!existing) {
        await db.user.create({
          data: {
            email: bot.email,
            name: bot.name,
            handle: bot.handle,
            password: hashedPassword,
            profileSetupComplete: true,
            auraTokens: Math.floor(Math.random() * 500) + 100,
            auraXP: Math.floor(Math.random() * 200) + 50,
            auraLevel: Math.floor(Math.random() * 5) + 1,
            verified: Math.random() > 0.6,
            badges: bot.badges,
            bio: bot.bio,
          },
        });
        results.push(`Created bot user ${bot.handle}`);
      } else {
        results.push(`Bot user ${bot.handle} already exists`);
      }
    }

    // All users (including newly created bots)
    const allUsers = await db.user.findMany({
      select: { id: true, name: true, handle: true, email: true },
    });

    // Seed posts if there are fewer than 10
    if (existingCount < 10) {
      const seedPosts = [
        { text: "Welcome to ORRA! 🎉 The next-gen social experience is here. Drop your first post and let your vibe speak!", vibeTag: "hyped", type: "text" },
        { text: "Just set up my profile on ORRA. This platform is fire 🔥 Who else is here?", vibeTag: "chill", type: "text" },
        { text: "The Aura system is crazy — you literally get rewarded for being social. Love the concept 💜", vibeTag: "hyped", type: "text" },
        { text: "Exploring the marketplace right now. The Gold Founder skin is clean ✨", vibeTag: "hyped", type: "text" },
        { text: "ORRA's dark mode is smooth. Everything just feels premium on this app 🖤", vibeTag: "chill", type: "text" },
        { text: "The Prism AI companion is actually useful. Had a whole conversation about music recommendations 🤖🎶", vibeTag: "vibing", type: "text" },
        { text: "Hub culture on ORRA is about to be unmatched. Who's building the first music hub? 🎵", vibeTag: "hyped", type: "text" },
        { text: "Daily streaks keeping me coming back. Day 5 and counting 🔥", vibeTag: "hyped", type: "text" },
        { text: "The Game Arena is addictive. Just spent an hour on Truth or Dare 😂", vibeTag: "funny", type: "text" },
        { text: "ORRA feels different from other social apps. Like it's actually built for our generation 💯", vibeTag: "vibing", type: "text" },
        { text: "Name effects in the marketplace are sick. The rainbow glow goes hard 🌈", vibeTag: "hyped", type: "text" },
        { text: "Who else is exploring the wellness section? The vibe check feature is real 🧘‍♂️", vibeTag: "chill", type: "text" },
        { text: "Building my aura balance up. Almost at 500 tokens! What should I buy next?", vibeTag: "hyped", type: "text" },
        { text: "The echo (repost) feature is clean. Love how it shows who echoed it too 🔁", vibeTag: "chill", type: "text" },
        { text: "Shoutout to the ORRA team for actually listening to feedback. This app keeps getting better 🚀", vibeTag: "hyped", type: "text" },
      ];

      for (const postData of seedPosts) {
        // Pick a random user for each post
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const alreadyExists = await db.post.findFirst({
          where: { text: postData.text, authorId: randomUser.id },
        });
        if (!alreadyExists) {
          await db.post.create({
            data: {
              text: postData.text,
              vibeTag: postData.vibeTag,
              type: postData.type,
              images: '[]',
              authorId: randomUser.id,
            },
          });
          results.push(`Created post by ${randomUser.handle}: "${postData.text.substring(0, 40)}..."`);
        } else {
          results.push(`Skipped duplicate post by ${randomUser.handle}`);
        }
      }
    } else {
      results.push(`Already have ${existingCount} posts, skipping seed`);
    }

    // Create posts from specific bot users
    const botPosts = [
      { text: "New fit check! What y'all think? 👗✨", vibeTag: "hyped", authorHandle: "@zaramiles" },
      { text: "Just hit Diamond rank! The grind never stops 💎🎮", vibeTag: "hyped", authorHandle: "@jaylenp" },
      { text: "Made homemade ramen from scratch today. 10/10 would recommend 🍜", vibeTag: "chill", authorHandle: "@mayachen" },
      { text: "New beat dropping this Friday. Y'all ready? 🎵🔥", vibeTag: "hyped", authorHandle: "@drewilliams" },
      { text: "Drew my cat as an anime character. Should I make prints? 🐱🎨", vibeTag: "vibing", authorHandle: "@lunakim" },
      { text: "Fashion week highlights are insane this year. The street style is everything 💅", vibeTag: "vibing", authorHandle: "@zaramiles" },
      { text: "Streaming tonight at 9pm! Drop a 🔥 if you're pulling up", vibeTag: "hyped", authorHandle: "@jaylenp" },
      { text: "Found the best tacos in the city. Life changing honestly 🌮", vibeTag: "chill", authorHandle: "@mayachen" },
    ];

    for (const bp of botPosts) {
      const author = await db.user.findFirst({ where: { handle: bp.authorHandle } });
      if (author) {
        const alreadyExists = await db.post.findFirst({
          where: { text: bp.text, authorId: author.id },
        });
        if (!alreadyExists) {
          await db.post.create({
            data: {
              text: bp.text,
              vibeTag: bp.vibeTag,
              type: 'text',
              images: '[]',
              authorId: author.id,
            },
          });
          results.push(`Created post by ${bp.authorHandle}: "${bp.text.substring(0, 40)}..."`);
        }
      }
    }

    // Make users follow each other
    const founder = allUsers.find(u => u.email === 'nickjoseph8087@gmail.com');
    if (founder) {
      for (const bot of botUsers) {
        const botUser = await db.user.findFirst({ where: { handle: bot.handle } });
        if (botUser) {
          // Founder follows bot
          const existingFollow = await db.follow.findFirst({
            where: { followerId: founder.id, followingId: botUser.id },
          });
          if (!existingFollow) {
            await db.follow.create({
              data: { followerId: founder.id, followingId: botUser.id },
            });
            results.push(`Founder now follows ${bot.handle}`);
          }

          // Bot follows founder back
          const existingFollowBack = await db.follow.findFirst({
            where: { followerId: botUser.id, followingId: founder.id },
          });
          if (!existingFollowBack) {
            await db.follow.create({
              data: { followerId: botUser.id, followingId: founder.id },
            });
            results.push(`${bot.handle} follows Founder back`);
          }
        }
      }
    }

    const finalCount = await db.post.count();
    const finalUserCount = await db.user.count();

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalPosts: finalCount,
        totalUsers: finalUserCount,
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seed failed' },
      { status: 500 }
    );
  }
}
