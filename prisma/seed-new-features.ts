import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// ============================================================
// ORRA — Seed Script for New Features
// Populates: Events, Subscriber Tiers, Collections,
//   Scheduled Posts, Close Friends, Pinned Posts
// Safe to run multiple times (idempotent via upserts / checks)
// ============================================================

async function main() {
  console.log('\n🚀 ORRA New Features Seed — Starting...\n');

  // ----------------------------------------------------------
  // Resolve prerequisite data
  // ----------------------------------------------------------
  const founder = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!founder) {
    console.error('❌ No users found in the database. Run the main seed first.');
    process.exit(1);
  }
  console.log(`👤 Founder: ${founder.name} (${founder.handle}) — id: ${founder.id}`);

  const otherUsersRaw = await db.user.findMany({ take: 5, skip: 1, orderBy: { createdAt: 'asc' } });
  // Safety: filter out the founder in case of ordering inconsistencies
  const otherUsers = otherUsersRaw.filter(u => u.id !== founder.id);
  console.log(`👥 Other users resolved: ${otherUsers.length}`);

  const posts = await db.post.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  console.log(`📝 Posts resolved: ${posts.length}`);

  if (posts.length < 4) {
    console.warn('⚠️  Fewer than 4 posts found — some collections/pins may have fewer items.');
  }

  // Helper: safe date offsets from now
  const now = new Date();
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // ============================================================
  // FEATURE #1 — Events
  // ============================================================
  console.log('\n📅 Seeding Events...');

  const eventsData = [
    {
      title: 'NOLA Jazz Night',
      description: 'Experience the soul of New Orleans jazz live! An unforgettable evening of brass, rhythm, and culture in the heart of the French Quarter.',
      category: 'music',
      isVirtual: false,
      location: 'French Quarter, New Orleans, LA',
      meetLink: '',
      tokenCost: 10,
      startDate: daysFromNow(2),
      endDate: daysFromNow(2.25),
      maxAttendees: 200,
    },
    {
      title: 'Digital Art Showcase',
      description: 'A virtual gallery featuring the best digital artists on ORRA. Explore AI-generated art, pixel masterpieces, and 3D renders from creators worldwide.',
      category: 'art',
      isVirtual: true,
      location: '',
      meetLink: 'https://meet.orra.app/art-showcase',
      tokenCost: 0,
      startDate: daysFromNow(1),
      endDate: daysFromNow(1.5),
      maxAttendees: 0,
    },
    {
      title: 'Tech Meetup 2026',
      description: 'Connect with fellow tech enthusiasts, developers, and founders. Lightning talks, networking, and the future of social tech. Free pizza included!',
      category: 'tech',
      isVirtual: false,
      location: 'The Innovation Hub, Austin, TX',
      meetLink: '',
      tokenCost: 0,
      startDate: daysFromNow(5),
      endDate: daysFromNow(5.33),
      maxAttendees: 150,
    },
    {
      title: 'Fitness Challenge Live',
      description: 'Join a live 45-minute HIIT workout with Coach Jade! All fitness levels welcome. Bring water and your best energy. Let us glow up together!',
      category: 'fitness',
      isVirtual: true,
      location: '',
      meetLink: 'https://meet.orra.app/fitness-live',
      tokenCost: 5,
      startDate: daysFromNow(1),
      endDate: daysFromNow(1.04),
      maxAttendees: 500,
    },
    {
      title: 'Summer Block Party',
      description: 'The biggest block party of the summer! Live DJs, food trucks, art vendors, and good vibes only. Bring your crew and your dancing shoes.',
      category: 'party',
      isVirtual: false,
      location: 'Riverside Park, Atlanta, GA',
      meetLink: '',
      tokenCost: 0,
      startDate: daysFromNow(3),
      endDate: daysFromNow(3.5),
      maxAttendees: 0,
    },
    {
      title: 'Album Drop: Midnight',
      description: 'Exclusive midnight listening party for the new ORRA compilation album. Hear it before anyone else with live commentary from the producers.',
      category: 'music',
      isVirtual: true,
      location: '',
      meetLink: 'https://meet.orra.app/album-drop',
      tokenCost: 3,
      startDate: hoursFromNow(12),
      endDate: hoursFromNow(13.5),
      maxAttendees: 300,
    },
  ];

  const createdEvents = [];
  for (const eventData of eventsData) {
    // Check if event already exists by title + creatorId
    const existing = await db.event.findFirst({
      where: { title: eventData.title, creatorId: founder.id },
    });

    if (existing) {
      console.log(`   ⏭️  Event "${eventData.title}" already exists (id: ${existing.id})`);
      createdEvents.push(existing);
    } else {
      const event = await db.event.create({
        data: {
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          isVirtual: eventData.isVirtual,
          location: eventData.location,
          meetLink: eventData.meetLink,
          tokenCost: eventData.tokenCost,
          startDate: eventData.startDate,
          endDate: eventData.endDate ?? null,
          maxAttendees: eventData.maxAttendees,
          creatorId: founder.id,
        },
      });
      console.log(`   ✅ Created event "${eventData.title}" (id: ${event.id})`);
      createdEvents.push(event);
    }
  }

  // Add RSVPs from other users
  console.log('\n📋 Seeding Event RSVPs...');
  const rsvpStatuses = ['going', 'interested', 'maybe'] as const;

  for (const event of createdEvents) {
    // Check how many RSVPs this event already has
    const existingRsvps = await db.eventRSVP.count({ where: { eventId: event.id } });
    if (existingRsvps > 0) {
      console.log(`   ⏭️  Event "${event.title}" already has ${existingRsvps} RSVP(s) — skipping`);
      continue;
    }

    // RSVP 2-4 other users per event
    const rsvpCount = Math.min(2 + Math.floor(Math.random() * 3), otherUsers.length);
    for (let i = 0; i < rsvpCount; i++) {
      const user = otherUsers[i];
      const status = rsvpStatuses[i % rsvpStatuses.length];
      try {
        await db.eventRSVP.create({
          data: {
            eventId: event.id,
            userId: user.id,
            status,
          },
        });
        console.log(`   ✅ RSVP: ${user.name} → "${event.title}" (${status})`);
      } catch (err: any) {
        if (err.code === 'P2002') {
          console.log(`   ⏭️  RSVP already exists for ${user.name} on "${event.title}"`);
        } else {
          throw err;
        }
      }
    }
  }

  // ============================================================
  // FEATURE #2 — Subscriber Tiers
  // ============================================================
  console.log('\n💎 Seeding Subscriber Tiers...');

  // We need 2-3 creators. Use founder + up to 2 other users.
  // Ensure all creators are distinct users
  const creatorsForTiers = [founder, ...otherUsers.slice(0, 2)].filter(
    (u, i, arr) => arr.findIndex(x => x.id === u.id) === i
  );

  const tiersData = [
    {
      creator: creatorsForTiers[0],
      tierName: 'Exclusive Access',
      price: 50,
      description: 'Get exclusive behind-the-scenes content, early access to new features, and a private badge.',
      perks: JSON.stringify(['Behind-the-scenes content', 'Early feature access', 'Exclusive badge', 'Monthly Q&A']),
    },
    {
      creator: creatorsForTiers[1] ?? creatorsForTiers[0],
      tierName: 'VIP Creator',
      price: 100,
      description: 'The ultimate fan experience! VIP access to everything plus 1-on-1 time and custom content.',
      perks: JSON.stringify(['All Exclusive Access perks', '1-on-1 monthly call', 'Custom shoutouts', 'Priority support', 'VIP badge']),
    },
    {
      creator: creatorsForTiers[2] ?? creatorsForTiers[1] ?? creatorsForTiers[0],
      tierName: 'Supporter',
      price: 25,
      description: 'Support your favorite creator and get a special supporter badge plus bonus content.',
      perks: JSON.stringify(['Supporter badge', 'Bonus posts', 'Poll voting power', 'Name in credits']),
    },
  ];

  for (const tierData of tiersData) {
    // SubscriberTier has @unique on creatorId, so we can upsert
    const tier = await db.subscriberTier.upsert({
      where: { creatorId: tierData.creator.id },
      update: {
        tierName: tierData.tierName,
        price: tierData.price,
        description: tierData.description,
        perks: tierData.perks,
        isActive: true,
      },
      create: {
        creatorId: tierData.creator.id,
        tierName: tierData.tierName,
        price: tierData.price,
        description: tierData.description,
        perks: tierData.perks,
        isActive: true,
      },
    });
    console.log(`   ✅ Tier "${tierData.tierName}" @ ${tierData.price} ORRA/mo for ${tierData.creator.name} (id: ${tier.id})`);
  }

  // ============================================================
  // FEATURE #7 — Collections
  // ============================================================
  console.log('\n📁 Seeding Collections...');

  const collectionsData: Array<{
    name: string;
    description: string;
    isPrivate: boolean;
    postIndices: number[];
  }> = [
    {
      name: 'Favorites',
      description: 'My all-time favorite posts on ORRA.',
      isPrivate: false,
      postIndices: [0, 1, 2, 3], // 4 posts
    },
    {
      name: 'Inspiration',
      description: 'Posts that inspire and motivate me.',
      isPrivate: false,
      postIndices: [4, 5, 6], // 3 posts
    },
    {
      name: 'Private Notes',
      description: 'Personal saves for later — eyes only.',
      isPrivate: true,
      postIndices: [7, 8], // 2 posts
    },
  ];

  for (const colData of collectionsData) {
    // Check if collection already exists by name + userId
    let collection = await db.collection.findFirst({
      where: { name: colData.name, userId: founder.id },
    });

    if (collection) {
      console.log(`   ⏭️  Collection "${colData.name}" already exists (id: ${collection.id})`);
    } else {
      collection = await db.collection.create({
        data: {
          name: colData.name,
          description: colData.description,
          isPrivate: colData.isPrivate,
          userId: founder.id,
        },
      });
      console.log(`   ✅ Created collection "${colData.name}" (id: ${collection.id})`);
    }

    // Add items to collection
    const validPostIndices = colData.postIndices.filter(i => i < posts.length);
    for (const postIdx of validPostIndices) {
      const post = posts[postIdx];
      if (!post) continue;

      // Check if item already exists (unique constraint on collectionId + postId)
      const existingItem = await db.collectionItem.findUnique({
        where: {
          collectionId_postId: {
            collectionId: collection.id,
            postId: post.id,
          },
        },
      });

      if (existingItem) {
        console.log(`      ⏭️  Post ${post.id} already in "${colData.name}"`);
      } else {
        await db.collectionItem.create({
          data: {
            collectionId: collection.id,
            postId: post.id,
          },
        });
        console.log(`      ✅ Added post ${post.id} to "${colData.name}"`);
      }
    }
  }

  // ============================================================
  // FEATURE #9 — Scheduled Posts
  // ============================================================
  console.log('\n⏰ Seeding Scheduled Posts...');

  const scheduledPostsData = [
    {
      text: '🚀 Big announcement dropping soon! Stay tuned for the next chapter of ORRA. This one changes everything.',
      scheduledAt: hoursFromNow(1),
      vibeTag: 'hyped',
      type: 'text',
    },
    {
      text: '📸 Morning inspiration: Every day is a new canvas. What are you painting today?',
      scheduledAt: daysFromNow(1),
      vibeTag: 'peaceful',
      type: 'text',
    },
    {
      text: '🎉 ORRA Weekly Recap — the best moments, top creators, and trending vibes from this week. Let us celebrate the community!',
      scheduledAt: daysFromNow(7),
      vibeTag: 'hyped',
      type: 'text',
    },
  ];

  for (const spData of scheduledPostsData) {
    // Check if a similar scheduled post already exists (same author + text)
    const existing = await db.scheduledPost.findFirst({
      where: {
        authorId: founder.id,
        text: spData.text,
      },
    });

    if (existing) {
      console.log(`   ⏭️  Scheduled post "${spData.text.slice(0, 50)}..." already exists (id: ${existing.id})`);
    } else {
      const scheduledPost = await db.scheduledPost.create({
        data: {
          text: spData.text,
          scheduledAt: spData.scheduledAt,
          vibeTag: spData.vibeTag,
          type: spData.type,
          authorId: founder.id,
          isPublished: false,
        },
      });
      console.log(
        `   ✅ Scheduled post "${spData.text.slice(0, 50)}..." for ${spData.scheduledAt.toISOString()} (id: ${scheduledPost.id})`
      );
    }
  }

  // ============================================================
  // FEATURE #10 — Close Friends
  // ============================================================
  console.log('\n💜 Seeding Close Friends...');

  // Add 3-4 close friends for the founder from existing other users
  const closeFriendUsers = otherUsers.slice(0, 4);

  for (const friend of closeFriendUsers) {
    // Check if close friend relationship already exists (unique on userId + friendId)
    const existing = await db.closeFriend.findUnique({
      where: {
        userId_friendId: {
          userId: founder.id,
          friendId: friend.id,
        },
      },
    });

    if (existing) {
      console.log(`   ⏭️  ${friend.name} is already a close friend`);
    } else {
      await db.closeFriend.create({
        data: {
          userId: founder.id,
          friendId: friend.id,
        },
      });
      console.log(`   ✅ Added ${friend.name} (${friend.handle}) as close friend`);
    }
  }

  // ============================================================
  // FEATURE #8 — Pinned Posts
  // ============================================================
  console.log('\n📌 Seeding Pinned Posts...');

  // Pin 1-2 posts for the founder
  // Find posts by the founder first, then fall back to any posts
  const founderPosts = await db.post.findMany({
    where: { authorId: founder.id },
    take: 2,
  });

  // If founder has fewer than 2 posts, supplement from the general posts list
  const postsToPin = [...founderPosts];
  if (postsToPin.length < 2 && posts.length > 0) {
    for (const p of posts) {
      if (postsToPin.length >= 2) break;
      if (!postsToPin.some(fp => fp.id === p.id)) {
        postsToPin.push(p);
      }
    }
  }

  for (const post of postsToPin.slice(0, 2)) {
    // Check if pin already exists (unique on userId + postId)
    const existing = await db.pinnedPost.findUnique({
      where: {
        userId_postId: {
          userId: founder.id,
          postId: post.id,
        },
      },
    });

    if (existing) {
      console.log(`   ⏭️  Post ${post.id} is already pinned`);
    } else {
      await db.pinnedPost.create({
        data: {
          userId: founder.id,
          postId: post.id,
        },
      });
      console.log(`   ✅ Pinned post ${post.id} ("${post.text.slice(0, 50)}...")`);
    }
  }

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n✅ ORRA New Features Seed — Complete!\n');

  // Count what was created
  const eventCount = await db.event.count({ where: { creatorId: founder.id } });
  const rsvpCount = await db.eventRSVP.count();
  const tierCount = await db.subscriberTier.count();
  const collectionCount = await db.collection.count({ where: { userId: founder.id } });
  const collectionItemCount = await db.collectionItem.count();
  const scheduledCount = await db.scheduledPost.count({ where: { authorId: founder.id } });
  const closeFriendCount = await db.closeFriend.count({ where: { userId: founder.id } });
  const pinnedCount = await db.pinnedPost.count({ where: { userId: founder.id } });

  console.log('📊 Summary:');
  console.log(`   📅 Events:            ${eventCount}`);
  console.log(`   📋 RSVPs:             ${rsvpCount}`);
  console.log(`   💎 Subscriber Tiers:  ${tierCount}`);
  console.log(`   📁 Collections:       ${collectionCount}`);
  console.log(`   📁 Collection Items:  ${collectionItemCount}`);
  console.log(`   ⏰ Scheduled Posts:   ${scheduledCount}`);
  console.log(`   💜 Close Friends:     ${closeFriendCount}`);
  console.log(`   📌 Pinned Posts:      ${pinnedCount}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
