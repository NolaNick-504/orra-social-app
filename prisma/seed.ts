import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'password123';

// ============================================================
// Mock user data (from src/lib/data.ts)
// ============================================================

const mockUsers = [
  {
    id: 'u1',
    email: 'jessica@orra.app',
    name: 'Jessica Art',
    handle: '@jessart',
    avatar: '/images/avatars/jess-avatar.jpg',
    verified: true,
    online: true,
    auraTokens: 250,
    auraLevel: 3,
    badges: ['Top Creator'],
  },
  {
    id: 'u4',
    email: 'marcus@orra.app',
    name: 'Marcus Rivera',
    handle: '@marcusr',
    avatar: '/images/avatars/marcus-avatar.jpg',
    verified: true,
    online: true,
    auraTokens: 180,
    auraLevel: 2,
    badges: [],
  },
  {
    id: 'u10',
    email: 'lunasky@orra.app',
    name: 'Luna Sky',
    handle: '@lunasky',
    avatar: '/images/avatars/luna-avatar.jpg',
    verified: true,
    online: true,
    auraTokens: 320,
    auraLevel: 4,
    badges: ['Trendsetter'],
  },
  {
    id: 'u13',
    email: 'zara@orra.app',
    name: 'Zara Miles',
    handle: '@zaramiles',
    avatar: '/images/avatars/zara-avatar.jpg',
    coverImage: '/images/profile-cover.png',
    bio: 'Fashion & lifestyle | NYC to LA | Living out loud and styling every moment',
    location: 'Los Angeles, CA',
    website: 'orra.link/zaramiles',
    verified: true,
    online: true,
    auraTokens: 410,
    auraLevel: 5,
    badges: ['Style Icon'],
  },
  {
    id: 'u14',
    email: 'jay@orra.app',
    name: 'Jay Parker',
    handle: '@jayparker',
    avatar: '/images/avatars/jay-avatar.jpg',
    coverImage: '/images/profile-cover.png',
    bio: 'Gamer & streamer | Competitive FPS | Catch me live on ORRA Prism',
    location: 'Atlanta, GA',
    website: 'orra.link/jayparker',
    verified: false,
    online: true,
    auraTokens: 150,
    auraLevel: 2,
    badges: [],
  },
  {
    id: 'u15',
    email: 'maya@orra.app',
    name: 'Maya Chen',
    handle: '@mayachen',
    avatar: '/images/avatars/maya-avatar.jpg',
    coverImage: '/images/profile-cover.png',
    bio: 'Food blogger & home chef | Sharing recipes that bring people together',
    location: 'San Francisco, CA',
    website: 'orra.link/mayachen',
    verified: true,
    online: false,
    auraTokens: 275,
    auraLevel: 3,
    badges: ['Foodie Elite'],
  },
  {
    id: 'u16',
    email: 'dre@orra.app',
    name: 'Dre Williams',
    handle: '@drewilliams',
    avatar: '/images/avatars/dre-avatar.jpg',
    coverImage: '/images/profile-cover.png',
    bio: 'Music producer & DJ | Beats that move the culture | ORRA Dance Off judge',
    location: 'Chicago, IL',
    website: 'orra.link/drewilliams',
    verified: true,
    online: true,
    auraTokens: 500,
    auraLevel: 6,
    badges: ['Beat Maker', 'Judge'],
  },
  {
    id: 'u2',
    email: 'david@orra.app',
    name: 'David Chen',
    handle: '@davchen',
    avatar: '/images/avatars/david-avatar.jpg',
    verified: false,
    online: true,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u3',
    email: 'sarah@orra.app',
    name: 'Sarah Kim',
    handle: '@sarahkim',
    avatar: '/images/avatars/sarah-avatar.jpg',
    verified: false,
    online: false,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u5',
    email: 'elena@orra.app',
    name: 'Elena Rodriguez',
    handle: '@elenarod',
    avatar: '/images/avatars/elena-avatar.jpg',
    verified: false,
    online: false,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u6',
    email: 'techdaily@orra.app',
    name: 'Tech Daily',
    handle: '@techdaily',
    avatar: '/images/avatars/tech-avatar.jpg',
    verified: true,
    online: false,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u7',
    email: 'wellness@orra.app',
    name: 'Wellness Guru',
    handle: '@wellnessg',
    avatar: '/images/avatars/wellness-avatar.jpg',
    verified: true,
    online: true,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u8',
    email: 'cyberdrift@orra.app',
    name: 'Cyber Drifter',
    handle: '@cyberdrift',
    avatar: '/images/avatars/cyber-avatar.jpg',
    verified: false,
    online: false,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u9',
    email: 'musiccentral@orra.app',
    name: 'Music Central',
    handle: '@musiccentral',
    avatar: '/images/avatars/music-avatar.jpg',
    verified: true,
    online: true,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u11',
    email: 'kaistorm@orra.app',
    name: 'Kai Storm',
    handle: '@kaistorm',
    avatar: '/images/avatars/kai-avatar.jpg',
    verified: false,
    online: false,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
  {
    id: 'u12',
    email: 'novablaze@orra.app',
    name: 'Nova Blaze',
    handle: '@novablaze',
    avatar: '/images/avatars/nova-avatar.jpg',
    verified: false,
    online: true,
    auraTokens: 0,
    auraLevel: 1,
    badges: [],
  },
];

// Feed posts data
const feedPosts = [
  {
    id: 'p0a',
    authorId: 'u16',
    text: 'Welcome to ORRA! This is the future of social media — real connections, real content, real rewards. We are just getting started. The best is yet to come!',
    images: [],
    likesCount: 25000,
    commentsCount: 1200,
    sharesCount: 5000,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p0b',
    authorId: 'u13',
    text: 'Style is not about the clothes you wear — it is about how you carry yourself. New lookbook dropping this week, stay tuned! Fashion is my love language and ORRA is my runway.',
    images: ['/images/posts/aura-hq.jpg'],
    likesCount: 18500,
    commentsCount: 890,
    sharesCount: 3200,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p1',
    authorId: 'u1',
    text: 'Just finished my latest digital art piece! The neon aesthetic is everything — spent 12 hours on this one and every minute was worth it. What do you think?',
    images: ['/images/posts/art1.jpg'],
    likesCount: 2341,
    commentsCount: 189,
    sharesCount: 67,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p2',
    authorId: 'u6',
    text: 'Breaking: AI achieves new milestone in creative generation. The future is here and it is mind-blowing. This changes everything we know about content creation and digital art.',
    images: [],
    likesCount: 8912,
    commentsCount: 456,
    sharesCount: 1234,
    vibeTag: 'focused',
    type: 'text',
  },
  {
    id: 'p3',
    authorId: 'u4',
    text: 'Dance practice went hard today! New choreo dropping this weekend — you do not want to miss this one. Been working on something special for the ORRA Dance Off!',
    images: ['/images/posts/dance1.jpg', '/images/posts/dance2.jpg'],
    likesCount: 5678,
    commentsCount: 234,
    sharesCount: 156,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p4',
    authorId: 'u5',
    text: 'Sunset vibes from Barcelona! Travel changes your perspective on everything. Every corner of this city tells a story, and I am here for all of it.',
    images: ['/images/posts/sunset1.jpg'],
    likesCount: 3456,
    commentsCount: 123,
    sharesCount: 89,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p5',
    authorId: 'u7',
    text: 'Morning routine tip: Start with 5 minutes of breathwork before checking your phone. Game changer for mental clarity. Your mind will thank you, trust me on this one.',
    images: [],
    likesCount: 1567,
    commentsCount: 98,
    sharesCount: 234,
    vibeTag: 'peaceful',
    type: 'text',
  },
  {
    id: 'p6',
    authorId: 'u9',
    text: 'NEW TRACK ALERT! Just dropped "Neon Dreams" — this is the official track for the ORRA Dance Off 2027 challenge! Link in bio! Let us see those moves!',
    images: ['/images/posts/album1.jpg'],
    likesCount: 7890,
    commentsCount: 567,
    sharesCount: 890,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p7',
    authorId: 'u8',
    text: 'When your WiFi dies mid-game and you just stare at the screen like... RIP my killstreak. Anyone else been there? 😂😭',
    images: ['/images/posts/game1.jpg', '/images/posts/game2.jpg'],
    likesCount: 4523,
    commentsCount: 345,
    sharesCount: 567,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p8',
    authorId: 'u10',
    text: 'Just hit 1 million ORRA tokens! From zero to hero in 6 months. The secret? Consistency, authentic content, and always showing up for the community. Dream big, grind harder!',
    images: [],
    likesCount: 12340,
    commentsCount: 890,
    sharesCount: 2100,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p9',
    authorId: 'u13',
    text: 'Just dropped my summer lookbook and I am obsessed with every single fit! From streetwear to couture, this season is all about mixing highs and lows. Which look is your favorite?',
    images: ['/images/posts/fashion1.jpg'],
    likesCount: 8900,
    commentsCount: 567,
    sharesCount: 1234,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p10',
    authorId: 'u14',
    text: 'CLUTCH WIN! Just hit a 1v5 in ranked and my whole squad went crazy. Streaming the rest of the session live on ORRA Prism — come watch the chaos unfold!',
    images: [],
    likesCount: 6700,
    commentsCount: 423,
    sharesCount: 890,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p11',
    authorId: 'u15',
    text: 'Made authentic hand-pulled noodles from scratch today! The secret is the dough resting time — 2 hours minimum. Recipe dropping tomorrow on my page. Your taste buds will thank you!',
    images: ['/images/posts/food1.jpg'],
    likesCount: 5400,
    commentsCount: 345,
    sharesCount: 678,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p12',
    authorId: 'u16',
    text: 'Just finished producing a beat that samples 4 different genres in one track. Hip-hop meets jazz meets electronic meets soul. This one is going to shake the culture. Preview coming tonight!',
    images: [],
    likesCount: 9800,
    commentsCount: 678,
    sharesCount: 1567,
    vibeTag: 'hyped',
    type: 'text',
  },
  // New posts to make the feed look live
  {
    id: 'p13',
    authorId: 'u2',
    text: 'Deployed my first smart contract today! The decentralized web is the future and I am here for it. Web3 developers, where you at? Let us build something amazing together.',
    images: [],
    likesCount: 3200,
    commentsCount: 234,
    sharesCount: 567,
    vibeTag: 'focused',
    type: 'text',
  },
  {
    id: 'p14',
    authorId: 'u3',
    text: 'Golden hour at the beach is my therapy. No notifications, no deadlines, just waves and peace. Everyone needs a moment like this. Take a breath, you deserve it.',
    images: ['/images/posts/sunset1.jpg'],
    likesCount: 7800,
    commentsCount: 456,
    sharesCount: 890,
    vibeTag: 'peaceful',
    type: 'image',
  },
  {
    id: 'p15',
    authorId: 'u10',
    text: 'Pop-up shop in SoHo this weekend! Exclusively on ORRA first — my new streetwear collab with Nova Blaze. Limited drops, first come first serve. Set your reminders NOW!',
    images: ['/images/posts/fashion1.jpg'],
    likesCount: 14200,
    commentsCount: 980,
    sharesCount: 3400,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p16',
    authorId: 'u7',
    text: '5 yoga poses that actually cure desk posture. I have been teaching these for 10 years and they never fail. Save this for later — your back will thank you. Full video on my page.',
    images: [],
    likesCount: 6100,
    commentsCount: 389,
    sharesCount: 1200,
    vibeTag: 'peaceful',
    type: 'text',
  },
  {
    id: 'p17',
    authorId: 'u14',
    text: 'Just hit Diamond rank in TWO games in the same week! The grind is real but the payoff is sweeter. Who else out here chasing ranks? Drop your current rank below!',
    images: ['/images/posts/game1.jpg'],
    likesCount: 5600,
    commentsCount: 789,
    sharesCount: 432,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p18',
    authorId: 'u15',
    text: 'Made ramen from scratch — 48 hour broth, handmade noodles, chashu pork that melts in your mouth. This took 3 days but it was absolutely worth every single minute.',
    images: ['/images/posts/food1.jpg'],
    likesCount: 8900,
    commentsCount: 567,
    sharesCount: 1234,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p19',
    authorId: 'u16',
    text: 'Studio session went CRAZY last night. 6 beats in one session, all fire. The album is coming together and I cannot wait for yall to hear this. ORRA exclusive preview dropping soon!',
    images: [],
    likesCount: 11000,
    commentsCount: 890,
    sharesCount: 2300,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p20',
    authorId: 'u1',
    text: 'New mural finished! Took 3 weeks and 47 cans of spray paint. This is my biggest piece yet and every spray told a story. Art is how I speak when words are not enough.',
    images: ['/images/posts/art1.jpg'],
    likesCount: 4500,
    commentsCount: 312,
    sharesCount: 678,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p21',
    authorId: 'u4',
    text: 'Master class dropping next week! Learn my signature move — the Prism Glide. Breaking it down step by step so anyone can learn it. Beginners welcome, no experience needed!',
    images: ['/images/posts/dance1.jpg'],
    likesCount: 9300,
    commentsCount: 678,
    sharesCount: 1567,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p22',
    authorId: 'u6',
    text: 'This AI just generated a full album in 30 seconds and honestly some of the tracks are genuinely good. Are we watching the birth of a new genre or the death of human creativity? Discuss.',
    images: [],
    likesCount: 15600,
    commentsCount: 1200,
    sharesCount: 4500,
    vibeTag: 'focused',
    type: 'text',
  },
  {
    id: 'p23',
    authorId: 'u5',
    text: 'Hidden gem in Lisbon — this cafe has the best pastel de nata I have ever tasted. Travel is the only thing you buy that makes you richer. Who has been to Portugal?',
    images: ['/images/posts/sunset1.jpg'],
    likesCount: 4200,
    commentsCount: 234,
    sharesCount: 456,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p24',
    authorId: 'u8',
    text: 'When your squad carries you to victory and you get the MVP screen with 0 kills... I will take it! Sometimes the best play is staying out of the way!',
    images: ['/images/posts/game2.jpg'],
    likesCount: 7800,
    commentsCount: 567,
    sharesCount: 1200,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p25',
    authorId: 'u9',
    text: 'Open mic night was INCREDIBLE. Shoutout to every artist who got on that stage and poured their soul out. The ORRA music community is unlike anything I have ever seen.',
    images: ['/images/posts/album1.jpg'],
    likesCount: 6700,
    commentsCount: 423,
    sharesCount: 890,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p26',
    authorId: 'u13',
    text: 'Met Gala inspired look — ORRA edition. Who says you need a red carpet to serve looks? Every sidewalk is a runway if you walk with purpose. Style is attitude, not labels.',
    images: ['/images/posts/fashion1.jpg'],
    likesCount: 19800,
    commentsCount: 1340,
    sharesCount: 4500,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p27',
    authorId: 'u11',
    text: 'New skateboard deck design just dropped! Hand-painted cyberpunk dragon — this one took 40 hours and I am so proud of how it turned out. Limited run of 50, link in bio!',
    images: ['/images/posts/art1.jpg'],
    likesCount: 3400,
    commentsCount: 189,
    sharesCount: 345,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p28',
    authorId: 'u3',
    text: 'Just finished a 10K run in under 45 minutes! 6 months ago I could not even run a mile without stopping. Consistency is literally the only secret. Start small, show up daily.',
    images: [],
    likesCount: 5600,
    commentsCount: 345,
    sharesCount: 890,
    vibeTag: 'focused',
    type: 'text',
  },
  {
    id: 'p29',
    authorId: 'u12',
    text: 'Beat making live stream TONIGHT at 9 PM EST! We are making a track from scratch using only ORRA community suggestions. Drop your genre and tempo ideas below!',
    images: [],
    likesCount: 4100,
    commentsCount: 567,
    sharesCount: 780,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p30',
    authorId: 'u7',
    text: 'Meditation challenge: 21 days, 10 minutes a day. Day 14 and I already feel like a completely different person. Better sleep, less anxiety, more clarity. Who is joining me?',
    images: [],
    likesCount: 3800,
    commentsCount: 234,
    sharesCount: 890,
    vibeTag: 'peaceful',
    type: 'text',
  },
  {
    id: 'p31',
    authorId: 'u2',
    text: 'Anyone else addicted to the ORRA Dance Off? I just submitted my entry and I am literally shaking. The talent this season is absolutely insane. Good luck to everyone competing!',
    images: [],
    likesCount: 2900,
    commentsCount: 178,
    sharesCount: 456,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p32',
    authorId: 'u15',
    text: 'Food hack: freeze your grapes. Trust me on this one — they become like little sorbet bites. Perfect summer snack. You can thank me later!',
    images: ['/images/posts/food1.jpg'],
    likesCount: 6200,
    commentsCount: 456,
    sharesCount: 1890,
    vibeTag: 'chill',
    type: 'image',
  },
];

// Comedy posts
const comedyPosts = [
  {
    id: 'cp1',
    authorId: 'u8',
    text: 'When the WiFi dies mid-game and you stare at the screen like your whole life just flashed before your eyes...',
    images: ['/images/posts/comedy1.jpg'],
    likesCount: 8900,
    commentsCount: 456,
    sharesCount: 890,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'cp2',
    authorId: 'u2',
    text: 'My code works! *changes nothing* My code doesn\'t work... Welcome to programming!',
    images: [],
    likesCount: 12400,
    commentsCount: 890,
    sharesCount: 2100,
    vibeTag: 'laughing',
    type: 'text',
  },
  {
    id: 'cp3',
    authorId: 'u11',
    text: 'POV: You said "just one more episode" 4 hours ago and now it\'s 3 AM',
    images: ['/images/posts/comedy3.jpg'],
    likesCount: 15600,
    commentsCount: 1200,
    sharesCount: 3400,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'cp4',
    authorId: 'u3',
    text: 'That moment when you wave back at someone who wasn\'t waving at you... Then pretend you were fixing your hair',
    images: [],
    likesCount: 23100,
    commentsCount: 1800,
    sharesCount: 5600,
    vibeTag: 'laughing',
    type: 'text',
  },
];

// Reels data
const reelsData = [
  { id: 'r1', title: 'Neon Dance Routine', creatorId: 'u4', views: 2400000, likesCount: 189000, commentsCount: 12400, category: 'Dance', song: 'Neon Dreams - DJ Prism ft. Luna', isRemix: true, thumbnail: '/images/reels/reel1.jpg' },
  { id: 'r2', title: 'Cooking Hacks: 5min Meals', creatorId: 'u5', views: 890000, likesCount: 67000, commentsCount: 5600, category: 'Food', song: 'Lo-Fi Kitchen Beats', thumbnail: '/images/reels/reel2.jpg' },
  { id: 'r3', title: 'Epic Guitar Solo', creatorId: 'u9', views: 1200000, likesCount: 145000, commentsCount: 8900, category: 'Music', song: 'Shredding Neon - Music Central', thumbnail: '/images/reels/reel3.jpg' },
  { id: 'r4', title: 'Morning Yoga Flow', creatorId: 'u7', views: 567000, likesCount: 34000, commentsCount: 2300, category: 'Sports', song: 'Zen Flow - Wellness Sounds', isLive: true, thumbnail: '/images/reels/reel4.jpg' },
  { id: 'r5', title: 'Street Art Process', creatorId: 'u1', views: 1800000, likesCount: 210000, commentsCount: 15600, category: 'Art', song: 'Canvas Dreams - Art Beats', isRemix: true, thumbnail: '/images/reels/reel5.jpg' },
  { id: 'r6', title: 'Comedy: When WiFi Dies', creatorId: 'u8', views: 3100000, likesCount: 445000, commentsCount: 34200, category: 'Comedy', song: 'Fail Sound Effect', thumbnail: '/images/reels/reel6.jpg' },
  { id: 'r7', title: 'Skateboard Tricks', creatorId: 'u11', views: 920000, likesCount: 78000, commentsCount: 4500, category: 'Sports', song: 'Skate Punk Anthems', thumbnail: '/images/reels/reel7.jpg' },
  { id: 'r8', title: 'Beat Making Tutorial', creatorId: 'u12', views: 1500000, likesCount: 167000, commentsCount: 11200, category: 'Music', song: 'Beat Lab - Nova Blaze', isRemix: true, thumbnail: '/images/reels/reel8.jpg' },
  { id: 'r9', title: 'Fashion Haul: Summer', creatorId: 'u10', views: 670000, likesCount: 45000, commentsCount: 3200, category: 'Trending', song: 'Runway Vibes - Luna Sky', isLive: true, thumbnail: '/images/reels/reel9.jpg' },
  { id: 'r10', title: 'Dance Battle Finals', creatorId: 'u4', views: 4200000, likesCount: 567000, commentsCount: 45600, category: 'Dance', song: 'Battle Cry - DJ Prism', isRemix: true, thumbnail: '/images/reels/reel10.jpg' },
  { id: 'r11', title: 'Sunset Timelapse', creatorId: 'u5', views: 1100000, likesCount: 98000, commentsCount: 6700, category: 'Trending', song: 'Golden Hour - Ambient Mix', thumbnail: '/images/reels/reel11.jpg' },
  { id: 'r12', title: 'Piano Cover: Neon Dreams', creatorId: 'u9', views: 780000, likesCount: 56000, commentsCount: 4100, category: 'Music', song: 'Neon Dreams (Piano Version)', thumbnail: '/images/reels/reel12.jpg' },
];

// Dance entries data
const danceEntriesData = [
  { id: 'de1', authorId: 'u4', description: 'Electric slide meets hip-hop!', thumbnail: '/images/dance/entry0.jpg', likesCount: 98420 },
  { id: 'de2', authorId: 'u10', description: 'Contemporary fusion piece', thumbnail: '/images/dance/entry1.jpg', likesCount: 87650 },
  { id: 'de3', authorId: 'u1', description: 'Voguing with a twist', thumbnail: '/images/dance/entry2.jpg', likesCount: 76340 },
  { id: 'de4', authorId: 'u12', description: 'Breakdance meets ballet', thumbnail: '/images/dance/entry3.jpg', likesCount: 65230 },
  { id: 'de5', authorId: 'u5', description: 'Latin dance fusion', thumbnail: '/images/dance/entry4.jpg', likesCount: 54120 },
  { id: 'de6', authorId: 'u11', description: 'Krump energy!', thumbnail: '/images/dance/entry5.jpg', likesCount: 43010 },
  { id: 'de7', authorId: 'u2', description: 'Robot dance challenge', thumbnail: '/images/dance/entry6.jpg', likesCount: 38900 },
  { id: 'de8', authorId: 'u8', description: 'Cyberpunk choreography', thumbnail: '/images/dance/entry7.jpg', likesCount: 32780 },
];

// Hubs data
const hubsData = [
  { id: 'h1', name: 'Digital Artists', membersCount: 12400, onlineCount: 342, icon: '🎨', cover: '/images/hub1.jpg', description: 'Share your digital creations' },
  { id: 'h2', name: 'Dance Crew', membersCount: 8900, onlineCount: 567, icon: '💃', cover: '/images/hub2.jpg', description: 'All dance styles welcome' },
  { id: 'h3', name: 'Tech Innovators', membersCount: 15600, onlineCount: 890, icon: '🚀', cover: '/images/hub3.jpg', description: 'The future starts here' },
  { id: 'h4', name: 'Music Makers', membersCount: 9200, onlineCount: 234, icon: '🎵', cover: '/images/hub4.jpg', description: 'Create and collaborate' },
  { id: 'h5', name: 'Fitness First', membersCount: 11000, onlineCount: 456, icon: '💪', cover: '/images/hub5.jpg', description: 'Level up your fitness' },
  { id: 'h6', name: 'Foodies Unite', membersCount: 7800, onlineCount: 123, icon: '🍜', cover: '/images/hub6.jpg', description: 'Food from around the world' },
];

// Hub posts data
const hubPostsData: Record<string, Array<{ id: string; authorId: string; text: string; likesCount: number; commentsCount: number }>> = {
  h1: [
    { id: 'hp1-1', authorId: 'u1', text: 'Just finished this cyberpunk cityscape! What do you all think? Feedback welcome!', likesCount: 234, commentsCount: 45 },
    { id: 'hp1-2', authorId: 'u12', text: 'Anyone else using Procreate for digital art? Looking for brush recommendations!', likesCount: 89, commentsCount: 23 },
    { id: 'hp1-3', authorId: 'u4', text: 'Art block is REAL. Been staring at a blank canvas for 2 hours. Send help and inspiration!', likesCount: 567, commentsCount: 78 },
  ],
  h2: [
    { id: 'hp2-1', authorId: 'u4', text: 'New choreo dropping this weekend! Been working on something special for the ORRA Dance Off!', likesCount: 456, commentsCount: 89 },
    { id: 'hp2-2', authorId: 'u10', text: 'Anyone want to collab on a duet dance? Looking for a partner for the challenge!', likesCount: 234, commentsCount: 56 },
  ],
  h3: [
    { id: 'hp3-1', authorId: 'u6', text: 'New AI model just dropped and it is INSANE. The creative applications are endless!', likesCount: 890, commentsCount: 123 },
    { id: 'hp3-2', authorId: 'u2', text: 'Just built my first app with the new SDK. Documentation could use some work but the possibilities are amazing!', likesCount: 345, commentsCount: 67 },
  ],
  h4: [
    { id: 'hp4-1', authorId: 'u9', text: 'Studio session went crazy last night! New track coming this Friday!', likesCount: 678, commentsCount: 90 },
    { id: 'hp4-2', authorId: 'u12', text: 'Beat making tutorial dropping tomorrow! Going to show you my whole workflow', likesCount: 445, commentsCount: 56 },
  ],
  h5: [
    { id: 'hp5-1', authorId: 'u7', text: 'Morning routine tip: 5 minutes of breathwork before checking your phone. Game changer!', likesCount: 567, commentsCount: 78 },
    { id: 'hp5-2', authorId: 'u11', text: 'Just hit a new PR on deadlifts! Consistency is key. Keep pushing!', likesCount: 345, commentsCount: 45 },
  ],
  h6: [
    { id: 'hp6-1', authorId: 'u5', text: 'Made authentic paella from my abuela\'s recipe! The secret is the saffron!', likesCount: 789, commentsCount: 134 },
    { id: 'hp6-2', authorId: 'u3', text: 'Best ramen spot in the city? Need recommendations for this weekend!', likesCount: 234, commentsCount: 89 },
  ],
};

// Initial chat history
const chatHistoryData: Record<string, { otherUserId: string; unreadCount: number; messages: { senderId: string; text: string }[] }> = {
  m1: {
    otherUserId: 'u1',
    unreadCount: 2,
    messages: [
      { senderId: 'u1', text: 'Hey! Did you see the new dance challenge?' },
      { senderId: 'u13', text: 'Yes!! The moves are incredible this year' },
      { senderId: 'u1', text: 'OMG that dance was insane! We need to collab!' },
    ],
  },
  m2: {
    otherUserId: 'u2',
    unreadCount: 0,
    messages: [
      { senderId: 'u2', text: 'Working on something cool in the studio' },
      { senderId: 'u13', text: 'Can not wait to hear it!' },
      { senderId: 'u2', text: 'Check out this new track I made' },
    ],
  },
  m3: {
    otherUserId: 'u4',
    unreadCount: 1,
    messages: [
      { senderId: 'u4', text: 'The dance off is about to start!' },
      { senderId: 'u13', text: 'I am so ready for this' },
      { senderId: 'u4', text: 'You ready for the challenge? Let us go!' },
    ],
  },
  m4: {
    otherUserId: 'u5',
    unreadCount: 0,
    messages: [
      { senderId: 'u5', text: 'Barcelona is absolutely stunning' },
      { senderId: 'u13', text: 'Show me the photos!' },
      { senderId: 'u5', text: 'Barcelona photos are up! Check them' },
    ],
  },
  m5: {
    otherUserId: 'u7',
    unreadCount: 0,
    messages: [
      { senderId: 'u7', text: 'Morning meditation was amazing today' },
      { senderId: 'u13', text: 'I need to get back into that routine' },
      { senderId: 'u7', text: 'Namaste! Morning session tomorrow?' },
    ],
  },
  m6: {
    otherUserId: 'u9',
    unreadCount: 3,
    messages: [
      { senderId: 'u9', text: 'Studio session went crazy last night' },
      { senderId: 'u13', text: 'When is it dropping?' },
      { senderId: 'u9', text: 'Listen to the new single! Just dropped!' },
    ],
  },
  m7: {
    otherUserId: 'u10',
    unreadCount: 0,
    messages: [
      { senderId: 'u10', text: 'That reel we talked about?' },
      { senderId: 'u13', text: 'Still editing, almost done!' },
      { senderId: 'u10', text: 'Let us collab on the next reel' },
    ],
  },
  m8: {
    otherUserId: 'u11',
    unreadCount: 0,
    messages: [
      { senderId: 'u11', text: 'The weather is perfect for skating' },
      { senderId: 'u13', text: 'Let me grab my board!' },
      { senderId: 'u11', text: 'Skate session tomorrow at the park?' },
    ],
  },
  m9: {
    otherUserId: 'u12',
    unreadCount: 0,
    messages: [
      { senderId: 'u12', text: 'Just finished a new beat' },
      { senderId: 'u13', text: 'Send it over!' },
      { senderId: 'u12', text: 'New beat just dropped, need your feedback' },
    ],
  },
};

// Notifications data
const notificationsData = [
  { id: 'n1', userId: 'u13', triggeredByUserId: 'u1', action: 'liked your dance video', type: 'like', thumbnail: '/images/posts/dance1.jpg' },
  { id: 'n2', userId: 'u13', triggeredByUserId: 'u2', action: 'started following you', type: 'follow', thumbnail: '' },
  { id: 'n3', userId: 'u13', triggeredByUserId: 'u4', action: 'commented: "Insane moves!"', type: 'comment', thumbnail: '/images/posts/dance2.jpg' },
  { id: 'n4', userId: 'u13', triggeredByUserId: 'u5', action: 'shared your post to their ORRA', type: 'share', thumbnail: '/images/posts/sunset1.jpg' },
  { id: 'n5', userId: 'u13', triggeredByUserId: 'u7', action: 'mentioned you in a comment', type: 'mention', thumbnail: '' },
  { id: 'n6', userId: 'u13', triggeredByUserId: 'u9', action: 'started following you', type: 'follow', thumbnail: '' },
  { id: 'n7', userId: 'u13', triggeredByUserId: 'u8', action: 'liked your dance challenge entry', type: 'like', thumbnail: '/images/posts/game1.jpg' },
  { id: 'n8', userId: 'u13', triggeredByUserId: 'u10', action: 'remixed your reel', type: 'remix', thumbnail: '/images/posts/album1.jpg' },
  { id: 'n9', userId: 'u13', triggeredByUserId: 'u11', action: 'started following you', type: 'follow', thumbnail: '' },
  { id: 'n10', userId: 'u13', triggeredByUserId: 'u12', action: 'liked your comment', type: 'like', thumbnail: '' },
  { id: 'n11', userId: 'u13', triggeredByUserId: 'u6', action: 'featured your post in Tech Daily', type: 'feature', thumbnail: '/images/posts/art1.jpg' },
];


// ============================================================
// SEED FUNCTION
// ============================================================

async function main() {
  console.log('🌱 Seeding ORRA database...\n');

  // Clean up existing data
  console.log('🗑️  Cleaning existing data...');
  const deleteOps = [
    () => prisma.sharedPost.deleteMany(),
    () => prisma.tokenAction.deleteMany(),
    () => prisma.notification.deleteMany(),
    () => prisma.directMessage.deleteMany(),
    () => prisma.chatMember.deleteMany(),
    () => prisma.chat.deleteMany(),
    () => prisma.hubPost.deleteMany(),
    () => prisma.hubMember.deleteMany(),
    () => prisma.hub.deleteMany(),
    () => prisma.danceEntry.deleteMany(),
    () => prisma.danceChallenge.deleteMany(),
    () => prisma.reel.deleteMany(),
    () => prisma.story.deleteMany(),
    () => prisma.save.deleteMany(),
    () => prisma.repost.deleteMany(),
    () => prisma.like.deleteMany(),
    () => prisma.comment.deleteMany(),
    () => prisma.post.deleteMany(),
    () => prisma.follow.deleteMany(),
    () => prisma.account.deleteMany(),
    () => prisma.session.deleteMany(),
    () => prisma.user.deleteMany(),
  ];
  for (const op of deleteOps) {
    try { await op(); } catch { /* Table may not exist after fresh reset */ }
  }
  console.log('✅ Existing data cleaned\n');

  // ========================================
  // 1. Create Users
  // ========================================
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  for (const u of mockUsers) {
    await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        name: u.name,
        handle: u.handle,
        password: hashedPassword,
        avatar: u.avatar,
        coverImage: u.coverImage ?? '/images/profile-cover.png',
        bio: u.bio ?? '',
        location: u.location ?? '',
        website: u.website ?? '',
        verified: u.verified ?? false,
        online: u.online ?? false,
        auraTokens: u.auraTokens,
        auraLevel: u.auraLevel,
        badges: JSON.stringify(u.badges ?? []),
        profileSetupComplete: true, // Demo users have their profiles set up
      },
    });
  }
  console.log(`✅ Created ${mockUsers.length} users\n`);

  // ========================================
  // 2. Create Posts (Feed + Comedy)
  // ========================================
  console.log('📝 Creating posts...');
  const allPosts = [...feedPosts, ...comedyPosts];
  for (const p of allPosts) {
    await prisma.post.create({
      data: {
        id: p.id,
        text: p.text,
        images: JSON.stringify(p.images),
        vibeTag: p.vibeTag,
        type: p.type,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        sharesCount: p.sharesCount,
        authorId: p.authorId,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ Created ${allPosts.length} posts (${feedPosts.length} feed + ${comedyPosts.length} comedy)\n`);

  // ========================================
  // 3. Create Stories
  // ========================================
  console.log('📸 Creating stories...');
  const storyUsers = [
    { userId: 'u13', image: '/images/dance-party.png' },
    { userId: 'u1', image: '/images/stories/story1.jpg' },
    { userId: 'u2', image: '/images/stories/story2.jpg' },
    { userId: 'u4', image: '/images/stories/story3.jpg' },
    { userId: 'u5', image: '/images/stories/story4.jpg' },
    { userId: 'u7', image: '/images/stories/story5.jpg' },
    { userId: 'u9', image: '/images/stories/story6.jpg' },
    { userId: 'u10', image: '/images/stories/story7.jpg' },
    { userId: 'u12', image: '/images/stories/story8.jpg' },
    // 8 new stories
    { userId: 'u14', image: '/images/stories/story9.jpg' },
    { userId: 'u15', image: '/images/stories/story10.jpg' },
    { userId: 'u16', image: '/images/stories/story11.jpg' },
    { userId: 'u3', image: '/images/stories/story12.jpg' },
    { userId: 'u6', image: '/images/stories/story13.jpg' },
    { userId: 'u8', image: '/images/stories/story14.jpg' },
    { userId: 'u11', image: '/images/stories/story15.jpg' },
    { userId: 'u13', image: '/images/stories/story16.jpg' },
  ];

  for (const s of storyUsers) {
    await prisma.story.create({
      data: {
        image: s.image,
        viewed: false,
        authorId: s.userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
      },
    });
  }
  console.log(`✅ Created ${storyUsers.length} stories\n`);

  // ========================================
  // 4. Create Reels
  // ========================================
  console.log('🎬 Creating reels...');
  for (const r of reelsData) {
    await prisma.reel.create({
      data: {
        id: r.id,
        title: r.title,
        thumbnail: r.thumbnail,
        views: r.views,
        likesCount: r.likesCount,
        commentsCount: r.commentsCount,
        category: r.category,
        song: r.song,
        isRemix: r.isRemix ?? false,
        isLive: r.isLive ?? false,
        creatorId: r.creatorId,
      },
    });
  }
  console.log(`✅ Created ${reelsData.length} reels\n`);

  // ========================================
  // 5. Create Dance Challenge + Entries
  // ========================================
  console.log('💃 Creating dance challenge...');
  const challenge = await prisma.danceChallenge.create({
    data: {
      id: 'dc1',
      name: 'ORRA DANCE OFF 2027',
      hashtag: '#OrraDanceOff2027',
      song: 'Neon Dreams - DJ Prism ft. Luna',
      description: 'Show us your best moves! Create a dance video using the official track and tag #OrraDanceOff2027. The top 3 entries with the most likes win exclusive ORRA plaques and tokens!',
      prize: '100,000 ORRA + Champion Plaque',
      secondPrize: '50,000 ORRA + Runner-Up Plaque',
      thirdPrize: '25,000 ORRA + 3rd Place Plaque',
      bannerImage: '/images/dance-banner.png',
      timeRemaining: 72 * 60 * 60,
      active: true,
    },
  });

  for (const e of danceEntriesData) {
    await prisma.danceEntry.create({
      data: {
        id: e.id,
        description: e.description,
        thumbnail: e.thumbnail,
        likesCount: e.likesCount,
        authorId: e.authorId,
        challengeId: challenge.id,
      },
    });
  }
  console.log(`✅ Created dance challenge with ${danceEntriesData.length} entries\n`);

  // ========================================
  // 6. Create Hubs + Members + Posts
  // ========================================
  console.log('🏠 Creating hubs...');
  for (const h of hubsData) {
    await prisma.hub.create({
      data: {
        id: h.id,
        name: h.name,
        icon: h.icon,
        cover: h.cover,
        description: h.description,
        membersCount: h.membersCount,
        onlineCount: h.onlineCount,
      },
    });

    // Add members to each hub (current user + relevant users)
    const hubMemberIds: string[] = [];
    // Add specific users based on hub
    if (h.id === 'h1') hubMemberIds.push('u1', 'u12', 'u4', 'u8', 'u13'); // Digital Artists
    if (h.id === 'h2') hubMemberIds.push('u4', 'u10', 'u1', 'u16'); // Dance Crew
    if (h.id === 'h3') hubMemberIds.push('u6', 'u2', 'u14'); // Tech Innovators
    if (h.id === 'h4') hubMemberIds.push('u9', 'u12', 'u10', 'u16'); // Music Makers
    if (h.id === 'h5') hubMemberIds.push('u7', 'u11', 'u15'); // Fitness First
    if (h.id === 'h6') hubMemberIds.push('u5', 'u3', 'u15'); // Foodies Unite

    for (const memberId of hubMemberIds) {
      await prisma.hubMember.create({
        data: {
          userId: memberId,
          hubId: h.id,
        },
      });
    }

    // Create hub posts
    const posts = hubPostsData[h.id] ?? [];
    for (const hp of posts) {
      await prisma.hubPost.create({
        data: {
          id: hp.id,
          text: hp.text,
          likesCount: hp.likesCount,
          commentsCount: hp.commentsCount,
          authorId: hp.authorId,
          hubId: h.id,
          createdAt: new Date(Date.now() - Math.random() * 3 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`✅ Created ${hubsData.length} hubs with members and posts\n`);

  // ========================================
  // 7. Create Follow Relationships
  // ========================================
  console.log('🔗 Creating follow relationships...');
  // Cross-follows between users (no main account)
  const followPairs: Array<{ followerId: string; followingId: string }> = [];

  const crossFollows = [
    { followerId: 'u1', followingId: 'u4' },
    { followerId: 'u4', followingId: 'u1' },
    { followerId: 'u1', followingId: 'u12' },
    { followerId: 'u10', followingId: 'u4' },
    { followerId: 'u4', followingId: 'u10' },
    { followerId: 'u9', followingId: 'u12' },
    { followerId: 'u12', followingId: 'u9' },
    { followerId: 'u7', followingId: 'u11' },
    { followerId: 'u5', followingId: 'u3' },
    { followerId: 'u6', followingId: 'u2' },
    { followerId: 'u2', followingId: 'u6' },
    // New demo users follows
    { followerId: 'u13', followingId: 'u1' },
    { followerId: 'u13', followingId: 'u4' },
    { followerId: 'u13', followingId: 'u10' },
    { followerId: 'u1', followingId: 'u13' },
    { followerId: 'u14', followingId: 'u8' },
    { followerId: 'u14', followingId: 'u6' },
    { followerId: 'u8', followingId: 'u14' },
    { followerId: 'u15', followingId: 'u5' },
    { followerId: 'u15', followingId: 'u3' },
    { followerId: 'u5', followingId: 'u15' },
    { followerId: 'u16', followingId: 'u4' },
    { followerId: 'u16', followingId: 'u9' },
    { followerId: 'u16', followingId: 'u12' },
    { followerId: 'u4', followingId: 'u16' },
    { followerId: 'u9', followingId: 'u16' },
  ];
  followPairs.push(...crossFollows);

  for (const f of followPairs) {
    try {
      await prisma.follow.create({
        data: {
          followerId: f.followerId,
          followingId: f.followingId,
        },
      });
    } catch {
      // Skip duplicates (unique constraint)
    }
  }
  console.log(`✅ Created ${followPairs.length} follow relationships\n`);

  // ========================================
  // 8. Create Chat Conversations + Messages
  // ========================================
  console.log('💬 Creating chat conversations...');
  for (const [chatId, chatData] of Object.entries(chatHistoryData)) {
    // Create chat
    const chat = await prisma.chat.create({
      data: {
        id: chatId,
      },
    });

    // Add members (u13 = Zara Miles is the conversation partner)
    await prisma.chatMember.create({
      data: {
        chatId: chat.id,
        userId: 'u13',
        unreadCount: 0,
      },
    });

    // Other user
    await prisma.chatMember.create({
      data: {
        chatId: chat.id,
        userId: chatData.otherUserId,
        unreadCount: chatData.unreadCount,
      },
    });

    // Add messages
    for (const msg of chatData.messages) {
      await prisma.directMessage.create({
        data: {
          text: msg.text,
          chatId: chat.id,
          senderId: msg.senderId,
          createdAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`✅ Created ${Object.keys(chatHistoryData).length} chat conversations with messages\n`);

  // ========================================
  // 9. Create Notifications
  // ========================================
  console.log('🔔 Creating notifications...');
  for (const n of notificationsData) {
    await prisma.notification.create({
      data: {
        id: n.id,
        action: n.action,
        type: n.type,
        thumbnail: n.thumbnail,
        userId: n.userId,
        triggeredByUserId: n.triggeredByUserId,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ Created ${notificationsData.length} notifications\n`);

  // ========================================
  // Summary
  // ========================================
  console.log('='.repeat(50));
  console.log('🎉 ORRA Database Seeded Successfully!');
  console.log('='.repeat(50));
  console.log(`👤 Users: ${mockUsers.length}`);
  console.log(`📝 Posts: ${allPosts.length}`);
  console.log(`📸 Stories: ${storyUsers.length}`);
  console.log(`🎬 Reels: ${reelsData.length}`);
  console.log(`💃 Dance Entries: ${danceEntriesData.length}`);
  console.log(`🏠 Hubs: ${hubsData.length}`);
  console.log(`💬 Chats: ${Object.keys(chatHistoryData).length}`);
  console.log(`🔔 Notifications: ${notificationsData.length}`);
  console.log(`🔗 Follows: ${followPairs.length}`);
  console.log('');
  console.log('🔑 All users login with password: password123');
  console.log('📧 Nick Joseph (CEO): nick@orra.app');
  console.log('📧 Jessica Art: jessica@orra.app');
  console.log('='.repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
