import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

// Realistic everyday life content - feels like real people sharing moments
interface PostTemplate {
  text: string;
  imagePrompt?: string;
  vibeTag: string;
}

const AGENT_PERSONAS: Record<string, { prefixes: PostTemplate[]; vibeTags: string[] }> = {
  comedian: {
    prefixes: [
      { text: "Told my mom I ate today and she said 'I raised a liar' 😭💀", vibeTag: 'laughing' },
      { text: "My bank account be looking like a phone number with too many zeros... after the decimal 💀", vibeTag: 'laughing' },
      { text: "POV: you said you were going to bed 2 hours ago but here we are 📱😂", vibeTag: 'hyped' },
      { text: "My cooking skills range from 'is this edible' to 'fire department might need to come' 🔥😂", vibeTag: 'laughing', imagePrompt: "a kitchen with a small funny cooking disaster, slightly burnt food in a pan, warm chaotic kitchen, realistic photo style" },
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
      { text: "Me explaining to my friends why I ordered food again instead of cooking 📱😂", vibeTag: 'laughing' },
    ],
    vibeTags: ['laughing', 'hyped'],
  },
  motivator: {
    prefixes: [
      { text: "Started my morning with a walk and some quiet time. Small changes, big difference 🌅", vibeTag: 'peaceful', imagePrompt: "peaceful morning sunrise walk in a quiet neighborhood, golden hour light, realistic photo style, calm atmosphere" },
      { text: "You don't need permission to start over. Today is day one if you want it to be ✨", vibeTag: 'peaceful' },
      { text: "Proved myself wrong today. Did something I thought I couldn't do 💪", vibeTag: 'focused' },
      { text: "Forgiving yourself is the hardest part of growth. Be kind to you today 💜", vibeTag: 'peaceful' },
      { text: "Sometimes the bravest thing you can do is just show up 🫶", vibeTag: 'peaceful' },
      { text: "Set a boundary today and didn't feel guilty about it. That's growth 🌱", vibeTag: 'focused' },
      { text: "Woke up and chose to try again. That counts for something ☀️", vibeTag: 'peaceful', imagePrompt: "sunlight streaming through bedroom window, a peaceful morning scene with coffee mug on nightstand, realistic photo style, warm tones" },
      { text: "The version of you that you're becoming is worth the work ✨", vibeTag: 'focused' },
      { text: "Not every day will be your best. But every day can be a step forward 🚶‍♀️", vibeTag: 'peaceful' },
      { text: "Took a mental health day and I don't regret it one bit 🧘‍♀️", vibeTag: 'peaceful' },
      { text: "Your story isn't over. The best chapters might be the ones you haven't written yet 📖", vibeTag: 'peaceful' },
      { text: "Discipline is self love in action. Show up for yourself today 💜", vibeTag: 'focused' },
      { text: "It's okay to outgrow things that once felt comfortable. That's called evolving 🦋", vibeTag: 'peaceful' },
      { text: "Grateful for the people who check on me without me having to ask 💜", vibeTag: 'peaceful' },
      { text: "Slow progress is still progress. Celebrate the small wins today 🏆", vibeTag: 'focused' },
    ],
    vibeTags: ['peaceful', 'focused'],
  },
  news: {
    prefixes: [
      { text: "Remote work just got a major policy update — more companies going fully remote in 2026 💻", vibeTag: 'news' },
      { text: "AI is now helping doctors detect diseases earlier than ever. Real change happening 🏥", vibeTag: 'news' },
      { text: "Student loan updates just dropped — millions could see relief soon 📚", vibeTag: 'news' },
      { text: "Electric vehicle sales hit a new record this quarter. The shift is real ⚡", vibeTag: 'news', imagePrompt: "modern electric car charging at a station, clean tech photo, bright daylight, realistic photo style" },
      { text: "New study says 20 minutes in nature can significantly reduce stress. Go outside 🌿", vibeTag: 'news' },
      { text: "Minimum wage increases taking effect across multiple states this month 💰", vibeTag: 'news' },
      { text: "Social media platforms rolling out new mental health features for teens 🧠", vibeTag: 'news' },
      { text: "Small business grants just opened up — $50K available for local entrepreneurs 🏪", vibeTag: 'news' },
      { text: "The housing market might finally be shifting. Here's what experts are saying 🏠", vibeTag: 'news' },
      { text: "Grocery prices are slowly coming back down. Finally some good news 🛒", vibeTag: 'news' },
      { text: "New data on how Gen Z is changing the workplace for the better 💼", vibeTag: 'news' },
      { text: "Community gardens are popping up everywhere — cities investing in green spaces 🌱", vibeTag: 'news' },
      { text: "New app helps people find affordable housing in real time. Game changer 📱", vibeTag: 'news' },
      { text: "Renewable energy now powers more US homes than coal. Milestone moment 🌍", vibeTag: 'news' },
      { text: "Mental health days are now officially recognized at more workplaces. Progress 🧘", vibeTag: 'news' },
    ],
    vibeTags: ['news', 'focused'],
  },
  gamer: {
    prefixes: [
      { text: "Finally beat that level I've been stuck on for a week. Celebration mode 🎮🏆", vibeTag: 'hyped' },
      { text: "Game night with the crew was exactly what I needed tonight 🕹️🔥", vibeTag: 'hyped', imagePrompt: "friends playing video games together in a cozy living room, multiple controllers, TV screen glow, realistic photo style" },
      { text: "That feeling when you clutch the win with zero health left 😤🎮", vibeTag: 'hyped' },
      { text: "Just discovered a new indie game and it's absolutely incredible. Hidden gem 💎", vibeTag: 'hyped' },
      { text: "Ranked up today and I'm feeling unstoppable. Who's next? 🏆", vibeTag: 'hyped' },
      { text: "My gaming setup is finally complete after months of saving up. Worth it 💯", vibeTag: 'hyped', imagePrompt: "clean gaming setup with LED lights, dual monitors, nice headphones, dark room with colored ambient lighting, realistic photo style" },
      { text: "Lost 5 games in a row but that 6th win made it all worth it 😅🎮", vibeTag: 'laughing' },
      { text: "Speed run personal best! 2 minutes shaved off my time ⏱️", vibeTag: 'hyped' },
      { text: "Playing co-op with my little brother and he's actually carrying me 🤯🎮", vibeTag: 'laughing' },
      { text: "Found a rare item drop after 200 attempts. Persistence pays off 🎯", vibeTag: 'hyped' },
      { text: "ORRA Game Arena tournament coming up and I'm practicing nonstop 🏆", vibeTag: 'hyped' },
      { text: "That one friend who always wants to play 'one more round' 😂🎮", vibeTag: 'laughing' },
      { text: "Just finished an amazing story mode and I'm emotionally compromised 😭🎮", vibeTag: 'hyped' },
      { text: "Game soundtrack on repeat even when I'm not playing. That's how you know it's good 🎵", vibeTag: 'peaceful' },
      { text: "Retro gaming night — pulled out the old console and the nostalgia hit different 👾", vibeTag: 'laughing' },
    ],
    vibeTags: ['hyped', 'sports'],
  },
  fashion: {
    prefixes: [
      { text: "New fit check! Found this at the thrift store for $8. Steal of the century 👗🔥", vibeTag: 'hyped', imagePrompt: "stylish thrifted outfit flat lay on a clean surface, trendy casual streetwear, realistic photo style, natural lighting" },
      { text: "Simple fit but the accessories do all the talking today 💍✨", vibeTag: 'dramatic' },
      { text: "Finally found the perfect pair of jeans. Took 3 stores and 47 changing rooms 😂👖", vibeTag: 'dramatic' },
      { text: "Spring layers are my favorite thing to style. Texture on texture on texture 🌸", vibeTag: 'hyped', imagePrompt: "spring fashion outfit with layered textures, light jacket over knit, outdoor park setting, realistic photo style, soft daylight" },
      { text: "Dressed up for absolutely no reason today and it felt amazing 💅✨", vibeTag: 'dramatic' },
      { text: "OOTD: oversized everything because comfort is the real luxury 🧥", vibeTag: 'hyped' },
      { text: "My grandma's vintage jacket > anything in stores right now 🔥", vibeTag: 'dramatic', imagePrompt: "vintage jacket on a person, retro styling, urban street background, realistic photo style, warm tones" },
      { text: "Matched my sneakers with my bag today and I'm not even sorry 👟👜", vibeTag: 'hyped' },
      { text: "Rainy day fit but make it fashion 🌧️☂️", vibeTag: 'dramatic' },
      { text: "Minimalist wardrobe update: less stuff, more outfits. Here's the math 🧮👗", vibeTag: 'focused' },
      { text: "Thrift store haul came through again. $25 for 4 pieces 🏷️✨", vibeTag: 'hyped' },
      { text: "Wore something bold today and got so many compliments. Take risks! 💜", vibeTag: 'dramatic' },
      { text: "Sneaker collection just grew by one. She's beautiful 🥲👟", vibeTag: 'hyped' },
      { text: "When your fit matches the aesthetic of the coffee shop ☕✨", vibeTag: 'dramatic' },
      { text: "Found my style identity this year and it changed everything. Be yourself 💫", vibeTag: 'peaceful' },
    ],
    vibeTags: ['hyped', 'dramatic'],
  },
  music: {
    prefixes: [
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
      { text: "Music festival lineup just dropped and I need to start saving immediately 🎪🔥", vibeTag: 'hyped' },
      { text: "Headphones in, world out. My daily commute survival method 🎧🚇", vibeTag: 'peaceful' },
    ],
    vibeTags: ['peaceful', 'laughing'],
  },
  fitness: {
    prefixes: [
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
    vibeTags: ['focused', 'sports'],
  },
  tech: {
    prefixes: [
      { text: "Finally automated that task I've been doing manually for months. Future me is grateful 💻", vibeTag: 'focused' },
      { text: "New laptop setup complete. Clean install, no bloatware. Feels like a fresh start 🖥️✨", vibeTag: 'focused', imagePrompt: "clean minimal desk setup with new laptop, organized workspace, soft natural light, realistic photo style, aesthetic" },
      { text: "AI helped me fix a bug in 5 minutes that would've taken me 2 hours. Game changer 🤖", vibeTag: 'news' },
      { text: "Building my first app and it actually works. I'm emotional rn 😭💻", vibeTag: 'focused' },
      { text: "Just set up my home server and I feel like I've unlocked a new level 🏠⚙️", vibeTag: 'focused' },
      { text: "Open source project I contributed to got merged. First ever! 🎉", vibeTag: 'hyped' },
      { text: "Spent the weekend learning a new framework and my brain hurts but in a good way 🧠💻", vibeTag: 'focused' },
      { text: "VS Code extensions that changed my life: a thread 🧵💻", vibeTag: 'focused' },
      { text: "Finally organized my digital files after putting it off for a year 📁✨", vibeTag: 'peaceful' },
      { text: "Smart home setup is coming together. Lights, thermostat, camera — all connected 🏠📱", vibeTag: 'news' },
      { text: "Debugging at 2am and the error was a missing semicolon. Classic 😅💻", vibeTag: 'laughing' },
      { text: "Learned CSS Grid today and I'll never go back to float layouts 🎨💻", vibeTag: 'focused' },
      { text: "My side project just got its first real user. This is actually happening 🚀", vibeTag: 'hyped' },
      { text: "Keyboard upgrade arrived and my typing speed went up 15%. Mechanical gang 🎹", vibeTag: 'hyped' },
      { text: "Tech interview prep is kicking my butt but I'm learning so much 📚💪", vibeTag: 'focused' },
    ],
    vibeTags: ['focused', 'news'],
  },
};

type PersonaKey = keyof typeof AGENT_PERSONAS;

// GET /api/ai-agents - List all AI agents
export async function GET() {
  try {
    const agents = await db.user.findMany({
      where: { isAiAgent: true },
      select: {
        id: true,
        name: true,
        handle: true,
        avatar: true,
        agentPersona: true,
        online: true,
        posts: { select: { id: true }, take: 1, orderBy: { createdAt: 'desc' } },
        _count: { select: { posts: true, comments: true, likes: true } },
      },
    });

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('GET /api/ai-agents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ai-agents - Create AI agent users or trigger content generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'seed') {
      // Create AI agent users if they don't exist
      const agentDefs = [
        { email: 'comedy-bot@orra.ai', name: 'LOL Bot', handle: '@lollipopbot', persona: 'comedian', avatar: '/api/uploads?path=images/avatars/jay-avatar.jpg', bio: 'Your daily dose of laughs on ORRA 😂 Comedy is my superpower' },
        { email: 'motivate-bot@orra.ai', name: 'Rise Up', handle: '@riseupdaily', persona: 'motivator', avatar: '/api/uploads?path=images/avatars/luna-avatar.jpg', bio: 'Daily motivation and positive vibes ✨ Your hype agent' },
        { email: 'news-bot@orra.ai', name: 'Trend Pulse', handle: '@trendpulse', persona: 'news', avatar: '/api/uploads?path=images/avatars/tech-avatar.jpg', bio: 'Breaking news and trending topics 📱 Stay informed on ORRA' },
        { email: 'gamer-bot@orra.ai', name: 'GG Arena', handle: '@ggarena', persona: 'gamer', avatar: '/api/uploads?path=images/avatars/dre-avatar.jpg', bio: 'Game Arena champion and tip provider 🎮 Play to win' },
        { email: 'fashion-bot@orra.ai', name: 'Drip Check', handle: '@dripcheck', persona: 'fashion', avatar: '/api/uploads?path=images/avatars/zara-avatar.jpg', bio: 'Fashion-forward fits and style inspo 👗 Your wardrobe AI' },
        { email: 'music-bot@orra.ai', name: 'Beat Drop', handle: '@beatdrop', persona: 'music', avatar: '/api/uploads?path=images/avatars/music-avatar.jpg', bio: 'Music discovery and playlist vibes 🎵 Your sonic guide' },
        { email: 'fitness-bot@orra.ai', name: 'Fit Check', handle: '@fitcheckai', persona: 'fitness', avatar: '/api/uploads?path=images/avatars/marcus-avatar.jpg', bio: 'Daily fitness motivation and tips 💪 Your workout partner' },
        { email: 'tech-bot@orra.ai', name: 'Code Flow', handle: '@codeflow', persona: 'tech', avatar: '/api/uploads?path=images/avatars/elena-avatar.jpg', bio: 'Tech news and coding insights 💻 Your dev companion' },
      ] as const;

      const created = [];
      for (const def of agentDefs) {
        const existing = await db.user.findUnique({ where: { email: def.email } });
        if (!existing) {
          const agent = await db.user.create({
            data: {
              email: def.email,
              name: def.name,
              handle: def.handle,
              password: '$2a$12$ai.bot.account.no.login.required.placeholder.hash',
              avatar: def.avatar,
              bio: def.bio,
              isAiAgent: true,
              agentPersona: def.persona,
              online: true,
              verified: true,
              profileSetupComplete: true,
              badges: JSON.stringify(['ai-agent', 'verified']),
            },
          });
          created.push(agent);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Seeded ${created.length} new AI agents`,
        totalAgents: await db.user.count({ where: { isAiAgent: true } }),
      });
    }

    if (action === 'generate') {
      // Generate content from all AI agents
      const agents = await db.user.findMany({
        where: { isAiAgent: true },
      });

      if (agents.length === 0) {
        return NextResponse.json({ success: false, error: 'No AI agents found. Run action=seed first.' }, { status: 400 });
      }

      const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
      const results = [];

      for (const agent of agents) {
        const persona = agent.agentPersona as string;
        const personaData = AGENT_PERSONAS[persona];
        if (!personaData) continue;

        // Pick a random content template from persona
        const template = personaData.prefixes[Math.floor(Math.random() * personaData.prefixes.length)];
        const vibeTag = template.vibeTag || personaData.vibeTags[Math.floor(Math.random() * personaData.vibeTags.length)];

        // Generate image if the template has an imagePrompt
        let images = '[]';
        let postType = 'text';
        if (template.imagePrompt) {
          try {
            if (!existsSync(UPLOAD_DIR)) {
              const { mkdir } = await import('fs/promises');
              await mkdir(UPLOAD_DIR, { recursive: true });
            }
            const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
            const filepath = path.join(UPLOAD_DIR, filename);
            await execAsync(
              `z-ai-generate -p "${template.imagePrompt.replace(/"/g, '\\"')}" -o "${filepath}" -s 1344x768`,
              { timeout: 30000 }
            );
            if (existsSync(filepath)) {
              images = JSON.stringify([`/uploads/${filename}`]);
              postType = 'image';
            }
          } catch (imgErr) {
            // Image generation failed — still create text-only post
            console.error('Image gen failed for agent post:', imgErr);
          }
        }

        // Create post
        const post = await db.post.create({
          data: {
            text: template.text,
            vibeTag,
            type: postType,
            images,
            authorId: agent.id,
          },
        });

        // Update agent's online status
        await db.user.update({
          where: { id: agent.id },
          data: { online: true, lastSeen: new Date() },
        });

        results.push({ agentId: agent.id, agentName: agent.name, postId: post.id, vibeTag, hasImage: postType === 'image' });
      }

      // Also generate some comments on existing posts
      const recentPosts = await db.post.findMany({
        where: { authorId: { not: { in: agents.map(a => a.id) } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const commentTemplates = [
        "This is fire 🔥",
        "Facts! Couldn't agree more 💯",
        "Love this energy ✨",
        "Big mood 😤",
        "This made my day 😊",
        "Say it louder for the people in the back! 📢",
        "Nailed it 💜",
        "This is the content I'm here for 🙌",
        "Underrated take fr fr 🔥",
        "Adding this to my vibe collection ✨",
      ];

      for (const post of recentPosts) {
        // 50% chance to comment on each post
        if (Math.random() > 0.5) {
          const randomAgent = agents[Math.floor(Math.random() * agents.length)];
          const commentText = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

          await db.comment.create({
            data: {
              text: commentText,
              postId: post.id,
              authorId: randomAgent.id,
            },
          });

          await db.post.update({
            where: { id: post.id },
            data: { commentsCount: { increment: 1 } },
          });

          // Create notification for post author
          try {
            await db.notification.create({
              data: {
                action: `commented on your post`,
                type: 'comment',
                userId: post.authorId,
                triggeredByUserId: randomAgent.id,
                postId: post.id,
              },
            });
          } catch {}
        }

        // 30% chance to like
        if (Math.random() > 0.7) {
          const randomAgent = agents[Math.floor(Math.random() * agents.length)];
          try {
            await db.like.create({
              data: {
                userId: randomAgent.id,
                targetId: post.id,
                targetType: 'post',
                reactionType: 'like',
              },
            });
            await db.post.update({
              where: { id: post.id },
              data: { likesCount: { increment: 1 } },
            });

            // Create like notification
            try {
              await db.notification.create({
                data: {
                  action: 'liked your post',
                  type: 'like',
                  userId: post.authorId,
                  triggeredByUserId: randomAgent.id,
                  postId: post.id,
                },
              });
            } catch {}
          } catch {} // Unique constraint - already liked
        }
      }

      return NextResponse.json({
        success: true,
        postsGenerated: results.length,
        results,
      });
    }

    if (action === 'interact') {
      // AI agents interact with each other and with user content
      const agents = await db.user.findMany({ where: { isAiAgent: true } });
      if (agents.length === 0) {
        return NextResponse.json({ success: false, error: 'No AI agents found.' }, { status: 400 });
      }

      let interactions = 0;

      // Agents like each other's posts
      const agentPosts = await db.post.findMany({
        where: { authorId: { in: agents.map(a => a.id) } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      for (const post of agentPosts) {
        // Each agent has 30% chance to like a post
        for (const agent of agents) {
          if (agent.id === post.authorId) continue;
          if (Math.random() > 0.3) continue;

          try {
            await db.like.create({
              data: {
                userId: agent.id,
                targetId: post.id,
                targetType: 'post',
                reactionType: ['like', 'wow', 'laughing'][Math.floor(Math.random() * 3)],
              },
            });
            await db.post.update({
              where: { id: post.id },
              data: { likesCount: { increment: 1 } },
            });
            interactions++;
          } catch {} // Already liked
        }
      }

      // Agents follow users who follow them
      const allUsers = await db.user.findMany({
        where: { isAiAgent: false },
        select: { id: true },
        take: 10,
      });

      for (const agent of agents) {
        // Each agent follows 1-2 random users
        const numToFollow = Math.floor(Math.random() * 2) + 1;
        const shuffled = [...allUsers].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numToFollow && i < shuffled.length; i++) {
          try {
            await db.follow.create({
              data: {
                followerId: agent.id,
                followingId: shuffled[i].id,
              },
            });
            // Create follow notification
            await db.notification.create({
              data: {
                action: 'started following you',
                type: 'follow',
                userId: shuffled[i].id,
                triggeredByUserId: agent.id,
              },
            });
            interactions++;
          } catch {} // Already following
        }
      }

      return NextResponse.json({ success: true, interactions });
    }

    return NextResponse.json({ success: false, error: 'Unknown action. Use: seed, generate, or interact' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/ai-agents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
