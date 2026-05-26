#!/usr/bin/env node
/**
 * Seed hub posts from bot accounts
 * Usage: node scripts/seed-hub-posts.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BOT_USER_IDS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'u14', 'u15', 'u16'];

// Hub-specific post templates per category
const HUB_POST_TEMPLATES = {
  art: [
    "Just finished a new digital piece and I'm obsessed with how it turned out! The colors just vibed perfectly",
    "Anyone else struggle with creative block? What helps you get back in the zone?",
    "Pro tip: limit your color palette to 3-4 colors. The constraint actually makes you more creative",
    "Found my style and it feels amazing. Took years but the journey was worth it",
    "Art is how I process my emotions. Every brush stroke tells a story I can't put into words",
    "The ORRA art community is seriously so inspiring. Y'all push me to be better every day",
    "Just discovered a new technique and my mind is blown. Can't wait to share the process",
  ],
  music: [
    "This new beat I made is literally stuck in my head on repeat. Is that normal? 😂",
    "What's the one song that always gets you in your feels? Drop it below",
    "Studio session went crazy last night. 4am and I still didn't want to leave",
    "Hot take: the best music comes from collaboration, not solo work. Change my mind",
    "Music theory is actually so fascinating once you get past the initial learning curve",
    "That feeling when the melody just clicks and everything falls into place 🎵",
    "Who's performing at the next open mic? I need to be there",
  ],
  tech: [
    "Just shipped a feature I've been working on for weeks and it feels incredible",
    "The future of AI is collaborative, not replacement. Here's my hot take",
    "Finally figured out that bug that's been driving me crazy for 3 days. It was a semicolon",
    "What's your go-to tech stack in 2026? I'm always curious what people are building with",
    "Open source is the backbone of everything we do. If you can, contribute back",
    "Pair programming is underrated. Two brains are genuinely better than one",
    "The ORRA dev community is lowkey one of the best on the internet. I said what I said",
  ],
  fitness: [
    "Day 60 of consistency and the transformation is real. Keep going y'all!",
    "Remember: rest days are just as important as workout days. Listen to your body",
    "New PR today! The grind is paying off and it feels incredible",
    "Find a workout you actually enjoy and you'll never have to 'force' yourself to go",
    "The gym is my therapy. No phone, no distractions, just me and the weights",
    "Who else is doing the ORRA fitness challenge? We got this 💪",
    "Morning runs > evening runs. There I said it. The sunrise is the bonus",
  ],
  food: [
    "Made this recipe from scratch and I'm never going back to the store-bought version",
    "The secret to perfect rice is patience. Let it rest for 10 minutes after cooking",
    "Food is love made visible. Cooking for people is my favorite love language",
    "Found the best hidden gem restaurant and I'm keeping it a secret... okay maybe just for you guys 😏",
    "Sunday meal prep is my therapy. Something about organized containers just hits different",
    "Matcha > coffee. I will die on this hill. But also I had 3 matchas today so...",
    "The ORRA food community always has the best recipes. Y'all never miss",
  ],
  gaming: [
    "One more round turned into 4 hours. Every. Single. Time. No regrets",
    "The new season just dropped and I'm already addicted. Who else is grinding?",
    "Gaming is my therapy and I'm tired of pretending it's not",
    "That feeling when you clutch the 1v5 is pure euphoria. Nothing compares",
    "Cozy gaming night with the squad. Sometimes you just need to vibe",
    "The speedrunning community is genuinely the most wholesome corner of the internet",
    "Looking for squadmates! Drop your IGN below and let's run some games 🎮",
  ],
  wellness: [
    "Today's reminder: you are enough exactly as you are. Be gentle with yourself",
    "3 deep breaths can genuinely change your entire mood. Try it right now",
    "Boundaries aren't walls, they're bridges to healthier relationships",
    "Started journaling every morning and the clarity is unreal. Highly recommend",
    "Healing isn't linear and that's okay. Some days are harder than others. You're not alone",
    "Digital detox day 3 and I actually feel human again. We need to normalize this",
    "This community is so supportive. Thank you all for making this a safe space 🧘",
  ],
  fashion: [
    "New fit check! This look took zero effort and that's exactly the vibe",
    "Thrift store find of the CENTURY. $5 for this vintage jacket?! Steal of the year",
    "Fashion rule: if you feel confident in it, wear it. Period.",
    "Style isn't about the price tag, it's about how you wear it. Remember that",
    "OOTD but make it effortless. Sometimes the simplest looks hit the hardest",
    "Sustainable fashion is the future and it looks SO good",
    "The ORRA fashion community has the best style inspo. I'm always taking notes 👗",
  ],
  social: [
    "This community is genuinely the best part of my day. Love y'all",
    "Who's up for a virtual hangout this weekend? Drop your ideas below",
    "Sometimes the best conversations happen at 2am with internet friends",
    "The ORRA community hits different. Real connections, real vibes",
    "Made some incredible friends through this app. Social media can actually be good",
    "Positive energy is contagious. Keep spreading those good vibes ✨",
    "This hub is my safe space. Thanks for making it amazing everyone",
  ],
  general: [
    "Happy to be part of this community! Everyone's so welcoming here",
    "What's everyone working on this week? Let's motivate each other!",
    "Just wanted to say I appreciate all of you. This community is special",
    "The vibes in this hub are immaculate. Keep being awesome",
    "New here and already feeling the love. This is what community should feel like",
    "Reminder to take breaks and take care of yourselves. You matter",
    "This is exactly the kind of space I've been looking for. Grateful to be here",
  ],
};

// Hub-specific comment templates
const HUB_COMMENT_TEMPLATES = [
  "This community is amazing! Love the energy here 🔥",
  "So grateful for this space, everyone's so supportive",
  "This is exactly what I needed today. Thank you all",
  "The vibes in this hub are immaculate ✨",
  "Y'all are the real ones. This community hits different",
  "Love seeing everyone lift each other up in here",
  "This is why I love this hub. Real ones only",
  "Can we just appreciate how wholesome this community is?",
  "You guys always make my day better 🙏",
  "This hub is literally my happy place",
  "The positivity in here is unmatched. Keep it up!",
  "Every time I open this hub I leave with a smile",
];

async function main() {
  console.log('[seed-hub-posts] Starting hub posts seeding...');

  // Get all hubs
  const hubs = await prisma.hub.findMany();
  console.log(`[seed-hub-posts] Found ${hubs.length} hubs`);

  // Get bot users
  const bots = await prisma.user.findMany({
    where: { id: { in: BOT_USER_IDS } },
    select: { id: true },
  });
  const botIds = bots.map((b) => b.id);
  console.log(`[seed-hub-posts] Found ${botIds.length} bot users`);

  if (botIds.length === 0) {
    console.log('[seed-hub-posts] No bot users found. Skipping.');
    await prisma.$disconnect();
    return;
  }

  let totalPosts = 0;
  let totalComments = 0;

  for (const hub of hubs) {
    // First, make some bots members of the hub
    const numMembers = Math.min(3 + Math.floor(Math.random() * 5), botIds.length);
    const hubBotMembers = botIds.slice(0, numMembers);

    for (const botId of hubBotMembers) {
      try {
        await prisma.hubMember.create({
          data: { userId: botId, hubId: hub.id },
        });
      } catch {
        // Already a member, skip
      }
    }

    // Get category-specific templates
    const category = hub.category || 'general';
    const templates = HUB_POST_TEMPLATES[category] || HUB_POST_TEMPLATES.general;

    // Create 3-5 posts per hub
    const numPosts = 3 + Math.floor(Math.random() * 3);
    const usedTemplates = new Set();

    for (let i = 0; i < numPosts; i++) {
      let templateIdx;
      do {
        templateIdx = Math.floor(Math.random() * templates.length);
      } while (usedTemplates.has(templateIdx) && usedTemplates.size < templates.length);
      usedTemplates.add(templateIdx);

      const text = templates[templateIdx] || templates[0];
      const authorId = hubBotMembers[Math.floor(Math.random() * hubBotMembers.length)];

      // Create the post
      const post = await prisma.hubPost.create({
        data: {
          text,
          authorId,
          hubId: hub.id,
          likesCount: Math.floor(Math.random() * 20) + 2,
          commentsCount: 0,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        },
      });

      totalPosts++;

      // Add 1-3 comments per post
      const numComments = 1 + Math.floor(Math.random() * 3);
      for (let c = 0; c < numComments; c++) {
        const commenterIdx = Math.floor(Math.random() * botIds.length);
        const commenterId = botIds[commenterIdx];
        const commentText = HUB_COMMENT_TEMPLATES[Math.floor(Math.random() * HUB_COMMENT_TEMPLATES.length)];

        try {
          await prisma.hubPostComment.create({
            data: {
              text: commentText,
              hubPostId: post.id,
              authorId: commenterId,
              createdAt: new Date(post.createdAt.getTime() + (c + 1) * 60000 * (5 + Math.random() * 30)),
            },
          });

          // Increment comments count
          await prisma.hubPost.update({
            where: { id: post.id },
            data: { commentsCount: { increment: 1 } },
          });

          totalComments++;
        } catch {
          // Skip failed comments
        }
      }
    }

    console.log(`[seed-hub-posts] Hub "${hub.name}" (${category}): ${numPosts} posts seeded`);
  }

  console.log(`[seed-hub-posts] Done! Total: ${totalPosts} posts, ${totalComments} comments across ${hubs.length} hubs`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[seed-hub-posts] Error:', err);
  process.exit(1);
});
