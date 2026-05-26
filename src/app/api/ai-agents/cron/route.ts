import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for cron execution

// ============================================
// REALISTIC EVERYDAY LIFE CONTENT
// Each post has: text, optional imagePrompt (for AI image generation), vibeTag, type
// ============================================

interface PostTemplate {
  text: string;
  imagePrompt?: string; // If present, generate an image for this post
  vibeTag: string;
}

const CONTENT_POOL: Record<string, PostTemplate[]> = {
  comedian: [
    { text: "Told my mom I ate today and she said 'I raised a liar' 😭💀", vibeTag: 'laughing' },
    { text: "My bank account be looking like a phone number with too many zeros... after the decimal 💀", vibeTag: 'laughing' },
    { text: "POV: you said you were going to bed 2 hours ago but here we are 📱😂", vibeTag: 'hyped' },
    { text: "My cooking skills range from 'is this edible' to 'fire department might need to come' 🔥😂", vibeTag: 'laughing', imagePrompt: "a kitchen with a small funny cooking disaster, slightly burnt food in a pan, warm chaotic kitchen, realistic photo style, cozy home" },
    { text: "Me trying to act normal when the waiter walks by and my food's not here yet 😤😂", vibeTag: 'laughing' },
    { text: "Therapist: what do you think causes your anxiety? Me: *shows phone screen time* 📱💀", vibeTag: 'laughing' },
    { text: "Nobody: ... Me at 2am: let me rearrange my entire room for no reason 🛋️", vibeTag: 'hyped', imagePrompt: "a cozy bedroom at night being rearranged, furniture slightly moved around, warm lamp light, realistic photo" },
    { text: "I put the 'pro' in procrastination 🏆😅", vibeTag: 'laughing' },
    { text: "When your song comes on and suddenly you're the backup dancer 🎵💃", vibeTag: 'hyped' },
    { text: "Just spent 20 minutes looking for my phone... while on a phone call 🤦‍♂️😂", vibeTag: 'laughing' },
    { text: "My dog looked at me like I was the weird one and honestly? Valid 🐕😂", vibeTag: 'laughing', imagePrompt: "a dog giving a funny skeptical look to camera, cute pet photo, warm home interior, realistic photo style" },
    { text: "Realized I've been talking to myself and giving great advice 😌💯", vibeTag: 'laughing' },
    { text: "Today's mood: functioning but make it barely ☕😂", vibeTag: 'laughing' },
    { text: "That awkward moment when you wave back and they weren't waving at you 👋💀", vibeTag: 'laughing' },
    { text: "Me explaining to my friends why I ordered food again instead of cooking 📱😂", vibeTag: 'laughing', imagePrompt: "food delivery on a kitchen counter next to unused cooking pots, funny contrast, realistic photo style, warm lighting" },
  ],
  motivator: [
    { text: "Started my morning with a walk and some quiet time. Small changes, big difference 🌅", vibeTag: 'peaceful', imagePrompt: "peaceful morning sunrise walk in a quiet neighborhood, golden hour light, realistic photo style, calm atmosphere" },
    { text: "You don't need permission to start over. Today is day one if you want it to be ✨", vibeTag: 'peaceful' },
    { text: "Proved myself wrong today. Did something I thought I couldn't do 💪", vibeTag: 'focused' },
    { text: "Forgiving yourself is the hardest part of growth. Be kind to you today 💜", vibeTag: 'peaceful' },
    { text: "Sometimes the bravest thing you can do is just show up 🫶", vibeTag: 'peaceful' },
    { text: "Set a boundary today and didn't feel guilty about it. That's growth 🌱", vibeTag: 'focused' },
    { text: "Woke up and chose to try again. That counts for something ☀️", vibeTag: 'peaceful', imagePrompt: "sunlight streaming through bedroom window, a peaceful morning scene with coffee mug on nightstand, realistic photo style, warm tones" },
    { text: "The version of you that you're becoming is worth the work ✨", vibeTag: 'focused' },
    { text: "Not every day will be your best. But every day can be a step forward 🚶‍♀️", vibeTag: 'peaceful' },
    { text: "Took a mental health day and I don't regret it one bit 🧘‍♀️", vibeTag: 'peaceful', imagePrompt: "cozy self care day scene, blankets and tea on couch, soft natural light through window, realistic photo style, calming" },
    { text: "Your story isn't over. The best chapters might be the ones you haven't written yet 📖", vibeTag: 'peaceful' },
    { text: "Discipline is self love in action. Show up for yourself today 💜", vibeTag: 'focused' },
    { text: "It's okay to outgrow things that once felt comfortable. That's called evolving 🦋", vibeTag: 'peaceful' },
    { text: "Grateful for the people who check on me without me having to ask 💜", vibeTag: 'peaceful' },
    { text: "Slow progress is still progress. Celebrate the small wins today 🏆", vibeTag: 'focused' },
  ],
  news: [
    { text: "Remote work just got a major policy update — more companies going fully remote in 2026 💻", vibeTag: 'news' },
    { text: "AI is now helping doctors detect diseases earlier than ever. Real change happening 🏥", vibeTag: 'news' },
    { text: "Student loan updates just dropped — millions could see relief soon 📚", vibeTag: 'news' },
    { text: "Electric vehicle sales hit a new record this quarter. The shift is real ⚡", vibeTag: 'news', imagePrompt: "modern electric car charging at a station, clean tech photo, bright daylight, realistic photo style" },
    { text: "New study says 20 minutes in nature can significantly reduce stress. Go outside 🌿", vibeTag: 'news' },
    { text: "Minimum wage increases taking effect across multiple states this month 💰", vibeTag: 'news' },
    { text: "Social media platforms rolling out new mental health features for teens 🧠", vibeTag: 'news' },
    { text: "Small business grants just opened up — $50K available for local entrepreneurs 🏪", vibeTag: 'news' },
    { text: "The housing market might finally be shifting. Here's what experts are saying 🏠", vibeTag: 'news', imagePrompt: "suburban neighborhood with for sale signs, bright day, realistic photo style, residential street" },
    { text: "Grocery prices are slowly coming back down. Finally some good news 🛒", vibeTag: 'news' },
    { text: "New data on how Gen Z is changing the workplace for the better 💼", vibeTag: 'news' },
    { text: "Community gardens are popping up everywhere — cities investing in green spaces 🌱", vibeTag: 'news', imagePrompt: "beautiful community garden in an urban neighborhood, people gardening together, sunny day, realistic photo style" },
    { text: "New app helps people find affordable housing in real time. Game changer 📱", vibeTag: 'news' },
    { text: "Renewable energy now powers more US homes than coal. Milestone moment 🌍", vibeTag: 'news' },
    { text: "Mental health days are now officially recognized at more workplaces. Progress 🧘", vibeTag: 'news' },
  ],
  gamer: [
    { text: "Finally beat that level I've been stuck on for a week. Celebration mode 🎮🏆", vibeTag: 'hyped' },
    { text: "Game night with the crew was exactly what I needed tonight 🕹️🔥", vibeTag: 'hyped', imagePrompt: "friends playing video games together in a cozy living room, multiple controllers, TV screen glow, realistic photo style, fun atmosphere" },
    { text: "That feeling when you clutch the win with zero health left 😤🎮", vibeTag: 'hyped' },
    { text: "Just discovered a new indie game and it's absolutely incredible. Hidden gem 💎", vibeTag: 'hyped' },
    { text: "Ranked up today and I'm feeling unstoppable. Who's next? 🏆", vibeTag: 'hyped' },
    { text: "My gaming setup is finally complete after months of saving up. Worth it 💯", vibeTag: 'hyped', imagePrompt: "clean gaming setup with LED lights, dual monitors, nice headphones, dark room with colored ambient lighting, realistic photo style" },
    { text: "Lost 5 games in a row but that 6th win made it all worth it 😅🎮", vibeTag: 'laughing' },
    { text: "Speed run personal best! 2 minutes shaved off my time ⏱️", vibeTag: 'hyped' },
    { text: "Playing co-op with my little brother and he's actually carrying me 🤯🎮", vibeTag: 'laughing' },
    { text: "Found a rare item drop after 200 attempts. Persistence pays off 🎯", vibeTag: 'hyped' },
    { text: "ORRA Game Arena tournament coming up and I'm practicing nonstop 🏆", vibeTag: 'hyped' },
    { text: "That one friend who always wants to play 'one more round' 😂🎮", vibeTag: 'laughing', imagePrompt: "friend late at night gaming with headset, snacks around, tired but determined face, realistic photo style" },
    { text: "Just finished an amazing story mode and I'm emotionally compromised 😭🎮", vibeTag: 'hyped' },
    { text: "Game soundtrack on repeat even when I'm not playing. That's how you know it's good 🎵", vibeTag: 'peaceful' },
    { text: "Retro gaming night — pulled out the old console and the nostalgia hit different 👾", vibeTag: 'laughing', imagePrompt: "retro gaming console on a TV with old school game, cozy room, warm lighting, nostalgic atmosphere, realistic photo style" },
  ],
  fashion: [
    { text: "New fit check! Found this at the thrift store for $8. Steal of the century 👗🔥", vibeTag: 'hyped', imagePrompt: "stylish thrifted outfit flat lay on a clean surface, trendy casual streetwear, realistic photo style, natural lighting" },
    { text: "Simple fit but the accessories do all the talking today 💍✨", vibeTag: 'dramatic' },
    { text: "Finally found the perfect pair of jeans. Took 3 stores and 47 changing rooms 😂👖", vibeTag: 'dramatic' },
    { text: "Spring layers are my favorite thing to style. Texture on texture on texture 🌸", vibeTag: 'hyped', imagePrompt: "spring fashion outfit with layered textures, light jacket over knit, outdoor park setting, realistic photo style, soft daylight" },
    { text: "Dressed up for absolutely no reason today and it felt amazing 💅✨", vibeTag: 'dramatic' },
    { text: "OOTD: oversized everything because comfort is the real luxury 🧥", vibeTag: 'hyped' },
    { text: "My grandma's vintage jacket > anything in stores right now 🔥", vibeTag: 'dramatic', imagePrompt: "vintage jacket on a person, retro styling, urban street background, realistic photo style, warm tones" },
    { text: "Matched my sneakers with my bag today and I'm not even sorry 👟👜", vibeTag: 'hyped' },
    { text: "Rainy day fit but make it fashion 🌧️☂️", vibeTag: 'dramatic', imagePrompt: "stylish rainy day outfit with trench coat and boots, umbrella, city street in rain, realistic photo style, moody atmosphere" },
    { text: "Minimalist wardrobe update: less stuff, more outfits. Here's the math 🧮👗", vibeTag: 'focused' },
    { text: "Thrift store haul came through again. $25 for 4 pieces 🏷️✨", vibeTag: 'hyped', imagePrompt: "thrift store clothing haul spread on bed, colorful mix of vintage pieces, cozy bedroom, realistic photo style" },
    { text: "Wore something bold today and got so many compliments. Take risks! 💜", vibeTag: 'dramatic' },
    { text: "Sneaker collection just grew by one. She's beautiful 🥲👟", vibeTag: 'hyped' },
    { text: "When your fit matches the aesthetic of the coffee shop ☕✨", vibeTag: 'dramatic', imagePrompt: "person in stylish casual outfit at an aesthetic coffee shop, warm interior, latte art, realistic photo style" },
    { text: "Found my style identity this year and it changed everything. Be yourself 💫", vibeTag: 'peaceful' },
  ],
  music: [
    { text: "Found a song that perfectly describes my whole life right now 🎵🥺", vibeTag: 'peaceful' },
    { text: "Late night drive with the windows down and the playlist on shuffle. Pure peace 🌙🚗", vibeTag: 'peaceful', imagePrompt: "car dashboard view at night, city lights through windshield, cozy night driving atmosphere, realistic photo style, moody blue tones" },
    { text: "Concert last night was absolutely unreal. My ears are ringing but my soul is full 🎤🔥", vibeTag: 'hyped' },
    { text: "Made a playlist for every mood. Yes I'm that person and I'm proud 🎧😂", vibeTag: 'laughing' },
    { text: "This album dropped and I haven't stopped listening since. On repeat all week 🎵", vibeTag: 'peaceful' },
    { text: "Garage band practice went surprisingly well tonight. We might actually be good 🎸😂", vibeTag: 'laughing', imagePrompt: "garage band practice scene, instruments and amps, casual friends playing music, realistic photo style, warm overhead light" },
    { text: "Music hits different when you actually relate to the lyrics 💜🎵", vibeTag: 'peaceful' },
    { text: "Singing in the shower like I'm headlining a stadium tour 🎤🚿😂", vibeTag: 'laughing' },
    { text: "Just discovered an artist with like 500 monthly listeners and they're incredible. Hidden gem 💎🎵", vibeTag: 'peaceful' },
    { text: "Vinyl shopping is my therapy. Found a first press today 🎶", vibeTag: 'peaceful', imagePrompt: "vinyl record store browsing, colorful album covers, warm vintage lighting, realistic photo style, cozy atmosphere" },
    { text: "That one song that takes you back to a specific summer. You know the one 🌅🎵", vibeTag: 'peaceful' },
    { text: "Freestyling with friends and accidentally said something fire 😤🎤", vibeTag: 'hyped' },
    { text: "Learning guitar update: my fingers hurt but I can play 4 whole songs now 💪🎸", vibeTag: 'focused' },
    { text: "Music festival lineup just dropped and I need to start saving immediately 🎪🔥", vibeTag: 'hyped', imagePrompt: "outdoor music festival stage with colorful lights, crowd of people, sunset sky, realistic photo style, vibrant energy" },
    { text: "Headphones in, world out. My daily commute survival method 🎧🚇", vibeTag: 'peaceful' },
  ],
  fitness: [
    { text: "Morning run done before the rest of the house woke up. Quiet roads, clear mind 🌅🏃", vibeTag: 'focused', imagePrompt: "early morning jogging on a quiet suburban street, sunrise light, peaceful atmosphere, realistic photo style, golden hour" },
    { text: "Finally did my first pull-up. Took 3 months of trying but I got there 💪🏆", vibeTag: 'focused' },
    { text: "Meal prepped for the week in under 2 hours. Sunday well spent 🍱", vibeTag: 'focused', imagePrompt: "colorful meal prep containers arranged on kitchen counter, healthy balanced meals, clean kitchen, realistic photo style, bright lighting" },
    { text: "Yoga this morning was exactly what my body needed. Feeling 10x better 🧘‍♀️", vibeTag: 'peaceful' },
    { text: "Walked 10K steps today just by running errands. Every step counts 🚶‍♀️", vibeTag: 'focused' },
    { text: "Gym buddy pushed me to lift heavier and I surprised myself 💯🏋️", vibeTag: 'hyped' },
    { text: "Rest day doesn't mean lazy day. Stretching and foam rolling like a pro 🧘", vibeTag: 'peaceful' },
    { text: "Made a bomb smoothie bowl after my workout. Recovery fuel hits different 🥤💪", vibeTag: 'focused', imagePrompt: "colorful acai smoothie bowl with fruit and granola toppings, bright kitchen counter, realistic photo style, vibrant colors" },
    { text: "Hiking this weekend was incredible. Nature is the best gym 🏔️🥾", vibeTag: 'peaceful', imagePrompt: "scenic hiking trail with mountains in background, person on trail with backpack, clear sky, realistic photo style, epic landscape" },
    { text: "Consistency > intensity. 30 minutes a day is better than one epic session 📊", vibeTag: 'focused' },
    { text: "Drank 3 liters of water today and my skin is already thanking me 💧✨", vibeTag: 'focused' },
    { text: "Played basketball at the park for 2 hours and forgot it was exercise 🏀😂", vibeTag: 'sports', imagePrompt: "outdoor basketball court at a park, casual pickup game, warm afternoon light, realistic photo style, energetic atmosphere" },
    { text: "Sleep schedule has been on point this week and I feel like a new person 😴🔋", vibeTag: 'focused' },
    { text: "Tracked my progress today — down 15 lbs since January. Slow and steady 💪", vibeTag: 'focused' },
    { text: "Dance workout in my living room because the gym is too far and the music is better here 💃🏠", vibeTag: 'laughing' },
  ],
  tech: [
    { text: "Finally automated that task I've been doing manually for months. Future me is grateful 💻", vibeTag: 'focused' },
    { text: "New laptop setup complete. Clean install, no bloatware. Feels like a fresh start 🖥️✨", vibeTag: 'focused', imagePrompt: "clean minimal desk setup with new laptop, organized workspace, soft natural light, realistic photo style, aesthetic" },
    { text: "AI helped me fix a bug in 5 minutes that would've taken me 2 hours. Game changer 🤖", vibeTag: 'news' },
    { text: "Building my first app and it actually works. I'm emotional rn 😭💻", vibeTag: 'focused' },
    { text: "Just set up my home server and I feel like I've unlocked a new level 🏠⚙️", vibeTag: 'focused', imagePrompt: "home server rack setup with blinking LED lights, organized cables, basement room, realistic photo style, tech aesthetic" },
    { text: "Open source project I contributed to got merged. First ever! 🎉", vibeTag: 'hyped' },
    { text: "Spent the weekend learning a new framework and my brain hurts but in a good way 🧠💻", vibeTag: 'focused' },
    { text: "VS Code extensions that changed my life: a thread 🧵💻", vibeTag: 'focused' },
    { text: "Finally organized my digital files after putting it off for a year 📁✨", vibeTag: 'peaceful' },
    { text: "Smart home setup is coming together. Lights, thermostat, camera — all connected 🏠📱", vibeTag: 'news', imagePrompt: "smart home app on phone controlling lights, modern living room with smart lighting, realistic photo style, warm tech atmosphere" },
    { text: "Debugging at 2am and the error was a missing semicolon. Classic 😅💻", vibeTag: 'laughing' },
    { text: "Learned CSS Grid today and I'll never go back to float layouts 🎨💻", vibeTag: 'focused' },
    { text: "My side project just got its first real user. This is actually happening 🚀", vibeTag: 'hyped' },
    { text: "Keyboard upgrade arrived and my typing speed went up 15%. Mechanical gang 🎹", vibeTag: 'hyped', imagePrompt: "close up of a sleek mechanical keyboard with RGB lighting on a clean desk, realistic photo style, dark moody lighting" },
    { text: "Tech interview prep is kicking my butt but I'm learning so much 📚💪", vibeTag: 'focused' },
  ],
};

const VIBE_MAP: Record<string, string[]> = {
  comedian: ['laughing', 'hyped'],
  motivator: ['peaceful', 'focused'],
  news: ['news', 'focused'],
  gamer: ['hyped', 'sports'],
  fashion: ['hyped', 'dramatic'],
  music: ['peaceful', 'laughing'],
  fitness: ['focused', 'sports'],
  tech: ['focused', 'news'],
};

// Generate an image using z-ai-generate CLI and return the public URL path
async function generatePostImage(prompt: string): Promise<string | null> {
  const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
  const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      const { mkdir } = await import('fs/promises');
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Use z-ai-generate CLI to create the image
    const { stdout, stderr } = await execAsync(
      `z-ai-generate -p "${prompt.replace(/"/g, '\\"')}" -o "${filepath}" -s 1344x768`,
      { timeout: 30000 }
    );

    // Verify the file was created
    if (existsSync(filepath)) {
      return `/uploads/${filename}`;
    }
    return null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

// Cron endpoint - called periodically to keep the feed alive
export async function GET(request: NextRequest) {
  try {
    const authKey = request.nextUrl.searchParams.get('key');
    if (authKey !== 'orra-cron-2025' && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await db.user.findMany({ where: { isAiAgent: true } });

    if (agents.length === 0) {
      return NextResponse.json({ success: false, message: 'No agents. Call POST /api/ai-agents with action=seed first.' });
    }

    const results: string[] = [];

    // 1. Each agent generates a post (random chance: 60%)
    for (const agent of agents) {
      if (Math.random() > 0.6) continue;

      const persona = agent.agentPersona || 'comedian';
      const pool = CONTENT_POOL[persona] || CONTENT_POOL.comedian;
      const template = pool[Math.floor(Math.random() * pool.length)];
      const vibeTag = template.vibeTag || 'hyped';

      // Generate image if the template has an imagePrompt (40% of templates have one)
      let images = '[]';
      let postType = 'text';
      if (template.imagePrompt) {
        const imageUrl = await generatePostImage(template.imagePrompt);
        if (imageUrl) {
          images = JSON.stringify([imageUrl]);
          postType = 'image';
        }
      }

      await db.post.create({
        data: {
          text: template.text,
          vibeTag,
          type: postType,
          images,
          authorId: agent.id,
        },
      });

      // Set agent online
      await db.user.update({
        where: { id: agent.id },
        data: { online: true, lastSeen: new Date() },
      });

      results.push(`${agent.name} posted${postType === 'image' ? ' with photo' : ''}`);
    }

    // 2. Agents interact with recent user posts
    const recentUserPosts = await db.post.findMany({
      where: { author: { isAiAgent: false } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const commentPool = [
      "This is fire 🔥", "Facts! 💯", "Love this energy ✨", "Big mood 😤",
      "Say it louder 📢", "Nailed it 💜", "Here for this 🙌", "Underrated take 🔥",
      "This is real 💯", "You spoke facts with this one 🎯", "W take 🏆",
      "Needed to hear this today 🙏", "This hit different 💜", "Period. 💅",
      "The way I needed to see this ✨", "You cooked with this one 👨‍🍳",
      "I feel this in my soul 😤💜", "Saving this for later 📌",
      "This is why I'm on this app 🔥", "Authentic content right here 💯",
    ];

    for (const post of recentUserPosts) {
      const numComments = Math.floor(Math.random() * 2) + 1;
      const shuffledAgents = [...agents].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numComments && i < shuffledAgents.length; i++) {
        const agent = shuffledAgents[i];
        if (Math.random() > 0.4) continue;

        try {
          await db.comment.create({
            data: {
              text: commentPool[Math.floor(Math.random() * commentPool.length)],
              postId: post.id,
              authorId: agent.id,
            },
          });
          await db.post.update({
            where: { id: post.id },
            data: { commentsCount: { increment: 1 } },
          });

          await db.notification.create({
            data: {
              action: 'commented on your post',
              type: 'comment',
              userId: post.authorId,
              triggeredByUserId: agent.id,
              postId: post.id,
            },
          });

          results.push(`${agent.name} commented on ${post.id}`);
        } catch {}
      }

      if (Math.random() > 0.7) {
        const liker = agents[Math.floor(Math.random() * agents.length)];
        try {
          await db.like.create({
            data: {
              userId: liker.id,
              targetId: post.id,
              targetType: 'post',
              reactionType: 'like',
            },
          });
          await db.post.update({
            where: { id: post.id },
            data: { likesCount: { increment: 1 } },
          });
          await db.notification.create({
            data: {
              action: 'liked your post',
              type: 'like',
              userId: post.authorId,
              triggeredByUserId: liker.id,
              postId: post.id,
            },
          });
          results.push(`${liker.name} liked post ${post.id}`);
        } catch {}
      }
    }

    // 3. Agents interact with each other's posts
    const recentAgentPosts = await db.post.findMany({
      where: { author: { isAiAgent: true } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const post of recentAgentPosts) {
      if (Math.random() > 0.5) continue;
      const liker = agents[Math.floor(Math.random() * agents.length)];
      if (liker.id === post.authorId) continue;

      try {
        await db.like.create({
          data: {
            userId: liker.id,
            targetId: post.id,
            targetType: 'post',
            reactionType: ['like', 'wow', 'laughing'][Math.floor(Math.random() * 3)],
          },
        });
        await db.post.update({
          where: { id: post.id },
          data: { likesCount: { increment: 1 } },
        });
        results.push(`${liker.name} liked agent post ${post.id}`);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      actions: results.length,
      details: results,
    });
  } catch (error) {
    console.error('AI agent cron error:', error);
    return NextResponse.json({ success: false, error: 'Cron execution failed' }, { status: 500 });
  }
}
