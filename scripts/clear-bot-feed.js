/**
 * ORRA - Clear Bot Feed Script
 * Removes all bot-generated content from the database while preserving bot user accounts.
 * 
 * This cleans up:
 * - Posts by bots (and all cascading: comments, likes, reposts, saves, polls, shared posts)
 * - Comments by bots on other users' posts
 * - Likes by bots on any content
 * - Reposts by bots
 * - Saves by bots
 * - Stories by bots
 * - Reels by bots (and reel comments)
 * - Notifications triggered by bots
 * - Token actions by bots
 * - Hub posts by bots
 * - Shared posts by bots
 * - Direct messages sent by bots
 * - Challenge participants/invites by bots
 * - Dance entries by bots
 * - Poll votes by bots
 * 
 * After cleanup, resets counter fields on remaining posts to accurate values.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Bot user IDs (u1 through u16)
const BOT_IDS = [];
for (let i = 1; i <= 16; i++) {
  BOT_IDS.push(`u${i}`);
}

async function main() {
  console.log('🧹 ORRA Bot Feed Cleanup');
  console.log('========================\n');

  // Get before stats
  const statsBefore = {
    posts: await prisma.post.count(),
    comments: await prisma.comment.count(),
    likes: await prisma.like.count(),
    reposts: await prisma.repost.count(),
    saves: await prisma.save.count(),
    stories: await prisma.story.count(),
    reels: await prisma.reel.count(),
    reelComments: await prisma.reelComment.count(),
    notifications: await prisma.notification.count(),
    tokenActions: await prisma.tokenAction.count(),
    hubPosts: await prisma.hubPost.count(),
    sharedPosts: await prisma.sharedPost.count(),
    directMessages: await prisma.directMessage.count(),
    pollVotes: await prisma.pollVote.count(),
    danceEntries: await prisma.danceEntry.count(),
    challengeParticipants: await prisma.challengeParticipant.count(),
    challengeInvites: await prisma.challengeInvite.count(),
  };

  console.log('📊 Stats BEFORE cleanup:');
  for (const [key, val] of Object.entries(statsBefore)) {
    console.log(`   ${key}: ${val}`);
  }
  console.log('');

  // Count bot-specific content
  const botPosts = await prisma.post.count({ where: { authorId: { in: BOT_IDS } } });
  const botComments = await prisma.comment.count({ where: { authorId: { in: BOT_IDS } } });
  const botLikes = await prisma.like.count({ where: { userId: { in: BOT_IDS } } });
  const botReposts = await prisma.repost.count({ where: { userId: { in: BOT_IDS } } });
  const botSaves = await prisma.save.count({ where: { userId: { in: BOT_IDS } } });
  const botStories = await prisma.story.count({ where: { authorId: { in: BOT_IDS } } });
  const botReels = await prisma.reel.count({ where: { creatorId: { in: BOT_IDS } } });
  const botReelComments = await prisma.reelComment.count({ where: { authorId: { in: BOT_IDS } } });
  const botNotifsTriggered = await prisma.notification.count({ where: { triggeredByUserId: { in: BOT_IDS } } });
  const botNotifsOwned = await prisma.notification.count({ where: { userId: { in: BOT_IDS } } });
  const botTokenActions = await prisma.tokenAction.count({ where: { userId: { in: BOT_IDS } } });
  const botHubPosts = await prisma.hubPost.count({ where: { authorId: { in: BOT_IDS } } });
  const botSharedPosts = await prisma.sharedPost.count({ where: { userId: { in: BOT_IDS } } });
  const botDMs = await prisma.directMessage.count({ where: { senderId: { in: BOT_IDS } } });
  const botPollVotes = await prisma.pollVote.count({ where: { userId: { in: BOT_IDS } } });
  const botDanceEntries = await prisma.danceEntry.count({ where: { authorId: { in: BOT_IDS } } });
  const botChallengeParts = await prisma.challengeParticipant.count({ where: { userId: { in: BOT_IDS } } });
  const botChallengeInvites = await prisma.challengeInvite.count({ where: { senderId: { in: BOT_IDS } } });

  console.log('🤖 Bot content to be removed:');
  console.log(`   Posts: ${botPosts}`);
  console.log(`   Comments: ${botComments}`);
  console.log(`   Likes: ${botLikes}`);
  console.log(`   Reposts: ${botReposts}`);
  console.log(`   Saves: ${botSaves}`);
  console.log(`   Stories: ${botStories}`);
  console.log(`   Reels: ${botReels}`);
  console.log(`   Reel Comments: ${botReelComments}`);
  console.log(`   Notifications (triggered by bots): ${botNotifsTriggered}`);
  console.log(`   Notifications (for bots): ${botNotifsOwned}`);
  console.log(`   Token Actions: ${botTokenActions}`);
  console.log(`   Hub Posts: ${botHubPosts}`);
  console.log(`   Shared Posts: ${botSharedPosts}`);
  console.log(`   Direct Messages: ${botDMs}`);
  console.log(`   Poll Votes: ${botPollVotes}`);
  console.log(`   Dance Entries: ${botDanceEntries}`);
  console.log(`   Challenge Participants: ${botChallengeParts}`);
  console.log(`   Challenge Invites: ${botChallengeInvites}`);
  console.log('');

  // ==========================================
  // STEP 1: Delete bot posts (cascade handles comments, reposts, polls, shared posts on those posts)
  // ==========================================
  console.log('🗑️  Step 1: Deleting bot posts (cascade removes their comments, reposts, polls, saves)...');
  const deletedPosts = await prisma.post.deleteMany({
    where: { authorId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedPosts.count} bot posts`);

  // ==========================================
  // STEP 2: Delete bot comments on remaining (non-bot) posts
  // ==========================================
  console.log('🗑️  Step 2: Deleting bot comments on remaining posts...');
  const deletedComments = await prisma.comment.deleteMany({
    where: { authorId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedComments.count} bot comments`);

  // ==========================================
  // STEP 3: Delete bot likes on any content
  // ==========================================
  console.log('🗑️  Step 3: Deleting bot likes/reactions...');
  const deletedLikes = await prisma.like.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedLikes.count} bot likes`);

  // ==========================================
  // STEP 4: Delete bot reposts (echoes) of remaining posts
  // ==========================================
  console.log('🗑️  Step 4: Deleting bot reposts...');
  const deletedReposts = await prisma.repost.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedReposts.count} bot reposts`);

  // ==========================================
  // STEP 5: Delete bot saves (bookmarks)
  // ==========================================
  console.log('🗑️  Step 5: Deleting bot saves...');
  const deletedSaves = await prisma.save.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedSaves.count} bot saves`);

  // ==========================================
  // STEP 6: Delete bot stories
  // ==========================================
  console.log('🗑️  Step 6: Deleting bot stories...');
  const deletedStories = await prisma.story.deleteMany({
    where: { authorId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedStories.count} bot stories`);

  // ==========================================
  // STEP 7: Delete bot reels (cascade removes reel comments on those reels)
  // ==========================================
  console.log('🗑️  Step 7: Deleting bot reels...');
  const deletedReels = await prisma.reel.deleteMany({
    where: { creatorId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedReels.count} bot reels`);

  // ==========================================
  // STEP 8: Delete bot reel comments on remaining reels
  // ==========================================
  console.log('🗑️  Step 8: Deleting bot reel comments on remaining reels...');
  const deletedReelComments = await prisma.reelComment.deleteMany({
    where: { authorId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedReelComments.count} bot reel comments`);

  // ==========================================
  // STEP 9: Delete bot notifications
  // ==========================================
  console.log('🗑️  Step 9: Deleting bot notifications...');
  const deletedNotifsTriggered = await prisma.notification.deleteMany({
    where: { triggeredByUserId: { in: BOT_IDS } }
  });
  const deletedNotifsOwned = await prisma.notification.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedNotifsTriggered.count + deletedNotifsOwned.count} bot notifications`);

  // ==========================================
  // STEP 10: Delete bot token actions
  // ==========================================
  console.log('🗑️  Step 10: Deleting bot token actions...');
  const deletedTokenActions = await prisma.tokenAction.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedTokenActions.count} bot token actions`);

  // ==========================================
  // STEP 11: Delete bot hub posts
  // ==========================================
  console.log('🗑️  Step 11: Deleting bot hub posts...');
  const deletedHubPosts = await prisma.hubPost.deleteMany({
    where: { authorId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedHubPosts.count} bot hub posts`);

  // ==========================================
  // STEP 12: Delete bot shared posts
  // ==========================================
  console.log('🗑️  Step 12: Deleting bot shared posts...');
  const deletedSharedPosts = await prisma.sharedPost.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedSharedPosts.count} bot shared posts`);

  // ==========================================
  // STEP 13: Delete bot direct messages
  // ==========================================
  console.log('🗑️  Step 13: Deleting bot direct messages...');
  const deletedDMs = await prisma.directMessage.deleteMany({
    where: { senderId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedDMs.count} bot direct messages`);

  // ==========================================
  // STEP 14: Delete bot poll votes
  // ==========================================
  console.log('🗑️  Step 14: Deleting bot poll votes...');
  const deletedPollVotes = await prisma.pollVote.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedPollVotes.count} bot poll votes`);

  // ==========================================
  // STEP 15: Delete bot dance entries
  // ==========================================
  console.log('🗑️  Step 15: Deleting bot dance entries...');
  const deletedDanceEntries = await prisma.danceEntry.deleteMany({
    where: { authorId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedDanceEntries.count} bot dance entries`);

  // ==========================================
  // STEP 16: Delete bot challenge participation
  // ==========================================
  console.log('🗑️  Step 16: Deleting bot challenge invites & participants...');
  const deletedChallengeInvites = await prisma.challengeInvite.deleteMany({
    where: { senderId: { in: BOT_IDS } }
  });
  const deletedChallengeParts = await prisma.challengeParticipant.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedChallengeInvites.count} bot challenge invites`);
  console.log(`   ✅ Deleted ${deletedChallengeParts.count} bot challenge participants`);

  // ==========================================
  // STEP 17: Delete bot reel history
  // ==========================================
  console.log('🗑️  Step 17: Deleting bot reel history...');
  const deletedReelHistory = await prisma.reelHistory.deleteMany({
    where: { userId: { in: BOT_IDS } }
  });
  console.log(`   ✅ Deleted ${deletedReelHistory.count} bot reel history entries`);

  // ==========================================
  // STEP 18: Clean up empty chats (chats with no messages and only bot members)
  // ==========================================
  console.log('🗑️  Step 18: Cleaning up empty chats...');
  const allChats = await prisma.chat.findMany({
    include: { messages: true, members: true }
  });
  let emptyChatCount = 0;
  for (const chat of allChats) {
    if (chat.messages.length === 0) {
      await prisma.chat.delete({ where: { id: chat.id } });
      emptyChatCount++;
    }
  }
  console.log(`   ✅ Deleted ${emptyChatCount} empty chats`);

  // ==========================================
  // STEP 19: Recalculate counters on remaining posts
  // ==========================================
  console.log('🔄 Step 19: Recalculating counters on remaining posts...');
  const remainingPosts = await prisma.post.findMany({
    select: { id: true }
  });
  
  let updatedCount = 0;
  for (const post of remainingPosts) {
    const actualLikes = await prisma.like.count({
      where: { targetId: post.id, targetType: 'post' }
    });
    const actualComments = await prisma.comment.count({
      where: { postId: post.id }
    });
    const actualShares = await prisma.repost.count({
      where: { postId: post.id }
    });
    
    await prisma.post.update({
      where: { id: post.id },
      data: {
        likesCount: actualLikes,
        commentsCount: actualComments,
        sharesCount: actualShares,
      }
    });
    updatedCount++;
  }
  console.log(`   ✅ Updated counters on ${updatedCount} remaining posts`);

  // ==========================================
  // STEP 20: Recalculate counters on remaining reels
  // ==========================================
  console.log('🔄 Step 20: Recalculating counters on remaining reels...');
  const remainingReels = await prisma.reel.findMany({
    select: { id: true }
  });
  
  let updatedReelCount = 0;
  for (const reel of remainingReels) {
    const actualLikes = await prisma.like.count({
      where: { targetId: reel.id, targetType: 'reel' }
    });
    const actualComments = await prisma.reelComment.count({
      where: { reelId: reel.id }
    });
    
    await prisma.reel.update({
      where: { id: reel.id },
      data: {
        likesCount: actualLikes,
        commentsCount: actualComments,
      }
    });
    updatedReelCount++;
  }
  console.log(`   ✅ Updated counters on ${updatedReelCount} remaining reels`);

  // ==========================================
  // STEP 21: Recalculate hub post counters
  // ==========================================
  console.log('🔄 Step 21: Recalculating counters on remaining hub posts...');
  const remainingHubPosts = await prisma.hubPost.findMany({
    select: { id: true }
  });
  for (const hp of remainingHubPosts) {
    const actualLikes = await prisma.like.count({
      where: { targetId: hp.id, targetType: 'hubPost' }
    });
    await prisma.hubPost.update({
      where: { id: hp.id },
      data: { likesCount: actualLikes }
    });
  }
  console.log(`   ✅ Updated counters on ${remainingHubPosts.length} remaining hub posts`);

  // ==========================================
  // FINAL STATS
  // ==========================================
  const statsAfter = {
    posts: await prisma.post.count(),
    comments: await prisma.comment.count(),
    likes: await prisma.like.count(),
    reposts: await prisma.repost.count(),
    saves: await prisma.save.count(),
    stories: await prisma.story.count(),
    reels: await prisma.reel.count(),
    reelComments: await prisma.reelComment.count(),
    notifications: await prisma.notification.count(),
    tokenActions: await prisma.tokenAction.count(),
    hubPosts: await prisma.hubPost.count(),
    sharedPosts: await prisma.sharedPost.count(),
    directMessages: await prisma.directMessage.count(),
    pollVotes: await prisma.pollVote.count(),
    danceEntries: await prisma.danceEntry.count(),
  };

  console.log('\n📊 Stats AFTER cleanup:');
  for (const [key, val] of Object.entries(statsAfter)) {
    const diff = statsBefore[key] - val;
    console.log(`   ${key}: ${val} (removed ${diff})`);
  }

  // Verify no bot posts remain in feed
  const remainingBotPosts = await prisma.post.count({
    where: { authorId: { in: BOT_IDS } }
  });
  console.log(`\n✅ Verification: ${remainingBotPosts} bot posts remaining in feed (should be 0)`);
  
  // Show remaining real content
  const remainingRealPosts = await prisma.post.count({
    where: { authorId: { notIn: BOT_IDS } }
  });
  console.log(`📄 Real user posts remaining: ${remainingRealPosts}`);

  console.log('\n🎉 Bot feed cleanup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
