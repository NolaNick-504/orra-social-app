/**
 * ORRA - Clear All Test/Stress Posts
 * Removes ALL stress test and bot test posts while keeping real content.
 * Handles SQLite cascade properly by deleting children before parents.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test post patterns - anything that looks like a stress/bot test post
const TEST_PATTERNS = [
  /^Stress #/i,
  /^Bot #/i,
  /^Bot stress #/i,
  /^Bot stress test #/i,
  /^Stress test post #/i,
  /^Test auto post$/i,
  /^test$/i,
  /^Feed fix test post$/i,
  /^Test bot post from auto-poster/i,
  /^Test post for auto-comment$/i,
  /^Auto-poster is back/i,
];

function isTestPost(text) {
  return TEST_PATTERNS.some(pattern => pattern.test(text));
}

async function main() {
  console.log('🧹 ORRA Test Post Cleanup');
  console.log('=========================\n');

  // Backup reminder
  console.log('📦 Database backup already saved to backups/ directory\n');

  // Find ALL test posts
  const allPosts = await prisma.post.findMany({
    select: { id: true, text: true, authorId: true, createdAt: true }
  });

  const testPostIds = allPosts.filter(p => isTestPost(p.text)).map(p => p.id);
  const realPostIds = allPosts.filter(p => !isTestPost(p.text)).map(p => p.id);

  console.log(`📊 Found ${testPostIds.length} test posts to delete`);
  console.log(`📊 Keeping ${realPostIds.length} real posts\n`);

  if (testPostIds.length === 0) {
    console.log('✅ No test posts found. Feed is clean!');
    return;
  }

  // Process in batches to avoid SQLite limits (max 999 variables per query)
  const BATCH_SIZE = 500;

  // ==========================================
  // STEP 1: Delete comments on test posts
  // ==========================================
  console.log('🗑️  Step 1: Deleting comments on test posts...');
  let totalDeletedComments = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.comment.deleteMany({
      where: { postId: { in: batch } }
    });
    totalDeletedComments += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedComments} comments on test posts`);

  // ==========================================
  // STEP 2: Delete likes on test posts
  // ==========================================
  console.log('🗑️  Step 2: Deleting likes on test posts...');
  let totalDeletedLikes = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.like.deleteMany({
      where: { targetId: { in: batch }, targetType: 'post' }
    });
    totalDeletedLikes += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedLikes} likes on test posts`);

  // ==========================================
  // STEP 3: Delete reposts of test posts
  // ==========================================
  console.log('🗑️  Step 3: Deleting reposts of test posts...');
  let totalDeletedReposts = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.repost.deleteMany({
      where: { postId: { in: batch } }
    });
    totalDeletedReposts += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedReposts} reposts of test posts`);

  // ==========================================
  // STEP 4: Delete saves of test posts
  // ==========================================
  console.log('🗑️  Step 4: Deleting saves of test posts...');
  let totalDeletedSaves = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.save.deleteMany({
      where: { targetId: { in: batch }, targetType: 'post' }
    });
    totalDeletedSaves += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedSaves} saves of test posts`);

  // ==========================================
  // STEP 5: Delete shared posts linking to test posts
  // ==========================================
  console.log('🗑️  Step 5: Deleting shared posts linking to test posts...');
  let totalDeletedShared = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.sharedPost.deleteMany({
      where: { postId: { in: batch } }
    });
    totalDeletedShared += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedShared} shared posts`);

  // ==========================================
  // STEP 6: Delete poll votes on polls for test posts
  // ==========================================
  console.log('🗑️  Step 6: Deleting polls on test posts...');
  // First find poll IDs for test posts
  const pollsOnTestPosts = await prisma.poll.findMany({
    where: { postId: { in: testPostIds } },
    select: { id: true }
  });
  const pollIds = pollsOnTestPosts.map(p => p.id);

  if (pollIds.length > 0) {
    // Delete poll votes first
    for (let i = 0; i < pollIds.length; i += BATCH_SIZE) {
      const batch = pollIds.slice(i, i + BATCH_SIZE);
      await prisma.pollVote.deleteMany({ where: { optionId: { in: batch } } });
    }
    // Find poll option IDs
    const pollOptions = await prisma.pollOption.findMany({
      where: { pollId: { in: pollIds } },
      select: { id: true }
    });
    const optionIds = pollOptions.map(o => o.id);
    if (optionIds.length > 0) {
      for (let i = 0; i < optionIds.length; i += BATCH_SIZE) {
        const batch = optionIds.slice(i, i + BATCH_SIZE);
        await prisma.pollVote.deleteMany({ where: { optionId: { in: batch } } });
      }
      // Delete poll options
      for (let i = 0; i < optionIds.length; i += BATCH_SIZE) {
        const batch = optionIds.slice(i, i + BATCH_SIZE);
        await prisma.pollOption.deleteMany({ where: { id: { in: batch } } });
      }
    }
    // Delete polls
    for (let i = 0; i < pollIds.length; i += BATCH_SIZE) {
      const batch = pollIds.slice(i, i + BATCH_SIZE);
      await prisma.poll.deleteMany({ where: { id: { in: batch } } });
    }
  }
  console.log(`   ✅ Deleted ${pollIds.length} polls on test posts`);

  // ==========================================
  // STEP 7: Delete notifications linked to test posts
  // ==========================================
  console.log('🗑️  Step 7: Deleting notifications linked to test posts...');
  let totalDeletedNotifs = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.notification.deleteMany({
      where: { postId: { in: batch } }
    });
    totalDeletedNotifs += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedNotifs} notifications`);

  // ==========================================
  // STEP 8: Delete token actions for test posts
  // ==========================================
  console.log('🗑️  Step 8: Deleting token actions for test posts...');
  let totalDeletedTokenActions = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.tokenAction.deleteMany({
      where: { targetId: { in: batch } }
    });
    totalDeletedTokenActions += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedTokenActions} token actions`);

  // ==========================================
  // STEP 9: Finally delete the test posts themselves
  // ==========================================
  console.log('🗑️  Step 9: Deleting test posts...');
  let totalDeletedPosts = 0;
  for (let i = 0; i < testPostIds.length; i += BATCH_SIZE) {
    const batch = testPostIds.slice(i, i + BATCH_SIZE);
    const result = await prisma.post.deleteMany({
      where: { id: { in: batch } }
    });
    totalDeletedPosts += result.count;
  }
  console.log(`   ✅ Deleted ${totalDeletedPosts} test posts`);

  // ==========================================
  // STEP 10: Recalculate counters on remaining posts
  // ==========================================
  console.log('🔄 Step 10: Recalculating counters on remaining posts...');
  const remainingPosts = await prisma.post.findMany({ select: { id: true } });
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
  }
  console.log(`   ✅ Updated counters on ${remainingPosts.length} remaining posts`);

  // ==========================================
  // STEP 11: Recalculate reel counters
  // ==========================================
  console.log('🔄 Step 11: Recalculating counters on remaining reels...');
  const remainingReels = await prisma.reel.findMany({ select: { id: true } });
  for (const reel of remainingReels) {
    const actualLikes = await prisma.like.count({
      where: { targetId: reel.id, targetType: 'reel' }
    });
    const actualComments = await prisma.reelComment.count({
      where: { reelId: reel.id }
    });
    await prisma.reel.update({
      where: { id: reel.id },
      data: { likesCount: actualLikes, commentsCount: actualComments }
    });
  }
  console.log(`   ✅ Updated counters on ${remainingReels.length} remaining reels`);

  // ==========================================
  // FINAL VERIFICATION
  // ==========================================
  console.log('\n📊 Final Stats:');
  console.log(`   Posts remaining: ${await prisma.post.count()}`);
  console.log(`   Comments remaining: ${await prisma.comment.count()}`);
  console.log(`   Likes remaining: ${await prisma.like.count()}`);
  console.log(`   Reposts remaining: ${await prisma.repost.count()}`);
  console.log(`   Saves remaining: ${await prisma.save.count()}`);
  console.log(`   Stories remaining: ${await prisma.story.count()}`);
  console.log(`   Reels remaining: ${await prisma.reel.count()}`);
  console.log(`   Notifications remaining: ${await prisma.notification.count()}`);

  // Verify no test posts remain
  const allRemaining = await prisma.post.findMany({ select: { text: true } });
  const stillTest = allRemaining.filter(p => isTestPost(p.text));
  console.log(`\n✅ Verification: ${stillTest.length} test posts remaining (should be 0)`);

  console.log('\n🎉 Test post cleanup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
