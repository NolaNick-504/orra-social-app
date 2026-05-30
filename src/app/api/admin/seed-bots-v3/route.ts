import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Create 10 new bot users with full profiles + posts + comments + likes + marketplace items
// Usage: /api/admin/seed-bots-v3?key=orra504
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== 'orra504') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results: string[] = [];
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ========================================================================
    // 10 NEW BOT PROFILES - with matching avatars, covers, songs, bios
    // ========================================================================
    const newBots = [
      {
        id: 'bot26',
        email: 'bot26@orra.app',
        name: 'Zoe Castillo',
        handle: '@zoecastillo',
        bio: 'Travel vlogger who quit corporate to see the world. 34 countries and counting. Currently slow-traveling through Southeast Asia. Your 9-5 is not the only way to live',
        location: 'Bangkok, Thailand',
        website: 'zoecastillo.travel',
        avatar: '/images/avatars/bots/bot26.jpg',
        coverImage: '/images/covers/bot26.jpg',
        profileSongUrl: '/music/orra/welcome-to-my-page.mp3',
        profileSongTitle: 'Welcome to My Page',
        profileSongArtist: 'ORRA',
        badges: '["Traveler","Explorer"]',
        verified: true,
        activeTheme: 'skin_aurora',
        activeNameEffect: 'effect_neon_glow',
      },
      {
        id: 'bot27',
        email: 'bot27@orra.app',
        name: 'Dex Murphy',
        handle: '@dexmurphy',
        bio: 'Cybersecurity analyst by day, CTF player by night. I break things so you do not have to. Trust me, your passwords are terrible',
        location: 'Washington, DC',
        website: 'dexmurphy.sec',
        avatar: '/images/avatars/bots/bot27.jpg',
        coverImage: '/images/covers/bot27.jpg',
        profileSongUrl: '/music/orra/mega-me.mp3',
        profileSongTitle: 'Mega Me',
        profileSongArtist: 'ORRA',
        badges: '["Hacker","Tech Savvy"]',
        verified: true,
        activeTheme: 'skin_midnight',
        activeNameEffect: 'effect_neon_glow',
      },
      {
        id: 'bot28',
        email: 'bot28@orra.app',
        name: 'Amara Okafor',
        handle: '@amaraokafor',
        bio: 'Fashion designer merging African textiles with modern streetwear. Lagos to London to NYC. My grandmother taught me to sew and now my pieces are on runways',
        location: 'Lagos, Nigeria',
        website: 'amaraokafor.com',
        avatar: '/images/avatars/bots/bot28.jpg',
        coverImage: '/images/covers/bot28.jpg',
        profileSongUrl: '/music/orra/unbothered-queen.mp3',
        profileSongTitle: 'Unbothered Queen',
        profileSongArtist: 'ORRA',
        badges: '["Designer","Runway"]',
        verified: true,
        activeTheme: 'skin_cherry_blossom',
        activeNameEffect: 'effect_rainbow_wave',
      },
      {
        id: 'bot29',
        email: 'bot29@orra.app',
        name: 'Sam Nakamura',
        handle: '@samnakamura',
        bio: 'Pastry chef and baking content creator. Croissants are my love language. 3am alarm for dough lamination is my normal. Currently working on my first cookbook',
        location: 'Portland, OR',
        website: 'samnakamura.bakes',
        avatar: '/images/avatars/bots/bot29.jpg',
        coverImage: '/images/covers/bot29.jpg',
        profileSongUrl: '/music/orra/glow-up-season-v1.mp3',
        profileSongTitle: 'Glow Up Season',
        profileSongArtist: 'ORRA',
        badges: '["Baker","Food Artist"]',
        verified: false,
        activeTheme: '',
        activeNameEffect: '',
      },
      {
        id: 'bot30',
        email: 'bot30@orra.app',
        name: 'Rio Santos',
        handle: '@riosantos',
        bio: 'Surf instructor and ocean conservationist. The ocean gives us everything and we owe it protection. Salty hair, sunburned nose, full heart',
        location: 'Huntington Beach, CA',
        website: 'riosantos.ocean',
        avatar: '/images/avatars/bots/bot30.jpg',
        coverImage: '/images/covers/bot30.jpg',
        profileSongUrl: '/music/orra/cloud-nine-id.mp3',
        profileSongTitle: 'Cloud Nine',
        profileSongArtist: 'ORRA',
        badges: '["Surfer","Ocean Protector"]',
        verified: true,
        activeTheme: 'skin_aurora',
        activeNameEffect: '',
      },
      {
        id: 'bot31',
        email: 'bot31@orra.app',
        name: 'Imani Williams',
        handle: '@imaniwilliams',
        bio: 'Therapist and relationship coach. Healing is not linear but it is worth it. Specializing in Black mental health and intergenerational trauma. Your feelings are valid',
        location: 'Atlanta, GA',
        website: 'imaniwilliams.therapy',
        avatar: '/images/avatars/bots/bot31.jpg',
        coverImage: '/images/covers/bot31.jpg',
        profileSongUrl: '/music/orra/no-cap-motivation.mp3',
        profileSongTitle: 'No Cap Motivation',
        profileSongArtist: 'ORRA',
        badges: '["Healer","Mindful"]',
        verified: true,
        activeTheme: 'skin_cherry_blossom',
        activeNameEffect: 'effect_neon_glow',
      },
      {
        id: 'bot32',
        email: 'bot32@orra.app',
        name: 'Felix Andersen',
        handle: '@felixandersen',
        bio: 'Architect designing sustainable spaces. Green buildings are not just possible, they are necessary. Won 2 AIA awards. Concrete can be beautiful AND kind to the planet',
        location: 'Copenhagen, Denmark',
        website: 'felixandersen.arch',
        avatar: '/images/avatars/bots/bot32.jpg',
        coverImage: '/images/covers/bot32.jpg',
        profileSongUrl: '/music/orra/donny-maduro-man.mp3',
        profileSongTitle: 'Donny Maduro Man',
        profileSongArtist: 'ORRA',
        badges: '["Architect","Visionary"]',
        verified: true,
        activeTheme: 'skin_midnight',
        activeNameEffect: 'effect_neon_glow',
      },
      {
        id: 'bot33',
        email: 'bot33@orra.app',
        name: 'Lex Rivera',
        handle: '@lexrivera',
        bio: 'Tattoo artist and visual storyteller. 8 years of ink and counting. Every tattoo has a story and I am here to tell it on skin. Currently booking for flash days',
        location: 'Austin, TX',
        website: 'lexrivera.ink',
        avatar: '/images/avatars/bots/bot33.jpg',
        coverImage: '/images/covers/bot33.jpg',
        profileSongUrl: '/music/orra/gremlin-mode-on.mp3',
        profileSongTitle: 'Gremlin Mode On',
        profileSongArtist: 'ORRA',
        badges: '["Ink Master","Creative"]',
        verified: false,
        activeTheme: 'skin_fire',
        activeNameEffect: 'effect_fire_glow',
      },
      {
        id: 'bot34',
        email: 'bot34@orra.app',
        name: 'Nadia Hassan',
        handle: '@nadiabhassan',
        bio: 'Journalist covering Middle East and North Africa. Stories the mainstream misses. Award-winning investigative reporter. The truth deserves a voice',
        location: 'Cairo, Egypt',
        website: 'nadiabhassan.news',
        avatar: '/images/avatars/bots/bot34.jpg',
        coverImage: '/images/covers/bot34.jpg',
        profileSongUrl: '/music/orra/flirt-era.mp3',
        profileSongTitle: 'Flirt Era',
        profileSongArtist: 'ORRA',
        badges: '["Reporter","Truth Seeker"]',
        verified: true,
        activeTheme: '',
        activeNameEffect: '',
      },
      {
        id: 'bot35',
        email: 'bot35@orra.app',
        name: 'Kai Tan',
        handle: '@kaitan',
        bio: 'Mixologist and bar owner. Cocktails are chemistry and art combined. My speakeasy has been featured in Bon Appetit. Every drink tells a story',
        location: 'San Francisco, CA',
        website: 'kaitan.cocktails',
        avatar: '/images/avatars/bots/bot35.jpg',
        coverImage: '/images/covers/bot35.jpg',
        profileSongUrl: '/music/orra/last-memory-of-you.mp3',
        profileSongTitle: 'Last Memory of You',
        profileSongArtist: 'ORRA',
        badges: '["Mixologist","Nightlife"]',
        verified: true,
        activeTheme: 'skin_neon',
        activeNameEffect: 'effect_rainbow_wave',
      },
    ];

    // ========================================================================
    // CREATE BOT USERS
    // ========================================================================
    const createdBotIds: string[] = [];

    for (const bot of newBots) {
      const existing = await db.user.findUnique({ where: { email: bot.email } });
      if (existing) {
        results.push(`SKIP: ${bot.handle} already exists`);
        createdBotIds.push(existing.id);
        continue;
      }

      const user = await db.user.create({
        data: {
          id: bot.id,
          email: bot.email,
          name: bot.name,
          handle: bot.handle,
          password: hashedPassword,
          bio: bot.bio,
          location: bot.location,
          website: bot.website,
          avatar: bot.avatar,
          coverImage: bot.coverImage,
          profileSongUrl: bot.profileSongUrl,
          profileSongTitle: bot.profileSongTitle,
          profileSongArtist: bot.profileSongArtist,
          badges: bot.badges,
          verified: bot.verified,
          online: true,
          profileSetupComplete: true,
          auraTokens: Math.floor(Math.random() * 800) + 200,
          auraLevel: Math.floor(Math.random() * 10) + 2,
          auraXP: Math.floor(Math.random() * 500) + 100,
          activeTheme: bot.activeTheme,
          activeNameEffect: bot.activeNameEffect,
        },
      });
      createdBotIds.push(user.id);
      results.push(`CREATED USER: ${bot.handle} - ${bot.name}`);
    }

    // ========================================================================
    // CREATE PURCHASES FOR BOTS WITH MARKETPLACE ITEMS
    // ========================================================================
    const botsWithThemes = newBots.filter(b => b.activeTheme);
    for (const bot of botsWithThemes) {
      const skinNames: Record<string, string> = {
        'skin_aurora': 'Aurora',
        'skin_neon': 'Neon',
        'skin_midnight': 'Midnight',
        'skin_cherry_blossom': 'Cherry Blossom',
        'skin_fire': 'Fire',
      };
      const skinCosts: Record<string, number> = {
        'skin_aurora': 300,
        'skin_neon': 350,
        'skin_midnight': 300,
        'skin_cherry_blossom': 350,
        'skin_fire': 400,
      };

      const existingSkin = await db.purchase.findUnique({
        where: { userId_itemId: { userId: bot.id, itemId: bot.activeTheme } },
      });
      if (!existingSkin) {
        await db.purchase.create({
          data: {
            userId: bot.id,
            itemId: bot.activeTheme,
            category: 'Themes',
            name: skinNames[bot.activeTheme] || 'Theme',
            cost: skinCosts[bot.activeTheme] || 300,
            isActive: true,
            selectedOption: 'default',
          },
        });
        results.push(`  PURCHASED: ${bot.handle} - ${bot.activeTheme} skin`);
      }

      if (bot.activeNameEffect) {
        const effectNames: Record<string, string> = {
          'effect_neon_glow': 'Neon Glow',
          'effect_rainbow_wave': 'Rainbow Wave',
          'effect_fire_glow': 'Fire Glow',
        };
        const effectCosts: Record<string, number> = {
          'effect_neon_glow': 250,
          'effect_rainbow_wave': 300,
          'effect_fire_glow': 350,
        };

        const existingEffect = await db.purchase.findUnique({
          where: { userId_itemId: { userId: bot.id, itemId: bot.activeNameEffect } },
        });
        if (!existingEffect) {
          await db.purchase.create({
            data: {
              userId: bot.id,
              itemId: bot.activeNameEffect,
              category: 'Effects',
              name: effectNames[bot.activeNameEffect] || 'Effect',
              cost: effectCosts[bot.activeNameEffect] || 250,
              isActive: true,
              selectedOption: 'default',
            },
          });
          results.push(`  PURCHASED: ${bot.handle} - ${bot.activeNameEffect} effect`);
        }
      }
    }

    // ========================================================================
    // CREATE POSTS FROM NEW BOTS
    // ========================================================================
    const botPosts = [
      { handle: '@zoecastillo', text: "Woke up to this view in Bali. Monkeys stealing my breakfast was NOT in the itinerary but honestly peak travel moment 😂🐒", type: 'image', image: '/images/posts/barcelona-sunset.jpg', vibeTag: 'peaceful' },
      { handle: '@zoecastillo', text: "Travel tip: always talk to the locals. They know the spots that no guidebook will ever mention. Found the best pad thai of my life in a Bangkok alley at 2am 🍜", type: 'text', vibeTag: 'chill' },
      { handle: '@zoecastillo', text: "34 countries and counting. Next stop: Morocco. The wanderlust never sleeps and neither do I when there is a red-eye flight to catch ✈️", type: 'image', image: '/images/posts/city-night-traveler.jpg', vibeTag: 'hyped' },
      { handle: '@dexmurphy', text: "Just found a critical vulnerability in a popular password manager. Responsible disclosure submitted. Please update your apps people, this one is serious 🔐", type: 'text', vibeTag: 'focused' },
      { handle: '@dexmurphy', text: "My home lab setup is finally complete. 3 servers, 2 honeypots, and enough LEDs to make my apartment look like a cyberpunk movie. The neighbors are concerned 😎", type: 'image', image: '/images/posts/late-night-coding.jpg', vibeTag: 'chill' },
      { handle: '@amaraokafor', text: "New collection drop! Ankara meets streetwear. My grandmother taught me to sew and now her patterns are walking runways in Milan. This one is for you Nana 💜", type: 'image', image: '/images/posts/fashion-streetwear.jpg', vibeTag: 'hyped' },
      { handle: '@amaraokafor', text: "Fabric shopping in Lagos and the textile market is absolutely unreal. The colors, the patterns, the history in every thread. African textiles are the blueprint and always have been 🇳🇬", type: 'image', image: '/images/posts/pop-up-shop.jpg', vibeTag: 'dramatic' },
      { handle: '@samnakamura', text: "48-hour croissant dough development. The lamination process is meditation. 81 layers of butter and flour, each one perfect. Patience is the secret ingredient 🥐", type: 'image', image: '/images/posts/latte-art.jpg', vibeTag: 'chill' },
      { handle: '@samnakamura', text: "Tested 17 versions of my matcha tiramisu recipe and version 14 is the one. The other 13 were learning experiences. Baking is science with tastier results 🍵", type: 'text', vibeTag: 'focused' },
      { handle: '@riosantos', text: "Dawn patrol session. 6ft swells, offshore wind, and not another soul in the water. This is why I wake up before the sun. The ocean never disappoints 🌊", type: 'image', image: '/images/posts/summer-beach.jpg', vibeTag: 'peaceful' },
      { handle: '@riosantos', text: "Beach cleanup went crazy today. 47 bags of trash removed. The ocean gives us everything and it is time we start giving back. Protect what you love 🌍", type: 'text', vibeTag: 'focused' },
      { handle: '@imaniwilliams', text: "Gentle reminder: healing is not linear. Some days you feel on top of the world and other days you can barely get out of bed. Both are valid. Be gentle with yourself 🧠", type: 'text', vibeTag: 'peaceful' },
      { handle: '@imaniwilliams', text: "Setting boundaries is not selfish, it is self-preservation. You cannot pour from an empty cup. Take care of yourself first so you can show up for others authentically", type: 'image', image: '/images/posts/meditation-candle.jpg', vibeTag: 'peaceful' },
      { handle: '@felixandersen', text: "Just won our second AIA award for the green library project. Sustainable architecture is not a trend, it is the future. Every building should give more than it takes 🏛️", type: 'image', image: '/images/posts/architecture-model.jpg', vibeTag: 'focused' },
      { handle: '@felixandersen', text: "The best buildings are the ones that breathe. Natural light, living walls, rainwater harvesting. We designed a structure that produces more energy than it consumes. The future is green", type: 'text', vibeTag: 'focused' },
      { handle: '@lexrivera', text: "Flash day was insane. Did 14 tattoos in 8 hours. My hand is cramping but the art was flowing. Every piece tells a story and today we wrote 14 new chapters 🖋️", type: 'image', image: '/images/posts/skate-deck-art.jpg', vibeTag: 'hyped' },
      { handle: '@lexrivera', text: "Cover-up progress on this piece. Turning old mistakes into new masterpieces. That is the beauty of tattoo art, nothing is permanent except the commitment to improve", type: 'text', vibeTag: 'dramatic' },
      { handle: '@nadiabhassan', text: "Just published my investigation into water rights in rural communities. 6 months of work, 200+ interviews, and the truth deserves to be heard. Read it and share 📰", type: 'text', vibeTag: 'focused' },
      { handle: '@nadiabhassan', text: "On the ground in Cairo. The stories people tell you when you actually listen are more powerful than any headline. Journalism is about giving voice to the voiceless ✊", type: 'image', image: '/images/posts/barcelona-golden-hour.jpg', vibeTag: 'news' },
      { handle: '@kaitan', text: "New cocktail menu just dropped at the speakeasy. My favorite is the Midnight Orchid — smoky mezcal, orchid syrup, and activated charcoal. Come find us if you can 🍸", type: 'image', image: '/images/posts/brunch-creative.jpg', vibeTag: 'chill' },
      { handle: '@kaitan', text: "The art of the perfect stir. 40 revolutions, clockwise, with a bar spoon. It is not just mixing, it is chemistry and intention in every glass. Stirred not shaken, always", type: 'text', vibeTag: 'chill' },
    ];

    let postsCreated = 0;
    for (const post of botPosts) {
      const author = await db.user.findFirst({ where: { handle: post.handle } });
      if (!author) {
        results.push(`SKIP POST: User ${post.handle} not found`);
        continue;
      }

      const existing = await db.post.findFirst({
        where: { text: post.text, authorId: author.id },
      });
      if (existing) {
        results.push(`SKIP POST: Duplicate by ${post.handle}`);
        continue;
      }

      const images = post.image ? JSON.stringify([post.image]) : '[]';
      await db.post.create({
        data: {
          text: post.text,
          vibeTag: post.vibeTag,
          type: post.type,
          images,
          authorId: author.id,
          likesCount: Math.floor(Math.random() * 50) + 5,
          commentsCount: Math.floor(Math.random() * 10) + 1,
          sharesCount: Math.floor(Math.random() * 8),
        },
      });
      postsCreated++;
      results.push(`CREATED POST: ${post.handle} - "${post.text.substring(0, 50)}..." ${post.image ? '[IMG]' : '[TXT]'}`);
    }

    // ========================================================================
    // ADD COMMENTS FROM NEW BOTS ON EXISTING POSTS
    // ========================================================================
    const existingPosts = await db.post.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const commentTexts = [
      "This is so fire 🔥",
      "No cap this is exactly what I needed to see today",
      "The vibes are immaculate",
      "Okay but this is actually insane",
      "Real talk, this changed my perspective",
      "I felt this in my soul 💯",
      "Living for this content",
      "This is why I love ORRA",
      "The energy in this post is unmatched",
      "Saving this for later, absolute gem ✨",
      "Can we talk about how good this is though",
      "This needs more attention fr fr",
      "The way I immediately related to this",
      "You just spoke my whole vibe",
      "Iconic. Period.",
      "This hit different at 2am",
      "Adding this to my daily motivation",
      "The people need to see this",
      "This is the content I am here for",
      "Pure gold right here 🏆",
    ];

    let commentsCreated = 0;
    for (const post of existingPosts) {
      const numComments = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numComments; i++) {
        const randomBot = newBots[Math.floor(Math.random() * newBots.length)];
        const randomComment = commentTexts[Math.floor(Math.random() * commentTexts.length)];

        try {
          await db.comment.create({
            data: {
              text: randomComment,
              postId: post.id,
              authorId: randomBot.id,
            },
          });
          commentsCreated++;
        } catch (e) {
          // Skip if duplicate or other error
        }
      }
    }
    results.push(`CREATED ${commentsCreated} comments from new bots`);

    // ========================================================================
    // ADD LIKES FROM NEW BOTS ON EXISTING POSTS
    // ========================================================================
    let likesCreated = 0;
    const allPosts = await db.post.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    for (const post of allPosts) {
      const numLikes = Math.floor(Math.random() * 4) + 2;
      const shuffledBots = [...newBots].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numLikes && i < shuffledBots.length; i++) {
        try {
          await db.like.create({
            data: {
              postId: post.id,
              userId: shuffledBots[i].id,
            },
          });
          likesCreated++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    results.push(`CREATED ${likesCreated} likes from new bots`);

    // ========================================================================
    // MAKE FOUNDER FOLLOW NEW BOTS AND VICE VERSA
    // ========================================================================
    const founder = await db.user.findUnique({ where: { email: 'nickjoseph8087@gmail.com' } });
    if (founder) {
      for (const bot of newBots) {
        try {
          await db.follow.create({ data: { followerId: founder.id, followingId: bot.id } });
          results.push(`Founder follows ${bot.handle}`);
        } catch (e) {}
        try {
          await db.follow.create({ data: { followerId: bot.id, followingId: founder.id } });
          results.push(`${bot.handle} follows Founder`);
        } catch (e) {}
      }
    }

    // Make new bots follow each other
    for (let i = 0; i < newBots.length; i++) {
      for (let j = i + 1; j < newBots.length; j++) {
        if (Math.random() > 0.4) {
          try {
            await db.follow.create({ data: { followerId: newBots[i].id, followingId: newBots[j].id } });
          } catch (e) {}
          try {
            await db.follow.create({ data: { followerId: newBots[j].id, followingId: newBots[i].id } });
          } catch (e) {}
        }
      }
    }

    // Make new bots follow existing bots
    const existingBots = await db.user.findMany({
      where: { id: { startsWith: 'bot' } },
      select: { id: true },
    });
    for (const newBot of newBots) {
      const randomExisting = existingBots.filter(b => b.id !== newBot.id).sort(() => Math.random() - 0.5).slice(0, 5);
      for (const existing of randomExisting) {
        try {
          await db.follow.create({ data: { followerId: newBot.id, followingId: existing.id } });
        } catch (e) {}
      }
    }

    const totalUsers = await db.user.count();
    const totalPosts = await db.post.count();

    return NextResponse.json({
      success: true,
      summary: {
        botsCreated: createdBotIds.length,
        postsCreated,
        commentsCreated,
        likesCreated,
        totalUsers,
        totalPosts,
      },
      results,
    });
  } catch (error: any) {
    console.error('Bot seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seed failed' },
      { status: 500 }
    );
  }
}
