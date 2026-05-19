#!/usr/bin/env node
/**
 * Seed 15 new bot users (u32-u46) with unique personalities, bios.
 * Step 1 only: Create users in DB + follow relationships (no image generation)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NEW_BOTS = [
  { id: 'u32', name: 'Zara Kim', handle: 'zarafoto', email: 'zarafoto@orra.app', bio: 'Fashion photographer shooting style on the streets and runways. Every outfit tells a story and my lens is listening. Behind every great look is a greater moment.', location: 'New York, NY', verified: true, online: true },
  { id: 'u33', name: 'Mateo Cruz', handle: 'mateocruz', email: 'mateocruz@orra.app', bio: 'DJ and electronic music producer. Bass drops and sunsets. When the beat hits right nothing else matters. Festival season is always.', location: 'Miami, FL', verified: true, online: true },
  { id: 'u34', name: 'Trinity Hayes', handle: 'trinityhayes', email: 'trinityhayes@orra.app', bio: 'Astrophysics grad student who moonlights as a science communicator. Black holes and big dreams. The universe is wild and so am I.', location: 'Cambridge, MA', verified: false, online: true },
  { id: 'u35', name: 'Oscar Reyes', handle: 'oscarreyes', email: 'oscarreyes@orra.app', bio: 'Tattoo artist and illustrator. Skin is my canvas and ink is my truth. Every piece has a story behind it. Book your session DMs open.', location: 'Austin, TX', verified: true, online: true },
  { id: 'u36', name: 'Yasmin Patel', handle: 'yasminpatel', email: 'yasminpatel@orra.app', bio: 'Certified yoga instructor and breathwork guide. Find your center and the world makes sense. Stillness is a superpower. Namaste but make it real.', location: 'Sedona, AZ', verified: true, online: false },
  { id: 'u37', name: 'Brooklyn Taylor', handle: 'brooklyntaylor', email: 'brooklyntaylor@orra.app', bio: 'Content creator and vlogger documenting the journey. Real life unfiltered. Behind the scenes of everything. Your favorite creators favorite creator.', location: 'Los Angeles, CA', verified: true, online: true },
  { id: 'u38', name: 'Hakeem Wright', handle: 'hakeemwright', email: 'hakeemwright@orra.app', bio: 'Basketball skills trainer and former college hooper. Developing the next generation of ballers. Fundamentals win championships. The gym is home.', location: 'Chicago, IL', verified: false, online: true },
  { id: 'u39', name: 'Sienna Blake', handle: 'siennablake', email: 'siennablake@orra.app', bio: 'Interior designer making spaces feel like home. Vintage meets modern. Your space should tell your story. Good design changes everything.', location: 'Nashville, TN', verified: true, online: true },
  { id: 'u40', name: 'Theo Kim', handle: 'theokim', email: 'theokim@orra.app', bio: 'Specialty coffee roaster and café owner. Life is too short for bad coffee. From bean to cup every sip matters. Third wave or nothing.', location: 'Portland, OR', verified: false, online: true },
  { id: 'u41', name: 'Naomi Cruz', handle: 'naomicruz', email: 'naomicruz@orra.app', bio: 'Drag performer and visual artist. Glamour is my weapon and the stage is my battlefield. Art is resistance. Love wins always.', location: 'San Francisco, CA', verified: true, online: true },
  { id: 'u42', name: 'Finn OSullivan', handle: 'finnosullivan', email: 'finnosullivan@orra.app', bio: 'Surf instructor and ocean advocate. Saltwater runs through my veins. The best waves are the ones you share. Keep the ocean clean and the vibes high.', location: 'Honolulu, HI', verified: false, online: true },
  { id: 'u43', name: 'Amara Okafor', handle: 'amaraokafor', email: 'amaraokafor@orra.app', bio: 'Documentary filmmaker telling stories that matter. Every person has a story worth telling. The camera is my voice and truth is my compass.', location: 'Washington, DC', verified: true, online: true },
  { id: 'u44', name: 'Jax Rivera', handle: 'jaxrivera', email: 'jaxrivera@orra.app', bio: 'Graffiti artist and muralist turning walls into galleries. Art belongs to everyone. The streets are my museum and color is my language.', location: 'Philadelphia, PA', verified: false, online: true },
  { id: 'u45', name: 'Mina Sato', handle: 'minasato', email: 'minasato@orra.app', bio: 'Pastry chef and baking enthusiast. Sugar is my love language. Every dessert is a tiny masterpiece. Life is sweet when you make it from scratch.', location: 'Seattle, WA', verified: true, online: false },
  { id: 'u46', name: 'DJ Remix', handle: 'djremix', email: 'djremix@orra.app', bio: 'Podcast host and pop culture commentator. Hot takes served fresh daily. Conversation is an art form. Every opinion has a story behind it.', location: 'Atlanta, GA', verified: true, online: true },
];

async function main() {
  console.log(`\n🤖 Seeding ${NEW_BOTS.length} new bot users (u32-u46)...\n`);
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

  // Step 2: Follow relationships — follow founder
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

  // Follow existing bots (u1-u31)
  const existingIds = Array.from({ length: 31 }, (_, i) => `u${i + 1}`);
  for (const bot of NEW_BOTS) {
    const shuffled = [...existingIds].sort(() => Math.random() - 0.5);
    const cnt = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cnt && i < shuffled.length; i++) {
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: bot.id, followingId: shuffled[i] } },
          update: {}, create: { followerId: bot.id, followingId: shuffled[i] },
        });
      } catch (e) {}
    }
    // Follow other new bots
    const others = NEW_BOTS.filter(b => b.id !== bot.id).sort(() => Math.random() - 0.5);
    const cnt2 = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cnt2 && i < others.length; i++) {
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: bot.id, followingId: others[i].id } },
          update: {}, create: { followerId: bot.id, followingId: others[i].id },
        });
      } catch (e) {}
    }
  }

  // Reciprocal follows from some existing bots
  for (const eid of existingIds) {
    const rBots = [...NEW_BOTS].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));
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
