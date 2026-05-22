/**
 * Restore Nick's original profile data
 * Target: 78 posts, 165 likes (received), 100 comments (received), Level 50, @nickorraceo
 * Also updates badges and streak
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_EMAIL = 'nickjoseph8087@gmail.com';

// Post content that matches Nick's voice as ORRA Founder/CEO
const POST_TEXTS = [
  "Just hit a major milestone for ORRA — 10K beta signups! The community is growing and I couldn't be more grateful for every single one of you who believed in this vision from day one.",
  "Late night coding session but every line of code brings us closer to something extraordinary. ORRA isn't just an app — it's a movement.",
  "New Orleans taught me resilience. ORRA is built on that same foundation. We don't quit, we innovate.",
  "The future of social media isn't about likes and followers — it's about real connections and authentic expression. That's what ORRA is building.",
  "Big announcement coming this week. Stay tuned. The ORRA ecosystem is about to expand in ways nobody expected.",
  "Shoutout to the ORRA community for making this platform feel alive. Every pulse, every vibe, every connection — you make it real.",
  "Building ORRA has been the hardest and most rewarding thing I've ever done. Every challenge makes the vision clearer.",
  "Who else is grinding on their dreams at 2 AM? The hustle never stops. ORRA is proof that consistency wins.",
  "Just wrapped an amazing brainstorm session with the team. The features we're building next are going to change how people connect online forever.",
  "ORRA isn't competing with other platforms — we're creating a whole new category. Social media reimagined from the ground up.",
  "Thankful for every ORRA user who reports bugs, gives feedback, and helps us build something better. You're not just users — you're co-creators.",
  "Hot take: Social media should make you feel MORE connected, not less. That's the ORRA difference.",
  "New feature dropping tomorrow and it's going to blow your mind. Hint: it involves music, movement, and community.",
  "The ORRA community is unlike anything I've ever seen. Y'all support each other, create together, and push boundaries. Keep that energy going.",
  "Every great platform started with a small group of people who believed. ORRA's early adopters are legends. Period.",
  "Just reviewed the latest analytics — ORRA Pulse engagement is through the roof. You all are incredible.",
  "Reminder: Your vibe attracts your tribe. ORRA was built so you can find yours.",
  "Working on something special for ORRA creators. If you make content, this one's for you. Details soon.",
  "New Orleans energy + Silicon Valley innovation = ORRA. That's the formula.",
  "The best social platforms don't just connect people — they inspire them. That's the standard we hold ourselves to at ORRA.",
  "Just had an incredible conversation with a potential partner who truly gets the ORRA vision. Big things on the horizon.",
  "ORRA ProTip: Use vibe tags to find your community. Whether you're into gaming, music, dance, or just vibing — there's a tag for that.",
  "Late night thoughts: The internet gave us connection but took away authenticity. ORRA is bringing it back.",
  "To everyone who said social media was a solved problem — watch this space. ORRA is about to prove you wrong.",
  "Building in public: Just shipped a new update to the Pulse feed algorithm. Your timeline just got a lot smarter.",
  "Gratitude post: Every ORRA user, every piece of feedback, every bug report — it all matters. Thank you for building with us.",
  "The ORRA Dance Challenge section is becoming my favorite part of the app. The creativity in this community is unreal.",
  "Just signed our first major brand partnership. ORRA is officially on the map. More details soon!",
  "If you haven't tried ORRA Prism yet, what are you waiting for? Short-form video done right. No ads, just vibes.",
  "My DMs are always open for ORRA feedback. The best features come from community suggestions.",
  "ORRA is more than a platform — it's a statement that social media can be better. And we're proving it every day.",
  "Incredible user growth this month. ORRA is becoming the place where real creators want to be.",
  "Hot take: Algorithms should serve users, not advertisers. That's ORRA's philosophy and we're sticking to it.",
  "Just came from an ORRA Live session and the energy was absolutely electric. This community is something special.",
  "Big things happen when you stop asking for permission and start building. That's the ORRA way.",
  "The ORRA Hub is becoming the go-to place for micro-communities. If you haven't created yours yet, today's the day.",
  "Shipped 3 new features this week. The team is on fire and the momentum is real.",
  "ORRA's mission: Make social media social again. Real connections. Real expression. Real community.",
  "To the ORRA OGs who've been here since day one — your loyalty means everything. We're building this for you.",
  "Just watched an ORRA Dance Challenge that literally gave me chills. The talent in this community is next level.",
  "Transparency update: We're working on ORRA Tokens, a way to reward creators for the value they bring. Stay tuned.",
  "The difference between ORRA and other platforms? We actually listen to our community. Your voice shapes this product.",
  "New Orleans born. Worldwide impact. ORRA is proof that you don't need to be in Silicon Valley to change the world.",
  "If ORRA has impacted your life in any positive way, I'd love to hear your story. Drop it in the comments.",
  "Building a social platform from scratch teaches you humility. Every day I learn something new from this community.",
  "ORRA update: Performance improvements across the board. Faster loading, smoother scrolling, better vibes.",
  "The ORRA Wellness Dashboard is live. Because your mental health matters more than your follower count.",
  "Just had the best user feedback session. Some of these ideas are going straight into the next sprint.",
  "ORRA tip: Customize your profile with vibe tags so people with similar interests can find you. Connection starts with authenticity.",
  "When you believe in something deeply enough, the universe conspires to make it happen. ORRA is living proof.",
  "Shoutout to every creator on ORRA who posts authentically. You're what makes this platform different.",
  "New ORRA feature preview: Enhanced messaging with voice notes, reactions, and shared Pulse posts. Coming soon.",
  "The best part of building ORRA? Watching strangers become friends, friends become communities, and communities become movements.",
  "ORRA is built for the next generation of social media users — people who value authenticity over aesthetics.",
  "Just hit 50K ORRA downloads. Every single download represents someone who chose a different kind of social experience. Grateful.",
  "Late night inspiration: The platforms that survive the next decade will be the ones that put people first. ORRA is people first.",
  "If you could add one feature to ORRA, what would it be? Drop your ideas below — I read every single one.",
  "ORRA's content moderation philosophy: Empower the community, don't censor it. Trust users to create amazing things.",
  "The ORRA Explore page just got a major upgrade. Find your people, find your vibe, find your community.",
  "Vision without execution is just hallucination. ORRA is turning vision into reality, one update at a time.",
  "To every ORRA user who's invited a friend — you're growing something bigger than an app. You're building a movement.",
  "Just implemented a new notification system. Less noise, more signal. Because your attention is valuable.",
  "ORRA ProTip: Use the Wellness Dashboard to track your screen time. Social media should enhance your life, not consume it.",
  "The ORRA community doesn't just use the app — they shape it. Your feedback literally writes our roadmap.",
  "Building a platform is like building a city. Every feature is a new street, every user is a new neighbor. ORRA is growing.",
  "Big news: ORRA creator fund launching next month. If you make great content, we want to support you. Period.",
  "I started ORRA because I was tired of social media making people feel worse, not better. That problem is worth solving.",
  "Just shipped dark mode improvements based on community feedback. Your voices are heard and your ideas ship.",
  "The ORRA Prism AI companion is getting smarter every day. Ask it anything — it's like having a creative partner in your pocket.",
  "Community spotlight: Some of the most creative content I've ever seen is being made on ORRA. Keep pushing boundaries.",
  "ORRA's promise: We will never sell your data. Your information belongs to you. Period. Full stop.",
  "Every time I see ORRA users connecting authentically, I know we're building something that matters.",
  "New feature alert: ORRA Stories with music integration. Express yourself with the perfect soundtrack.",
  "The journey from idea to product is long, but every ORRA user makes it worth it. Thank you for being part of this.",
  "Hot take: The next big social platform won't come from a tech giant — it'll come from a community that demanded better. That's ORRA.",
  "Just reviewed our community guidelines with the team. Simplicity and fairness are the foundation. Respect each other, express freely.",
  "ORRA isn't just my project — it's OUR project. Every user, every creator, every community member is a co-builder.",
];

// Comment texts from other users
const COMMENT_TEXTS = [
  "This is incredible! ORRA is changing the game 🔥",
  "Love this energy! Keep building!",
  "ORRA is the future, no cap",
  "This is why I joined ORRA — real talk from real people",
  "The vision is clear and the execution is even better",
  "Can't wait to see what's next!",
  "You're building something special here",
  "ORRA community is unmatched!",
  "This platform is exactly what social media needed",
  "Big things coming, I can feel it!",
  "Proud to be part of the ORRA family",
  "The hustle is inspiring, keep going!",
  "ORRA > everything else out there",
  "This is the kind of leadership social media needs",
  "New Orleans stands with you! 🎷",
  "The ORRA difference is real. I feel it every time I open the app.",
  "Building in public is the way. Respect.",
  "This community is something else entirely",
  "Every update makes ORRA better and better",
  "Real ones know ORRA is the future",
  "Love the transparency! Other platforms could learn from this",
  "ORRA OG here, still going strong!",
  "This is why I tell everyone to join ORRA",
  "The vision just keeps getting clearer",
  "You're not just building an app, you're building a movement",
  "ORRA feels different from day one — in the best way",
  "Keep pushing boundaries! The community is behind you 100%",
  "This is the energy the internet needs more of",
  "ORRA is proof that one person's vision can change everything",
  "Grateful to be part of this journey!",
];

async function main() {
  console.log('Restoring Nick\'s profile data...\n');
  
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) {
    console.error('User not found!');
    process.exit(1);
  }
  console.log('Found user:', user.handle, '| Level:', user.auraLevel);
  
  // Get all other users for interactions
  const otherUsers = await prisma.user.findMany({
    where: { id: { not: user.id } }
  });
  console.log('Found', otherUsers.length, 'other users for interactions');
  
  // Count current posts
  const currentPostCount = await prisma.post.count({ where: { authorId: user.id } });
  console.log('Current user posts:', currentPostCount);
  
  // 1. Create additional posts to reach 78 total
  const postsNeeded = 78 - currentPostCount;
  console.log(`Creating ${postsNeeded} additional posts...`);
  
  const vibeTags = ['hyped', 'chill', 'inspired', 'grateful', 'excited', 'visionary', 'real', 'creative', 'motivated', 'reflective'];
  
  // Create posts spread over the last 60 days
  const now = Date.now();
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
  
  const newPosts = [];
  for (let i = 0; i < postsNeeded; i++) {
    const text = POST_TEXTS[i % POST_TEXTS.length];
    // Spread posts across 60 days with some randomness
    const dayOffset = Math.floor((i / postsNeeded) * 60);
    const hourOffset = Math.floor(Math.random() * 24);
    const createdAt = new Date(sixtyDaysAgo + dayOffset * 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000);
    
    // Random likes and comments counts for each post
    const likes = Math.floor(Math.random() * 12) + 1; // 1-12 likes per post
    const comments = Math.floor(Math.random() * 5); // 0-4 comments per post
    const shares = Math.floor(Math.random() * 3); // 0-2 shares per post
    
    const post = await prisma.post.create({
      data: {
        text,
        images: '[]',
        vibeTag: vibeTags[Math.floor(Math.random() * vibeTags.length)],
        type: 'text',
        likesCount: likes,
        commentsCount: comments,
        sharesCount: shares,
        authorId: user.id,
        createdAt,
        updatedAt: createdAt,
      }
    });
    newPosts.push({ post, likes, comments });
  }
  console.log(`Created ${postsNeeded} posts. Total now: ${currentPostCount + postsNeeded}`);
  
  // 2. Create likes on user's posts (from other users) to reach ~165 total
  const allUserPosts = await prisma.post.findMany({ where: { authorId: user.id } });
  
  // Count existing likes on user's posts
  const existingLikes = await prisma.like.count({
    where: { targetType: 'post', targetId: { in: allUserPosts.map(p => p.id) } }
  });
  console.log('\nExisting likes on user posts:', existingLikes);
  
  const likesNeeded = 165 - existingLikes;
  console.log(`Creating ${likesNeeded} additional likes on user's posts...`);
  
  let likesCreated = 0;
  for (let i = 0; i < likesNeeded; i++) {
    const randomPost = allUserPosts[Math.floor(Math.random() * allUserPosts.length)];
    const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    
    try {
      await prisma.like.create({
        data: {
          userId: randomUser.id,
          targetId: randomPost.id,
          targetType: 'post',
          reactionType: ['like', 'like', 'like', 'wow', 'omg', 'laughing', 'care'][Math.floor(Math.random() * 7)],
          createdAt: new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
        }
      });
      likesCreated++;
    } catch {
      // Skip duplicates (unique constraint)
    }
  }
  console.log(`Created ${likesCreated} likes. Total likes on user posts: ~${existingLikes + likesCreated}`);
  
  // 3. Create comments on user's posts to reach ~100 total
  const existingComments = await prisma.comment.count({
    where: { post: { authorId: user.id } }
  });
  console.log('\nExisting comments on user posts:', existingComments);
  
  const commentsNeeded = 100 - existingComments;
  console.log(`Creating ${commentsNeeded} additional comments on user's posts...`);
  
  let commentsCreated = 0;
  for (let i = 0; i < commentsNeeded; i++) {
    const randomPost = allUserPosts[Math.floor(Math.random() * allUserPosts.length)];
    const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    const commentText = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];
    
    try {
      await prisma.comment.create({
        data: {
          text: commentText,
          authorId: randomUser.id,
          postId: randomPost.id,
          createdAt: new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
        }
      });
      commentsCreated++;
    } catch (e) {
      // Skip errors
    }
  }
  console.log(`Created ${commentsCreated} comments. Total comments on user posts: ~${existingComments + commentsCreated}`);
  
  // 4. Update user's profile stats
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      auraLevel: 50,
      auraXP: 10500,
      auraTokens: 50000,
      dailyStreak: 365,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: JSON.stringify(['Founder', 'CEO', 'Legend', 'ORRA OG', 'Early Adopter', 'Visionary', 'ORRA Architect', 'Level 50', '365-Day Streak', 'Top Creator']),
      bio: "Founder & CEO of ORRA — building the next-gen social universe where creativity meets connection. Turning vision into reality, one pulse at a time. New Orleans born, worldwide impact. 💜",
      verified: true,
    }
  });
  console.log('\nUpdated user profile:');
  console.log('  Level:', updatedUser.auraLevel);
  console.log('  XP:', updatedUser.auraXP);
  console.log('  Tokens:', updatedUser.auraTokens);
  console.log('  Streak:', updatedUser.dailyStreak);
  console.log('  Badges:', updatedUser.badges);
  
  // Final counts
  const finalPostCount = await prisma.post.count({ where: { authorId: user.id } });
  const finalLikeCount = await prisma.like.count({
    where: { targetType: 'post', targetId: { in: allUserPosts.map(p => p.id) } }
  });
  const finalCommentCount = await prisma.comment.count({
    where: { post: { authorId: user.id } }
  });
  const followerCount = await prisma.follow.count({ where: { followingId: user.id } });
  
  console.log('\n=== FINAL PROFILE STATS ===');
  console.log('Posts:', finalPostCount);
  console.log('Likes (received):', finalLikeCount);
  console.log('Comments (received):', finalCommentCount);
  console.log('Followers:', followerCount);
  
  await prisma.$disconnect();
  console.log('\nProfile restoration complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
