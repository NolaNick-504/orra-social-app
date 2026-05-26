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

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.ORRA_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXTAUTH_SECRET || 'orra-super-secret-key-2025-production';
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

// Photo post templates — posts that cry out for comments
const PHOTO_POST_TEMPLATES = [
  { text: "Made this from scratch and I'm not even sorry for the food spam. Best thing I've eaten all year 🍜", vibeTag: 'chill' },
  { text: "Brunch is served! Who's coming over? Made enough for the whole crew 🥞", vibeTag: 'chill' },
  { text: "Late night cooking hits different. This pasta took 2 hours and I regret nothing", vibeTag: 'chill' },
  { text: "My abuela's secret recipe. She'd kill me for sharing but y'all deserve to know 🫔", vibeTag: 'chill' },
  { text: "Coffee art level: finally not embarrassing. What's your go-to order? ☕", vibeTag: 'chill' },
  { text: "Golden hour never disappoints. This view was worth the 6am hike 💛", vibeTag: 'peaceful' },
  { text: "Found this hidden beach and I'm not telling anyone where it is... okay maybe you guys 😏", vibeTag: 'chill' },
  { text: "City lights hit different at 2am. Who else is a night owl? 🌃", vibeTag: 'dramatic' },
  { text: "This sunset literally stopped me in my tracks. Nature stays winning 🌅", vibeTag: 'peaceful' },
  { text: "Street art just hits different in Berlin. Every corner is a gallery 🎨", vibeTag: 'dramatic' },
  { text: "New fit check! This look took 3 stores and 47 changing rooms to find 😂", vibeTag: 'dramatic' },
  { text: "When the outfit just works and you can't stop looking in the mirror 💅", vibeTag: 'dramatic' },
  { text: "Thrift store find of the CENTURY. $8 for this vintage jacket?! Steal of the year", vibeTag: 'laughing' },
  { text: "Post-workout glow is real! 6 months of consistency and I finally see the change 💪", vibeTag: 'hyped' },
  { text: "Basketball pickup game went CRAZY today. Hit the game winner! 🏀", vibeTag: 'hyped' },
  { text: "My cat just did the funniest thing and I happened to catch it on camera 😂", vibeTag: 'laughing' },
  { text: "This good boy followed me on my morning walk. Best hiking buddy ever 🐕", vibeTag: 'peaceful' },
  { text: "12 hours of painting later... is it done? I genuinely can't tell anymore 😅", vibeTag: 'dramatic' },
  { text: "Digital art process! Swipe to see the layers come together. Still can't believe this started as a blank canvas", vibeTag: 'dramatic' },
  { text: "New mural in progress! This one's dedicated to the ORRA community 🎨", vibeTag: 'dramatic' },
  { text: "New setup is FINALLY complete! Took 3 months of saving but worth every penny 🖥️", vibeTag: 'focused' },
  { text: "Retro gaming night! Some games just hit different on the original console 🕹️", vibeTag: 'chill' },
  { text: "Studio session going crazy tonight! New track is almost done and it's a banger 🔥", vibeTag: 'hyped' },
  { text: "Vinyl collection growing! Found a first press of my favorite album at the flea market 🎵", vibeTag: 'chill' },
];

// Text-only post templates
const TEXT_POST_TEMPLATES = [
  "Just tried the new AI coding assistant and it wrote my entire app in 10 minutes. We're living in the future fr",
  "Anyone else feel like we're on the verge of something massive with AI? The pace is insane right now",
  "Woke up today and chose peace. No drama, just vibes ✌️",
  "That post-workout feeling hits different when you actually stick to the routine",
  "Late night drives with the windows down >>>>",
  "Sometimes you just need to disconnect and touch grass fr",
  "3am thoughts hit different when the whole world is asleep",
  "My cat just knocked my coffee off the table and looked at me like it was MY fault 😤",
  "If you say 'I'm fine' 3 times in the mirror, a therapist appears",
  "Me: I'll go to bed early tonight. Also me at 3am: just one more video",
  "This new album dropped and I haven't stopped listening since. On repeat all day",
  "Nothing compares to finding a song that perfectly matches your mood",
  "Day 30 of working out every day. The transformation is real 💪",
  "Stop waiting for the perfect moment. The moment you start IS the perfect moment",
  "Your only competition is who you were yesterday. Keep pushing",
  "Small progress is still progress. Don't compare your chapter 1 to someone's chapter 20",
  "Hot take: the best tech is the tech that disappears into your daily routine",
  "The world moves fast but staying informed doesn't mean doom scrolling. Balance is key",
  "Who else is addicted to the ORRA feed? Can't stop scrolling 😂",
  "ORRA tokens stacking up! What's everyone saving for?",
  "The community on here is actually so much better than other apps. No toxicity, just vibes",
  "Just hit Level 10 on ORRA! The grind never stops 💎",
  "Plot twist: the wifi was working fine, I just forgot to pay the bill",
  "Friday plans? Couch, snacks, and absolutely zero social interaction. Perfect.",
  "When someone says 'we need to talk' and it's just about lunch plans 😮‍💨",
  "Making a playlist for every possible mood is not a problem, it's a lifestyle",
  "Found the best taco spot in town. Life is complete now 🌮",
  "Mental health check: how are you really doing today? Be honest with yourself",
  "Can we normalize changing our opinions when presented with new evidence?",
  "Surround yourself with people who make you want to level up",
];

/**
 * Pick a random item from an array
 */
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Create a single auto-post via the API (text or photo template as text)
 */
async function createAutoPost(usePhotoTemplate) {
  const template = usePhotoTemplate ? randomItem(PHOTO_POST_TEMPLATES) : null;
  const authorId = randomItem(BOT_USER_IDS);
  const vibeTag = usePhotoTemplate ? template.vibeTag : randomItem(VIBE_TAGS);
  const text = usePhotoTemplate ? template.text : randomItem(TEXT_POST_TEMPLATES);

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
      console.log(`[auto-poster] ✅ ${usePhotoTemplate ? 'Photo' : 'Text'} post by ${post.author?.name || authorId}: "${text.substring(0, 50)}..." [${vibeTag}]`);
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
 * Generate AI image asynchronously (non-blocking) and post it
 * Uses spawn instead of execSync so it doesn't block the event loop
 */
async function createImagePost() {
  const template = randomItem(PHOTO_POST_TEMPLATES);
  const authorId = randomItem(BOT_USER_IDS);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imageFilename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
  const imagePath = path.join(uploadDir, imageFilename);

  console.log(`[auto-poster] 🎨 Generating image for: "${template.text.substring(0, 50)}..."`);

  // Use spawn (async) instead of execSync to avoid blocking
  const imageGenerated = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve(false);
    }, 45000); // 45s timeout

    const proc = spawn('z-ai-generate', [
      '-p', template.text.substring(0, 100),
      '-o', imagePath,
      '-s', '1344x768'
    ], { stdio: 'pipe' });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 && fs.existsSync(imagePath)) {
        resolve(true);
      } else {
        console.error(`[auto-poster] ⚠️ Image gen exited code ${code}: ${stderr.substring(0, 100)}`);
        try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch {}
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`[auto-poster] ⚠️ Image gen error: ${err.message}`);
      resolve(false);
    });
  });

  // Copy to standalone dir if generated
  if (imageGenerated) {
    try {
      const standaloneDir = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads');
      if (!fs.existsSync(standaloneDir)) fs.mkdirSync(standaloneDir, { recursive: true });
      fs.copyFileSync(imagePath, path.join(standaloneDir, imageFilename));
    } catch (copyErr) {
      console.error(`[auto-poster] ⚠️ Copy to standalone failed: ${copyErr.message}`);
    }
  }

  const imageUrl = imageGenerated ? `/uploads/${imageFilename}` : '';
  const postType = imageGenerated ? 'image' : 'text';

  // Create the post via API
  try {
    const res = await fetch(`${BASE_URL}/api/auto-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-autopost-key': API_KEY },
      body: JSON.stringify({
        text: template.text,
        vibeTag: template.vibeTag,
        authorId,
        type: postType,
        images: imageGenerated ? [imageUrl] : [],
      }),
    });

    const data = await res.json();
    if (data.success) {
      const post = data.data.post;
      console.log(`[auto-poster] ✅ Image post by ${post.author?.name || authorId}: "${template.text.substring(0, 50)}..." [${template.vibeTag}] ${imageGenerated ? '📸' : '(no image)'}`);
      return true;
    } else {
      console.error(`[auto-poster] ❌ Post failed: ${data.error}`);
      if (imageGenerated && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      return false;
    }
  } catch (err) {
    console.error(`[auto-poster] ❌ Network error: ${err.message}`);
    return false;
  }
}

/**
 * Run the auto-poster once (1-3 posts, mix of text and photo)
 */
async function runOnce() {
  const postCount = 1 + Math.floor(Math.random() * 3); // 1-3 posts per cycle
  console.log(`[auto-poster] Creating ${postCount} post(s)... [${new Date().toISOString()}]`);

  for (let i = 0; i < postCount; i++) {
    const roll = Math.random();
    if (roll < 0.15) {
      // 15% chance: try image post with AI generation
      await createImagePost();
    } else if (roll < 0.45) {
      // 30% chance: photo template as text (engaging text, no image gen)
      await createAutoPost(true);
    } else {
      // 55% chance: pure text post
      await createAutoPost(false);
    }
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
  try {
    await runOnce();
  } catch (err) {
    console.error(`[auto-poster] ❌ Initial run error: ${err.message}`);
  }

  // Then run every INTERVAL_MS
  setInterval(async () => {
    try {
      await runOnce();
    } catch (err) {
      console.error(`[auto-poster] ❌ Scheduled run error: ${err.message}`);
    }
  }, INTERVAL_MS);

  console.log(`[auto-poster] ⏰ Next batch in ${INTERVAL_MS / 1000}s. Process alive.`);
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error(`[auto-poster] 💥 Uncaught exception: ${err.message}`);
});
process.on('unhandledRejection', (err) => {
  console.error(`[auto-poster] 💥 Unhandled rejection: ${err}`);
});

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
