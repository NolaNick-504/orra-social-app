import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Seed new features (Events, Subscriptions, Collections, Scheduled Posts, Close Friends, Pinned Posts)
// Usage: GET /api/admin/seed-features?key=orra504
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== 'orra504') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    const founder = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!founder) return NextResponse.json({ error: 'No users found' }, { status: 400 });

    const otherUsers = await db.user.findMany({
      where: { id: { not: founder.id } },
      take: 8,
    });

    const posts = await db.post.findMany({ take: 10, orderBy: { createdAt: 'desc' } });

    // === EVENTS ===
    const eventDefs = [
      { title: 'NOLA Jazz Night', description: 'Live jazz in the French Quarter! Bring your vibe and let the music move you. Featuring local artists and special guests.', category: 'music', isVirtual: false, location: 'French Quarter, New Orleans', tokenCost: 10, daysAhead: 2 },
      { title: 'Digital Art Showcase', description: 'Virtual gallery featuring the hottest digital artists on ORRA. Exclusive NFT drops and live art demos.', category: 'art', isVirtual: true, meetLink: 'https://meet.orra.app/art-showcase', tokenCost: 0, daysAhead: 1 },
      { title: 'Tech Meetup 2026', description: 'Connect with fellow tech enthusiasts. Lightning talks, demos, and networking. All skill levels welcome!', category: 'tech', isVirtual: false, location: 'Downtown Tech Hub, NOLA', tokenCost: 0, daysAhead: 5 },
      { title: 'Fitness Challenge Live', description: '30-minute HIIT workout streamed live! Compete with others and earn ORRA tokens for completing the challenge.', category: 'fitness', isVirtual: true, meetLink: 'https://meet.orra.app/fitness', tokenCost: 5, daysAhead: 1 },
      { title: 'Summer Block Party', description: 'The biggest block party of the year! Music, food, vibes, and good people. Free entry, good energy only.', category: 'party', isVirtual: false, location: 'City Park, New Orleans', tokenCost: 0, daysAhead: 3 },
      { title: 'Album Drop: Midnight', description: 'Exclusive midnight listening party for the new album. First 50 attendees get a special badge!', category: 'music', isVirtual: true, meetLink: 'https://meet.orra.app/album-drop', tokenCost: 3, daysAhead: 0.5 },
    ];

    let eventsCreated = 0;
    for (const def of eventDefs) {
      const existing = await db.event.findFirst({ where: { title: def.title, creatorId: founder.id } });
      if (existing) { results.push(`SKIP event: ${def.title}`); continue; }

      const startDate = new Date(Date.now() + def.daysAhead * 86400000);
      const event = await db.event.create({
        data: {
          title: def.title,
          description: def.description,
          category: def.category,
          isVirtual: def.isVirtual,
          location: def.location || '',
          meetLink: def.meetLink || '',
          tokenCost: def.tokenCost,
          startDate,
          endDate: new Date(startDate.getTime() + 14400000),
          maxAttendees: def.isVirtual ? 100 : 50,
          creatorId: founder.id,
        },
      });
      eventsCreated++;

      const statuses = ['going', 'interested', 'maybe'];
      for (let i = 0; i < Math.min(3, otherUsers.length); i++) {
        try {
          await db.eventRSVP.create({
            data: { eventId: event.id, userId: otherUsers[i].id, status: statuses[i % 3] },
          });
        } catch (e: any) { if (!e.message?.includes('Unique')) results.push(`RSVP error: ${e.message}`); }
      }
      results.push(`CREATED event: ${def.title}`);
    }

    // === SUBSCRIBER TIERS ===
    const tierDefs = [
      { creatorId: founder.id, tierName: 'Exclusive Access', price: 50, description: 'Get exclusive content and behind-the-scenes access', perks: ['Exclusive posts', 'Early access', 'Custom badge'] },
      { creatorId: otherUsers[1]?.id, tierName: 'VIP Creator', price: 100, description: 'Premium tier with all perks and direct access', perks: ['All Exclusive perks', '1-on-1 chat', 'Monthly shoutout', 'VIP badge'] },
      { creatorId: otherUsers[2]?.id, tierName: 'Supporter', price: 25, description: 'Support your favorite creator and get a badge', perks: ['Supporter badge', 'Exclusive updates'] },
    ];

    let tiersCreated = 0;
    for (const def of tierDefs) {
      if (!def.creatorId) continue;
      const existing = await db.subscriberTier.findUnique({ where: { creatorId: def.creatorId } });
      if (existing) { results.push(`SKIP tier: ${def.tierName}`); continue; }

      await db.subscriberTier.create({
        data: {
          creatorId: def.creatorId,
          tierName: def.tierName,
          price: def.price,
          description: def.description,
          perks: JSON.stringify(def.perks),
          isActive: true,
        },
      });
      tiersCreated++;
      results.push(`CREATED tier: ${def.tierName}`);
    }

    // === COLLECTIONS ===
    const collectionDefs = [
      { name: 'Favorites', description: 'My favorite posts on ORRA', isPrivate: false },
      { name: 'Inspiration', description: 'Posts that inspire me daily', isPrivate: false },
      { name: 'Private Notes', description: 'Personal bookmarks', isPrivate: true },
    ];

    let collectionsCreated = 0;
    for (const def of collectionDefs) {
      const existing = await db.collection.findFirst({ where: { name: def.name, userId: founder.id } });
      if (existing) { results.push(`SKIP collection: ${def.name}`); continue; }

      const collection = await db.collection.create({
        data: { name: def.name, description: def.description, isPrivate: def.isPrivate, userId: founder.id },
      });
      collectionsCreated++;

      const postsToAdd = posts.slice(0, def.name === 'Favorites' ? 4 : def.name === 'Inspiration' ? 3 : 2);
      for (const post of postsToAdd) {
        try {
          await db.collectionItem.create({ data: { collectionId: collection.id, postId: post.id } });
        } catch (e: any) { if (!e.message?.includes('Unique')) results.push(`Collection item error: ${e.message}`); }
      }
      results.push(`CREATED collection: ${def.name} (${postsToAdd.length} items)`);
    }

    // === SCHEDULED POSTS ===
    const scheduledDefs = [
      { text: 'Monday motivation: Every expert was once a beginner. Keep going! 🔥', hoursAhead: 1 },
      { text: 'New music dropping this Friday at midnight. Set your alarms! 🎵', hoursAhead: 24 },
      { text: 'Weekly recap: Top moments from the ORRA community this week. Stay tuned! 👀', hoursAhead: 168 },
    ];

    let scheduledCreated = 0;
    for (const def of scheduledDefs) {
      const existing = await db.scheduledPost.findFirst({ where: { text: def.text, authorId: founder.id } });
      if (existing) { results.push(`SKIP scheduled: ${def.text.substring(0, 30)}...`); continue; }

      await db.scheduledPost.create({
        data: { text: def.text, authorId: founder.id, scheduledAt: new Date(Date.now() + def.hoursAhead * 3600000), vibeTag: 'hyped', isPublished: false },
      });
      scheduledCreated++;
      results.push(`CREATED scheduled: "${def.text.substring(0, 30)}..." in ${def.hoursAhead}h`);
    }

    // === CLOSE FRIENDS ===
    let friendsAdded = 0;
    for (let i = 0; i < Math.min(4, otherUsers.length); i++) {
      try {
        await db.closeFriend.create({ data: { userId: founder.id, friendId: otherUsers[i].id } });
        friendsAdded++;
        results.push(`ADDED close friend: ${otherUsers[i].name}`);
      } catch (e: any) {
        if (e.message?.includes('Unique')) results.push(`SKIP close friend: ${otherUsers[i].name} (exists)`);
      }
    }

    // === PINNED POSTS ===
    let pinnedCreated = 0;
    const ownPosts = posts.filter(p => p.authorId === founder.id);
    const postsToPin = ownPosts.length >= 2 ? ownPosts.slice(0, 2) : posts.slice(0, 2);
    for (const post of postsToPin) {
      try {
        await db.pinnedPost.create({ data: { userId: founder.id, postId: post.id } });
        pinnedCreated++;
        results.push(`PINNED post: "${post.text.substring(0, 40)}..."`);
      } catch (e: any) {
        if (e.message?.includes('Unique')) results.push(`SKIP pin: already pinned`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: { eventsCreated, tiersCreated, collectionsCreated, scheduledCreated, friendsAdded, pinnedCreated },
      results,
    });
  } catch (error: any) {
    console.error('Seed features error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Seed failed' }, { status: 500 });
  }
}
