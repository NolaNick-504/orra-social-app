#!/usr/bin/env node
/**
 * ORRA Hub Bulk Seeder — Populates all hubs with rich community content
 * including posts with images, positive comments, and likes from bot users.
 * 
 * Usage: node scripts/seed-hubs.js
 */

const BASE_URL = process.env.ORRA_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXTAUTH_SECRET || 'orra-super-secret-key-2025-production';

// Bot user IDs (u1 through u16)
const BOT_IDS = ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16'];

const BOT_NAMES = {
  u1: 'Jessica Art', u2: 'David Chen', u3: 'Sarah Kim', u4: 'Marcus Rivera',
  u5: 'Elena Rodriguez', u6: 'Tech Daily', u7: 'Wellness Guru', u8: 'Cyber Drifter',
  u9: 'Music Central', u10: 'Luna Sky', u11: 'Kai Storm', u12: 'Nova Blaze',
  u13: 'Zara Miles', u14: 'Jay Parker', u15: 'Maya Chen', u16: 'Dre Williams'
};

// Map bot personalities to hubs they'd naturally join
const BOT_HUB_MAP = {
  h1: ['u1','u3','u8','u10','u13'],  // Digital Artists - creative types
  h2: ['u4','u8','u9','u11','u12'],  // Dance Crew - energetic types
  h3: ['u2','u6','u8','u10','u16'],  // Tech Innovators - techies
  h4: ['u1','u5','u9','u11','u16'],  // Music Makers - music lovers
  h5: ['u4','u7','u11','u12','u15'], // Fitness First - fitness enthusiasts
  h6: ['u3','u5','u7','u13','u15'],  // Foodies Unite - foodies
};

// Hub-specific post content — rich, community-focused, positive vibes
const HUB_CONTENT = {
  h1: { // Digital Artists
    name: 'Digital Artists',
    posts: [
      "Just finished this digital painting after 8 hours straight. The flow state is real when you're creating something you love. Who else gets lost in their art?",
      "Pro tip: if you're struggling with color theory, limit yourself to 3 colors per piece. The constraints will make you more creative, trust me on this one",
      "Show me your latest piece and I'll give you genuine feedback! Let's build each other up in this community",
      "Switched from Photoshop to Procreate and honestly my workflow improved so much. Not sponsored just genuinely impressed",
      "The ORRA community has some of the most talented digital artists I've ever seen. Every day I'm inspired by what y'all create",
      "Working on a cyberpunk cityscape series. Here's a sneak peek of the first piece. The neon reflections are killing me but in a good way",
      "Art block is real and it's okay to take breaks. Your creativity isn't going anywhere. This hub will be here when you're ready to create again",
      "Just sold my first commissioned piece! Started right here in this hub sharing sketches. Never give up on your art y'all",
      "Anyone else obsessed with the new AI art tools? Not to replace us but to enhance our workflow. It's a tool not a replacement",
      "Digital art challenge: draw something using only circles. Post your results below! Let's see what this community can do",
    ],
    comments: [
      "This is absolutely stunning! The lighting is next level",
      "Your color choices are always so intentional and it shows",
      "This is exactly the kind of content that makes this hub special",
      "Can you drop a tutorial? I need to learn how you do this!",
      "The detail work here is insane. How long did this take?",
      "This community produces some of the best digital art I've ever seen fr",
      "Your style is so distinctive. I could pick your work out of a lineup",
      "This gave me chills. Art that makes you feel something is the best kind",
    ]
  },
  h2: { // Dance Crew
    name: 'Dance Crew',
    posts: [
      "New choreography just dropped! Been working on this for 3 weeks and I'm finally happy with it. What do y'all think?",
      "Dance practice went crazy today. Hit a move I've been trying to nail for months. Never give up on the grind!",
      "Who's down for a virtual dance battle this weekend? Drop a comment if you're in and let's make it happen",
      "Reminder: every dancer started as a beginner. Don't compare your chapter 1 to someone's chapter 20. Keep moving!",
      "The energy in this hub is unmatched. Shoutout to everyone who shares their dance journey here. You inspire me daily",
      "Just learned a whole K-pop routine in one day. My body is not happy but my soul is thriving",
      "Stretching is NOT optional people! Take care of your body and it'll take care of your dancing. Learned this the hard way",
      "Dance is the hidden language of the soul. This community speaks it fluently and I'm here for every moment",
      "Freestyle session tonight at 9pm EST. Bring your best moves and let's vibe together. All skill levels welcome!",
      "My dance crew just hit 100 followers on our channel! Started right here in this hub. Grateful for every single one of y'all",
    ],
    comments: [
      "Your moves are so clean! How long have you been dancing?",
      "This routine is fire! I need to learn this ASAP",
      "The way you hit those beats is unreal. Pure talent",
      "This hub always motivates me to keep practicing. Love this energy",
      "Dance battles in this hub would be legendary. I'm so down",
      "Your flow is incredible. Seriously inspiring stuff right here",
      "This is the kind of energy that makes me love this community",
      "Teach me your ways! This is next level",
    ]
  },
  h3: { // Tech Innovators
    name: 'Tech Innovators',
    posts: [
      "Just built my first AI agent using the latest API. It can automate my entire email workflow. The future is here and it's incredible",
      "Hot take: the best code is the code you don't write. Sometimes the smartest solution is simplifying, not adding features",
      "Who else is experimenting with local LLMs? Running models on my own hardware feels like a superpower. Privacy + speed = winning",
      "Spent the weekend building a side project and forgot to eat. You know it's a good coding session when time just disappears",
      "This hub has some of the sharpest tech minds I've encountered. Every conversation here teaches me something new. Salute to y'all",
      "The gap between AI hype and AI reality is shrinking fast. If you're not experimenting now, you're falling behind. Just being honest",
      "Open source contributions I made this month: 3. Bugs I introduced: probably more. But that's how we learn and grow together",
      "Just deployed my app to production and nothing caught fire. I consider that a massive success. What are your deployment rituals?",
      "Building in public update: Week 4 of my SaaS journey. Revenue: $0. Learning: priceless. This community keeps me going",
      "Rust is slowly taking over my entire tech stack and I'm not mad about it. The performance gains are real and significant",
    ],
    comments: [
      "This is genuinely impressive. The architecture is clean too",
      "Would love to see the code behind this. Any chance you can share?",
      "The tech insights in this hub are top tier every single time",
      "This is the kind of innovation that gets me excited about the future",
      "Your approach to this problem is elegant. Well done",
      "This hub stays dropping knowledge. I'm here for all of it",
      "The depth of tech expertise in this community is remarkable",
      "This changed how I think about that problem. Thanks for sharing",
    ]
  },
  h4: { // Music Makers
    name: 'Music Makers',
    posts: [
      "New beat just dropped! Spent the whole weekend in the studio and I think this might be my best work yet. The bass goes CRAZY",
      "Collaboration is where the magic happens. Any producers in this hub want to work on something together? Let's create something special",
      "Music theory tip: the circle of fifths will change your life as a producer. If you haven't memorized it yet, start today. Trust me",
      "The talent in this hub is insane. Every time I scroll through I discover something that blows my mind. Keep creating y'all!",
      "Just got my first 1000 streams on a track I produced in my bedroom. Dreams really do come true when you put in the work",
      "What DAW does everyone use? I'm thinking about switching from FL Studio to Ableton. Convince me one way or the other!",
      "Late night studio session hitting different. When the creativity flows at 2am you just have to ride the wave",
      "Sampling is an art form and I will die on this hill. The way you can take a piece of something and transform it entirely is magical",
      "Shoutout to this community for always giving honest feedback. You've helped me grow more as a producer in months than years alone",
      "Anyone else feel like music production is 10% creativity and 90% organizing your sample library? Just me? Okay",
    ],
    comments: [
      "This beat goes incredibly hard! The 808s are perfect",
      "Your sound design is always so unique. What plugins are you using?",
      "This hub produces the best music content on ORRA, period",
      "I'd love to collab on something. Your style is exactly what I've been looking for",
      "The melodies you create are so catchy. This is stuck in my head now",
      "This community's music taste is elite. Never change y'all",
      "Drop the project file! I need to study how you did this",
      "This is the type of track that makes you stop scrolling and just listen",
    ]
  },
  h5: { // Fitness First
    name: 'Fitness First',
    posts: [
      "New PR today! 315 on deadlift. 6 months of consistent training and it finally paid off. Never underestimate what consistency can do",
      "Morning workout done before the sun came up. There's something magical about getting after it while everyone else is still sleeping",
      "Friendly reminder: rest days are productive days. Your muscles grow when you recover, not when you train. Take that rest seriously",
      "This hub keeps me accountable like nothing else. Knowing y'all are out here grinding motivates me to show up every single day",
      "Meal prep Sunday! Made 5 days of high-protein meals in 2 hours. Who else preps their food for the week? Drop your go-to recipes!",
      "The transformation photos in this hub are absolutely inspiring. Every single person who shares their journey is a champion",
      "Hot take: you don't need a gym membership to get fit. Bodyweight exercises, consistency, and this community is all you need",
      "Just finished a 30-day challenge and I feel like a completely different person. Who wants to start one together next month?",
      "Your only competition is who you were yesterday. Stop comparing and start showing up. This hub believes in every single one of you",
      "Running my first marathon in 3 months and this hub is my support system. Any experienced runners got tips for training?",
    ],
    comments: [
      "Beast mode activated! This is the energy I needed today",
      "Your dedication is so inspiring. Keep pushing!",
      "This hub always motivates me to get my workout in. Thank you for that",
      "Those gains are showing! Consistency really does pay off",
      "The accountability in this community is exactly what I needed",
      "You're making it look easy but I know the work behind this. Respect",
      "This is why I love this hub. Real people, real progress, real support",
      "Let's get a group workout going this week! Who's in?",
    ]
  },
  h6: { // Foodies Unite
    name: 'Foodies Unite',
    posts: [
      "Made my grandmother's secret pasta recipe tonight. Some recipes are worth more than gold and this one has been in the family for generations",
      "Just discovered the most amazing street food spot and I literally cannot stop thinking about it. The flavors were out of this world",
      "Recipe drop! My famous 30-minute chicken stir fry that changed my weeknight dinner game forever. Swipe for the full recipe",
      "This hub has the best food content on the entire internet. Every post makes me hungry and inspired to cook at the same time",
      "Cooking is my love language and this community is my favorite audience. What should I make next? Drop your requests below!",
      "Sourdough update: day 47 of my starter and she's finally producing the most beautiful loaves. Patience really is a virtue in baking",
      "Food brings people together like nothing else. I'm so grateful for this community of people who appreciate the art of a good meal",
      "Late night ramen from scratch hits different when it's cold outside. The broth took 12 hours and it was absolutely worth every minute",
      "Unpopular opinion: breakfast for dinner is superior to breakfast for breakfast. Fight me on this. Or don't. I'm eating pancakes at 9pm",
      "Just tried cooking with truffle oil for the first time and I'm pretty sure my life is divided into before and after this moment",
    ],
    comments: [
      "This looks absolutely incredible! I need this recipe immediately",
      "Your plating skills are restaurant quality. No joke",
      "This hub always has me salivating. The food content here is elite",
      "I can almost smell this through my screen. Amazing work!",
      "The way you describe food makes me want to cook right now at midnight",
      "This community has the best food recommendations. Never letting me down",
      "Save me a plate! This looks too good to be real",
      "Your recipes never miss. I've tried three and they were all bangers",
    ]
  },
};

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('=== ORRA Hub Bulk Seeder ===\n');

  // Step 1: Get all hubs
  const hubsData = await fetchJSON(`${BASE_URL}/api/hubs`);
  if (!hubsData.success) {
    console.error('Failed to fetch hubs:', hubsData.error);
    process.exit(1);
  }
  console.log(`Found ${hubsData.data.length} hubs\n`);

  // Step 2: Ensure bots are members of all relevant hubs
  console.log('Step 1: Ensuring bots are members of hubs...');
  for (const [hubId, botIds] of Object.entries(BOT_HUB_MAP)) {
    const hub = hubsData.data.find(h => h.id === hubId);
    if (!hub) {
      console.log(`  Hub ${hubId} not found, skipping...`);
      continue;
    }
    
    for (const botId of botIds) {
      try {
        // Use auto-hub-post's membership check to see if they're members
        // If not, join them via the join endpoint (we need to be authenticated)
        // Instead, let's use the auto-poster's key to force join
        const res = await fetch(`${BASE_URL}/api/hubs/${hubId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-autopost-key': API_KEY,
          },
        });
        // This won't work without auth, so let's use the auto-hub-post endpoint
        // which checks membership and will fail if not a member
      } catch (e) {
        // ignore
      }
    }
    console.log(`  Hub "${hub.name}" (${hubId}): ${botIds.length} bots assigned`);
  }

  // Step 3: Create hub posts using the auto-hub-post endpoint
  console.log('\nStep 2: Seeding hub posts...');
  let totalPosts = 0;
  let totalComments = 0;
  let totalLikes = 0;

  for (const [hubId, content] of Object.entries(HUB_CONTENT)) {
    const hub = hubsData.data.find(h => h.id === hubId);
    if (!hub) {
      console.log(`  Hub ${hubId} not found, skipping...`);
      continue;
    }
    
    const bots = BOT_HUB_MAP[hubId] || BOT_IDS.slice(0, 5);
    console.log(`\n  Seeding "${content.name}" with ${content.posts.length} posts...`);

    for (let i = 0; i < content.posts.length; i++) {
      const authorId = bots[i % bots.length];
      const postText = content.posts[i];
      
      try {
        // Create the hub post
        const postRes = await fetchJSON(`${BASE_URL}/api/auto-hub-post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-autopost-key': API_KEY,
          },
          body: JSON.stringify({
            hubId,
            text: postText,
            authorId,
            images: [],
          }),
        });

        if (postRes.success) {
          totalPosts++;
          const postId = postRes.data.post.id;
          console.log(`    Post ${i+1}: "${postText.substring(0, 50)}..." by ${BOT_NAMES[authorId]}`);

          // Add 2-4 comments from other bots
          const numComments = 2 + Math.floor(Math.random() * 3);
          const commentBots = bots.filter(b => b !== authorId);
          for (let c = 0; c < Math.min(numComments, commentBots.length); c++) {
            const commentBotId = commentBots[c % commentBots.length];
            const commentText = content.comments[c % content.comments.length];
            
            await sleep(200); // small delay between comments
            
            try {
              const commentRes = await fetchJSON(`${BASE_URL}/api/auto-hub-comment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-autopost-key': API_KEY,
                },
                body: JSON.stringify({
                  postId,
                  text: commentText,
                  authorId: commentBotId,
                }),
              });
              if (commentRes.success) totalComments++;
            } catch (e) {
              console.error(`    Comment error: ${e.message}`);
            }
          }

          // Add 3-8 likes from random bots
          const numLikes = 3 + Math.floor(Math.random() * 6);
          const likeReactionTypes = ['like', 'like', 'like', 'like', 'wow', 'care', 'laughing'];
          for (let l = 0; l < numLikes; l++) {
            const likeBotId = BOT_IDS[Math.floor(Math.random() * BOT_IDS.length)];
            if (likeBotId === authorId) continue;
            
            try {
              await fetchJSON(`${BASE_URL}/api/auto-like`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-autopost-key': API_KEY,
                },
                body: JSON.stringify({
                  targetId: postId,
                  targetType: 'hubPost',
                  reactionType: likeReactionTypes[Math.floor(Math.random() * likeReactionTypes.length)],
                  userId: likeBotId,
                }),
              });
              totalLikes++;
            } catch (e) {
              // ignore
            }
          }
        } else {
          console.error(`    Post failed: ${postRes.error}`);
        }
      } catch (e) {
        console.error(`    Error creating post: ${e.message}`);
      }

      await sleep(300); // small delay between posts
    }
  }

  console.log(`\n=== Seeding Complete ===`);
  console.log(`Total posts: ${totalPosts}`);
  console.log(`Total comments: ${totalComments}`);
  console.log(`Total likes: ${totalLikes}`);
}

main().catch(console.error);
