#!/usr/bin/env node
/**
 * Enrich posts with AI-generated images and seed comments from bot users.
 * This makes the feed feel alive and real.
 * 
 * Usage: node scripts/enrich-posts.js [--images 40] [--comments 60]
 */
const { execSync } = require('child_process');
const path = require('path');

// We'll use Prisma directly
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules', '.prisma', 'client'));
const db = new PrismaClient();

// Bot user IDs
const BOT_IDS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'u14', 'u15', 'u16'];

// Comment templates per vibe
const COMMENT_TEMPLATES = {
  hyped: [
    "This got me so hyped!! 🔥🔥🔥",
    "Let's gooo! This is incredible!",
    "The energy in this post is unreal",
    "Absolutely fire content right here 🔥",
    "This is what ORRA is all about! Hyped!",
    "Can't stop coming back to this post 🔥",
    "Yooo this goes crazy!!",
    "Need more content like this fr fr",
    "This just made my whole day better 💯",
    "Peak content right here no cap",
  ],
  laughing: [
    "I'm literally crying 😂😂😂",
    "This took me OUT 💀",
    "Can't breathe right now 😂",
    "I've watched this 10 times and it's still funny",
    "My stomach hurts from laughing 😂",
    "Bro this is too funny 😂😂",
    "Nah this can't be real 😭😂",
    "Funniest thing I've seen all week",
    "Tears are streaming 😂💀",
    "The way I just screamed 😂",
  ],
  chill: [
    "This is so peaceful and calming 🌊",
    "Exactly the vibe I needed today",
    "Chill vibes only 🧊",
    "This is giving me the best energy ✨",
    "Such a relaxing moment captured perfectly",
    "Chill content like this keeps me grounded",
    "The serenity in this is unmatched 🌿",
    "Pure peace right here",
    "This is what I needed to see today 🌅",
    "So soothing, thank you for sharing this",
  ],
  dramatic: [
    "The DRAMA of it all 💅✨",
    "This is giving main character energy",
    "I can't even deal with this right now 😩",
    "The plot twist nobody saw coming!",
    "This is more dramatic than a movie",
    "Hold on let me grab my popcorn 🍿",
    "Stay for the ending... you won't believe it",
    "When life gives you drama, make it content 💅",
    "This needs its own Netflix series fr",
    "I was NOT ready for this 😱",
  ],
  focused: [
    "Great advice! Taking notes 📝",
    "This is exactly what I needed to hear",
    "Focus mode activated 💪",
    "Productivity tip of the day right here",
    "Bookmarking this for later 📌",
    "The knowledge dropped here is invaluable",
    "This changed my whole perspective",
    "Facts! Implementation starts today",
    "Thanks for sharing this wisdom 🙏",
    "This is the motivation I needed today",
  ],
  peaceful: [
    "This brings me so much inner peace 🕊️",
    "What a beautiful moment 🌅",
    "Peace and love always ✌️",
    "Sending peaceful vibes your way",
    "This made me smile so much 😊",
    "The world needs more of this energy",
    "Simply beautiful, thank you for this 🙏",
    "Finding peace in the little things",
    "This is what life is all about",
    "My soul needed this today 🕊️",
  ],
  news: [
    "This is important, everyone needs to see this",
    "Thanks for bringing awareness to this 📢",
    "The more people know about this the better",
    "Breaking news that actually matters",
    "We need to talk about this more",
    "This changes everything we thought we knew",
    "Finally some real news on my feed",
    "Important information right here 👆",
    "Can't believe this isn't getting more attention",
    "Sharing this everywhere, people need to know",
  ],
  sports: [
    "What a play!! 🏆",
    "Absolute legend for this one",
    "The athleticism is insane 🤯",
    "Game changer right here!",
    "This is why I love sports ⚽",
    "GOAT status confirmed 🐐",
    "Clutch performance when it mattered most",
    "The highlights keep getting better 🏀",
    "Unbelievable skills on display here",
    "This deserves a replay 🔁🏆",
  ],
};

// Generic comments for any vibe
const GENERIC_COMMENTS = [
  "Facts! 💯",
  "This is so real",
  "Needed to hear this today",
  "You're so right about this",
  "Couldn't agree more 🔥",
  "This speaks to me on another level",
  "W post honestly",
  "Finally someone said it!",
  "Real ones know 💯",
  "This is why I love ORRA",
  "Dropping gems as always ✨",
  "Can we get more content like this?",
  "This just hits different fr",
  "Pure gold right here 🏆",
  "The vibes are immaculate",
];

// Image prompt templates based on post text keywords
function generateImagePrompt(postText) {
  const lower = postText.toLowerCase();
  
  if (lower.includes('sunset') || lower.includes('sunrise') || lower.includes('sky')) {
    return "Breathtaking sunset sky with vibrant orange pink and purple clouds, dramatic landscape photography, cinematic lighting, 4k quality";
  }
  if (lower.includes('city') || lower.includes('night') || lower.includes('urban')) {
    return "Neon lit city skyline at night, cyberpunk aesthetic, glowing buildings reflecting on water, cinematic urban photography";
  }
  if (lower.includes('music') || lower.includes('studio') || lower.includes('track') || lower.includes('song')) {
    return "Music studio session with colorful LED lights, professional recording equipment, ambient purple and blue glow, moody photography";
  }
  if (lower.includes('workout') || lower.includes('gym') || lower.includes('fitness')) {
    return "Modern gym interior with dramatic lighting, fitness equipment, motivational atmosphere, dark moody aesthetic";
  }
  if (lower.includes('food') || lower.includes('cook') || lower.includes('recipe') || lower.includes('eat')) {
    return "Beautifully plated gourmet food, dramatic overhead lighting, dark background, food photography, steam rising";
  }
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('vacation') || lower.includes('beach')) {
    return "Stunning tropical beach with turquoise water and palm trees, aerial drone photography, paradise landscape";
  }
  if (lower.includes('art') || lower.includes('draw') || lower.includes('paint') || lower.includes('creative')) {
    return "Artist workspace with paint splatters and canvas, creative studio, warm ambient lighting, artistic aesthetic";
  }
  if (lower.includes('car') || lower.includes('drive') || lower.includes('ride')) {
    return "Luxury sports car with neon underglow on wet asphalt at night, cinematic car photography, reflections";
  }
  if (lower.includes('game') || lower.includes('gaming') || lower.includes('play')) {
    return "Gaming setup with RGB lights, multiple monitors, neon purple and blue ambient glow, immersive atmosphere";
  }
  if (lower.includes('love') || lower.includes('heart') || lower.includes('relationship')) {
    return "Romantic golden hour silhouette of couple, warm sunset background, dreamy bokeh lights, emotional photography";
  }
  if (lower.includes('money') || lower.includes('hustle') || lower.includes('grind') || lower.includes('success')) {
    return "Luxury office interior with city view, motivational aesthetic, dark and gold color scheme, success vibe";
  }
  if (lower.includes('nature') || lower.includes('mountain') || lower.includes('hike') || lower.includes('forest')) {
    return "Misty mountain forest at dawn, golden rays through trees, mystical atmosphere, landscape photography";
  }
  if (lower.includes('coffee') || lower.includes('morning') || lower.includes('tea')) {
    return "Artisan coffee latte art in a dark aesthetic cafe, warm ambient lighting, cozy atmosphere, moody photography";
  }
  if (lower.includes('dog') || lower.includes('pet') || lower.includes('puppy')) {
    return "Adorable golden retriever puppy playing in golden sunlight, bokeh background, heartwarming pet photography";
  }
  if (lower.includes('fashion') || lower.includes('style') || lower.includes('outfit') || lower.includes('fit')) {
    return "Street fashion photography, edgy urban outfit, dramatic lighting, dark aesthetic, high contrast";
  }
  // Default - abstract/cinematic
  return "Cinematic abstract aesthetic, dark purple and blue gradient with glowing particles, futuristic ambient, moody atmospheric photography";
}

async function main() {
  const args = process.argv.slice(2);
  let imageCount = 40;
  let commentCount = 60;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--images' && args[i + 1]) imageCount = parseInt(args[i + 1]);
    if (args[i] === '--comments' && args[i + 1]) commentCount = parseInt(args[i + 1]);
  }

  console.log(`=== Enriching Posts ===`);
  console.log(`Target: ${imageCount} images, ${commentCount} comments`);

  // Get posts without images
  const allPosts = await db.post.findMany({
    select: { id: true, images: true, type: true, text: true, vibeTag: true, commentsCount: true },
    orderBy: { createdAt: 'desc' },
  });

  const postsWithoutImages = allPosts.filter(p => {
    try { return JSON.parse(p.images).length === 0; } catch { return true; }
  });

  const postsWithoutComments = allPosts.filter(p => p.commentsCount === 0);

  console.log(`Posts without images: ${postsWithoutImages.length}`);
  console.log(`Posts without comments: ${postsWithoutComments.length}`);

  // ============================
  // STEP 1: Generate AI images for posts
  // ============================
  const imagePosts = postsWithoutImages.slice(0, imageCount);
  console.log(`\nGenerating ${imagePosts.length} AI images...`);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const fs = require('fs');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  let imagesGenerated = 0;
  for (const post of imagePosts) {
    try {
      const prompt = generateImagePrompt(post.text || '');
      const timestamp = Date.now();
      const filename = `ai-enriched-${timestamp}-${post.id.slice(0, 6)}.jpg`;
      const outputPath = path.join(uploadDir, filename);

      // Use z-ai-generate CLI tool
      console.log(`  [${imagesGenerated + 1}/${imagePosts.length}] Generating image for post ${post.id.slice(0, 8)}...`);
      execSync(`z-ai-generate -p "${prompt.replace(/"/g, '\\"')}" -o "${outputPath}" -s 864x1152`, {
        timeout: 30000,
        stdio: 'pipe',
      });

      // Update post with image
      await db.post.update({
        where: { id: post.id },
        data: {
          images: JSON.stringify([`/uploads/${filename}`]),
          type: 'image',
        },
      });

      imagesGenerated++;
      console.log(`    ✅ Saved ${filename}`);
    } catch (err) {
      console.log(`    ❌ Failed: ${err.message?.slice(0, 80) || 'Unknown error'}`);
    }
  }

  console.log(`\nGenerated ${imagesGenerated} images successfully`);

  // ============================
  // STEP 2: Seed comments from bot users
  // ============================
  const commentPosts = postsWithoutComments.slice(0, commentCount);
  console.log(`\nSeeding ${commentPosts.length * 2} comments on ${commentPosts.length} posts...`);

  let commentsCreated = 0;
  for (const post of commentPosts) {
    try {
      // Add 1-3 comments per post
      const numComments = 1 + Math.floor(Math.random() * 3);
      const vibe = post.vibeTag || 'hyped';
      const vibeComments = COMMENT_TEMPLATES[vibe] || COMMENT_TEMPLATES.hyped;
      
      for (let i = 0; i < numComments; i++) {
        // Pick a random bot
        const botId = BOT_IDS[Math.floor(Math.random() * BOT_IDS.length)];
        // Pick a random comment template
        const commentPool = Math.random() > 0.3 ? vibeComments : GENERIC_COMMENTS;
        const text = commentPool[Math.floor(Math.random() * commentPool.length)];
        
        // Create random timestamp within the last few days
        const hoursAgo = Math.floor(Math.random() * 72) + 1;
        const createdAt = new Date(Date.now() - hoursAgo * 3600000);

        await db.comment.create({
          data: {
            text,
            postId: post.id,
            authorId: botId,
            createdAt,
          },
        });

        // Update comments count
        await db.post.update({
          where: { id: post.id },
          data: { commentsCount: { increment: 1 } },
        });

        commentsCreated++;
      }
    } catch (err) {
      console.log(`    ❌ Failed on post ${post.id.slice(0, 8)}: ${err.message?.slice(0, 60)}`);
    }
  }

  console.log(`Created ${commentsCreated} comments successfully`);

  // Also add some comments to posts that already have a few (make them feel more alive)
  const postsWithFewComments = allPosts.filter(p => p.commentsCount > 0 && p.commentsCount < 3).slice(0, 20);
  console.log(`\nAdding extra comments to ${postsWithFewComments.length} posts with few comments...`);
  
  let extraComments = 0;
  for (const post of postsWithFewComments) {
    try {
      const botId = BOT_IDS[Math.floor(Math.random() * BOT_IDS.length)];
      const vibe = post.vibeTag || 'hyped';
      const vibeComments = COMMENT_TEMPLATES[vibe] || COMMENT_TEMPLATES.hyped;
      const text = vibeComments[Math.floor(Math.random() * vibeComments.length)];
      
      const hoursAgo = Math.floor(Math.random() * 48) + 1;
      
      await db.comment.create({
        data: {
          text,
          postId: post.id,
          authorId: botId,
          createdAt: new Date(Date.now() - hoursAgo * 3600000),
        },
      });
      
      await db.post.update({
        where: { id: post.id },
        data: { commentsCount: { increment: 1 } },
      });
      
      extraComments++;
    } catch (err) {
      // Skip silently
    }
  }

  console.log(`Added ${extraComments} extra comments`);

  // Final stats
  const finalPosts = await db.post.findMany({ select: { images: true, commentsCount: true } });
  const finalWithImages = finalPosts.filter(p => { try { return JSON.parse(p.images).length > 0; } catch { return false; } });
  const finalWithComments = finalPosts.filter(p => p.commentsCount > 0);
  const totalComments = await db.comment.count();

  console.log(`\n=== Final Stats ===`);
  console.log(`Posts with images: ${finalWithImages.length}/${finalPosts.length}`);
  console.log(`Posts with comments: ${finalWithComments.length}/${finalPosts.length}`);
  console.log(`Total comments: ${totalComments}`);

  await db.$disconnect();
  console.log('\nDone! Posts enriched successfully.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
