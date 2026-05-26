#!/usr/bin/env node
/**
 * Seed bots u17-u46 into the ORRA database.
 * These accounts were never created in the DB despite having avatars and
 * personality definitions in auto-poster.js / update-bots.js.
 *
 * Run: node scripts/seed-bots-u17-u46.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const BOTS = {
  u17: { name: 'Rico Vega', handle: 'ricovega', email: 'ricovega@orra.app', avatar: '/api/uploads?path=images/avatars/u17-ricovega.jpg', bio: 'Street photographer capturing the raw beauty of urban life. Every corner tells a story if you know where to look', location: 'Chicago, IL', verified: true },
  u18: { name: 'Aria Moon', handle: 'ariamoon', email: 'ariamoon@orra.app', avatar: '/api/uploads?path=images/avatars/u18-ariamoon.jpg', bio: 'Singer-songwriter weaving melodies from moonlight. Music is my therapy and my rebellion', location: 'Nashville, TN', verified: true },
  u19: { name: 'Jake Torres', handle: 'jaketorres', email: 'jaketorres@orra.app', avatar: '/api/uploads?path=images/avatars/u19-jaketorres.jpg', bio: 'Skater, filmmaker, adrenaline junkie. If it goes fast Im on it', location: 'Los Angeles, CA', verified: true },
  u20: { name: 'Nia Brooks', handle: 'niabrooks', email: 'niabrooks@orra.app', avatar: '/api/uploads?path=images/avatars/u20-niabrooks.jpg', bio: 'Fashion designer blending African prints with modern streetwear. Culture is always in style', location: 'Atlanta, GA', verified: true },
  u21: { name: 'Sam Park', handle: 'sampark', email: 'sampark@orra.app', avatar: '/api/uploads?path=images/avatars/u21-sampark.jpg', bio: 'Indie game dev by day, pixel artist by night. Creating worlds one pixel at a time', location: 'Seattle, WA', verified: true },
  u22: { name: 'Priya Sharma', handle: 'priyasharma', email: 'priyasharma@orra.app', avatar: '/api/uploads?path=images/avatars/u22-priyasharma.jpg', bio: 'Data scientist who loves turning chaos into clarity. Charts are my love language', location: 'San Francisco, CA', verified: true },
  u23: { name: 'Miles Jackson', handle: 'milesjackson', email: 'milesjackson@orra.app', avatar: '/api/uploads?path=images/avatars/u23-milesjackson.jpg', bio: 'Jazz musician keeping the groove alive. The trumpet doesnt lie', location: 'New Orleans, LA', verified: true },
  u24: { name: 'Chloe Bennett', handle: 'chloebennett', email: 'chloebennett@orra.app', avatar: '/api/uploads?path=images/avatars/u24-chloebennett.jpg', bio: 'Travel blogger exploring hidden gems around the world. The best stories are off the beaten path', location: 'Denver, CO', verified: true },
  u25: { name: 'Dex Carter', handle: 'dexcarter', email: 'dexcarter@orra.app', avatar: '/api/uploads?path=images/avatars/u25-dexcarter.jpg', bio: 'Hip-hop producer and beatmaker. The studio is my sanctuary', location: 'Atlanta, GA', verified: true },
  u26: { name: 'Lily Tran', handle: 'lilytran', email: 'lilytran@orra.app', avatar: '/api/uploads?path=images/avatars/u26-lilytran.jpg', bio: 'Plant mom and sustainable living advocate. Green thumb green heart', location: 'Portland, OR', verified: true },
  u27: { name: 'Tyler Reed', handle: 'tylerreed', email: 'tylerreed@orra.app', avatar: '/api/uploads?path=images/avatars/u27-tylerreed.jpg', bio: 'Sports analyst and fantasy league champion. Stats dont lie but they do surprise', location: 'Boston, MA', verified: true },
  u28: { name: 'Rosa Gutierrez', handle: 'rosagutierrez', email: 'rosagutierrez@orra.app', avatar: '/api/uploads?path=images/avatars/u28-rosagutierrez.jpg', bio: 'Muralist and community organizer. Art belongs to everyone', location: 'San Antonio, TX', verified: true },
  u29: { name: 'Kai Nakamura', handle: 'kainakamura', email: 'kainakamura@orra.app', avatar: '/api/uploads?path=images/avatars/u29-kainakamura.jpg', bio: 'Anime artist and cosplay creator. Living between 2D and 3D worlds', location: 'San Jose, CA', verified: true },
  u30: { name: 'DeShawn Harris', handle: 'deshawnharris', email: 'deshawnharris@orra.app', avatar: '/api/uploads?path=images/avatars/u30-deshawnharris.jpg', bio: 'Personal trainer and nutrition coach. Your body is your greatest investment', location: 'Miami, FL', verified: true },
  u31: { name: 'Isla Murphy', handle: 'islamurphy', email: 'islamurphy@orra.app', avatar: '/api/uploads?path=images/avatars/u31-islamurphy.jpg', bio: 'Marine biologist and ocean conservationist. Save the oceans save ourselves', location: 'Monterey, CA', verified: true },
  u32: { name: 'Zara Kim', handle: 'zarafoto', email: 'zarafoto@orra.app', avatar: '/api/uploads?path=images/avatars/u32-zarafoto.jpg', bio: 'Fashion photographer with an eye for the avant-garde. Style is a statement not a trend', location: 'New York, NY', verified: true },
  u33: { name: 'Mateo Cruz', handle: 'mateocruz', email: 'mateocruz@orra.app', avatar: '/api/uploads?path=images/avatars/u33-mateocruz.jpg', bio: 'Graffiti artist turned gallery sensation. From walls to museums same energy different canvas', location: 'Brooklyn, NY', verified: true },
  u34: { name: 'Trinity Hayes', handle: 'trinityhayes', email: 'trinityhayes@orra.app', avatar: '/api/uploads?path=images/avatars/u34-trinityhayes.jpg', bio: 'Spoken word poet and activist. Words are weapons use them wisely', location: 'Oakland, CA', verified: true },
  u35: { name: 'Oscar Reyes', handle: 'oscarreyes', email: 'oscarreyes@orra.app', avatar: '/api/uploads?path=images/avatars/u35-oscarreyes.jpg', bio: 'Chef fusing Latin flavors with Asian technique. Food has no borders', location: 'Austin, TX', verified: true },
  u36: { name: 'Yasmin Patel', handle: 'yasminpatel', email: 'yasminpatel@orra.app', avatar: '/api/uploads?path=images/avatars/u36-yasminpatel.jpg', bio: 'Documentary filmmaker telling untold stories. The truth deserves a spotlight', location: 'Washington, DC', verified: true },
  u37: { name: 'Brooklyn Taylor', handle: 'brooklyntaylor', email: 'brooklyntaylor@orra.app', avatar: '/api/uploads?path=images/avatars/u37-brooklyntaylor.jpg', bio: 'Dance choreographer and TikTok sensation. Movement is the universal language', location: 'Los Angeles, CA', verified: true },
  u38: { name: 'Hakeem Wright', handle: 'hakeemwright', email: 'hakeemwright@orra.app', avatar: '/api/uploads?path=images/avatars/u38-hakeemwright.jpg', bio: 'Barber and community mentor. Fresh fades and real talk thats the vibe', location: 'Philadelphia, PA', verified: true },
  u39: { name: 'Sienna Blake', handle: 'siennablake', email: 'siennablake@orra.app', avatar: '/api/uploads?path=images/avatars/u39-siennablake.jpg', bio: 'Interior designer with a maximalist soul. More is more and I stand by it', location: 'Dallas, TX', verified: true },
  u40: { name: 'Theo Kim', handle: 'theokim', email: 'theokim@orra.app', avatar: '/api/uploads?path=images/avatars/u40-theokim.jpg', bio: 'Stand-up comedian and podcast host. If youre not laughing youre not living', location: 'Chicago, IL', verified: true },
  u41: { name: 'Naomi Cruz', handle: 'naomicruz', email: 'naomicruz@orra.app', avatar: '/api/uploads?path=images/avatars/u41-naomicruz.jpg', bio: 'Makeup artist and beauty influencer. Your face is a canvas own it', location: 'Miami, FL', verified: true },
  u42: { name: 'Finn OSullivan', handle: 'finnosullivan', email: 'finnosullivan@orra.app', avatar: '/api/uploads?path=images/avatars/u42-finnosullivan.jpg', bio: 'Surfer and environmental activist. Ride the waves protect the ocean', location: 'San Diego, CA', verified: true },
  u43: { name: 'Amara Okafor', handle: 'amaraokafor', email: 'amaraokafor@orra.app', avatar: '/api/uploads?path=images/avatars/u43-amaraokafor.jpg', bio: 'Afrobeats dancer and cultural ambassador. The rhythm is in my blood', location: 'Houston, TX', verified: true },
  u44: { name: 'Jax Rivera', handle: 'jaxrivera', email: 'jaxrivera@orra.app', avatar: '/api/uploads?path=images/avatars/u44-jaxrivera.jpg', bio: 'MMA fighter and mindset coach. Discipline beats motivation every time', location: 'Las Vegas, NV', verified: true },
  u45: { name: 'Mina Sato', handle: 'minasato', email: 'minasato@orra.app', avatar: '/api/uploads?path=images/avatars/u45-minasato.jpg', bio: 'Pastry chef and food stylist. Life is sweet make it sweeter', location: 'San Francisco, CA', verified: true },
  u46: { name: 'DJ Remix', handle: 'djremix', email: 'djremix@orra.app', avatar: '/api/uploads?path=images/avatars/u46-djremix.jpg', bio: 'Club DJ and music curator. The turntables never lie', location: 'Las Vegas, NV', verified: true },
};

async function main() {
  console.log('Seeding bots u17-u46 into database...\n');

  // Use the same password hash as existing bots for consistency
  const existingBot = await prisma.user.findUnique({ where: { id: 'u1' } });
  const passwordHash = existingBot ? existingBot.password : '$2b$12$w.bYKznW5ka6594rCEMGR.9CyhT2cg5em1.ZKkRpj4gffzQBEGueS';

  let created = 0;
  let skipped = 0;

  for (const [id, data] of Object.entries(BOTS)) {
    try {
      // Check if already exists
      const existing = await prisma.user.findUnique({ where: { id } });
      if (existing) {
        console.log(`  SKIP ${id} (@${data.handle}) — already exists`);
        skipped++;
        continue;
      }

      await prisma.user.create({
        data: {
          id,
          email: data.email,
          name: data.name,
          handle: `@${data.handle}`,
          password: passwordHash,
          avatar: data.avatar,
          coverImage: '/api/uploads?path=images/profile-cover.png',
          bio: data.bio,
          location: data.location,
          website: '',
          verified: data.verified,
          online: Math.random() > 0.3,
          lastSeen: new Date(),
          auraTokens: Math.floor(Math.random() * 500) + 100,
          auraLevel: Math.floor(Math.random() * 5) + 1,
          auraXP: Math.floor(Math.random() * 500) + 50,
          dailyStreak: Math.floor(Math.random() * 15),
          lastActiveDate: new Date().toISOString().split('T')[0],
          badges: '[]',
          profileSetupComplete: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });
      console.log(`  CREATED ${id} — ${data.name} (@${data.handle})`);
      created++;
    } catch (err) {
      console.error(`  FAILED ${id}: ${err.message}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);

  // Verify total count
  const totalUsers = await prisma.user.count();
  console.log(`Total users in database: ${totalUsers}`);

  // List all bots
  const allBots = await prisma.user.findMany({
    where: { id: { startsWith: 'u' } },
    select: { id: true, name: true, handle: true },
    orderBy: { id: 'asc' },
  });
  console.log(`\nAll ${allBots.length} bot accounts:`);
  allBots.forEach(b => console.log(`  ${b.id}: ${b.name} (${b.handle})`));

  await prisma.$disconnect();
}

main().catch(console.error);
