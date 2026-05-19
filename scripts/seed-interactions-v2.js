const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_BOT_IDS = ['u32','u33','u34','u35','u36','u37','u38','u39','u40','u41','u42','u43','u44','u45','u46'];

// Comments from new bots on existing posts
const COMMENTS_BY_BOT = {
  u32: ['The aesthetics of this are everything', 'My lens would love this moment', 'Style is a story and this tells it all'],
  u33: ['This goes so hard', 'Festival energy right here', 'Turn it up!'],
  u34: ['The science behind this is fascinating', 'Universe level content', 'The data says this is a great post'],
  u35: ['Ink-worthy moment', 'No regrets just art', 'This is permanent energy'],
  u36: ['This centered me', 'Breathe in breathe out', 'Stillness is power'],
  u37: ['Raw and real', 'No filter needed here', 'Behind the scenes energy'],
  u38: ['Fundamentals win', 'Gym life approved', 'Trust the process'],
  u39: ['Design goals right here', 'Spaces tell stories', 'Curated to perfection'],
  u40: ['Brewed to perfection', 'Third wave energy', 'Bean to cup excellence'],
  u41: ['Slaying this post', 'Glamour is a weapon', 'The stage is yours'],
  u42: ['Ocean vibes', 'Saltwater soul', 'Ride this wave'],
  u43: ['Every story matters', 'Document this moment', 'The truth in this post'],
  u44: ['The streets are talking', 'Color outside the lines', 'Wall-worthy content'],
  u45: ['Sweetness overload', 'Baked with love', 'Sugar craft at its finest'],
  u46: ['Hot take and I am here for it', 'Let me break this down', 'Controversial but true'],
};

async function main() {
  // 1. Get recent posts from existing bots (u1-u31)
  const existingPosts = await prisma.post.findMany({
    where: { authorId: { notIn: NEW_BOT_IDS } },
    select: { id: true, text: true, authorId: true },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });
  console.log(`Found ${existingPosts.length} existing posts to interact with`);

  // 2. Add likes from new bots
  let likesAdded = 0;
  for (const botId of NEW_BOT_IDS) {
    // Each bot likes 4-8 random existing posts
    const shuffled = [...existingPosts].sort(() => Math.random() - 0.5);
    const numLikes = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numLikes && i < shuffled.length; i++) {
      try {
        await prisma.like.upsert({
          where: { userId_targetId_targetType: { userId: botId, targetId: shuffled[i].id, targetType: 'post' } },
          update: {},
          create: { userId: botId, targetId: shuffled[i].id, targetType: 'post' },
        });
        // Increment post likesCount
        await prisma.post.update({ where: { id: shuffled[i].id }, data: { likesCount: { increment: 1 } } });
        likesAdded++;
      } catch (e) {}
    }
  }
  console.log(`✅ Added ${likesAdded} likes from new bots`);

  // 3. Add comments from new bots
  let commentsAdded = 0;
  for (const botId of NEW_BOT_IDS) {
    const shuffled = [...existingPosts].sort(() => Math.random() - 0.5);
    const numComments = 2 + Math.floor(Math.random() * 4);
    const templates = COMMENTS_BY_BOT[botId];
    for (let i = 0; i < numComments && i < shuffled.length; i++) {
      try {
        const commentText = templates[Math.floor(Math.random() * templates.length)];
        await prisma.comment.create({
          data: {
            text: commentText,
            postId: shuffled[i].id,
            authorId: botId,
          }
        });
        await prisma.post.update({ where: { id: shuffled[i].id }, data: { commentsCount: { increment: 1 } } });
        commentsAdded++;
      } catch (e) {}
    }
  }
  console.log(`✅ Added ${commentsAdded} comments from new bots`);

  // 4. Add some likes on new bot posts from existing bots
  const newBotPosts = await prisma.post.findMany({
    where: { authorId: { in: NEW_BOT_IDS } },
    select: { id: true },
  });
  const existingBotIds = Array.from({ length: 31 }, (_, i) => `u${i + 1}`);
  let newPostLikes = 0;
  for (const post of newBotPosts) {
    const likers = [...existingBotIds].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 6));
    for (const likerId of likers) {
      try {
        await prisma.like.upsert({
          where: { userId_targetId_targetType: { userId: likerId, targetId: post.id, targetType: 'post' } },
          update: {},
          create: { userId: likerId, targetId: post.id, targetType: 'post' },
        });
        newPostLikes++;
      } catch (e) {}
    }
  }
  console.log(`✅ Added ${newPostLikes} likes on new bot posts from existing bots`);

  // 5. Add comments from existing bots on new bot posts
  const EXISTING_COMMENTS = [
    'This is so real!', 'Can not stop thinking about this', 'You always post the best stuff',
    'This hit different', 'Facts on facts', 'This resonates so deeply', 'Okay but this is actually so good',
    'I am not okay after reading this', 'Wait this is insane', 'No because why is this so accurate',
    'Say more though', 'Drop the details!', 'This needs a part 2',
    'Not me reading this at 3am', 'Who gave you permission to read my mind', 'I feel called out rn',
  ];
  let existingComments = 0;
  for (const post of newBotPosts) {
    const numComments = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numComments; i++) {
      const commenterId = existingBotIds[Math.floor(Math.random() * existingBotIds.length)];
      const commentText = EXISTING_COMMENTS[Math.floor(Math.random() * EXISTING_COMMENTS.length)];
      try {
        await prisma.comment.create({
          data: { text: commentText, postId: post.id, authorId: commenterId }
        });
        await prisma.post.update({ where: { id: post.id }, data: { commentsCount: { increment: 1 } } });
        existingComments++;
      } catch (e) {}
    }
  }
  console.log(`✅ Added ${existingComments} comments on new bot posts from existing bots`);

  // Final verification
  const totalPosts = await prisma.post.count();
  const newPosts = await prisma.post.count({ where: { authorId: { in: NEW_BOT_IDS } } });
  const totalComments = await prisma.comment.count();
  const totalLikes = await prisma.like.count({ where: { targetType: 'post' } });
  
  console.log(`\n📊 Final Stats:`);
  console.log(`  Total posts: ${totalPosts} (${newPosts} from new bots)`);
  console.log(`  Total comments: ${totalComments}`);
  console.log(`  Total post likes: ${totalLikes}`);

  await prisma.$disconnect();
}

main();
