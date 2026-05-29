#!/usr/bin/env node
/**
 * Update all bot accounts with personality-matched profile cover images and detailed bios.
 * Uses the actual DB user IDs from the seed.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const botUpdates = [
  {
    id: 'founder', // Nick Joseph
    coverImage: '/images/profile-covers/nick-ceo.jpg?v=2',
    bio: 'CEO & Founder of ORRA — building the next-gen social universe where creativity meets community. Visionary, innovator, and dreamer. New Orleans to the world. 💜',
  },
  {
    id: 'bot01', // Amira Johnson
    coverImage: '/images/profile-covers/wellness-guru.jpg?v=2',
    bio: 'Pediatric nurse by day, plant mom always. My apartment is basically a jungle and I love it. Health tips, plant care, and real talk. 🌿🩺',
  },
  {
    id: 'bot02', // Devin Mitchell
    coverImage: '/images/profile-covers/david-sports.jpg?v=2',
    bio: 'High school football coach. Still think about that one play from 2019. Building champions on and off the field. Coach life or no life. 🏈💪',
  },
  {
    id: 'bot03', // Sofia Reyes
    coverImage: '/images/profile-covers/zara-fashion.jpg?v=2',
    bio: 'First-gen college grad. Marketing coordinator by day, side hustle queen by night. Coffee addict and spreadsheet lover. ☕📈',
  },
  {
    id: 'bot04', // Marcus Rivera
    coverImage: '/images/profile-covers/marcus-dance.jpg?v=2',
    bio: 'Dance instructor and choreographer. If music is playing, I\'m moving. Hip-hop, contemporary, salsa — I teach it all. Let the rhythm take over. 💃🔥',
  },
  {
    id: 'bot05', // Raj Patel
    coverImage: '/images/profile-covers/maya-cooking.jpg?v=2',
    bio: 'Software engineer who accidentally became a food blogger. My code compiles, my curries are legendary. Tech by day, tadka by night. 🍛💻',
  },
  {
    id: 'bot06', // Tasha Washington
    coverImage: '/images/profile-covers/zara-fashion.jpg?v=2',
    bio: 'Hair stylist and salon owner. Been doing hair since I was 14. If your edges aren\'t laid, we need to talk. Beauty is my business. 💇‍♀️✨',
  },
  {
    id: 'bot07', // Chris Nakamura
    coverImage: '/images/profile-covers/jay-gaming.jpg?v=2',
    bio: 'Electrician by trade, gamer by night. My K/D ratio is better than my wiring. FPS main. Late night streams, early morning shifts. 🎮⚡',
  },
  {
    id: 'bot08', // Elena Vasquez
    coverImage: '/images/profile-covers/elena-wellness.jpg?v=2',
    bio: 'Wanderlust is my default setting. 23 countries and counting. Travel tips, hidden gems, and the best street food in every city. 🌍✈️',
  },
  {
    id: 'bot09', // Donte Jackson
    coverImage: '/images/profile-covers/dre-music.jpg?v=2',
    bio: 'Aspiring music producer working out of my bedroom studio. Beats that hit different. 808s and late nights. This is my year, I can feel it. 🎧🔥',
  },
  {
    id: 'bot10', // Luna Kim
    coverImage: '/images/profile-covers/luna-sky.jpg?v=2',
    bio: 'Freelance illustrator and cat enthusiast. I paint what I dream and dream what I paint. Watercolors under moonlight. Reality is overrated. 🌙🎨',
  },
  {
    id: 'bot11', // Terrence Brooks
    coverImage: '/images/profile-covers/cyber-drifter.jpg?v=2',
    bio: 'Warehouse supervisor and weekend mechanic. Fixing things is my therapy. Cars, bikes, anything with an engine. Grease under my nails is a lifestyle. 🔧🚗',
  },
  {
    id: 'bot12', // Maya Chen
    coverImage: '/images/profile-covers/maya-cooking.jpg?v=2',
    bio: 'Food blogger and home chef. My kitchen is my happy place. From grandma\'s secrets to fusion experiments — come eat with me! 🍜👩‍🍳',
  },
  {
    id: 'bot13', // Zara Miles
    coverImage: '/images/profile-covers/zara-fashion.jpg?v=2',
    bio: 'Fashion & lifestyle | NYC to LA | Living proof that thrift and designer can coexist. Style is how you express yourself without words. 👗💄',
  },
  {
    id: 'bot14', // Jaylen Parker
    coverImage: '/images/profile-covers/jay-gaming.jpg?v=2',
    bio: 'Gamer & streamer | Competitive FPS | Catch me on ranked or building in creative. Clutch or kick. GGs only. 🎮🏆',
  },
  {
    id: 'bot15', // Dre Williams
    coverImage: '/images/profile-covers/dre-music.jpg?v=2',
    bio: 'Music producer & DJ | Beats that move the room. Studio sessions at 3AM. The vibe is everything. Turn up or tune in. 🎧🔥',
  },
  {
    id: 'bot16', // Nia Okafor
    coverImage: '/images/profile-covers/elena-wellness.jpg?v=2',
    bio: 'Yoga instructor and wellness advocate. Healing one breath at a time. Matcha, meditation, and mindful movement. Peace is a practice. 🧘‍♀️🌿',
  },
  {
    id: 'bot17', // Trevon Harris
    coverImage: '/images/profile-covers/kai-storm.jpg?v=2',
    bio: 'Community college student figuring it out. Photography, pickups games, and late-night debates. Every day is a new chapter. 📸🏀',
  },
  {
    id: 'bot18', // Isla Brennan
    coverImage: '/images/profile-covers/jessica-art.jpg?v=2',
    bio: 'Barista by morning, poet by midnight. Words are my weapon and coffee is my fuel. Open mic nights and dog-eared paperbacks. ☕📝',
  },
  {
    id: 'bot19', // Kai Tanaka
    coverImage: '/images/profile-covers/kai-storm.jpg?v=2',
    bio: 'Skater, artist, chaos enthusiast. I paint skateboards and ride canvases. Rules are suggestions. Stay wild, stay creative. 🛹🎨',
  },
  {
    id: 'bot20', // Brianna Taylor
    coverImage: '/images/profile-covers/wellness-guru.jpg?v=2',
    bio: 'Single mom, full-time accountant, part-time superhero. Surviving on coffee and cuddles. Real talk about mom life. 💪👶',
  },
  {
    id: 'bot21', // Omar Hassan
    coverImage: '/images/profile-covers/tech-daily.jpg?v=2',
    bio: 'Architecture student with too many sketchbooks. Drawing buildings by day, dreaming cities by night. Design is everything. 🏗️✏️',
  },
  {
    id: 'bot22', // Rosa Delgado
    coverImage: '/images/profile-covers/elena-wellness.jpg?v=2',
    bio: 'Retired teacher, professional gardener, community garden queen. Growing food and growing people. Every seed tells a story. 🌱🌻',
  },
  {
    id: 'bot23', // Liam O'Connor
    coverImage: '/images/profile-covers/david-sports.jpg?v=2',
    bio: 'Firefighter and amateur chef. I run into burning buildings and then cook for the crew. Steel sharpens steel. 🔥👨‍🍳',
  },
  {
    id: 'bot24', // Jade Thompson
    coverImage: '/images/profile-covers/wellness-guru.jpg?v=2',
    bio: 'College athlete turned personal trainer. Fitness isn\'t a hobby, it\'s a lifestyle. Let me help you find your strength. 💪🏋️‍♀️',
  },
  {
    id: 'bot25', // Ethan Park
    coverImage: '/images/profile-covers/tech-daily.jpg?v=2',
    bio: 'High school math teacher who makes dank memes about calculus. Education can be fun, I promise. Numbers don\'t lie. 📐😎',
  },
];

async function main() {
  console.log('Updating bot profiles with personalized covers and bios...\n');
  let success = 0;
  let fail = 0;

  for (const bot of botUpdates) {
    try {
      const result = await prisma.user.update({
        where: { id: bot.id },
        data: {
          coverImage: bot.coverImage,
          bio: bot.bio,
        },
      });
      console.log(`✅ ${result.name} (@${result.handle}) — cover + bio updated`);
      success++;
    } catch (e) {
      console.error(`❌ ${bot.id} — FAILED: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n=== Done: ${success} updated, ${fail} failed ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
