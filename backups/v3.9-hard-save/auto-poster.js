#!/usr/bin/env node
/**
 * ORRA Auto-Poster — Background job that generates random posts every 5 minutes
 * to keep the feed feeling live and real.
 *
 * Usage:
 *   node scripts/auto-poster.js            # Run once
 *   node scripts/auto-poster.js --cron     # Run every 5 minutes
 *
 * Environment:
 *   ORRA_URL - Base URL of the ORRA app (default: http://localhost:3000)
 *   NEXTAUTH_SECRET - API key for auto-post endpoint
 */

const BASE_URL = process.env.ORRA_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXTAUTH_SECRET || 'aura-super-secret-key-2027-dev-only';
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Bot user IDs (seeded users, NOT the real user)
const BOT_USER_IDS = [
  'u1',   // Jessica Art
  'u2',   // David Chen
  'u3',   // Sarah Kim
  'u4',   // Marcus Rivera
  'u5',   // Elena Rodriguez
  'u6',   // Tech Daily
  'u7',   // Wellness Guru
  'u8',   // Cyber Drifter
  'u9',   // Music Central
  'u10',  // Luna Sky
  'u11',  // Kai Storm
  'u12',  // Nova Blaze
  'u13',  // Zara Miles
  'u14',  // Jay Parker
  'u15',  // Maya Chen
  'u16',  // Dre Williams
];

const VIBE_TAGS = ['hyped', 'laughing', 'chill', 'dramatic', 'focused', 'peaceful', 'news', 'sports'];

// Curated random post content — realistic social media posts
const POST_TEMPLATES = [
  // Tech & AI
  "Just tried the new AI coding assistant and it wrote my entire app in 10 minutes. We're living in the future fr",
  "Anyone else feel like we're on the verge of something massive with AI? The pace is insane right now",
  "Built my first app using only AI prompts today. The future is wild.",
  "Tech tip: always back up your code before a major refactor. Learned that the hard way today 😅",
  "The new phone releases are getting boring. Where's the innovation? Give me something revolutionary",
  "Just set up my smart home with voice commands. Feeling like Iron Man right now 🏠🤖",
  "AI art is getting scary good. Can't even tell what's real anymore",
  "Hot take: the best tech is the tech that disappears into your daily routine",
  "Spent the whole day debugging. The bug? A missing semicolon. Classic.",

  // Vibes & Lifestyle
  "Woke up today and chose peace. No drama, just vibes ✌️",
  "That post-workout feeling hits different when you actually stick to the routine",
  "Late night drives with the windows down >>>>",
  "Sometimes you just need to disconnect and touch grass fr",
  "Started journaling and it's actually changing how I process things",
  "The sunset tonight was absolutely unreal. Nature stays winning",
  "3am thoughts hit different when the whole world is asleep",
  "Minimalism is the move. Less stuff, more peace of mind",
  "Clean room, clean mind. Just reorganized everything and I feel brand new",

  // ORRA community
  "Who else is addicted to the ORRA feed? Can't stop scrolling 😂",
  "The ORRA Dance Off is insane this season! Some of these entries are fire 🔥",
  "Just hit Level 10 on ORRA! The grind never stops 💎",
  "The community on here is actually so much better than other apps. No toxicity, just vibes",
  "ORRA tokens stacking up! What's everyone saving for?",
  "Echo if you think ORRA is the future of social media 🌊",
  "The mood filter on ORRA is genius. No more doom scrolling, just content I actually want",
  "Shoutout to the ORRA team for actually listening to users. That's rare these days",

  // Funny & Random
  "My cat just knocked my coffee off the table and looked at me like it was MY fault 😤",
  "Plot twist: the wifi was working fine, I just forgot to pay the bill",
  "If you say 'I'm fine' 3 times in the mirror, a therapist appears",
  "Me: I'll go to bed early tonight. Also me at 3am: just one more video",
  "Accidentally liked a post from 2018. Time to change my name and move countries",
  "Friday plans? Couch, snacks, and absolutely zero social interaction. Perfect.",
  "When someone says 'we need to talk' and it's just about lunch plans 😮‍💨",

  // Music & Culture
  "This new album dropped and I haven't stopped listening since. On repeat all day",
  "Nothing compares to finding a song that perfectly matches your mood",
  "Live music hits completely different. You can feel the bass in your chest",
  "Making a playlist for every possible mood is not a problem, it's a lifestyle",
  "That one song that takes you right back to a specific memory 🎵",

  // Food & Drinks
  "Made ramen from scratch today. Took 6 hours but totally worth it 🍜",
  "Coffee is not a drink, it's a lifestyle. Don't @ me ☕",
  "Trying to meal prep but my cooking skills say otherwise 😂",
  "Found the best taco spot in town. Life is complete now 🌮",
  "Brunch without mimosas is just a sad breakfast idc",

  // Fitness & Wellness
  "Day 30 of working out every day. The transformation is real 💪",
  "Remember: rest days are part of the program. Don't burn yourself out",
  "Just hit a new PR on deadlifts! Consistency is everything",
  "Mental health check: how are you really doing today? Be honest with yourself",
  "Stretching is underrated. Your future self will thank you",

  // News & Culture
  "The world moves fast but staying informed doesn't mean doom scrolling. Balance is key",
  "Can we normalize changing our opinions when presented with new evidence?",
  "Big changes happening and I'm here for all of it",
  "History repeats itself but this time we have memes about it",

  // Motivational
  "Stop waiting for the perfect moment. The moment you start IS the perfect moment",
  "Your only competition is who you were yesterday. Keep pushing",
  "Dreams don't work unless you do. But also, take breaks. Burnout is real",
  "Surround yourself with people who make you want to level up",
  "Small progress is still progress. Don't compare your chapter 1 to someone's chapter 20",
];

/**
 * Pick a random item from an array
 */
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick 1-3 random unique items from an array
 */
function randomItems(arr, min = 1, max = 3) {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Create a single auto-post via the API
 */
async function createAutoPost() {
  const authorId = randomItem(BOT_USER_IDS);
  const text = randomItem(POST_TEMPLATES);
  const vibeTag = randomItem(VIBE_TAGS);

  try {
    const res = await fetch(`${BASE_URL}/api/auto-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopost-key': API_KEY,
      },
      body: JSON.stringify({ text, vibeTag, authorId }),
    });

    const data = await res.json();

    if (data.success) {
      const post = data.data.post;
      console.log(`[auto-poster] ✅ Post created by ${post.author?.name || authorId}: "${text.substring(0, 50)}..." [${vibeTag}]`);
      return true;
    } else {
      console.error(`[auto-poster] ❌ Failed: ${data.error}`);
      return false;
    }
  } catch (err) {
    console.error(`[auto-poster] ❌ Network error: ${err.message}`);
    return false;
  }
}

/**
 * Run the auto-poster once (1-3 posts)
 */
async function runOnce() {
  const postCount = 1 + Math.floor(Math.random() * 3); // 1-3 posts per cycle
  console.log(`[auto-poster] Creating ${postCount} post(s)...`);

  for (let i = 0; i < postCount; i++) {
    await createAutoPost();
    // Small delay between posts so they don't all have the same timestamp
    if (i < postCount - 1) {
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 3000));
    }
  }
}

/**
 * Run the auto-poster on a cron schedule
 */
async function runCron() {
  console.log(`[auto-poster] 🚀 Starting auto-poster (every ${INTERVAL_MS / 1000}s)`);
  console.log(`[auto-poster] Base URL: ${BASE_URL}`);

  // Run immediately on start
  await runOnce();

  // Then run every INTERVAL_MS
  setInterval(async () => {
    await runOnce();
  }, INTERVAL_MS);
}

// Main
const args = process.argv.slice(2);
if (args.includes('--cron')) {
  runCron();
} else {
  runOnce().then(() => {
    console.log('[auto-poster] Done (single run). Use --cron for continuous mode.');
    process.exit(0);
  });
}
