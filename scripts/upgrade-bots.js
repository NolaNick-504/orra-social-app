#!/usr/bin/env node
/**
 * ORRA Bot Profile Upgrade Script
 * 
 * Upgrades all bot users with realistic profiles:
 * - Bios that sound like real people
 * - Real locations
 * - Websites/links
 * - Cover images
 * - Adds 8 new bot users for feed density (24 total)
 * 
 * Run: node scripts/upgrade-bots.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

const SALT_ROUNDS = 12;

// ============================================================
// COMPLETE BOT PROFILES — realistic humans with personality
// ============================================================
const BOT_PROFILES = {
  // --- EXISTING 16 BOTS (upgraded) ---
  'u1': {
    name: 'Jessica Art',
    handle: 'jessart',
    bio: 'Painter & illustrator | Obsessed with color theory | My studio is my happy place | Commissions open',
    location: 'Portland, OR',
    website: 'orra.link/jessart',
    verified: true,
    online: true,
  },
  'u2': {
    name: 'David Chen',
    handle: 'davchen',
    bio: 'Software engineer by day, homelab nerd by night | Rust enthusiast | Building things that scale',
    location: 'Seattle, WA',
    website: 'github.com/davchen',
    verified: false,
    online: true,
  },
  'u3': {
    name: 'Sarah Kim',
    handle: 'sarahkim',
    bio: 'Personal trainer & yoga instructor | Meal prep obsessed | Training for my first marathon',
    location: 'Austin, TX',
    website: 'orra.link/sarahkim',
    verified: false,
    online: true,
  },
  'u4': {
    name: 'Marcus Rivera',
    handle: 'marcusr',
    bio: 'Community organizer & musician | Hip hop is my first language | Building from the ground up',
    location: 'Detroit, MI',
    website: 'orra.link/marcusr',
    verified: true,
    online: true,
  },
  'u5': {
    name: 'Elena Rodriguez',
    handle: 'elenarod',
    bio: 'Abuela recipes > everything | Book club founder | Slow living advocate | Garden is my therapy',
    location: 'San Antonio, TX',
    website: '',
    verified: false,
    online: false,
  },
  'u6': {
    name: 'Tech Daily',
    handle: 'techdaily',
    bio: 'Breaking down the tech that matters | Former SWE at big tech | Now I just write about it',
    location: 'San Francisco, CA',
    website: 'orra.link/techdaily',
    verified: true,
    online: true,
  },
  'u7': {
    name: 'Wellness Guru',
    handle: 'wellnessg',
    bio: 'Certified yoga instructor | Breathwork & meditation guide | Your mental health matters more than your productivity',
    location: 'Sedona, AZ',
    website: 'orra.link/wellnessg',
    verified: true,
    online: false,
  },
  'u8': {
    name: 'Cyber Drifter',
    handle: 'cyberdrift',
    bio: 'Digital artist & retro gamer | Neon aesthetics | If it glows I probably want it',
    location: 'Tokyo, JP',
    website: '',
    verified: false,
    online: true,
  },
  'u9': {
    name: 'Music Central',
    handle: 'musiccentral',
    bio: 'Music journalist & vinyl collector | 500+ records and counting | Every genre deserves a listen',
    location: 'Nashville, TN',
    website: 'orra.link/musiccentral',
    verified: true,
    online: false,
  },
  'u10': {
    name: 'Luna Sky',
    handle: 'lunasky',
    bio: 'Poet & photographer | Chasing light and meaning | The stars always have something to say',
    location: 'Asheville, NC',
    website: 'orra.link/lunasky',
    verified: true,
    online: true,
  },
  'u11': {
    name: 'Kai Storm',
    handle: 'kaistorm',
    bio: 'Rock climber & adventure seeker | If it scares me I probably need to do it | Patagonia is next',
    location: 'Boulder, CO',
    website: '',
    verified: false,
    online: true,
  },
  'u12': {
    name: 'Nova Blaze',
    handle: 'novablaze',
    bio: 'Streetwear designer | Sneaker head before it was cool | My closet is a museum',
    location: 'Miami, FL',
    website: 'orra.link/novablaze',
    verified: false,
    online: true,
  },
  'u13': {
    name: 'Zara Miles',
    handle: 'zaramiles',
    bio: 'Fashion & lifestyle | NYC to LA | Living out loud and styling every moment',
    location: 'Los Angeles, CA',
    website: 'orra.link/zaramiles',
    verified: true,
    online: true,
  },
  'u14': {
    name: 'Jay Parker',
    handle: 'jayparker',
    bio: 'Gamer & streamer | Competitive FPS | Catch me live on ORRA Prism',
    location: 'Atlanta, GA',
    website: 'orra.link/jayparker',
    verified: false,
    online: true,
  },
  'u15': {
    name: 'Maya Chen',
    handle: 'mayachen',
    bio: 'Environmental scientist | Fighting for a livable future | Data over opinions',
    location: 'San Francisco, CA',
    website: 'orra.link/mayachen',
    verified: true,
    online: false,
  },
  'u16': {
    name: 'Dre Williams',
    handle: 'drewilliams',
    bio: 'Music producer & DJ | Beats that move the culture | ORRA Dance Off judge',
    location: 'Chicago, IL',
    website: 'orra.link/drewilliams',
    verified: true,
    online: true,
  },

  // --- 8 NEW BOTS ---
  'u17': {
    name: 'Amara Okafor',
    handle: 'amarao',
    bio: 'Documentary filmmaker | Telling stories that matter | Lagos → Brooklyn | Currently editing my 3rd film',
    location: 'Brooklyn, NY',
    website: 'orra.link/amarao',
    verified: true,
    online: true,
    avatar: '/api/uploads?path=images/avatars/amara-avatar.jpg',
  },
  'u18': {
    name: 'Riley Park',
    handle: 'rileypark',
    bio: 'Barista by morning, writer by night | Working on my first novel | Coffee is a love language',
    location: 'Minneapolis, MN',
    website: '',
    verified: false,
    online: true,
    avatar: '/api/uploads?path=images/avatars/riley-avatar.jpg',
  },
  'u19': {
    name: 'Sofia Reyes',
    handle: 'sofiareyes',
    bio: 'Nursing student | Plant mom | Trying to survive clinicals one coffee at a time',
    location: 'Houston, TX',
    website: '',
    verified: false,
    online: false,
    avatar: '/api/uploads?path=images/avatars/sofia-avatar.jpg',
  },
  'u20': {
    name: 'Jake Morrison',
    handle: 'jakemorrison',
    bio: 'High school football coach | Dad of 3 | Faith first | Building young men on and off the field',
    location: 'Dallas, TX',
    website: '',
    verified: false,
    online: false,
    avatar: '/api/uploads?path=images/avatars/jake-avatar.jpg',
  },
  'u21': {
    name: 'Priya Sharma',
    handle: 'priyasharma',
    bio: 'Data scientist at a startup | Bollywood dance team captain | Spices run in my blood',
    location: 'Boston, MA',
    website: 'orra.link/priyasharma',
    verified: true,
    online: true,
    avatar: '/api/uploads?path=images/avatars/priya-avatar.jpg',
  },
  'u22': {
    name: 'Chris Taylor',
    handle: 'christaylor',
    bio: 'Mechanic who codes | Cars & computers | Self-taught everything | Trust the process',
    location: 'Phoenix, AZ',
    website: '',
    verified: false,
    online: true,
    avatar: '/api/uploads?path=images/avatars/chris-avatar.jpg',
  },
  'u23': {
    name: 'Nia Washington',
    handle: 'niawash',
    bio: 'Hairstylist & salon owner | Making people feel beautiful since 2018 | Black girl magic',
    location: 'Charlotte, NC',
    website: 'orra.link/niawash',
    verified: true,
    online: true,
    avatar: '/api/uploads?path=images/avatars/nia-avatar.jpg',
  },
  'u24': {
    name: 'Leo Kim',
    handle: 'leokim',
    bio: 'Architecture student | Minimalist design enthusiast | Skating is my meditation | Cat dad',
    location: 'Los Angeles, CA',
    website: '',
    verified: false,
    online: true,
    avatar: '/api/uploads?path=images/avatars/leo-avatar.jpg',
  },
};

async function main() {
  console.log('🚀 Upgrading bot profiles...\n');

  // 1. Update existing bots
  for (const [id, profile] of Object.entries(BOT_PROFILES)) {
    try {
      const existing = await db.user.findUnique({ where: { id } });
      if (existing) {
        await db.user.update({
          where: { id },
          data: {
            bio: profile.bio,
            location: profile.location,
            website: profile.website,
            verified: profile.verified,
            online: profile.online,
            profileSetupComplete: true,
          },
        });
        console.log(`✅ Updated ${profile.name} (@${profile.handle})`);
      } else {
        // New bot — create
        const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
        await db.user.create({
          data: {
            id,
            name: profile.name,
            handle: profile.handle,
            email: profile.handle + '@orra.app',
            password: hashedPassword,
            bio: profile.bio,
            location: profile.location,
            website: profile.website,
            verified: profile.verified,
            online: profile.online,
            avatar: profile.avatar || `/api/uploads?path=images/avatars/default-avatar.jpg`,
            coverImage: '/images/profile-cover.png',
            profileSetupComplete: true,
            auraTokens: Math.floor(Math.random() * 300) + 50,
            auraLevel: Math.floor(Math.random() * 4) + 1,
            auraXP: Math.floor(Math.random() * 500) + 50,
          },
        });
        console.log(`✅ Created ${profile.name} (@${profile.handle})`);
      }
    } catch (err) {
      console.error(`❌ Error with ${profile.name}:`, err.message);
    }
  }

  // 2. Create some follow relationships for new bots
  console.log('\nCreating follow relationships for new bots...');
  const newBotIds = ['u17', 'u18', 'u19', 'u20', 'u21', 'u22', 'u23', 'u24'];
  const allBotIds = ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16', ...newBotIds];

  for (const newId of newBotIds) {
    // Each new bot follows 4-8 random other bots
    const numFollows = Math.floor(Math.random() * 5) + 4;
    const others = allBotIds.filter(id => id !== newId).sort(() => Math.random() - 0.5).slice(0, numFollows);

    for (const otherId of others) {
      try {
        await db.follow.create({ data: { followerId: newId, followingId: otherId } });
      } catch {} // Skip if duplicate
      try {
        // Make some mutual follows
        if (Math.random() < 0.5) {
          await db.follow.create({ data: { followerId: otherId, followingId: newId } });
        }
      } catch {}
    }
    console.log(`  ${BOT_PROFILES[newId].name} follows ${numFollows} users`);
  }

  // 3. Make existing bots follow some new bots too
  for (const existingId of ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16']) {
    const numNewFollows = Math.floor(Math.random() * 4) + 1;
    const toFollow = newBotIds.sort(() => Math.random() - 0.5).slice(0, numNewFollows);
    for (const nid of toFollow) {
      try {
        await db.follow.create({ data: { followerId: existingId, followingId: nid } });
      } catch {}
    }
  }

  console.log('\n✅ Bot profile upgrade complete!');
  const totalUsers = await db.user.count();
  console.log(`Total users in database: ${totalUsers}`);

  await db.$disconnect();
}

main().catch(console.error);
