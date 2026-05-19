#!/usr/bin/env node
/**
 * Seed 15 new bot users (u17-u31) with unique personalities, bios.
 * Step 1 only: Create users in DB + follow relationships (no image generation)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NEW_BOTS = [
  { id: 'u17', name: 'Rico Vega', handle: 'ricovega', email: 'ricovega@orra.app', bio: 'Street photographer capturing the raw and real. Every corner tells a story if you know where to look. Lens always loaded, eyes always open.', location: 'Chicago, IL', verified: true, online: true },
  { id: 'u18', name: 'Aria Moon', handle: 'ariamoon', email: 'ariamoon@orra.app', bio: 'Singer-songwriter making music from the heart. Acoustic sessions at 2am are my therapy. Every song is a piece of my soul you get to keep.', location: 'Nashville, TN', verified: true, online: true },
  { id: 'u19', name: 'Jake Torres', handle: 'jaketorres', email: 'jaketorres@orra.app', bio: 'Skater and filmmaker. If I am not on a board I am behind a camera. Documenting the culture one clip at a time. Stay gritty stay real.', location: 'Los Angeles, CA', verified: false, online: true },
  { id: 'u20', name: 'Nia Brooks', handle: 'niabrooks', email: 'niabrooks@orra.app', bio: 'Dance is my first language. Choreographer and movement director. The body says what words cannot. Every routine is a conversation with the universe.', location: 'Atlanta, GA', verified: true, online: false },
  { id: 'u21', name: 'Sam Park', handle: 'sampark', email: 'sampark@orra.app', bio: 'Indie game dev building worlds one pixel at a time. Currently making the game I always wanted to play. Code by day, pixels by night.', location: 'Seattle, WA', verified: false, online: true },
  { id: 'u22', name: 'Priya Sharma', handle: 'priyasharma', email: 'priyasharma@orra.app', bio: 'Spice is life. Indian cuisine ambassador sharing recipes from my grandmother kitchen. Food is love made visible. Every dish has a story.', location: 'Houston, TX', verified: true, online: true },
  { id: 'u23', name: 'Miles Jackson', handle: 'milesjackson', email: 'milesjackson@orra.app', bio: 'Jazz saxophonist by night, data scientist by day. The overlap between music and math is where the magic happens. Coltrane is my religion.', location: 'New Orleans, LA', verified: true, online: false },
  { id: 'u24', name: 'Chloe Bennett', handle: 'chloebennett', email: 'chloebennett@orra.app', bio: 'Plant mom with 200+ babies and counting. Interior stylist specializing in biophilic design. Green spaces make better places.', location: 'Portland, OR', verified: false, online: true },
  { id: 'u25', name: 'Dex Carter', handle: 'dexcarter', email: 'dexcarter@orra.app', bio: 'Sneakerhead and streetwear collector. If it is limited I probably have it. The culture runs deeper than the shoes. Respect the game.', location: 'New York, NY', verified: true, online: true },
  { id: 'u26', name: 'Lily Tran', handle: 'lilytran', email: 'lilytran@orra.app', bio: 'Travel blogger who has been to 47 countries and counting. Home is wherever my passport takes me next. The world is too big to stay in one place.', location: 'San Francisco, CA', verified: true, online: true },
  { id: 'u27', name: 'Tyler Reed', handle: 'tylerreed', email: 'tylerreed@orra.app', bio: 'Stand-up comedian making people laugh for a living. If you are not laughing you are not living. Every crowd is a new opportunity to connect.', location: 'Austin, TX', verified: false, online: true },
  { id: 'u28', name: 'Rosa Gutierrez', handle: 'rosagutierrez', email: 'rosagutierrez@orra.app', bio: 'Makeup artist and beauty educator. Your face is my canvas. Teaching people to see their own beauty one tutorial at a time. Glow from within.', location: 'Miami, FL', verified: true, online: true },
  { id: 'u29', name: 'Kai Nakamura', handle: 'kainakamura', email: 'kainakamura@orra.app', bio: 'Anime and manga enthusiast. If it is animated I have probably watched it. The stories in anime hit harder than most live action. Subs over dubs always.', location: 'Honolulu, HI', verified: false, online: true },
  { id: 'u30', name: 'DeShawn Harris', handle: 'deshawnharris', email: 'deshawnharris@orra.app', bio: 'Barbershop owner and community builder. Every fade tells a story. The chair is my therapy couch. More than haircuts, this is about connection.', location: 'Detroit, MI', verified: true, online: false },
  { id: 'u31', name: 'Isla Murphy', handle: 'islamurphy', email: 'islamurphy@orra.app', bio: 'Environmental scientist fighting for the planet one post at a time. The ocean is my church, sustainability is my lifestyle. We only get one Earth.', location: 'Boulder, CO', verified: true, online: true },
];

async function main() {
  console.log(`\n🤖 Seeding ${NEW_BOTS.length} new bot users (u17-u31)...\n`);
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Step 1: Create bot users
  for (const bot of NEW_BOTS) {
    try {
      await prisma.user.upsert({
        where: { id: bot.id },
        update: {
          name: bot.name, handle: bot.handle, email: bot.email,
          password: hashedPassword, bio: bot.bio, location: bot.location,
          verified: bot.verified, online: bot.online, profileSetupComplete: true,
          auraTokens: 100 + Math.floor(Math.random() * 500),
          auraLevel: Math.floor(Math.random() * 15) + 3,
          auraXP: Math.floor(Math.random() * 800) + 50,
          avatar: `/api/uploads?path=images/avatars/u${bot.id.slice(1)}-${bot.handle}.jpg`,
          coverImage: '/api/uploads?path=images/profile-cover.png',
        },
        create: {
          id: bot.id, name: bot.name, handle: bot.handle, email: bot.email,
          password: hashedPassword, bio: bot.bio, location: bot.location,
          verified: bot.verified, online: bot.online, profileSetupComplete: true,
          auraTokens: 100 + Math.floor(Math.random() * 500),
          auraLevel: Math.floor(Math.random() * 15) + 3,
          auraXP: Math.floor(Math.random() * 800) + 50,
          avatar: `/api/uploads?path=images/avatars/u${bot.id.slice(1)}-${bot.handle}.jpg`,
          coverImage: '/api/uploads?path=images/profile-cover.png',
        },
      });
      console.log(`  ✅ ${bot.name} (@${bot.handle})`);
    } catch (err) {
      console.error(`  ❌ ${bot.id}: ${err.message}`);
    }
  }

  // Step 2: Follow relationships
  console.log('\n👥 Creating follow relationships...');
  const founder = await prisma.user.findFirst({ where: { handle: 'nickorraceo' }, select: { id: true } });

  if (founder) {
    for (const bot of NEW_BOTS) {
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: bot.id, followingId: founder.id } },
          update: {}, create: { followerId: bot.id, followingId: founder.id },
        });
      } catch (e) {}
    }
    console.log('  ✅ All new bots follow @nickorraceo');
  }

  // Follow existing bots and each other
  const existingIds = ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16'];
  for (const bot of NEW_BOTS) {
    const shuffled = existingIds.sort(() => Math.random() - 0.5);
    const cnt = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cnt; i++) {
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: bot.id, followingId: shuffled[i] } },
          update: {}, create: { followerId: bot.id, followingId: shuffled[i] },
        });
      } catch (e) {}
    }
    const others = NEW_BOTS.filter(b => b.id !== bot.id).sort(() => Math.random() - 0.5);
    const cnt2 = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cnt2; i++) {
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: bot.id, followingId: others[i].id } },
          update: {}, create: { followerId: bot.id, followingId: others[i].id },
        });
      } catch (e) {}
    }
  }

  // Reciprocal follows from existing bots
  for (const eid of existingIds) {
    const rBots = NEW_BOTS.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 4));
    for (const nb of rBots) {
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: eid, followingId: nb.id } },
          update: {}, create: { followerId: eid, followingId: nb.id },
        });
      } catch (e) {}
    }
  }
  console.log('  ✅ Follow relationships created');

  // Verify
  const bots = await prisma.user.findMany({
    where: { id: { in: NEW_BOTS.map(b => b.id) } },
    select: { id: true, name: true, handle: true, bio: true, verified: true },
  });
  console.log(`\n✅ ${bots.length}/${NEW_BOTS.length} new bots in database:`);
  bots.forEach(b => console.log(`  ${b.verified ? '✅' : '⬜'} ${b.name} (@${b.handle})`));

  await prisma.$disconnect();
}

main().catch(console.error);
