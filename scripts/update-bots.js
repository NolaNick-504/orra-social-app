#!/usr/bin/env node
/**
 * Update all 16 bot users with profile pictures and realistic bios.
 * Run once: node scripts/update-bots.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BOT_UPDATES = {
  u1: {
    name: 'Jessica Art',
    handle: 'jessart',
    avatar: '/api/uploads?path=images/avatars/u1-jessica-art.jpg',
    bio: 'Digital artist & creative soul. Paint strokes over heartbreaks. My canvas speaks louder than my words. Commissions open DM me.',
    location: 'Brooklyn, NY',
    verified: true,
    online: true,
  },
  u2: {
    name: 'David Chen',
    handle: 'davchen',
    avatar: '/api/uploads?path=images/avatars/u2-david-chen.jpg',
    bio: 'Software engineer by day, AI enthusiast by night. Building the future one commit at a time. Opinions are my own.',
    location: 'San Francisco, CA',
    verified: false,
    online: true,
  },
  u3: {
    name: 'Sarah Kim',
    handle: 'sarahkim',
    avatar: '/api/uploads?path=images/avatars/u3-sarah-kim.jpg',
    bio: 'Fashion forward, trend obsessed. If it is not on my feed it does not exist. Style is a way to say who you are without speaking.',
    location: 'Los Angeles, CA',
    verified: true,
    online: true,
  },
  u4: {
    name: 'Marcus Rivera',
    handle: 'marcusr',
    avatar: '/api/uploads?path=images/avatars/u4-marcus-rivera.jpg',
    bio: 'Athlete. Coach. Believer. The gym never lies to you. Every rep counts. Every day is game day. No excuses just results.',
    location: 'Miami, FL',
    verified: true,
    online: false,
  },
  u5: {
    name: 'Elena Rodriguez',
    handle: 'elenarod',
    avatar: '/api/uploads?path=images/avatars/u5-elena-rodriguez.jpg',
    bio: 'Wanderlust and recipes. Home is wherever the food takes me. Sharing my abuela secrets one post at a time. Life is too short for bad meals.',
    location: 'Austin, TX',
    verified: false,
    online: true,
  },
  u6: {
    name: 'Tech Daily',
    handle: 'techdaily',
    avatar: '/api/uploads?path=images/avatars/u6-tech-daily.jpg',
    bio: 'Your daily dose of tech news and analysis. Breaking stories before they break the internet. AI, startups, gadgets, and the future of everything.',
    location: 'Seattle, WA',
    verified: true,
    online: true,
  },
  u7: {
    name: 'Wellness Guru',
    handle: 'wellnessg',
    avatar: '/api/uploads?path=images/avatars/u7-wellness-guru.jpg',
    bio: 'Certified life coach & yoga instructor. Breathe in peace, breathe out stress. Your mental health matters. Gentle reminders for hard days.',
    location: 'Sedona, AZ',
    verified: true,
    online: false,
  },
  u8: {
    name: 'Cyber Drifter',
    handle: 'cyberdrift',
    avatar: '/api/uploads?path=images/avatars/u8-cyber-drifter.jpg',
    bio: 'Digital nomad navigating the chaos. Memes are my love language. In a society but not of it. The internet is my playground.',
    location: 'Everywhere',
    verified: false,
    online: true,
  },
  u9: {
    name: 'Music Central',
    handle: 'musiccentral',
    avatar: '/api/uploads?path=images/avatars/u9-music-central.jpg',
    bio: 'All music all the time. From vinyl to streaming, if it bumps I am on it. Concert reviews, album deep dives, and hot takes on the industry.',
    location: 'Nashville, TN',
    verified: true,
    online: true,
  },
  u10: {
    name: 'Luna Sky',
    handle: 'lunasky',
    avatar: '/api/uploads?path=images/avatars/u10-luna-sky.jpg',
    bio: 'Philosopher. Dreamer. Stargazer. Asking the questions nobody dares to ask. Art is the lie that enables us to realize the truth.',
    location: 'Portland, OR',
    verified: true,
    online: false,
  },
  u11: {
    name: 'Kai Storm',
    handle: 'kaistorm',
    avatar: '/api/uploads?path=images/avatars/u11-kai-storm.jpg',
    bio: 'Unapologetic. Bold takes only. Cultural critic and professional pot stirrer. I said what I said. Debate me if you want.',
    location: 'Atlanta, GA',
    verified: false,
    online: true,
  },
  u12: {
    name: 'Nova Blaze',
    handle: 'novablaze',
    avatar: '/api/uploads?path=images/avatars/u12-nova-blaze.jpg',
    bio: 'Competitive gamer. Ranked is life. Built different on the sticks. Esports or nothing. GG EZ. Catch me in the arena.',
    location: 'Las Vegas, NV',
    verified: false,
    online: true,
  },
  u13: {
    name: 'Zara Miles',
    handle: 'zaramiles',
    avatar: '/api/uploads?path=images/avatars/u13-zara-miles.jpg',
    bio: 'Social butterfly with impeccable taste. Fashion, events, and the good life. If I am not obsessed with it, it is not worth posting.',
    location: 'New York, NY',
    verified: true,
    online: true,
  },
  u14: {
    name: 'Jay Parker',
    handle: 'jayparker',
    avatar: '/api/uploads?path=images/avatars/u14-jay-parker.jpg',
    bio: 'Comedy is my cardio. Memes, anime, and questionable life choices. If you are not laughing you are not living. Professional joke machine.',
    location: 'Chicago, IL',
    verified: false,
    online: true,
  },
  u15: {
    name: 'Maya Chen',
    handle: 'mayachen',
    avatar: '/api/uploads?path=images/avatars/u15-maya-chen.jpg',
    bio: 'Home cook with restaurant dreams. Recipe drops weekly. Comfort food is my love language. Trust me on this, your taste buds will thank you.',
    location: 'San Diego, CA',
    verified: true,
    online: false,
  },
  u16: {
    name: 'Dre Williams',
    handle: 'drewilliams',
    avatar: '/api/uploads?path=images/avatars/u16-dre-williams.jpg',
    bio: 'Music producer & beat maker. In the lab cooking up something crazy. No cap the vibes are immaculate. Collabs open, hit my DMs.',
    location: 'Houston, TX',
    verified: true,
    online: true,
  },
  // ===== 15 NEW BOTS (u17-u31) =====
  u17: {
    name: 'Rico Vega',
    handle: 'ricovega',
    avatar: '/api/uploads?path=images/avatars/u17-ricovega.jpg',
    bio: 'Street photographer capturing the raw and real. Every corner tells a story if you know where to look. Lens always loaded, eyes always open.',
    location: 'Chicago, IL',
    verified: true,
    online: true,
  },
  u18: {
    name: 'Aria Moon',
    handle: 'ariamoon',
    avatar: '/api/uploads?path=images/avatars/u18-ariamoon.jpg',
    bio: 'Singer-songwriter making music from the heart. Acoustic sessions at 2am are my therapy. Every song is a piece of my soul you get to keep.',
    location: 'Nashville, TN',
    verified: true,
    online: true,
  },
  u19: {
    name: 'Jake Torres',
    handle: 'jaketorres',
    avatar: '/api/uploads?path=images/avatars/u19-jaketorres.jpg',
    bio: 'Skater and filmmaker. If I am not on a board I am behind a camera. Documenting the culture one clip at a time. Stay gritty stay real.',
    location: 'Los Angeles, CA',
    verified: false,
    online: true,
  },
  u20: {
    name: 'Nia Brooks',
    handle: 'niabrooks',
    avatar: '/api/uploads?path=images/avatars/u20-niabrooks.jpg',
    bio: 'Dance is my first language. Choreographer and movement director. The body says what words cannot. Every routine is a conversation with the universe.',
    location: 'Atlanta, GA',
    verified: true,
    online: false,
  },
  u21: {
    name: 'Sam Park',
    handle: 'sampark',
    avatar: '/api/uploads?path=images/avatars/u21-sampark.jpg',
    bio: 'Indie game dev building worlds one pixel at a time. Currently making the game I always wanted to play. Code by day, pixels by night.',
    location: 'Seattle, WA',
    verified: false,
    online: true,
  },
  u22: {
    name: 'Priya Sharma',
    handle: 'priyasharma',
    avatar: '/api/uploads?path=images/avatars/u22-priyasharma.jpg',
    bio: 'Spice is life. Indian cuisine ambassador sharing recipes from my grandmother kitchen. Food is love made visible. Every dish has a story.',
    location: 'Houston, TX',
    verified: true,
    online: true,
  },
  u23: {
    name: 'Miles Jackson',
    handle: 'milesjackson',
    avatar: '/api/uploads?path=images/avatars/u23-milesjackson.jpg',
    bio: 'Jazz saxophonist by night, data scientist by day. The overlap between music and math is where the magic happens. Coltrane is my religion.',
    location: 'New Orleans, LA',
    verified: true,
    online: false,
  },
  u24: {
    name: 'Chloe Bennett',
    handle: 'chloebennett',
    avatar: '/api/uploads?path=images/avatars/u24-chloebennett.jpg',
    bio: 'Plant mom with 200+ babies and counting. Interior stylist specializing in biophilic design. Green spaces make better places.',
    location: 'Portland, OR',
    verified: false,
    online: true,
  },
  u25: {
    name: 'Dex Carter',
    handle: 'dexcarter',
    avatar: '/api/uploads?path=images/avatars/u25-dexcarter.jpg',
    bio: 'Sneakerhead and streetwear collector. If it is limited I probably have it. The culture runs deeper than the shoes. Respect the game.',
    location: 'New York, NY',
    verified: true,
    online: true,
  },
  u26: {
    name: 'Lily Tran',
    handle: 'lilytran',
    avatar: '/api/uploads?path=images/avatars/u26-lilytran.jpg',
    bio: 'Travel blogger who has been to 47 countries and counting. Home is wherever my passport takes me next. The world is too big to stay in one place.',
    location: 'San Francisco, CA',
    verified: true,
    online: true,
  },
  u27: {
    name: 'Tyler Reed',
    handle: 'tylerreed',
    avatar: '/api/uploads?path=images/avatars/u27-tylerreed.jpg',
    bio: 'Stand-up comedian making people laugh for a living. If you are not laughing you are not living. Every crowd is a new opportunity to connect.',
    location: 'Austin, TX',
    verified: false,
    online: true,
  },
  u28: {
    name: 'Rosa Gutierrez',
    handle: 'rosagutierrez',
    avatar: '/api/uploads?path=images/avatars/u28-rosagutierrez.jpg',
    bio: 'Makeup artist and beauty educator. Your face is my canvas. Teaching people to see their own beauty one tutorial at a time. Glow from within.',
    location: 'Miami, FL',
    verified: true,
    online: true,
  },
  u29: {
    name: 'Kai Nakamura',
    handle: 'kainakamura',
    avatar: '/api/uploads?path=images/avatars/u29-kainakamura.jpg',
    bio: 'Anime and manga enthusiast. If it is animated I have probably watched it. The stories in anime hit harder than most live action. Subs over dubs always.',
    location: 'Honolulu, HI',
    verified: false,
    online: true,
  },
  u30: {
    name: 'DeShawn Harris',
    handle: 'deshawnharris',
    avatar: '/api/uploads?path=images/avatars/u30-deshawnharris.jpg',
    bio: 'Barbershop owner and community builder. Every fade tells a story. The chair is my therapy couch. More than haircuts, this is about connection.',
    location: 'Detroit, MI',
    verified: true,
    online: false,
  },
  u31: {
    name: 'Isla Murphy',
    handle: 'islamurphy',
    avatar: '/api/uploads?path=images/avatars/u31-islamurphy.jpg',
    bio: 'Environmental scientist fighting for the planet one post at a time. The ocean is my church, sustainability is my lifestyle. We only get one Earth.',
    location: 'Boulder, CO',
    verified: true,
    online: true,
  },
  // ===== 15 NEW BOTS (u32-u46) =====
  u32: {
    name: 'Zara Kim',
    handle: 'zarafoto',
    avatar: '/api/uploads?path=images/avatars/u32-zarafoto.jpg',
    bio: 'Fashion photographer shooting style on the streets and runways. Every outfit tells a story and my lens is listening. Behind every great look is a greater moment.',
    location: 'New York, NY',
    verified: true,
    online: true,
  },
  u33: {
    name: 'Mateo Cruz',
    handle: 'mateocruz',
    avatar: '/api/uploads?path=images/avatars/u33-mateocruz.jpg',
    bio: 'DJ and electronic music producer. Bass drops and sunsets. When the beat hits right nothing else matters. Festival season is always.',
    location: 'Miami, FL',
    verified: true,
    online: true,
  },
  u34: {
    name: 'Trinity Hayes',
    handle: 'trinityhayes',
    avatar: '/api/uploads?path=images/avatars/u34-trinityhayes.jpg',
    bio: 'Astrophysics grad student who moonlights as a science communicator. Black holes and big dreams. The universe is wild and so am I.',
    location: 'Cambridge, MA',
    verified: false,
    online: true,
  },
  u35: {
    name: 'Oscar Reyes',
    handle: 'oscarreyes',
    avatar: '/api/uploads?path=images/avatars/u35-oscarreyes.jpg',
    bio: 'Tattoo artist and illustrator. Skin is my canvas and ink is my truth. Every piece has a story behind it. Book your session DMs open.',
    location: 'Austin, TX',
    verified: true,
    online: true,
  },
  u36: {
    name: 'Yasmin Patel',
    handle: 'yasminpatel',
    avatar: '/api/uploads?path=images/avatars/u36-yasminpatel.jpg',
    bio: 'Certified yoga instructor and breathwork guide. Find your center and the world makes sense. Stillness is a superpower. Namaste but make it real.',
    location: 'Sedona, AZ',
    verified: true,
    online: false,
  },
  u37: {
    name: 'Brooklyn Taylor',
    handle: 'brooklyntaylor',
    avatar: '/api/uploads?path=images/avatars/u37-brooklyntaylor.jpg',
    bio: 'Content creator and vlogger documenting the journey. Real life unfiltered. Behind the scenes of everything. Your favorite creators favorite creator.',
    location: 'Los Angeles, CA',
    verified: true,
    online: true,
  },
  u38: {
    name: 'Hakeem Wright',
    handle: 'hakeemwright',
    avatar: '/api/uploads?path=images/avatars/u38-hakeemwright.jpg',
    bio: 'Basketball skills trainer and former college hooper. Developing the next generation of ballers. Fundamentals win championships. The gym is home.',
    location: 'Chicago, IL',
    verified: false,
    online: true,
  },
  u39: {
    name: 'Sienna Blake',
    handle: 'siennablake',
    avatar: '/api/uploads?path=images/avatars/u39-siennablake.jpg',
    bio: 'Interior designer making spaces feel like home. Vintage meets modern. Your space should tell your story. Good design changes everything.',
    location: 'Nashville, TN',
    verified: true,
    online: true,
  },
  u40: {
    name: 'Theo Kim',
    handle: 'theokim',
    avatar: '/api/uploads?path=images/avatars/u40-theokim.jpg',
    bio: 'Specialty coffee roaster and cafe owner. Life is too short for bad coffee. From bean to cup every sip matters. Third wave or nothing.',
    location: 'Portland, OR',
    verified: false,
    online: true,
  },
  u41: {
    name: 'Naomi Cruz',
    handle: 'naomicruz',
    avatar: '/api/uploads?path=images/avatars/u41-naomicruz.jpg',
    bio: 'Drag performer and visual artist. Glamour is my weapon and the stage is my battlefield. Art is resistance. Love wins always.',
    location: 'San Francisco, CA',
    verified: true,
    online: true,
  },
  u42: {
    name: 'Finn OSullivan',
    handle: 'finnosullivan',
    avatar: '/api/uploads?path=images/avatars/u42-finnosullivan.jpg',
    bio: 'Surf instructor and ocean advocate. Saltwater runs through my veins. The best waves are the ones you share. Keep the ocean clean and the vibes high.',
    location: 'Honolulu, HI',
    verified: false,
    online: true,
  },
  u43: {
    name: 'Amara Okafor',
    handle: 'amaraokafor',
    avatar: '/api/uploads?path=images/avatars/u43-amaraokafor.jpg',
    bio: 'Documentary filmmaker telling stories that matter. Every person has a story worth telling. The camera is my voice and truth is my compass.',
    location: 'Washington, DC',
    verified: true,
    online: true,
  },
  u44: {
    name: 'Jax Rivera',
    handle: 'jaxrivera',
    avatar: '/api/uploads?path=images/avatars/u44-jaxrivera.jpg',
    bio: 'Graffiti artist and muralist turning walls into galleries. Art belongs to everyone. The streets are my museum and color is my language.',
    location: 'Philadelphia, PA',
    verified: false,
    online: true,
  },
  u45: {
    name: 'Mina Sato',
    handle: 'minasato',
    avatar: '/api/uploads?path=images/avatars/u45-minasato.jpg',
    bio: 'Pastry chef and baking enthusiast. Sugar is my love language. Every dessert is a tiny masterpiece. Life is sweet when you make it from scratch.',
    location: 'Seattle, WA',
    verified: true,
    online: false,
  },
  u46: {
    name: 'DJ Remix',
    handle: 'djremix',
    avatar: '/api/uploads?path=images/avatars/u46-djremix.jpg',
    bio: 'Podcast host and pop culture commentator. Hot takes served fresh daily. Conversation is an art form. Every opinion has a story behind it.',
    location: 'Atlanta, GA',
    verified: true,
    online: true,
  },
};

async function main() {
  console.log('Updating bot users with profile pictures and bios...\n');

  for (const [id, updates] of Object.entries(BOT_UPDATES)) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          avatar: updates.avatar,
          bio: updates.bio,
          location: updates.location,
          verified: updates.verified,
          online: updates.online,
          profileSetupComplete: true,
        },
      });
      console.log(`✅ ${user.name} (@${user.handle}) — avatar & bio updated`);
    } catch (err) {
      console.error(`❌ Failed to update ${id}: ${err.message}`);
    }
  }

  // Also update cover images for verified users
  const COVER_IMAGES = [
    '/api/uploads?path=images/profile-cover.png',
  ];

  for (const [id] of Object.entries(BOT_UPDATES)) {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          coverImage: COVER_IMAGES[0],
        },
      });
    } catch (err) {
      // Skip silently
    }
  }

  console.log('\n✅ All bot users updated!');
  
  // Verify
  const bots = await prisma.user.findMany({
    where: { id: { in: Object.keys(BOT_UPDATES) } },
    select: { id: true, name: true, handle: true, avatar: true, bio: true, location: true, verified: true },
  });

  console.log(`\nVerified ${bots.length} bots in database:`);
  bots.forEach(b => {
    console.log(`  ${b.name} (@${b.handle}) — ${b.verified ? '✅' : '⬜'} Bio: "${b.bio?.substring(0, 40)}..."`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
