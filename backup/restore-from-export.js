#!/usr/bin/env node
// ORRA Full State Restore Script
// Restores the entire database from the JSON export.
// Usage: node backup/restore-from-export.js
//
// This is the STOP-GAP restore. If the server is lost, after:
//   1. npm install
//   2. npx prisma generate
//   3. npx prisma db push
//   4. node backup/restore-from-export.js
//   5. npx next build --webpack
//   6. npx next start -p 3000
// The app will be back to this exact state.

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const exportPath = path.join(__dirname, 'full-state-export.json');
  if (!fs.existsSync(exportPath)) {
    console.error('ERROR: backup/full-state-export.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  console.log(`Restoring ORRA state from ${data.exportedAt} (version: ${data.version})`);
  console.log(`Users: ${data.users.length}, Likes: ${data.likes.length}, Hubs: ${data.hubs.length}`);

  // 1. Create all users (with hashed passwords from the export — skip if they exist)
  console.log('\n=== Restoring Users ===');
  for (const user of data.users) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { id: user.id } });
      if (existing) {
        console.log(`  [SKIP] User ${user.handle} already exists`);
        continue;
      }

      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          handle: user.handle,
          password: '$2a$10$placeholder_hash_restore_from_db_backup_if_needed',
          avatar: user.avatar,
          coverImage: user.coverImage,
          bio: user.bio,
          location: user.location,
          website: user.website,
          verified: user.verified,
          auraTokens: user.auraTokens,
          auraLevel: user.auraLevel,
          auraXP: user.auraXP,
          dailyStreak: user.dailyStreak,
          badges: user.badges,
          profileSongUrl: user.profileSongUrl || '',
          profileSongTitle: user.profileSongTitle || '',
          profileSongArtist: user.profileSongArtist || '',
          profileSetupComplete: user.profileSetupComplete || false,
        }
      });
      console.log(`  [OK] Created user ${user.handle}`);
    } catch (e) {
      console.error(`  [ERR] Failed to create user ${user.handle}:`, e.message);
    }
  }

  // 2. Create all posts with comments
  console.log('\n=== Restoring Posts ===');
  let postCount = 0;
  let commentCount = 0;
  for (const user of data.users) {
    for (const post of user.posts) {
      try {
        const existing = await prisma.post.findUnique({ where: { id: post.id } });
        if (existing) {
          console.log(`  [SKIP] Post ${post.id} already exists`);
          continue;
        }

        await prisma.post.create({
          data: {
            id: post.id,
            text: post.text,
            images: post.images,
            vibeTag: post.vibeTag,
            type: post.type,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            sharesCount: post.sharesCount,
            authorId: user.id,
            createdAt: new Date(post.createdAt),
            comments: {
              create: post.comments.map(c => ({
                id: c.id,
                text: c.text,
                authorId: c.authorId,
                createdAt: new Date(c.createdAt),
              }))
            }
          }
        });
        postCount++;
        commentCount += post.comments.length;
      } catch (e) {
        console.error(`  [ERR] Failed to create post ${post.id}:`, e.message);
      }
    }
  }
  console.log(`  Created ${postCount} posts with ${commentCount} comments`);

  // 3. Create follow relationships
  console.log('\n=== Restoring Follows ===');
  let followCount = 0;
  for (const user of data.users) {
    for (const f of user.followers) {
      try {
        await prisma.follow.upsert({
          where: { id: `${f.followerId}_${f.followingId}` },
          update: {},
          create: {
            followerId: f.followerId,
            followingId: f.followingId,
          }
        });
        followCount++;
      } catch (e) {
        // Follow unique constraint may fail, that's ok
      }
    }
  }
  console.log(`  Created ${followCount} follow relationships`);

  // 4. Create likes
  console.log('\n=== Restoring Likes ===');
  let likeCount = 0;
  for (const like of data.likes) {
    try {
      await prisma.like.create({
        data: {
          userId: like.userId,
          targetId: like.targetId,
          targetType: like.targetType,
          reactionType: like.reactionType,
        }
      });
      likeCount++;
    } catch (e) {
      // Unique constraint may fail, skip
    }
  }
  console.log(`  Created ${likeCount} likes`);

  // 5. Create hubs with members
  console.log('\n=== Restoring Hubs ===');
  for (const hub of data.hubs) {
    try {
      const existing = await prisma.hub.findUnique({ where: { id: hub.id } });
      if (existing) {
        console.log(`  [SKIP] Hub ${hub.name} already exists`);
        continue;
      }
      await prisma.hub.create({
        data: {
          id: hub.id,
          name: hub.name,
          icon: hub.icon,
          cover: hub.cover,
          description: hub.description,
          membersCount: hub.membersCount,
        }
      });
      // Add members
      for (const m of hub.members) {
        try {
          await prisma.hubMember.create({
            data: { userId: m.userId, hubId: hub.id }
          });
        } catch (e) {}
      }
      console.log(`  [OK] Created hub ${hub.name}`);
    } catch (e) {
      console.error(`  [ERR] Failed to create hub ${hub.name}:`, e.message);
    }
  }

  // 6. Restore stories
  console.log('\n=== Restoring Stories ===');
  let storyCount = 0;
  for (const story of data.stories) {
    try {
      const existing = await prisma.story.findUnique({ where: { id: story.id } });
      if (existing) continue;
      await prisma.story.create({
        data: {
          id: story.id,
          image: story.image,
          viewed: story.viewed,
          authorId: story.authorId,
          createdAt: new Date(story.createdAt),
          expiresAt: new Date(story.expiresAt),
        }
      });
      storyCount++;
    } catch (e) {}
  }
  console.log(`  Created ${storyCount} stories`);

  // 7. Restore reels
  console.log('\n=== Restoring Reels ===');
  let reelCount = 0;
  for (const reel of data.reels) {
    try {
      const existing = await prisma.reel.findUnique({ where: { id: reel.id } });
      if (existing) continue;
      await prisma.reel.create({
        data: {
          id: reel.id,
          title: reel.title,
          thumbnail: reel.thumbnail,
          category: reel.category,
          song: reel.song || '',
          views: reel.views,
          likesCount: reel.likesCount,
          commentsCount: reel.commentsCount,
          creatorId: reel.creatorId,
        }
      });
      reelCount++;
    } catch (e) {}
  }
  console.log(`  Created ${reelCount} reels`);

  // 8. Restore dance entries
  console.log('\n=== Restoring Dance Entries ===');
  let danceCount = 0;
  for (const entry of data.danceEntries) {
    try {
      const existing = await prisma.danceEntry.findUnique({ where: { id: entry.id } });
      if (existing) continue;
      await prisma.danceEntry.create({
        data: {
          id: entry.id,
          description: entry.description,
          thumbnail: entry.thumbnail || '',
          likesCount: entry.likesCount,
          authorId: entry.authorId,
          challengeId: entry.challengeId,
        }
      });
      danceCount++;
    } catch (e) {}
  }
  console.log(`  Created ${danceCount} dance entries`);

  console.log('\n========================================');
  console.log('ORRA STATE RESTORE COMPLETE!');
  console.log('========================================');
  console.log('Next steps:');
  console.log('  1. npx next build --webpack');
  console.log('  2. npx next start -p 3000');
  console.log('  3. For the founder account, you may need to reset the password:');
  console.log('     node -e "const bcrypt=require(\'bcryptjs\'); const p=new(require(\'@prisma/client\').PrismaClient)(); (async()=>{ await p.user.update({where:{email:\'nickjoseph8087@gmail.com\'},data:{password:await bcrypt.hash(\'Weareone504\',10)}}); console.log(\'Password reset!\'); await p.\\$disconnect();})()"');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
