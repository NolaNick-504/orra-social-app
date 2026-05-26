#!/usr/bin/env node
/**
 * Seed hub categories and create additional hubs
 * Usage: node scripts/seed-hub-categories.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[seed-hubs] Updating existing hub categories...');

  // Update existing hubs with categories
  await prisma.hub.update({ where: { id: 'h1' }, data: { category: 'art' } });
  await prisma.hub.update({ where: { id: 'h2' }, data: { category: 'music' } });
  await prisma.hub.update({ where: { id: 'h3' }, data: { category: 'tech' } });
  await prisma.hub.update({ where: { id: 'h4' }, data: { category: 'music' } });
  await prisma.hub.update({ where: { id: 'h5' }, data: { category: 'fitness' } });
  await prisma.hub.update({ where: { id: 'h6' }, data: { category: 'food' } });

  console.log('[seed-hubs] Updated 6 existing hubs with categories');

  // Add cover images to existing hubs
  await prisma.hub.update({ where: { id: 'h1' }, data: { cover: '/images/hub-art.jpg' } });
  await prisma.hub.update({ where: { id: 'h2' }, data: { cover: '/images/hub-music.jpg' } });
  await prisma.hub.update({ where: { id: 'h3' }, data: { cover: '/images/hub-tech.jpg' } });
  await prisma.hub.update({ where: { id: 'h4' }, data: { cover: '/images/hub-beats.jpg' } });
  await prisma.hub.update({ where: { id: 'h5' }, data: { cover: '/images/hub-fitness.jpg' } });
  await prisma.hub.update({ where: { id: 'h6' }, data: { cover: '/images/hub-food.jpg' } });

  console.log('[seed-hubs] Added cover images to existing hubs');

  // Add more diverse hubs
  const newHubs = [
    { id: 'h7', name: 'Gaming Lounge', icon: '🎮', description: 'Connect with gamers, share clips, find your squad', category: 'gaming', cover: '/images/hub-gaming.jpg', membersCount: 14200, onlineCount: 567 },
    { id: 'h8', name: 'Self Care Circle', icon: '🧘', description: 'Mental health support, wellness tips, positive vibes only', category: 'wellness', cover: '/images/hub-wellness.jpg', membersCount: 9800, onlineCount: 234 },
    { id: 'h9', name: 'Style Society', icon: '👗', description: 'Fashion inspo, outfit checks, trend alerts', category: 'fashion', cover: '/images/hub-fashion.jpg', membersCount: 7600, onlineCount: 189 },
    { id: 'h10', name: 'Vibe Check', icon: '✨', description: 'Social hangout, make friends, positive energy', category: 'social', cover: '/images/hub-social.jpg', membersCount: 21000, onlineCount: 890 },
    { id: 'h11', name: 'Beat Lab', icon: '🎹', description: 'Music production, beats, collabs, studio sessions', category: 'music', cover: '/images/hub-beats.jpg', membersCount: 6300, onlineCount: 156 },
    { id: 'h12', name: 'Code & Coffee', icon: '💻', description: 'Dev talk, side projects, coding tips and career advice', category: 'tech', cover: '/images/hub-code.jpg', membersCount: 11500, onlineCount: 423 },
  ];

  for (const hub of newHubs) {
    try {
      await prisma.hub.create({ data: hub });
      console.log(`[seed-hubs] Created hub: ${hub.name}`);
    } catch (err) {
      // Hub might already exist
      console.log(`[seed-hubs] Hub ${hub.name} already exists, skipping`);
    }
  }

  console.log('[seed-hubs] Done! Added categories and new hubs');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[seed-hubs] Error:', err);
  process.exit(1);
});
