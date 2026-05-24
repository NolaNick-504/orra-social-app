import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'password123';

// ============================================================
// ORRA Profile Songs (from /public/music/orra/)
// ============================================================
const ORRA_SONGS = [
  { url: '/music/orra/orra-gives-me-everything.mp3', title: 'ORRA Gives Me Everything', artist: 'ORRA' },
  { url: '/music/orra/like-and-follow.mp3', title: 'Like and Follow', artist: 'ORRA' },
  { url: '/music/orra/welcome-to-my-page.mp3', title: 'Welcome to My Page', artist: 'ORRA' },
  { url: '/music/orra/orra.mp3', title: 'ORRA', artist: 'ORRA' },
  { url: '/music/orra/back-of-the-tracks.mp3', title: 'Back of the Tracks', artist: 'ORRA' },
];

// ============================================================
// 25 Realistic Emotion Bots + Founder
// ============================================================

const mockUsers = [
  // ========================================
  // FOUNDER ACCOUNT
  // ========================================
  {
    id: 'founder',
    email: 'nickjoseph8087@gmail.com',
    name: 'Nick Orraceo',
    handle: '@nickorraceo',
    avatar: '/images/avatars/bots/founder-avatar.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Founder of ORRA — building the next-gen social universe where creativity meets connection. Turning vision into reality, one pulse at a time. New Orleans born, worldwide impact.',
    location: 'New Orleans, LA',
    website: 'orra.app',
    verified: true,
    online: true,
    auraTokens: 100000,
    auraLevel: 51,
    auraXP: 750,
    badges: ['Early Adopter', 'ORRA OG', 'Founder', 'Visionary', 'ORRA Architect'],
    profileSong: ORRA_SONGS[3], // "ORRA"
  },

  // ========================================
  // 25 EMOTION BOTS
  // ========================================
  {
    id: 'bot01',
    email: 'bot01@orra.app',
    name: 'Amira Johnson',
    handle: '@amiraj',
    avatar: '/images/avatars/bots/bot01.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Pediatric nurse by day, plant mom always. Trying to keep my succulents alive and my heart full. Coffee is a food group.',
    location: 'Houston, TX',
    website: 'amiraj.orra.app',
    verified: false,
    online: true,
    auraTokens: 320,
    auraLevel: 4,
    auraXP: 180,
    badges: ['Early Adopter', 'Plant Parent'],
    profileSong: ORRA_SONGS[4],
  },
  {
    id: 'bot02',
    email: 'bot02@orra.app',
    name: 'Devin Mitchell',
    handle: '@devinmitch',
    avatar: '/images/avatars/bots/bot02.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'High school football coach. Still think about that one play in 2019. Raising two wild boys and trying to be the man they deserve.',
    location: 'Birmingham, AL',
    website: '',
    verified: false,
    online: false,
    auraTokens: 145,
    auraLevel: 2,
    auraXP: 90,
    badges: [],
    profileSong: ORRA_SONGS[2],
  },
  {
    id: 'bot03',
    email: 'bot03@orra.app',
    name: 'Sofia Reyes',
    handle: '@sofiareyes',
    avatar: '/images/avatars/bots/bot03.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'First-gen college grad. Marketing coordinator who spends too much on iced matcha. My dog Bruno is my entire personality.',
    location: 'Phoenix, AZ',
    website: 'sofiareyes.orra.app',
    verified: true,
    online: true,
    auraTokens: 480,
    auraLevel: 6,
    auraXP: 310,
    badges: ['Trendsetter', 'Early Adopter'],
    profileSong: ORRA_SONGS[1],
  },
  {
    id: 'bot04',
    email: 'bot04@orra.app',
    name: 'Marcus Rivera',
    handle: '@marcusr',
    avatar: '/images/avatars/bots/bot04.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Dance instructor and choreographer. If my body can move, I am creating. Every beat tells a story and I am just trying to translate it.',
    location: 'Miami, FL',
    website: 'marcusr.orra.app',
    verified: true,
    online: true,
    auraTokens: 650,
    auraLevel: 8,
    auraXP: 420,
    badges: ['Top Creator', 'Dance King'],
    profileSong: ORRA_SONGS[0],
  },
  {
    id: 'bot05',
    email: 'bot05@orra.app',
    name: 'Raj Patel',
    handle: '@rajp',
    avatar: '/images/avatars/bots/bot05.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Software engineer who accidentally became a food blogger. My code compiles, my curries simmer. Life is about balance.',
    location: 'Austin, TX',
    website: 'rajp.orra.app',
    verified: false,
    online: true,
    auraTokens: 210,
    auraLevel: 3,
    auraXP: 140,
    badges: ['Foodie Elite'],
    profileSong: ORRA_SONGS[4],
  },
  {
    id: 'bot06',
    email: 'bot06@orra.app',
    name: 'Tasha Washington',
    handle: '@tashawash',
    avatar: '/images/avatars/bots/bot06.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Hair stylist and salon owner. Been doing hair since I was 12. Your crown is my canvas. Black girl magic is not a trend, it is a lifestyle.',
    location: 'Atlanta, GA',
    website: 'tashawash.orra.app',
    verified: true,
    online: true,
    auraTokens: 530,
    auraLevel: 7,
    auraXP: 380,
    badges: ['Style Icon', 'ORRA OG'],
    profileSong: ORRA_SONGS[1],
  },
  {
    id: 'bot07',
    email: 'bot07@orra.app',
    name: 'Chris Nakamura',
    handle: '@chrisnaka',
    avatar: '/images/avatars/bots/bot07.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Electrician by trade, gamer by night. My van has more RGB than my PC and I am not sorry about it. Catch me on ORRA Prism at midnight.',
    location: 'Portland, OR',
    website: '',
    verified: false,
    online: false,
    auraTokens: 95,
    auraLevel: 1,
    auraXP: 55,
    badges: [],
    profileSong: ORRA_SONGS[2],
  },
  {
    id: 'bot08',
    email: 'bot08@orra.app',
    name: 'Elena Vasquez',
    handle: '@elenav',
    avatar: '/images/avatars/bots/bot08.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Wanderlust is my default setting. 23 countries and counting. I collect sunsets and questionable street food. Life is too short for boring meals.',
    location: 'San Diego, CA',
    website: 'elenav.orra.app',
    verified: true,
    online: true,
    auraTokens: 390,
    auraLevel: 5,
    auraXP: 250,
    badges: ['Explorer', 'Early Adopter'],
    profileSong: ORRA_SONGS[4],
  },
  {
    id: 'bot09',
    email: 'bot09@orra.app',
    name: 'Donte Jackson',
    handle: '@dontej',
    avatar: '/images/avatars/bots/bot09.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Aspiring music producer working out of my bedroom. My mama says my beats slap and she is never wrong. Chicago born, raised on house music.',
    location: 'Chicago, IL',
    website: 'dontej.orra.app',
    verified: false,
    online: true,
    auraTokens: 175,
    auraLevel: 2,
    auraXP: 110,
    badges: ['Beat Maker'],
    profileSong: ORRA_SONGS[0],
  },
  {
    id: 'bot10',
    email: 'bot10@orra.app',
    name: 'Luna Kim',
    handle: '@lunakim',
    avatar: '/images/avatars/bots/bot10.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Freelance illustrator and cat enthusiast. I draw things that make people feel something. My two cats supervise all my work and they are harsh critics.',
    location: 'Seattle, WA',
    website: 'lunakim.art',
    verified: true,
    online: true,
    auraTokens: 420,
    auraLevel: 5,
    auraXP: 290,
    badges: ['Top Creator', 'Art Soul'],
    profileSong: ORRA_SONGS[3],
  },
  {
    id: 'bot11',
    email: 'bot11@orra.app',
    name: 'Terrence Brooks',
    handle: '@terryb',
    avatar: '/images/avatars/bots/bot11.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Warehouse supervisor and weekend mechanic. I fix things for a living and for fun. My truck is my baby. Married 15 years, still smiling.',
    location: 'Memphis, TN',
    website: '',
    verified: false,
    online: false,
    auraTokens: 80,
    auraLevel: 1,
    auraXP: 45,
    badges: [],
    profileSong: ORRA_SONGS[4],
  },
  {
    id: 'bot12',
    email: 'bot12@orra.app',
    name: 'Maya Chen',
    handle: '@mayachen',
    avatar: '/images/avatars/bots/bot12.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Food blogger and home chef. My kitchen is my therapy. Sharing recipes that bring people together because food is love made visible.',
    location: 'San Francisco, CA',
    website: 'mayachen.orra.app',
    verified: true,
    online: false,
    auraTokens: 275,
    auraLevel: 3,
    auraXP: 200,
    badges: ['Foodie Elite'],
    profileSong: ORRA_SONGS[2],
  },
  {
    id: 'bot13',
    email: 'bot13@orra.app',
    name: 'Zara Miles',
    handle: '@zaramiles',
    avatar: '/images/avatars/bots/bot13.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Fashion & lifestyle | NYC to LA | Living out loud and styling every moment. Every sidewalk is a runway if you walk with purpose.',
    location: 'Los Angeles, CA',
    website: 'zaramiles.orra.app',
    verified: true,
    online: true,
    auraTokens: 410,
    auraLevel: 5,
    auraXP: 280,
    badges: ['Style Icon', 'Trendsetter'],
    profileSong: ORRA_SONGS[1],
  },
  {
    id: 'bot14',
    email: 'bot14@orra.app',
    name: 'Jaylen Parker',
    handle: '@jayparker',
    avatar: '/images/avatars/bots/bot14.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Gamer & streamer | Competitive FPS | Catch me live on ORRA Prism. I talk trash but I back it up. Diamond rank or nothing.',
    location: 'Atlanta, GA',
    website: 'jayparker.orra.app',
    verified: false,
    online: true,
    auraTokens: 150,
    auraLevel: 2,
    auraXP: 95,
    badges: [],
    profileSong: ORRA_SONGS[0],
  },
  {
    id: 'bot15',
    email: 'bot15@orra.app',
    name: 'Dre Williams',
    handle: '@drewilliams',
    avatar: '/images/avatars/bots/bot15.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Music producer & DJ | Beats that move the culture. Been in the studio since I was 15. Chicago raised me, music saved me.',
    location: 'Chicago, IL',
    website: 'drewilliams.orra.app',
    verified: true,
    online: true,
    auraTokens: 500,
    auraLevel: 6,
    auraXP: 350,
    badges: ['Beat Maker', 'Judge'],
    profileSong: ORRA_SONGS[0],
  },
  {
    id: 'bot16',
    email: 'bot16@orra.app',
    name: 'Nia Okafor',
    handle: '@niaokafor',
    avatar: '/images/avatars/bots/bot16.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Yoga instructor and wellness advocate. Healing is not linear and that is okay. Be gentle with yourself today. Breath first, everything else second.',
    location: 'Denver, CO',
    website: 'niaokafor.orra.app',
    verified: true,
    online: true,
    auraTokens: 340,
    auraLevel: 4,
    auraXP: 230,
    badges: ['Wellness Warrior'],
    profileSong: ORRA_SONGS[3],
  },
  {
    id: 'bot17',
    email: 'bot17@orra.app',
    name: 'Trevon Harris',
    handle: '@trevonh',
    avatar: '/images/avatars/bots/bot17.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Community college student figuring it out. Some days I feel like I am failing, other days I know I am just growing. Either way, I keep showing up.',
    location: 'Detroit, MI',
    website: '',
    verified: false,
    online: false,
    auraTokens: 60,
    auraLevel: 1,
    auraXP: 35,
    badges: [],
    profileSong: ORRA_SONGS[2],
  },
  {
    id: 'bot18',
    email: 'bot18@orra.app',
    name: 'Isla Brennan',
    handle: '@islabrennan',
    avatar: '/images/avatars/bots/bot18.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Barista by morning, poet by midnight. Words are the only thing that have never let me down. Currently writing my first chapbook.',
    location: 'Minneapolis, MN',
    website: 'islabrennan.orra.app',
    verified: false,
    online: true,
    auraTokens: 190,
    auraLevel: 2,
    auraXP: 130,
    badges: ['Word Smith'],
    profileSong: ORRA_SONGS[3],
  },
  {
    id: 'bot19',
    email: 'bot19@orra.app',
    name: 'Kai Tanaka',
    handle: '@kaitanaka',
    avatar: '/images/avatars/bots/bot19.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Skater, artist, chaos enthusiast. I paint decks and break bones. The road rash is worth it. Living life on the edge of a grip tape.',
    location: 'Sacramento, CA',
    website: 'kaitanaka.orra.app',
    verified: false,
    online: true,
    auraTokens: 230,
    auraLevel: 3,
    auraXP: 160,
    badges: ['Thrill Seeker'],
    profileSong: ORRA_SONGS[4],
  },
  {
    id: 'bot20',
    email: 'bot20@orra.app',
    name: 'Brianna Taylor',
    handle: '@briannt',
    avatar: '/images/avatars/bots/bot20.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Single mom, full-time accountant, part-time superhero. My kids think I am cool and that is the only validation I need. Also I make killer mac and cheese.',
    location: 'Charlotte, NC',
    website: '',
    verified: false,
    online: false,
    auraTokens: 110,
    auraLevel: 1,
    auraXP: 70,
    badges: [],
    profileSong: ORRA_SONGS[2],
  },
  {
    id: 'bot21',
    email: 'bot21@orra.app',
    name: 'Omar Hassan',
    handle: '@omarhassan',
    avatar: '/images/avatars/bots/bot21.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Architecture student with too many sketches and not enough sleep. Dreaming in blueprints. Every building tells a story, I want to write them.',
    location: 'Philadelphia, PA',
    website: 'omarhassan.orra.app',
    verified: false,
    online: true,
    auraTokens: 165,
    auraLevel: 2,
    auraXP: 100,
    badges: ['Dreamer'],
    profileSong: ORRA_SONGS[1],
  },
  {
    id: 'bot22',
    email: 'bot22@orra.app',
    name: 'Rosa Delgado',
    handle: '@rosadelgado',
    avatar: '/images/avatars/bots/bot22.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Retired teacher, professional gardener, amateur comedian. My grandkids say I am dramatic and they are absolutely right. Life is too short to be subtle.',
    location: 'San Antonio, TX',
    website: '',
    verified: false,
    online: true,
    auraTokens: 200,
    auraLevel: 2,
    auraXP: 120,
    badges: ['Golden Heart'],
    profileSong: ORRA_SONGS[4],
  },
  {
    id: 'bot23',
    email: 'bot23@orra.app',
    name: 'Liam O\'Connor',
    handle: '@liamoconnor',
    avatar: '/images/avatars/bots/bot23.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'Firefighter and amateur chef. I run into burning buildings and then go home and make risotto. Adrenaline and butter, that is my love language.',
    location: 'Boston, MA',
    website: '',
    verified: true,
    online: false,
    auraTokens: 285,
    auraLevel: 3,
    auraXP: 190,
    badges: ['Hero', 'Foodie Elite'],
    profileSong: ORRA_SONGS[0],
  },
  {
    id: 'bot24',
    email: 'bot24@orra.app',
    name: 'Jade Thompson',
    handle: '@jadethompson',
    avatar: '/images/avatars/bots/bot24.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'College athlete turned personal trainer. I believe in showing up even when you do not want to. Your only competition is who you were yesterday.',
    location: 'Nashville, TN',
    website: 'jadethompson.orra.app',
    verified: true,
    online: true,
    auraTokens: 360,
    auraLevel: 4,
    auraXP: 240,
    badges: ['Fitness First', 'Motivator'],
    profileSong: ORRA_SONGS[1],
  },
  {
    id: 'bot25',
    email: 'bot25@orra.app',
    name: 'Ethan Park',
    handle: '@ethanpark',
    avatar: '/images/avatars/bots/bot25.jpg',
    coverImage: '/images/profile-cover.jpg',
    bio: 'High school math teacher who makes dank memes on the side. Yes I am the teacher students actually like. No I will not bump your grade.',
    location: 'Columbus, OH',
    website: 'ethanpark.orra.app',
    verified: false,
    online: true,
    auraTokens: 255,
    auraLevel: 3,
    auraXP: 170,
    badges: ['Meme Lord'],
    profileSong: ORRA_SONGS[3],
  },
];

// ============================================================
// POSTS — 50+ everyday people content
// ============================================================

const feedPosts = [
  // ---- Founder posts ----
  {
    id: 'p0founder',
    authorId: 'founder',
    text: 'Welcome to ORRA! This is the future of social media — real connections, real content, real rewards. We are just getting started. The best is yet to come!',
    images: [],
    likesCount: 50000,
    commentsCount: 2500,
    sharesCount: 10000,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p0founder2',
    authorId: 'founder',
    text: 'Late night in the studio working on something special for the ORRA community. The updates coming this month are going to change everything. Stay tuned.',
    images: ['/images/posts/studio.jpg'],
    likesCount: 32400,
    commentsCount: 1800,
    sharesCount: 7200,
    vibeTag: 'focused',
    type: 'image',
  },
  {
    id: 'p0founder3',
    authorId: 'founder',
    text: 'ORRA just hit 1000 users and I am beyond grateful. Every single one of you believed in this vision before anyone else did. This is YOUR platform. We building together.',
    images: [],
    likesCount: 42000,
    commentsCount: 3200,
    sharesCount: 15000,
    vibeTag: 'hyped',
    type: 'text',
  },

  // ---- Amira (bot01) — nurse, plant mom ----
  {
    id: 'p01a',
    authorId: 'bot01',
    text: '12 hour shift done and my snake plant is still alive. Honestly one of those days where the little wins are everything. Grateful for my coworkers who kept me sane today.',
    images: ['/images/posts/nurse-shift.jpg'],
    likesCount: 845,
    commentsCount: 67,
    sharesCount: 23,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p01b',
    authorId: 'bot01',
    text: 'My patient today told me I made her hospital stay bearable. I almost cried right there at the nurses station. This is why I do what I do.',
    images: [],
    likesCount: 2100,
    commentsCount: 189,
    sharesCount: 340,
    vibeTag: 'peaceful',
    type: 'text',
  },
  {
    id: 'p01c',
    authorId: 'bot01',
    text: 'Night shift nurses, I see you. The silence at 3 AM when all your patients are sleeping is both peaceful and terrifying. Stay strong out there.',
    images: ['/images/posts/nurse-shift.jpg'],
    likesCount: 2100,
    commentsCount: 167,
    sharesCount: 234,
    vibeTag: 'peaceful',
    type: 'image',
  },
  {
    id: 'p01d',
    authorId: 'bot01',
    text: 'My succulent collection is officially out of control. 27 plants and counting. My apartment looks like a greenhouse and I am not even a little bit sorry about it.',
    images: [],
    likesCount: 1340,
    commentsCount: 89,
    sharesCount: 45,
    vibeTag: 'chill',
    type: 'text',
  },

  // ---- Devin (bot02) — football coach, dad ----
  {
    id: 'p02a',
    authorId: 'bot02',
    text: 'One of my kids asked me if I ever get tired of coaching. Told him I get tired of LOSING. But seriously, watching these boys grow into young men makes every 5 AM worth it.',
    images: ['/images/posts/coaching-field.jpg'],
    likesCount: 1567,
    commentsCount: 98,
    sharesCount: 45,
    vibeTag: 'focused',
    type: 'image',
  },
  {
    id: 'p02b',
    authorId: 'bot02',
    text: 'My youngest just beat me in Madden. I am not even mad, I am terrified for the future. This kid has no mercy.',
    images: [],
    likesCount: 4200,
    commentsCount: 312,
    sharesCount: 890,
    vibeTag: 'laughing',
    type: 'text',
  },
  {
    id: 'p02c',
    authorId: 'bot02',
    text: 'First game of the season Friday night! These boys have been grinding all summer. If you are in Birmingham, come through. We about to put on a show.',
    images: ['/images/posts/coaching-field.jpg'],
    likesCount: 2100,
    commentsCount: 134,
    sharesCount: 67,
    vibeTag: 'hyped',
    type: 'image',
  },

  // ---- Sofia (bot03) — marketing, matcha, dog ----
  {
    id: 'p03a',
    authorId: 'bot03',
    text: 'Bruno ate my favorite sandals and I still kissed him goodnight. This is what unconditional love looks like and it is embarrassing.',
    images: ['/images/posts/dog-sandals.jpg'],
    likesCount: 5600,
    commentsCount: 234,
    sharesCount: 670,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p03b',
    authorId: 'bot03',
    text: 'First gen grads, where you at? Just paid off my last student loan and I am literally crying at my desk. Three jobs, no sleep, but we made it. Mama, we made it.',
    images: ['/images/posts/student-loan-paid.jpg'],
    likesCount: 18500,
    commentsCount: 1200,
    sharesCount: 4500,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p03c',
    authorId: 'bot03',
    text: 'This AI just generated a full album in 30 seconds and honestly some of the tracks are genuinely good. Are we watching the birth of a new genre or the death of human creativity? Discuss.',
    images: [],
    likesCount: 15600,
    commentsCount: 1200,
    sharesCount: 4500,
    vibeTag: 'focused',
    type: 'text',
  },

  // ---- Marcus (bot04) — dance instructor ----
  {
    id: 'p04a',
    authorId: 'bot04',
    text: 'Dance practice went hard today! New choreo dropping this weekend. Been working on something special for the ORRA Dance Off!',
    images: ['/images/posts/dance-studio.jpg'],
    likesCount: 5678,
    commentsCount: 234,
    sharesCount: 156,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p04b',
    authorId: 'bot04',
    text: 'One of my students just nailed a routine she has been struggling with for weeks. The look on her face was everything. This is why I teach.',
    images: ['/images/posts/dance-studio.jpg'],
    likesCount: 3400,
    commentsCount: 178,
    sharesCount: 120,
    vibeTag: 'peaceful',
    type: 'image',
  },
  {
    id: 'p04c',
    authorId: 'bot04',
    text: 'Choreography tip: Stop thinking about the steps and start feeling the music. Your body already knows what to do. Trust the rhythm and let it move you.',
    images: [],
    likesCount: 4200,
    commentsCount: 267,
    sharesCount: 345,
    vibeTag: 'focused',
    type: 'text',
  },

  // ---- Raj (bot05) — software engineer, food blogger ----
  {
    id: 'p05a',
    authorId: 'bot05',
    text: 'My code works! *changes nothing* My code does not work... Welcome to programming! Also I made butter chicken from scratch tonight so at least one thing went right today.',
    images: ['/images/posts/butter-chicken.jpg'],
    likesCount: 7800,
    commentsCount: 456,
    sharesCount: 1200,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p05b',
    authorId: 'bot05',
    text: 'Deployed my first smart contract today! The decentralized web is the future and I am here for it. Web3 developers, where you at?',
    images: ['/images/posts/laptop-code.jpg'],
    likesCount: 3200,
    commentsCount: 234,
    sharesCount: 567,
    vibeTag: 'focused',
    type: 'image',
  },
  {
    id: 'p05c',
    authorId: 'bot05',
    text: 'Meal prep Sunday is my therapy. 5 days of butter chicken, dal, and fresh naan. My coworkers are jealous every single Monday and I am not sharing. Okay maybe a little.',
    images: ['/images/posts/butter-chicken.jpg'],
    likesCount: 4500,
    commentsCount: 289,
    sharesCount: 567,
    vibeTag: 'chill',
    type: 'image',
  },

  // ---- Tasha (bot06) — hair stylist ----
  {
    id: 'p06a',
    authorId: 'bot06',
    text: 'Client walked in with a Pinterest board and said "I trust you." That is the highest compliment a stylist can get. Came out looking like a whole different woman.',
    images: ['/images/posts/salon-chair.jpg'],
    likesCount: 8900,
    commentsCount: 567,
    sharesCount: 1234,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p06b',
    authorId: 'bot06',
    text: 'Six years ago I was renting a chair in someone else shop. Today I signed the lease on my SECOND salon location. Never let anyone tell you your dream is too big.',
    images: ['/images/posts/salon-chair.jpg'],
    likesCount: 24500,
    commentsCount: 1800,
    sharesCount: 5600,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p06c',
    authorId: 'bot06',
    text: 'Pop-up shop in SoHo this weekend! My new hair care line drops exclusively on ORRA first. Limited bottles, first come first serve. Set your reminders!',
    images: ['/images/posts/pop-up-shop.jpg'],
    likesCount: 14200,
    commentsCount: 980,
    sharesCount: 3400,
    vibeTag: 'hyped',
    type: 'image',
  },

  // ---- Chris (bot07) — electrician, gamer ----
  {
    id: 'p07a',
    authorId: 'bot07',
    text: 'When your WiFi dies mid-game and you just stare at the screen like... RIP my killstreak. Anyone else been there?',
    images: [],
    likesCount: 6700,
    commentsCount: 345,
    sharesCount: 567,
    vibeTag: 'laughing',
    type: 'text',
  },
  {
    id: 'p07b',
    authorId: 'bot07',
    text: 'Just rewired my entire gaming setup with custom LEDs. My electricity bill is going to be a problem but my setup is going to be UNREAL.',
    images: ['/images/posts/gaming-setup-leds.jpg'],
    likesCount: 2300,
    commentsCount: 145,
    sharesCount: 89,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p07c',
    authorId: 'bot07',
    text: 'The RGB debate is settled. More lights = more FPS. I will not be taking questions at this time. My van has more LEDs than my PC and I regret nothing.',
    images: ['/images/posts/gaming-setup-leds.jpg'],
    likesCount: 3400,
    commentsCount: 234,
    sharesCount: 567,
    vibeTag: 'laughing',
    type: 'image',
  },

  // ---- Elena (bot08) — traveler ----
  {
    id: 'p08a',
    authorId: 'bot08',
    text: 'Sunset vibes from Barcelona! Travel changes your perspective on everything. Every corner of this city tells a story, and I am here for all of it.',
    images: ['/images/posts/barcelona-alley.jpg'],
    likesCount: 4500,
    commentsCount: 189,
    sharesCount: 340,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p08b',
    authorId: 'bot08',
    text: 'Got lost in the streets of Lisbon at 2 AM and found the most incredible live music in a basement bar. The best moments are never planned.',
    images: ['/images/posts/lisbon-cafe.jpg'],
    likesCount: 6800,
    commentsCount: 312,
    sharesCount: 890,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p08c',
    authorId: 'bot08',
    text: 'Hidden gem in Lisbon — this cafe has the best pastel de nata I have ever tasted. Travel is the only thing you buy that makes you richer.',
    images: ['/images/posts/lisbon-cafe.jpg'],
    likesCount: 4200,
    commentsCount: 234,
    sharesCount: 456,
    vibeTag: 'chill',
    type: 'image',
  },

  // ---- Donte (bot09) — aspiring producer ----
  {
    id: 'p09a',
    authorId: 'bot09',
    text: 'NEW TRACK ALERT! Just dropped my latest beat. This one samples 4 different genres. Hip-hop meets jazz meets electronic meets soul. Preview coming tonight!',
    images: ['/images/posts/studio-beats.jpg'],
    likesCount: 2300,
    commentsCount: 167,
    sharesCount: 234,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p09b',
    authorId: 'bot09',
    text: 'Studio session went until 4 AM. My neighbors probably hate me but this beat is going to shake the culture. Mama said my beats slap and she is never wrong.',
    images: [],
    likesCount: 1800,
    commentsCount: 123,
    sharesCount: 178,
    vibeTag: 'focused',
    type: 'text',
  },

  // ---- Luna (bot10) — illustrator, cats ----
  {
    id: 'p10a',
    authorId: 'bot10',
    text: 'Just finished my latest digital art piece! Spent 12 hours on this one and every minute was worth it. My cats knocked over my coffee twice but we made it through.',
    images: ['/images/posts/digital-art-screen.jpg'],
    likesCount: 3400,
    commentsCount: 234,
    sharesCount: 89,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p10b',
    authorId: 'bot10',
    text: 'Art block is REAL. Been staring at a blank canvas for 2 hours. Send help, inspiration, or snacks. Preferably all three.',
    images: [],
    likesCount: 5600,
    commentsCount: 423,
    sharesCount: 678,
    vibeTag: 'laughing',
    type: 'text',
  },
  {
    id: 'p10c',
    authorId: 'bot10',
    text: 'Commission update: 3 slots left for February! If you want a custom illustration, DM me now. My cats approve all final designs and they are very critical.',
    images: ['/images/posts/digital-art-screen.jpg'],
    likesCount: 2800,
    commentsCount: 167,
    sharesCount: 234,
    vibeTag: 'focused',
    type: 'image',
  },

  // ---- Terrence (bot11) — mechanic ----
  {
    id: 'p11a',
    authorId: 'bot11',
    text: 'Finally got the truck running right after 3 weekends in the garage. There is something about fixing things with your own hands that you just cannot get anywhere else.',
    images: ['/images/posts/truck-engine.jpg'],
    likesCount: 980,
    commentsCount: 67,
    sharesCount: 23,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p11b',
    authorId: 'bot11',
    text: 'Wife asked me to fix the dishwasher. I fixed it. Then I broke it again. Then I fixed it again. The dishwasher and I are in a complicated relationship.',
    images: [],
    likesCount: 8900,
    commentsCount: 567,
    sharesCount: 2100,
    vibeTag: 'laughing',
    type: 'text',
  },

  // ---- Maya (bot12) — food blogger ----
  {
    id: 'p12a',
    authorId: 'bot12',
    text: 'Made authentic hand-pulled noodles from scratch today! The secret is the dough resting time — 2 hours minimum. Your taste buds will thank you.',
    images: ['/images/posts/hand-pulled-noodles.jpg'],
    likesCount: 5400,
    commentsCount: 345,
    sharesCount: 678,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p12b',
    authorId: 'bot12',
    text: 'Food hack: freeze your grapes. Trust me on this one — they become like little sorbet bites. Perfect summer snack. You can thank me later!',
    images: ['/images/posts/ramen.jpg'],
    likesCount: 6200,
    commentsCount: 456,
    sharesCount: 1890,
    vibeTag: 'chill',
    type: 'image',
  },

  // ---- Zara (bot13) — fashion ----
  {
    id: 'p13a',
    authorId: 'bot13',
    text: 'Just dropped my summer lookbook and I am obsessed with every single fit! From streetwear to couture, this season is all about mixing highs and lows.',
    images: ['/images/posts/fashion-streetwear.jpg'],
    likesCount: 8900,
    commentsCount: 567,
    sharesCount: 1234,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p13b',
    authorId: 'bot13',
    text: 'Met Gala inspired look — ORRA edition. Who says you need a red carpet to serve looks? Style is attitude, not labels.',
    images: ['/images/posts/fashion-streetwear.jpg'],
    likesCount: 19800,
    commentsCount: 1340,
    sharesCount: 4500,
    vibeTag: 'dramatic',
    type: 'image',
  },

  // ---- Jaylen (bot14) — gamer ----
  {
    id: 'p14a',
    authorId: 'bot14',
    text: 'CLUTCH WIN! Just hit a 1v5 in ranked and my whole squad went crazy. Streaming the rest of the session live on ORRA Prism!',
    images: ['/images/posts/ranked-victory.jpg'],
    likesCount: 6700,
    commentsCount: 423,
    sharesCount: 890,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p14b',
    authorId: 'bot14',
    text: 'Just hit Diamond rank in TWO games in the same week! The grind is real but the payoff is sweeter. Who else out here chasing ranks?',
    images: [],
    likesCount: 4500,
    commentsCount: 312,
    sharesCount: 432,
    vibeTag: 'hyped',
    type: 'text',
  },

  // ---- Dre (bot15) — producer/DJ ----
  {
    id: 'p15a',
    authorId: 'bot15',
    text: 'Just finished producing a beat that samples 4 different genres in one track. Hip-hop meets jazz meets electronic meets soul. Preview coming tonight!',
    images: ['/images/posts/studio-beats.jpg'],
    likesCount: 9800,
    commentsCount: 678,
    sharesCount: 1567,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p15b',
    authorId: 'bot15',
    text: 'Studio session went CRAZY last night. 6 beats in one session, all fire. The album is coming together and I cannot wait for yall to hear this.',
    images: ['/images/posts/studio-beats.jpg'],
    likesCount: 11000,
    commentsCount: 890,
    sharesCount: 2300,
    vibeTag: 'hyped',
    type: 'image',
  },
  {
    id: 'p15c',
    authorId: 'bot15',
    text: 'Anyone else addicted to the ORRA Dance Off? The talent this season is absolutely insane. I submitted my entry and I am literally shaking.',
    images: [],
    likesCount: 2900,
    commentsCount: 178,
    sharesCount: 456,
    vibeTag: 'hyped',
    type: 'text',
  },

  // ---- Nia (bot16) — yoga ----
  {
    id: 'p16a',
    authorId: 'bot16',
    text: 'Morning routine tip: Start with 5 minutes of breathwork before checking your phone. Game changer for mental clarity. Your mind will thank you.',
    images: ['/images/posts/yoga-morning.jpg'],
    likesCount: 1567,
    commentsCount: 98,
    sharesCount: 234,
    vibeTag: 'peaceful',
    type: 'image',
  },
  {
    id: 'p16b',
    authorId: 'bot16',
    text: 'Meditation challenge: 21 days, 10 minutes a day. Day 14 and I already feel like a completely different person. Better sleep, less anxiety, more clarity.',
    images: ['/images/posts/meditation-candle.jpg'],
    likesCount: 3800,
    commentsCount: 234,
    sharesCount: 890,
    vibeTag: 'peaceful',
    type: 'image',
  },
  {
    id: 'p16c',
    authorId: 'bot16',
    text: 'Your body is not a machine. Rest is not laziness, it is maintenance. Take the nap, skip the workout, drink the water. Be gentle with yourself today.',
    images: [],
    likesCount: 6700,
    commentsCount: 423,
    sharesCount: 1200,
    vibeTag: 'peaceful',
    type: 'text',
  },

  // ---- Trevon (bot17) — college student ----
  {
    id: 'p17a',
    authorId: 'bot17',
    text: 'Failed my calculus midterm. Again. But I showed up to class today and that counts for something, right? Just trying to keep going even when it feels impossible.',
    images: ['/images/posts/textbook-calculus.jpg'],
    likesCount: 1200,
    commentsCount: 145,
    sharesCount: 56,
    vibeTag: 'chill',
    type: 'image',
  },
  {
    id: 'p17b',
    authorId: 'bot17',
    text: 'My professor pulled me aside today and said she sees me trying. She told me to keep going. Sometimes one sentence from someone who believes in you changes everything.',
    images: [],
    likesCount: 15600,
    commentsCount: 1100,
    sharesCount: 4200,
    vibeTag: 'peaceful',
    type: 'text',
  },

  // ---- Isla (bot18) — poet ----
  {
    id: 'p18a',
    authorId: 'bot18',
    text: 'new poem:\n\ni keep rewriting the same letter\nin different handwriting\nhoping the words will finally\nsound like\nthe truth\n\nmaybe the ink is tired too',
    images: [],
    likesCount: 4100,
    commentsCount: 267,
    sharesCount: 890,
    vibeTag: 'dramatic',
    type: 'text',
  },
  {
    id: 'p18b',
    authorId: 'bot18',
    text: 'Open mic night and I am third on the list. Hands shaking, voice steady. Sometimes your body knows the words before your mind does. Tonight I read the poem I have been afraid to share.',
    images: ['/images/posts/open-mic.jpg'],
    likesCount: 2800,
    commentsCount: 198,
    sharesCount: 340,
    vibeTag: 'focused',
    type: 'image',
  },
  {
    id: 'p18c',
    authorId: 'bot18',
    text: 'The barista at my shop started writing my poem fragments on the cups. Someone told me they kept their coffee cup because the words made them feel seen. This is why I write.',
    images: ['/images/posts/open-mic.jpg'],
    likesCount: 5400,
    commentsCount: 345,
    sharesCount: 780,
    vibeTag: 'peaceful',
    type: 'image',
  },

  // ---- Kai (bot19) — skater ----
  {
    id: 'p19a',
    authorId: 'bot19',
    text: 'New skateboard deck design just dropped! Hand-painted cyberpunk dragon — this one took 40 hours and I am so proud of how it turned out. Limited run of 50!',
    images: ['/images/posts/skate-deck-art.jpg'],
    likesCount: 3400,
    commentsCount: 189,
    sharesCount: 345,
    vibeTag: 'dramatic',
    type: 'image',
  },
  {
    id: 'p19b',
    authorId: 'bot19',
    text: 'Ate pavement hard today. Road rash on my elbow, bruised ribs, and my board is cracked. But I landed the trick on the next try and that is all that matters.',
    images: ['/images/posts/skate-park.jpg'],
    likesCount: 2100,
    commentsCount: 134,
    sharesCount: 89,
    vibeTag: 'hyped',
    type: 'image',
  },

  // ---- Brianna (bot20) — single mom ----
  {
    id: 'p20a',
    authorId: 'bot20',
    text: 'My 6 year old just told me I am the best chef in the whole wide world. I made dinosaur nuggets. The bar is low but I will take the win.',
    images: ['/images/posts/dino-nuggets.jpg'],
    likesCount: 9200,
    commentsCount: 567,
    sharesCount: 2300,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p20b',
    authorId: 'bot20',
    text: 'Some days being a single mom feels like drowning and other days it feels like flying. Today was a flying day. My kids are my whole world and I would not change a thing.',
    images: [],
    likesCount: 14200,
    commentsCount: 890,
    sharesCount: 3400,
    vibeTag: 'peaceful',
    type: 'text',
  },
  {
    id: 'p20c',
    authorId: 'bot20',
    text: 'Tax season as an accountant AND a single mom is my personal villain origin story. If you see me crying at my desk, just slide coffee my way and walk away slowly.',
    images: [],
    likesCount: 7800,
    commentsCount: 567,
    sharesCount: 1900,
    vibeTag: 'laughing',
    type: 'text',
  },

  // ---- Omar (bot21) — architecture student ----
  {
    id: 'p21a',
    authorId: 'bot21',
    text: 'Been in the studio for 14 hours straight. My model is falling apart and my professor says "add more layers." Layers of WHAT, Professor Kim? My sanity?',
    images: ['/images/posts/architecture-model.jpg'],
    likesCount: 5600,
    commentsCount: 345,
    sharesCount: 890,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p21b',
    authorId: 'bot21',
    text: 'Just got my first internship at an architecture firm! I cried in the parking lot for ten minutes. All those sleepless nights were not for nothing.',
    images: [],
    likesCount: 11200,
    commentsCount: 678,
    sharesCount: 2100,
    vibeTag: 'hyped',
    type: 'text',
  },
  {
    id: 'p21c',
    authorId: 'bot21',
    text: '3D printing my first architectural model today. This is the future of design and I am holding it in my hands. 200 hours of rendering led to this moment.',
    images: ['/images/posts/architecture-model.jpg'],
    likesCount: 4500,
    commentsCount: 234,
    sharesCount: 567,
    vibeTag: 'focused',
    type: 'image',
  },

  // ---- Rosa (bot22) — retired teacher ----
  {
    id: 'p22a',
    authorId: 'bot22',
    text: 'My grandkids taught me how to use ORRA today. I already have 3 followers and I do not know what that means but I am winning! Abuela is online!',
    images: [],
    likesCount: 28900,
    commentsCount: 2100,
    sharesCount: 8900,
    vibeTag: 'laughing',
    type: 'text',
  },
  {
    id: 'p22b',
    authorId: 'bot22',
    text: 'Retired after 35 years of teaching. Today a former student emailed me to say I changed her life. I am not crying, you are crying. Actually we both are.',
    images: [],
    likesCount: 18700,
    commentsCount: 1340,
    sharesCount: 5600,
    vibeTag: 'peaceful',
    type: 'text',
  },
  {
    id: 'p22c',
    authorId: 'bot22',
    text: 'Just planted my spring garden! Tomatoes, jalapenos, cilantro, and sunflowers. My grandkids think I am farming. Abuela says it is called surviving with flavor.',
    images: ['/images/posts/garden-spring.jpg'],
    likesCount: 3400,
    commentsCount: 189,
    sharesCount: 234,
    vibeTag: 'chill',
    type: 'image',
  },

  // ---- Liam (bot23) — firefighter ----
  {
    id: 'p23a',
    authorId: 'bot23',
    text: 'Just got back from a call. Everyone is safe. That is the only thing that matters. Hug your people tight tonight, you never know.',
    images: [],
    likesCount: 8500,
    commentsCount: 423,
    sharesCount: 1200,
    vibeTag: 'peaceful',
    type: 'text',
  },
  {
    id: 'p23b',
    authorId: 'bot23',
    text: 'Made risotto for the station tonight. The boys said it was the best thing I have ever cooked. I told them it was the first thing I have ever cooked properly. Honesty is the best policy.',
    images: ['/images/posts/fire-station.jpg'],
    likesCount: 4300,
    commentsCount: 289,
    sharesCount: 567,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p23c',
    authorId: 'bot23',
    text: 'The things you see in this job make you appreciate every single normal day. Today was a normal day and I am grateful for every boring minute of it.',
    images: ['/images/posts/fire-station.jpg'],
    likesCount: 6700,
    commentsCount: 345,
    sharesCount: 890,
    vibeTag: 'peaceful',
    type: 'image',
  },

  // ---- Jade (bot24) — trainer ----
  {
    id: 'p24a',
    authorId: 'bot24',
    text: 'Just finished a 10K run in under 45 minutes! 6 months ago I could not even run a mile without stopping. Consistency is literally the only secret. Start small, show up daily.',
    images: ['/images/posts/running-trail.jpg'],
    likesCount: 5600,
    commentsCount: 345,
    sharesCount: 890,
    vibeTag: 'focused',
    type: 'image',
  },
  {
    id: 'p24b',
    authorId: 'bot24',
    text: '5 yoga poses that actually cure desk posture. I have been teaching these for 10 years and they never fail. Save this for later — your back will thank you.',
    images: ['/images/posts/yoga-morning.jpg'],
    likesCount: 6100,
    commentsCount: 389,
    sharesCount: 1200,
    vibeTag: 'peaceful',
    type: 'image',
  },

  // ---- Ethan (bot25) — teacher, memes ----
  {
    id: 'p25a',
    authorId: 'bot25',
    text: 'POV: You said "just one more episode" 4 hours ago and now it is 3 AM. Asking for a friend. The friend is me.',
    images: ['/images/posts/late-night-tv.jpg'],
    likesCount: 15600,
    commentsCount: 1200,
    sharesCount: 3400,
    vibeTag: 'laughing',
    type: 'image',
  },
  {
    id: 'p25b',
    authorId: 'bot25',
    text: 'That moment when you wave back at someone who was not waving at you... Then pretend you were fixing your hair. I have done this four times this week.',
    images: [],
    likesCount: 23100,
    commentsCount: 1800,
    sharesCount: 5600,
    vibeTag: 'laughing',
    type: 'text',
  },
  {
    id: 'p25c',
    authorId: 'bot25',
    text: 'A student just told me I am the only teacher who makes math not terrible. I will put that on my tombstone. "He made math not terrible."',
    images: [],
    likesCount: 19800,
    commentsCount: 1450,
    sharesCount: 4800,
    vibeTag: 'laughing',
    type: 'text',
  },
];

// ============================================================
// COMMENTS — 80+ realistic conversation replies
// ============================================================

const commentsData = [
  // Comments on founder welcome post
  { id: 'c01', postId: 'p0founder', authorId: 'bot04', text: 'ORRA is about to change the game! Let us go!', parentId: null, replyToName: null },
  { id: 'c02', postId: 'p0founder', authorId: 'bot06', text: 'Already in love with this platform. The vibes are immaculate.', parentId: null, replyToName: null },
  { id: 'c03', postId: 'p0founder', authorId: 'bot10', text: 'The future is NOW. Proud to be here from day one!', parentId: null, replyToName: null },
  { id: 'c04', postId: 'p0founder', authorId: 'bot22', text: 'My grandkids showed me this app and I am OBSESSED. Abuela is online!', parentId: 'c02', replyToName: 'Tasha Washington' },
  { id: 'c05', postId: 'p0founder', authorId: 'bot13', text: 'This platform is giving everything it needs to give. Period.', parentId: null, replyToName: null },

  // Comments on Sofia's first-gen grad post
  { id: 'c06', postId: 'p03b', authorId: 'bot17', text: 'As a first-gen student still in the struggle, this gives me so much hope. Congrats Sofia!', parentId: null, replyToName: null },
  { id: 'c07', postId: 'p03b', authorId: 'bot20', text: 'Paying off student loans is no joke. You should be SO proud of yourself!', parentId: null, replyToName: null },
  { id: 'c08', postId: 'p03b', authorId: 'bot21', text: 'We made it! First gen grads run the world. Congrats!', parentId: 'c06', replyToName: 'Trevon Harris' },
  { id: 'c09', postId: 'p03b', authorId: 'bot03', text: 'Thank you everyone! Could not have done it without the village. Mama sacrificed everything for this moment.', parentId: 'c07', replyToName: 'Brianna Taylor' },

  // Comments on Tasha's second salon post
  { id: 'c10', postId: 'p06b', authorId: 'bot13', text: 'QUEEN! This is what hard work looks like. So proud of you!', parentId: null, replyToName: null },
  { id: 'c11', postId: 'p06b', authorId: 'bot01', text: 'From renting a chair to two locations! You are an inspiration Tasha!', parentId: null, replyToName: null },
  { id: 'c12', postId: 'p06b', authorId: 'bot06', text: 'Six years of blood, sweat, and hair dye! Thank you all for believing in me!', parentId: 'c10', replyToName: 'Zara Miles' },
  { id: 'c13', postId: 'p06b', authorId: 'bot22', text: 'This is the kind of story that makes me believe in people. Congratulations mija!', parentId: null, replyToName: null },

  // Comments on Marcus's dance posts
  { id: 'c14', postId: 'p04a', authorId: 'bot15', text: 'Those moves are CLEAN. You are going to destroy the Dance Off this year!', parentId: null, replyToName: null },
  { id: 'c15', postId: 'p04a', authorId: 'bot10', text: 'The energy in this video is unmatched! We need a collab!', parentId: null, replyToName: null },
  { id: 'c16', postId: 'p04b', authorId: 'bot19', text: 'Moments like that are why we do what we do. That student will remember you forever.', parentId: null, replyToName: null },
  { id: 'c17', postId: 'p04b', authorId: 'bot16', text: 'Teaching is the most underrated superpower. Keep inspiring Marcus!', parentId: null, replyToName: null },

  // Comments on Raj's coding/food post
  { id: 'c18', postId: 'p05a', authorId: 'bot05', text: 'The butter chicken was the real MVP tonight. Code can wait, curry cannot.', parentId: null, replyToName: null },
  { id: 'c19', postId: 'p05a', authorId: 'bot12', text: 'That butter chicken recipe when? Asking for literally everyone!', parentId: null, replyToName: null },
  { id: 'c20', postId: 'p05a', authorId: 'bot23', text: 'As a fellow code-and-cook person, I respect this deeply. The duality of man.', parentId: null, replyToName: null },

  // Comments on Devin's Madden post
  { id: 'c21', postId: 'p02b', authorId: 'bot24', text: 'Your kid has no mercy and I respect that. Future champion in the making!', parentId: null, replyToName: null },
  { id: 'c22', postId: 'p02b', authorId: 'bot25', text: 'My students beat me at Smash Bros all the time. The youth are terrifying.', parentId: null, replyToName: null },
  { id: 'c23', postId: 'p02b', authorId: 'bot02', text: 'He talked trash the whole game too. Gets it from his mama honestly.', parentId: 'c21', replyToName: 'Jade Thompson' },

  // Comments on Isla's poem
  { id: 'c24', postId: 'p18a', authorId: 'bot10', text: 'This hit different. The line about tired ink? I felt that in my bones.', parentId: null, replyToName: null },
  { id: 'c25', postId: 'p18a', authorId: 'bot17', text: 'I keep rereading this. Sometimes words find you exactly when you need them.', parentId: null, replyToName: null },
  { id: 'c26', postId: 'p18a', authorId: 'bot22', text: 'Mija, you have a gift. Keep writing. The world needs your words.', parentId: null, replyToName: null },
  { id: 'c27', postId: 'p18a', authorId: 'bot18', text: 'Thank you. Writing is the only way I know how to be honest.', parentId: 'c24', replyToName: 'Luna Kim' },

  // Comments on Trevon's professor post
  { id: 'c28', postId: 'p17b', authorId: 'bot20', text: 'One person believing in you can change your whole trajectory. Keep going king!', parentId: null, replyToName: null },
  { id: 'c29', postId: 'p17b', authorId: 'bot16', text: 'This is why teachers matter. They see what we cannot see in ourselves yet.', parentId: null, replyToName: null },
  { id: 'c30', postId: 'p17b', authorId: 'bot01', text: 'As someone who almost quit nursing school, I feel this so hard. One person changed everything for me too.', parentId: null, replyToName: null },
  { id: 'c31', postId: 'p17b', authorId: 'bot17', text: 'I am literally crying reading these comments. Thank you all for the love. I am not giving up.', parentId: 'c28', replyToName: 'Brianna Taylor' },

  // Comments on Rosa's ORRA post
  { id: 'c32', postId: 'p22a', authorId: 'bot13', text: 'Abuela is ONLINE! I am crying this is the best thing I have seen all day!', parentId: null, replyToName: null },
  { id: 'c33', postId: 'p22a', authorId: 'bot25', text: 'Mrs. Delgado is my favorite ORRA user and it is not even close.', parentId: null, replyToName: null },
  { id: 'c34', postId: 'p22a', authorId: 'bot22', text: 'Thank you mijo! My grandson says I am going viral? Is that good?', parentId: 'c32', replyToName: 'Zara Miles' },
  { id: 'c35', postId: 'p22a', authorId: 'bot06', text: 'Rosa you are the icon we did not know we needed! Keep posting!', parentId: null, replyToName: null },

  // Comments on Brianna's kids post
  { id: 'c36', postId: 'p20a', authorId: 'bot22', text: 'Dinosaur nuggets are gourmet when made with love! Keep winning mama!', parentId: null, replyToName: null },
  { id: 'c37', postId: 'p20a', authorId: 'bot12', text: 'I am a food blogger and even I respect the dinosaur nugget. Do not let anyone take that from you.', parentId: null, replyToName: null },
  { id: 'c38', postId: 'p20a', authorId: 'bot01', text: 'The best chef award goes to Brianna! Dino nuggets forever!', parentId: null, replyToName: null },

  // Comments on Liam's firefighter post
  { id: 'c39', postId: 'p23a', authorId: 'bot24', text: 'Thank you for what you do. Seriously. Yall are the real heroes.', parentId: null, replyToName: null },
  { id: 'c40', postId: 'p23a', authorId: 'bot11', text: 'Glad everyone is safe. Go rest, you earned it brother.', parentId: null, replyToName: null },
  { id: 'c41', postId: 'p23a', authorId: 'bot16', text: 'Sending you and your crew so much love tonight. Take care of yourself too.', parentId: null, replyToName: null },

  // Comments on Maya's food posts
  { id: 'c42', postId: 'p12a', authorId: 'bot05', text: 'Two hours resting time? I have been doing it wrong my whole life. Recipe PLEASE!', parentId: null, replyToName: null },
  { id: 'c43', postId: 'p12a', authorId: 'bot23', text: 'I made this and my station crew lost their minds. Best recipe on ORRA.', parentId: null, replyToName: null },
  { id: 'c44', postId: 'p12b', authorId: 'bot03', text: 'Freezing grapes?! My mind is blown. Trying this immediately!', parentId: null, replyToName: null },
  { id: 'c45', postId: 'p12b', authorId: 'bot08', text: 'Learned this trick in Greece! Life changing snack for real.', parentId: null, replyToName: null },

  // Comments on Zara's fashion posts
  { id: 'c46', postId: 'p13a', authorId: 'bot06', text: 'Every single look is giving! You never miss Zara!', parentId: null, replyToName: null },
  { id: 'c47', postId: 'p13a', authorId: 'bot03', text: 'The third look is my favorite! Where did you get that jacket?', parentId: null, replyToName: null },
  { id: 'c48', postId: 'p13b', authorId: 'bot13', text: 'Style is an attitude and yours is unmatched. Slaying as always!', parentId: null, replyToName: null },
  { id: 'c49', postId: 'p13b', authorId: 'bot24', text: 'Even I want that outfit and I live in gym clothes. That says something!', parentId: null, replyToName: null },

  // Comments on Ethan's meme posts
  { id: 'c50', postId: 'p25a', authorId: 'bot07', text: 'It is 3 AM and I am reading this instead of sleeping. The irony is not lost on me.', parentId: null, replyToName: null },
  { id: 'c51', postId: 'p25a', authorId: 'bot14', text: 'This is literally me every night. I have a problem and I am not fixing it.', parentId: null, replyToName: null },
  { id: 'c52', postId: 'p25b', authorId: 'bot18', text: 'I did this at the coffee shop today. The barista saw everything. I am never going back.', parentId: null, replyToName: null },
  { id: 'c53', postId: 'p25b', authorId: 'bot22', text: 'Happened to me at church. I just started praising the Lord. Quick recovery!', parentId: null, replyToName: null },
  { id: 'c54', postId: 'p25c', authorId: 'bot17', text: 'Mr. Park if you are reading this, you are the reason I did not drop out of math. For real.', parentId: null, replyToName: null },
  { id: 'c55', postId: 'p25c', authorId: 'bot25', text: 'Making math not terrible is my entire personality at this point. I accept it.', parentId: 'c54', replyToName: 'Trevon Harris' },

  // Comments on Chris's gaming posts
  { id: 'c56', postId: 'p07a', authorId: 'bot14', text: 'This is the most relatable post on ORRA. WiFi dying mid-game is a crime against humanity.', parentId: null, replyToName: null },
  { id: 'c57', postId: 'p07a', authorId: 'bot09', text: 'I made a beat about this exact feeling. It is called "Disconnected" lol', parentId: null, replyToName: null },
  { id: 'c58', postId: 'p07b', authorId: 'bot07', text: 'The custom LEDs are going to be insane. Post a video when it is done!', parentId: null, replyToName: null },

  // Comments on Omar's internship post
  { id: 'c59', postId: 'p21b', authorId: 'bot21', text: 'Still processing. Cried happy tears for the first time in my life. All those all-nighters were worth it.', parentId: null, replyToName: null },
  { id: 'c60', postId: 'p21b', authorId: 'bot05', text: 'From one sleep-deprived student to another, this is the dream. Congrats Omar!', parentId: null, replyToName: null },
  { id: 'c61', postId: 'p21b', authorId: 'bot10', text: 'You are going to design buildings that change skylines. I can feel it!', parentId: null, replyToName: null },
  { id: 'c62', postId: 'p21b', authorId: 'bot17', text: 'This gives me hope that my grind will pay off too. Thank you for sharing this.', parentId: null, replyToName: null },

  // Comments on Donte's beat post
  { id: 'c63', postId: 'p09a', authorId: 'bot15', text: 'This kid has serious talent. The multi-genre sampling is next level.', parentId: null, replyToName: null },
  { id: 'c64', postId: 'p09a', authorId: 'bot04', text: 'We need to dance to this! The beat is infectious!', parentId: null, replyToName: null },
  { id: 'c65', postId: 'p09b', authorId: 'bot09', text: '4 AM is when the magic happens. Or the madness. Same thing really.', parentId: null, replyToName: null },

  // Comments on Elena's travel posts
  { id: 'c66', postId: 'p08a', authorId: 'bot08', text: 'Barcelona has my heart. The architecture alone is worth the trip!', parentId: null, replyToName: null },
  { id: 'c67', postId: 'p08a', authorId: 'bot03', text: 'Adding Barcelona to my bucket list right now. This is stunning!', parentId: null, replyToName: null },
  { id: 'c68', postId: 'p08b', authorId: 'bot12', text: '2 AM basement jazz in Lisbon? That sounds like a movie scene. Incredible!', parentId: null, replyToName: null },

  // Comments on Jade's fitness posts
  { id: 'c69', postId: 'p24a', authorId: 'bot19', text: '45 minute 10K is no joke! You are an absolute machine.', parentId: null, replyToName: null },
  { id: 'c70', postId: 'p24a', authorId: 'bot02', text: 'Consistency over intensity. Could not agree more. Keep pushing!', parentId: null, replyToName: null },
  { id: 'c71', postId: 'p24b', authorId: 'bot16', text: 'These poses saved my back after years of teaching yoga! Everyone save this post!', parentId: null, replyToName: null },
  { id: 'c72', postId: 'p24b', authorId: 'bot20', text: 'My desk posture is terrible. Trying these tonight, thank you Jade!', parentId: null, replyToName: null },

  // Comments on Kai's skating posts
  { id: 'c73', postId: 'p19a', authorId: 'bot10', text: 'That dragon deck is FIRE. The detail is insane. You painted this by hand?!', parentId: null, replyToName: null },
  { id: 'c74', postId: 'p19b', authorId: 'bot24', text: 'Eat pavement, get back up, land the trick. That is the skater way. Respect!', parentId: null, replyToName: null },

  // Comments on Nia's wellness posts
  { id: 'c75', postId: 'p16a', authorId: 'bot24', text: '5 minutes does not sound like much but it genuinely changes your whole morning. Try it people!', parentId: null, replyToName: null },
  { id: 'c76', postId: 'p16b', authorId: 'bot01', text: 'Day 8 of the meditation challenge here. Already sleeping so much better. Nia is onto something!', parentId: null, replyToName: null },
  { id: 'c77', postId: 'p16b', authorId: 'bot18', text: 'Meditation and poetry go hand in hand. The clarity is real.', parentId: null, replyToName: null },

  // Comments on Brianna's single mom post
  { id: 'c78', postId: 'p20b', authorId: 'bot22', text: 'Mija, you are raising the future. Every day you show up is a flying day. I am so proud of you.', parentId: null, replyToName: null },
  { id: 'c79', postId: 'p20b', authorId: 'bot11', text: 'My wife is a single mom from before we met. I see how hard you all work. Salute.', parentId: null, replyToName: null },
  { id: 'c80', postId: 'p20b', authorId: 'bot06', text: 'Single moms are the strongest people on earth. No debate.', parentId: null, replyToName: null },

  // Comments on founder's second post
  { id: 'c81', postId: 'p0founder2', authorId: 'bot04', text: 'Whatever is coming, we are ready! ORRA keeps getting better!', parentId: null, replyToName: null },
  { id: 'c82', postId: 'p0founder2', authorId: 'bot15', text: 'Late nights building something great — that is the energy! We got you Nick!', parentId: null, replyToName: null },
  { id: 'c83', postId: 'p0founder2', authorId: 'bot03', text: 'The community sees the work. Thank you for building something that feels different.', parentId: null, replyToName: null },

  // Comments on Luna's art posts
  { id: 'c84', postId: 'p10a', authorId: 'bot19', text: '12 hours well spent. This is incredible Luna! Your cats are chaotic but your art is flawless.', parentId: null, replyToName: null },
  { id: 'c85', postId: 'p10b', authorId: 'bot21', text: 'Architecture student checking in — I feel this in my soul. The blank page is the enemy.', parentId: null, replyToName: null },
  { id: 'c86', postId: 'p10b', authorId: 'bot05', text: 'Snacks incoming! Also, sometimes the best art comes from the block. Give it time.', parentId: null, replyToName: null },

  // Comments on extra posts
  { id: 'c87', postId: 'p20c', authorId: 'bot20', text: 'Coffee has been slid. Virtual hug from one tired professional to another!', parentId: null, replyToName: null },
  { id: 'c88', postId: 'p01c', authorId: 'bot01', text: 'The 3 AM quiet is a whole mood. Hang in there fellow night shift warriors.', parentId: null, replyToName: null },
  { id: 'c89', postId: 'p22c', authorId: 'bot22', text: 'Abuela knows best! That garden is going to be beautiful. Jalapenos are essential.', parentId: null, replyToName: null },
  { id: 'c90', postId: 'p03c', authorId: 'bot09', text: 'As a producer this terrifies and excites me. AI cannot replace soul though. At least I hope not.', parentId: null, replyToName: null },
];

// ============================================================
// LIKES — 100+ from various bots on various posts
// ============================================================

const likesData = [
  // Founder's posts
  { id: 'l01', userId: 'bot04', targetId: 'p0founder', targetType: 'post', reactionType: 'like' },
  { id: 'l02', userId: 'bot06', targetId: 'p0founder', targetType: 'post', reactionType: 'wow' },
  { id: 'l03', userId: 'bot10', targetId: 'p0founder', targetType: 'post', reactionType: 'like' },
  { id: 'l04', userId: 'bot13', targetId: 'p0founder', targetType: 'post', reactionType: 'like' },
  { id: 'l05', userId: 'bot03', targetId: 'p0founder', targetType: 'post', reactionType: 'like' },
  { id: 'l06', userId: 'bot22', targetId: 'p0founder', targetType: 'post', reactionType: 'care' },
  { id: 'l07', userId: 'bot15', targetId: 'p0founder2', targetType: 'post', reactionType: 'like' },
  { id: 'l08', userId: 'bot01', targetId: 'p0founder2', targetType: 'post', reactionType: 'like' },
  { id: 'l09', userId: 'bot24', targetId: 'p0founder2', targetType: 'post', reactionType: 'like' },

  // Amira's posts
  { id: 'l10', userId: 'bot16', targetId: 'p01a', targetType: 'post', reactionType: 'care' },
  { id: 'l11', userId: 'bot20', targetId: 'p01a', targetType: 'post', reactionType: 'like' },
  { id: 'l12', userId: 'bot01', targetId: 'p01b', targetType: 'post', reactionType: 'like' },
  { id: 'l13', userId: 'bot22', targetId: 'p01b', targetType: 'post', reactionType: 'care' },

  // Sofia's posts
  { id: 'l14', userId: 'bot17', targetId: 'p03b', targetType: 'post', reactionType: 'like' },
  { id: 'l15', userId: 'bot20', targetId: 'p03b', targetType: 'post', reactionType: 'like' },
  { id: 'l16', userId: 'bot21', targetId: 'p03b', targetType: 'post', reactionType: 'like' },
  { id: 'l17', userId: 'bot05', targetId: 'p03b', targetType: 'post', reactionType: 'wow' },
  { id: 'l18', userId: 'bot08', targetId: 'p03a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l19', userId: 'bot12', targetId: 'p03a', targetType: 'post', reactionType: 'like' },

  // Marcus's dance posts
  { id: 'l20', userId: 'bot15', targetId: 'p04a', targetType: 'post', reactionType: 'like' },
  { id: 'l21', userId: 'bot04', targetId: 'p04a', targetType: 'post', reactionType: 'wow' },
  { id: 'l22', userId: 'bot10', targetId: 'p04a', targetType: 'post', reactionType: 'like' },
  { id: 'l23', userId: 'bot19', targetId: 'p04b', targetType: 'post', reactionType: 'care' },
  { id: 'l24', userId: 'bot16', targetId: 'p04b', targetType: 'post', reactionType: 'like' },

  // Tasha's posts
  { id: 'l25', userId: 'bot13', targetId: 'p06a', targetType: 'post', reactionType: 'wow' },
  { id: 'l26', userId: 'bot01', targetId: 'p06b', targetType: 'post', reactionType: 'like' },
  { id: 'l27', userId: 'bot22', targetId: 'p06b', targetType: 'post', reactionType: 'care' },
  { id: 'l28', userId: 'bot03', targetId: 'p06b', targetType: 'post', reactionType: 'like' },

  // Devin's posts
  { id: 'l29', userId: 'bot24', targetId: 'p02b', targetType: 'post', reactionType: 'laughing' },
  { id: 'l30', userId: 'bot25', targetId: 'p02b', targetType: 'post', reactionType: 'laughing' },
  { id: 'l31', userId: 'bot02', targetId: 'p02a', targetType: 'post', reactionType: 'like' },

  // Raj's posts
  { id: 'l32', userId: 'bot12', targetId: 'p05a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l33', userId: 'bot23', targetId: 'p05a', targetType: 'post', reactionType: 'like' },
  { id: 'l34', userId: 'bot05', targetId: 'p05b', targetType: 'post', reactionType: 'like' },

  // Isla's poetry
  { id: 'l35', userId: 'bot10', targetId: 'p18a', targetType: 'post', reactionType: 'care' },
  { id: 'l36', userId: 'bot17', targetId: 'p18a', targetType: 'post', reactionType: 'like' },
  { id: 'l37', userId: 'bot22', targetId: 'p18a', targetType: 'post', reactionType: 'like' },
  { id: 'l38', userId: 'bot18', targetId: 'p18b', targetType: 'post', reactionType: 'like' },

  // Trevon's posts
  { id: 'l39', userId: 'bot20', targetId: 'p17b', targetType: 'post', reactionType: 'care' },
  { id: 'l40', userId: 'bot16', targetId: 'p17b', targetType: 'post', reactionType: 'like' },
  { id: 'l41', userId: 'bot01', targetId: 'p17b', targetType: 'post', reactionType: 'like' },
  { id: 'l42', userId: 'bot17', targetId: 'p17a', targetType: 'post', reactionType: 'like' },

  // Rosa's posts
  { id: 'l43', userId: 'bot13', targetId: 'p22a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l44', userId: 'bot25', targetId: 'p22a', targetType: 'post', reactionType: 'like' },
  { id: 'l45', userId: 'bot06', targetId: 'p22a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l46', userId: 'bot22', targetId: 'p22b', targetType: 'post', reactionType: 'care' },

  // Brianna's posts
  { id: 'l47', userId: 'bot22', targetId: 'p20a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l48', userId: 'bot12', targetId: 'p20a', targetType: 'post', reactionType: 'like' },
  { id: 'l49', userId: 'bot01', targetId: 'p20a', targetType: 'post', reactionType: 'like' },
  { id: 'l50', userId: 'bot06', targetId: 'p20b', targetType: 'post', reactionType: 'care' },

  // Liam's posts
  { id: 'l51', userId: 'bot24', targetId: 'p23a', targetType: 'post', reactionType: 'care' },
  { id: 'l52', userId: 'bot11', targetId: 'p23a', targetType: 'post', reactionType: 'like' },
  { id: 'l53', userId: 'bot16', targetId: 'p23a', targetType: 'post', reactionType: 'like' },
  { id: 'l54', userId: 'bot05', targetId: 'p23b', targetType: 'post', reactionType: 'laughing' },

  // Ethan's meme posts
  { id: 'l55', userId: 'bot07', targetId: 'p25a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l56', userId: 'bot14', targetId: 'p25a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l57', userId: 'bot18', targetId: 'p25b', targetType: 'post', reactionType: 'laughing' },
  { id: 'l58', userId: 'bot22', targetId: 'p25b', targetType: 'post', reactionType: 'laughing' },
  { id: 'l59', userId: 'bot17', targetId: 'p25c', targetType: 'post', reactionType: 'like' },

  // Jade's fitness posts
  { id: 'l60', userId: 'bot19', targetId: 'p24a', targetType: 'post', reactionType: 'wow' },
  { id: 'l61', userId: 'bot02', targetId: 'p24a', targetType: 'post', reactionType: 'like' },
  { id: 'l62', userId: 'bot16', targetId: 'p24b', targetType: 'post', reactionType: 'like' },
  { id: 'l63', userId: 'bot20', targetId: 'p24b', targetType: 'post', reactionType: 'like' },

  // Maya's food posts
  { id: 'l64', userId: 'bot05', targetId: 'p12a', targetType: 'post', reactionType: 'like' },
  { id: 'l65', userId: 'bot23', targetId: 'p12a', targetType: 'post', reactionType: 'like' },
  { id: 'l66', userId: 'bot03', targetId: 'p12b', targetType: 'post', reactionType: 'wow' },
  { id: 'l67', userId: 'bot08', targetId: 'p12b', targetType: 'post', reactionType: 'like' },

  // Zara's fashion posts
  { id: 'l68', userId: 'bot06', targetId: 'p13a', targetType: 'post', reactionType: 'wow' },
  { id: 'l69', userId: 'bot03', targetId: 'p13a', targetType: 'post', reactionType: 'like' },
  { id: 'l70', userId: 'bot24', targetId: 'p13b', targetType: 'post', reactionType: 'like' },

  // Jaylen's gaming posts
  { id: 'l71', userId: 'bot07', targetId: 'p14a', targetType: 'post', reactionType: 'wow' },
  { id: 'l72', userId: 'bot14', targetId: 'p14b', targetType: 'post', reactionType: 'like' },

  // Dre's music posts
  { id: 'l73', userId: 'bot04', targetId: 'p15a', targetType: 'post', reactionType: 'like' },
  { id: 'l74', userId: 'bot09', targetId: 'p15a', targetType: 'post', reactionType: 'wow' },
  { id: 'l75', userId: 'bot15', targetId: 'p15b', targetType: 'post', reactionType: 'like' },

  // Nia's wellness posts
  { id: 'l76', userId: 'bot24', targetId: 'p16a', targetType: 'post', reactionType: 'like' },
  { id: 'l77', userId: 'bot01', targetId: 'p16b', targetType: 'post', reactionType: 'like' },
  { id: 'l78', userId: 'bot18', targetId: 'p16b', targetType: 'post', reactionType: 'like' },

  // Chris's gaming posts
  { id: 'l79', userId: 'bot14', targetId: 'p07a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l80', userId: 'bot09', targetId: 'p07a', targetType: 'post', reactionType: 'like' },
  { id: 'l81', userId: 'bot07', targetId: 'p07b', targetType: 'post', reactionType: 'like' },

  // Elena's travel posts
  { id: 'l82', userId: 'bot08', targetId: 'p08a', targetType: 'post', reactionType: 'like' },
  { id: 'l83', userId: 'bot03', targetId: 'p08a', targetType: 'post', reactionType: 'like' },
  { id: 'l84', userId: 'bot12', targetId: 'p08b', targetType: 'post', reactionType: 'wow' },

  // Omar's posts
  { id: 'l85', userId: 'bot05', targetId: 'p21b', targetType: 'post', reactionType: 'like' },
  { id: 'l86', userId: 'bot10', targetId: 'p21b', targetType: 'post', reactionType: 'like' },
  { id: 'l87', userId: 'bot17', targetId: 'p21b', targetType: 'post', reactionType: 'like' },

  // Kai's skate posts
  { id: 'l88', userId: 'bot10', targetId: 'p19a', targetType: 'post', reactionType: 'wow' },
  { id: 'l89', userId: 'bot24', targetId: 'p19b', targetType: 'post', reactionType: 'like' },

  // Donte's beats
  { id: 'l90', userId: 'bot15', targetId: 'p09a', targetType: 'post', reactionType: 'like' },
  { id: 'l91', userId: 'bot04', targetId: 'p09a', targetType: 'post', reactionType: 'like' },

  // Luna's art
  { id: 'l92', userId: 'bot19', targetId: 'p10a', targetType: 'post', reactionType: 'wow' },
  { id: 'l93', userId: 'bot21', targetId: 'p10b', targetType: 'post', reactionType: 'like' },
  { id: 'l94', userId: 'bot05', targetId: 'p10b', targetType: 'post', reactionType: 'care' },

  // Terrence's posts
  { id: 'l95', userId: 'bot11', targetId: 'p11a', targetType: 'post', reactionType: 'like' },
  { id: 'l96', userId: 'bot23', targetId: 'p11b', targetType: 'post', reactionType: 'laughing' },

  // Extra posts
  { id: 'l97', userId: 'bot09', targetId: 'p03c', targetType: 'post', reactionType: 'like' },
  { id: 'l98', userId: 'bot15', targetId: 'p15c', targetType: 'post', reactionType: 'like' },
  { id: 'l99', userId: 'bot12', targetId: 'p08c', targetType: 'post', reactionType: 'like' },
  { id: 'l100', userId: 'bot19', targetId: 'p19a', targetType: 'post', reactionType: 'like' },
  { id: 'l101', userId: 'bot22', targetId: 'p22c', targetType: 'post', reactionType: 'like' },
  { id: 'l102', userId: 'bot20', targetId: 'p20c', targetType: 'post', reactionType: 'laughing' },
  { id: 'l103', userId: 'bot01', targetId: 'p01c', targetType: 'post', reactionType: 'care' },
  { id: 'l104', userId: 'bot03', targetId: 'p06c', targetType: 'post', reactionType: 'like' },
  { id: 'l105', userId: 'bot13', targetId: 'p06c', targetType: 'post', reactionType: 'wow' },

  // Founder likes on community posts
  { id: 'l106', userId: 'founder', targetId: 'p03b', targetType: 'post', reactionType: 'like' },
  { id: 'l107', userId: 'founder', targetId: 'p06b', targetType: 'post', reactionType: 'wow' },
  { id: 'l108', userId: 'founder', targetId: 'p17b', targetType: 'post', reactionType: 'care' },
  { id: 'l109', userId: 'founder', targetId: 'p22a', targetType: 'post', reactionType: 'laughing' },
  { id: 'l110', userId: 'founder', targetId: 'p21b', targetType: 'post', reactionType: 'like' },
];

// ============================================================
// FOLLOW RELATIONSHIPS
// ============================================================

// All bots follow the founder, plus cross-follows for community feel
const followsData: Array<{ followerId: string; followingId: string }> = [];

// All bots follow the founder
for (let i = 1; i <= 25; i++) {
  const botId = `bot${String(i).padStart(2, '0')}`;
  followsData.push({ followerId: botId, followingId: 'founder' });
}

// Founder follows all bots back
for (let i = 1; i <= 25; i++) {
  const botId = `bot${String(i).padStart(2, '0')}`;
  followsData.push({ followerId: 'founder', followingId: botId });
}

// Cross-follows between bots for community feel
const crossFollows = [
  ['bot04', 'bot15'], ['bot15', 'bot04'], // Marcus & Dre - dance/music collab
  ['bot03', 'bot13'], ['bot13', 'bot03'], // Sofia & Zara - marketing/fashion
  ['bot06', 'bot13'], ['bot13', 'bot06'], // Tasha & Zara - style icons
  ['bot01', 'bot16'], ['bot16', 'bot01'], // Amira & Nia - wellness/healthcare
  ['bot05', 'bot12'], ['bot12', 'bot05'], // Raj & Maya - foodies
  ['bot07', 'bot14'], ['bot14', 'bot07'], // Chris & Jaylen - gamers
  ['bot10', 'bot19'], ['bot19', 'bot10'], // Luna & Kai - artists
  ['bot17', 'bot21'], ['bot21', 'bot17'], // Trevon & Omar - students
  ['bot18', 'bot25'], ['bot25', 'bot18'], // Isla & Ethan - word lovers
  ['bot20', 'bot22'], ['bot22', 'bot20'], // Brianna & Rosa - maternal figures
  ['bot02', 'bot24'], ['bot24', 'bot02'], // Devin & Jade - fitness
  ['bot23', 'bot11'], ['bot11', 'bot23'], // Liam & Terrence - blue collar
  ['bot08', 'bot09'], ['bot09', 'bot08'], // Elena & Donte - creative
  ['bot03', 'bot06'], ['bot06', 'bot03'], // Sofia & Tasha - besties
  ['bot04', 'bot10'], ['bot10', 'bot04'], // Marcus & Luna - art+dance
  ['bot12', 'bot23'], ['bot23', 'bot12'], // Maya & Liam - food lovers
  ['bot01', 'bot20'], ['bot20', 'bot01'], // Amira & Brianna - working moms
  ['bot16', 'bot24'], ['bot24', 'bot16'], // Nia & Jade - wellness/fitness
  ['bot05', 'bot21'], ['bot21', 'bot05'], // Raj & Omar - tech
];

for (const [a, b] of crossFollows) {
  followsData.push({ followerId: a, followingId: b });
}

// ============================================================
// REELS DATA — 12 reels
// ============================================================

const reelsData = [
  { id: 'r1', title: 'Neon Dance Routine', creatorId: 'bot04', views: 2400000, likesCount: 189000, commentsCount: 12400, category: 'Dance', song: 'ORRA Gives Me Everything - ORRA', isRemix: true, thumbnail: '/images/reels/reel1.jpg' },
  { id: 'r2', title: 'Cooking Hacks: 5min Meals', creatorId: 'bot12', views: 890000, likesCount: 67000, commentsCount: 5600, category: 'Food', song: 'Welcome to My Page - ORRA', thumbnail: '/images/reels/reel2.jpg' },
  { id: 'r3', title: 'Beat Making From Scratch', creatorId: 'bot09', views: 1200000, likesCount: 145000, commentsCount: 8900, category: 'Music', song: 'Back of the Tracks - ORRA', thumbnail: '/images/reels/reel3.jpg' },
  { id: 'r4', title: 'Morning Yoga Flow', creatorId: 'bot16', views: 567000, likesCount: 34000, commentsCount: 2300, category: 'Sports', song: 'ORRA - ORRA', isLive: true, thumbnail: '/images/reels/reel4.jpg' },
  { id: 'r5', title: 'Street Art Process', creatorId: 'bot10', views: 1800000, likesCount: 210000, commentsCount: 15600, category: 'Art', song: 'Like and Follow - ORRA', isRemix: true, thumbnail: '/images/reels/reel5.jpg' },
  { id: 'r6', title: 'Comedy: When WiFi Dies', creatorId: 'bot07', views: 3100000, likesCount: 445000, commentsCount: 34200, category: 'Comedy', song: 'Back of the Tracks - ORRA', thumbnail: '/images/reels/reel6.jpg' },
  { id: 'r7', title: 'Skateboard Tricks', creatorId: 'bot19', views: 920000, likesCount: 78000, commentsCount: 4500, category: 'Sports', song: 'ORRA Gives Me Everything - ORRA', thumbnail: '/images/reels/reel7.jpg' },
  { id: 'r8', title: 'Beat Making Tutorial', creatorId: 'bot15', views: 1500000, likesCount: 167000, commentsCount: 11200, category: 'Music', song: 'Like and Follow - ORRA', isRemix: true, thumbnail: '/images/reels/reel8.jpg' },
  { id: 'r9', title: 'Fashion Haul: Summer', creatorId: 'bot13', views: 670000, likesCount: 45000, commentsCount: 3200, category: 'Trending', song: 'Welcome to My Page - ORRA', isLive: true, thumbnail: '/images/reels/reel9.jpg' },
  { id: 'r10', title: 'Dance Battle Finals', creatorId: 'bot04', views: 4200000, likesCount: 567000, commentsCount: 45600, category: 'Dance', song: 'ORRA Gives Me Everything - ORRA', isRemix: true, thumbnail: '/images/reels/reel10.jpg' },
  { id: 'r11', title: 'Sunset Timelapse', creatorId: 'bot08', views: 1100000, likesCount: 98000, commentsCount: 6700, category: 'Trending', song: 'ORRA - ORRA', thumbnail: '/images/reels/reel11.jpg' },
  { id: 'r12', title: 'Classroom Comedy', creatorId: 'bot25', views: 780000, likesCount: 56000, commentsCount: 4100, category: 'Comedy', song: 'Back of the Tracks - ORRA', thumbnail: '/images/reels/reel12.jpg' },
];

// ============================================================
// DANCE CHALLENGE + ENTRIES
// ============================================================

const danceEntriesData = [
  { id: 'de1', authorId: 'bot04', description: 'Electric slide meets hip-hop — bringing that Miami flavor!', thumbnail: '/images/dance/entry0.jpg', likesCount: 98420 },
  { id: 'de2', authorId: 'bot13', description: 'Contemporary fusion with a fashion twist', thumbnail: '/images/dance/entry1.jpg', likesCount: 87650 },
  { id: 'de3', authorId: 'bot10', description: 'Voguing with a digital art twist', thumbnail: '/images/dance/entry2.jpg', likesCount: 76340 },
  { id: 'de4', authorId: 'bot15', description: 'Breakdance meets ballet — the duality', thumbnail: '/images/dance/entry3.jpg', likesCount: 65230 },
  { id: 'de5', authorId: 'bot08', description: 'Latin dance fusion from around the world', thumbnail: '/images/dance/entry4.jpg', likesCount: 54120 },
  { id: 'de6', authorId: 'bot19', description: 'Krump energy with skate style!', thumbnail: '/images/dance/entry5.jpg', likesCount: 43010 },
  { id: 'de7', authorId: 'bot05', description: 'Robot dance challenge — engineer style', thumbnail: '/images/dance/entry6.jpg', likesCount: 38900 },
  { id: 'de8', authorId: 'bot07', description: 'Cyberpunk choreography — gaming meets dance', thumbnail: '/images/dance/entry7.jpg', likesCount: 32780 },
  { id: 'de9', authorId: 'bot24', description: 'Athletic flow — fitness meets rhythm', thumbnail: '/images/dance/entry8.jpg', likesCount: 28450 },
  { id: 'de10', authorId: 'bot09', description: 'Chicago house meets hip-hop — born on the South Side', thumbnail: '/images/dance/entry9.jpg', likesCount: 24120 },
];

// ============================================================
// HUBS DATA
// ============================================================

const hubsData = [
  { id: 'h1', name: 'Digital Artists', membersCount: 12400, onlineCount: 342, icon: '🎨', cover: '/images/hub1.jpg', description: 'Share your digital creations and get feedback from fellow artists' },
  { id: 'h2', name: 'Dance Crew', membersCount: 8900, onlineCount: 567, icon: '💃', cover: '/images/hub2.jpg', description: 'All dance styles welcome — learn, share, and compete' },
  { id: 'h3', name: 'Tech Innovators', membersCount: 15600, onlineCount: 890, icon: '🚀', cover: '/images/hub3.jpg', description: 'The future starts here — tech talk, dev tips, and AI debates' },
  { id: 'h4', name: 'Music Makers', membersCount: 9200, onlineCount: 234, icon: '🎵', cover: '/images/hub4.jpg', description: 'Create and collaborate — producers, DJs, and musicians unite' },
  { id: 'h5', name: 'Fitness First', membersCount: 11000, onlineCount: 456, icon: '💪', cover: '/images/hub5.jpg', description: 'Level up your fitness — tips, motivation, and accountability' },
  { id: 'h6', name: 'Foodies Unite', membersCount: 7800, onlineCount: 123, icon: '🍜', cover: '/images/hub6.jpg', description: 'Food from around the world — recipes, reviews, and restaurant recs' },
];

const hubPostsData: Record<string, Array<{ id: string; authorId: string; text: string; likesCount: number; commentsCount: number }>> = {
  h1: [
    { id: 'hp1-1', authorId: 'bot10', text: 'Just finished this cyberpunk cityscape! What do you all think? Feedback welcome!', likesCount: 234, commentsCount: 45 },
    { id: 'hp1-2', authorId: 'bot19', text: 'Anyone else using Procreate for digital art? Looking for brush recommendations!', likesCount: 89, commentsCount: 23 },
    { id: 'hp1-3', authorId: 'bot21', text: 'Art block is REAL. Been staring at a blank canvas for 2 hours. Send help and inspiration!', likesCount: 567, commentsCount: 78 },
  ],
  h2: [
    { id: 'hp2-1', authorId: 'bot04', text: 'New choreo dropping this weekend! Been working on something special for the ORRA Dance Off!', likesCount: 456, commentsCount: 89 },
    { id: 'hp2-2', authorId: 'bot13', text: 'Anyone want to collab on a duet dance? Looking for a partner for the challenge!', likesCount: 234, commentsCount: 56 },
    { id: 'hp2-3', authorId: 'bot24', text: 'Stretching routine for dancers! Do not skip your warmup, your body will thank you after practice.', likesCount: 312, commentsCount: 45 },
  ],
  h3: [
    { id: 'hp3-1', authorId: 'bot05', text: 'New AI model just dropped and it is INSANE. The creative applications are endless!', likesCount: 890, commentsCount: 123 },
    { id: 'hp3-2', authorId: 'bot21', text: 'Just built my first app with the new SDK. Documentation could use some work but the possibilities are amazing!', likesCount: 345, commentsCount: 67 },
    { id: 'hp3-3', authorId: 'bot07', text: 'Custom RGB setup is done. My electricity bill is going to be a problem but my setup is UNREAL.', likesCount: 234, commentsCount: 56 },
  ],
  h4: [
    { id: 'hp4-1', authorId: 'bot15', text: 'Studio session went crazy last night! New track coming this Friday!', likesCount: 678, commentsCount: 90 },
    { id: 'hp4-2', authorId: 'bot09', text: 'Beat making tutorial dropping tomorrow! Going to show you my whole workflow from bedroom to banger.', likesCount: 445, commentsCount: 56 },
    { id: 'hp4-3', authorId: 'bot18', text: 'Does anyone else write lyrics first and then build the beat around them? Looking for collaborators!', likesCount: 189, commentsCount: 34 },
  ],
  h5: [
    { id: 'hp5-1', authorId: 'bot16', text: 'Morning routine tip: 5 minutes of breathwork before checking your phone. Game changer!', likesCount: 567, commentsCount: 78 },
    { id: 'hp5-2', authorId: 'bot24', text: 'Just hit a new PR on deadlifts! Consistency is key. Keep pushing!', likesCount: 345, commentsCount: 45 },
    { id: 'hp5-3', authorId: 'bot02', text: 'Coach tip: hydration is not optional. If you are not drinking water, you are not training right.', likesCount: 234, commentsCount: 34 },
  ],
  h6: [
    { id: 'hp6-1', authorId: 'bot12', text: 'Made authentic paella from scratch! The secret is the saffron!', likesCount: 789, commentsCount: 134 },
    { id: 'hp6-2', authorId: 'bot05', text: 'Best ramen spot in the city? Need recommendations for this weekend!', likesCount: 234, commentsCount: 89 },
    { id: 'hp6-3', authorId: 'bot22', text: 'My garden jalapenos are finally ready! Salsa recipe coming this weekend. Abuela approved.', likesCount: 156, commentsCount: 23 },
  ],
};

// Hub member assignments
const hubMembersData: Record<string, string[]> = {
  h1: ['bot10', 'bot19', 'bot21', 'bot13', 'bot18'],
  h2: ['bot04', 'bot13', 'bot15', 'bot24', 'bot08'],
  h3: ['bot05', 'bot07', 'bot21', 'bot09'],
  h4: ['bot15', 'bot09', 'bot18', 'bot19'],
  h5: ['bot16', 'bot24', 'bot02', 'bot19', 'bot01'],
  h6: ['bot12', 'bot05', 'bot22', 'bot23', 'bot08'],
};

// ============================================================
// CHAT CONVERSATIONS
// ============================================================

const chatHistoryData: Array<{ chatKey: string; participants: string[]; unreadCounts: Record<string, number>; messages: Array<{ senderId: string; text: string }> }> = [
  // Founder chats
  {
    chatKey: 'mf1',
    participants: ['founder', 'bot04'],
    unreadCounts: { founder: 1, bot04: 0 },
    messages: [
      { senderId: 'bot04', text: 'Hey Nick! The Dance Off is going crazy this year!' },
      { senderId: 'founder', text: 'I know! The talent is insane' },
      { senderId: 'bot04', text: 'Can we collab on the next challenge? I have some wild ideas!' },
    ],
  },
  {
    chatKey: 'mf2',
    participants: ['founder', 'bot15'],
    unreadCounts: { founder: 2, bot15: 0 },
    messages: [
      { senderId: 'bot15', text: 'Just dropped a new beat for ORRA!' },
      { senderId: 'founder', text: 'Let me hear it!' },
      { senderId: 'bot15', text: 'The studio session was legendary. This one is different.' },
    ],
  },
  {
    chatKey: 'mf3',
    participants: ['founder', 'bot06'],
    unreadCounts: { founder: 0, bot06: 1 },
    messages: [
      { senderId: 'bot06', text: 'Nick! The hair care line is ready for the ORRA drop!' },
      { senderId: 'founder', text: 'Amazing! Let us make it an exclusive launch!' },
      { senderId: 'bot06', text: 'Yes! I will send over the product shots tonight' },
    ],
  },
  {
    chatKey: 'mf4',
    participants: ['founder', 'bot10'],
    unreadCounts: { founder: 0, bot10: 0 },
    messages: [
      { senderId: 'bot10', text: 'Love what you built with ORRA! The art community is thriving!' },
      { senderId: 'founder', text: 'Thanks Luna! We are just getting started' },
      { senderId: 'bot10', text: 'The art tools are incredible. My illustrations have never looked better!' },
    ],
  },
  // Bot-to-bot chats
  {
    chatKey: 'mb1',
    participants: ['bot03', 'bot13'],
    unreadCounts: { bot03: 2, bot13: 0 },
    messages: [
      { senderId: 'bot13', text: 'Hey! Did you see the new dance challenge?' },
      { senderId: 'bot03', text: 'Yes!! The moves are incredible this year' },
      { senderId: 'bot13', text: 'We need to collab on a reel! Fashion meets dance!' },
    ],
  },
  {
    chatKey: 'mb2',
    participants: ['bot05', 'bot12'],
    unreadCounts: { bot05: 0, bot12: 0 },
    messages: [
      { senderId: 'bot12', text: 'Working on a new recipe that blends Indian and Chinese flavors' },
      { senderId: 'bot05', text: 'That sounds incredible! Butter chicken egg rolls?' },
      { senderId: 'bot12', text: 'You read my mind! Testing it tonight' },
    ],
  },
  {
    chatKey: 'mb3',
    participants: ['bot04', 'bot15'],
    unreadCounts: { bot04: 1, bot15: 0 },
    messages: [
      { senderId: 'bot15', text: 'The dance off track is going to be FIRE' },
      { senderId: 'bot04', text: 'I am so ready for this! Been practicing all week' },
      { senderId: 'bot15', text: 'Let us make this the biggest challenge yet!' },
    ],
  },
  {
    chatKey: 'mb4',
    participants: ['bot07', 'bot14'],
    unreadCounts: { bot07: 3, bot14: 0 },
    messages: [
      { senderId: 'bot14', text: 'Ranked session tonight? I am on a winning streak!' },
      { senderId: 'bot07', text: 'Let us go! Just finished my LED setup, streaming from the cave tonight' },
      { senderId: 'bot14', text: 'Perfect! I will bring the snacks, you bring the skills' },
    ],
  },
  {
    chatKey: 'mb5',
    participants: ['bot01', 'bot20'],
    unreadCounts: { bot01: 0, bot20: 0 },
    messages: [
      { senderId: 'bot20', text: 'Long day at work. Kids were wild today!' },
      { senderId: 'bot01', text: 'Same! 12 hour shift. But we made it through!' },
      { senderId: 'bot20', text: 'Working moms unite! We are basically superheroes' },
    ],
  },
  {
    chatKey: 'mb6',
    participants: ['bot17', 'bot21'],
    unreadCounts: { bot17: 0, bot21: 2 },
    messages: [
      { senderId: 'bot21', text: 'Just got the internship!' },
      { senderId: 'bot17', text: 'BRO THAT IS AMAZING!! So happy for you!' },
      { senderId: 'bot21', text: 'Thanks! Your turn is coming, I can feel it. Keep going.' },
    ],
  },
  {
    chatKey: 'mb7',
    participants: ['bot18', 'bot25'],
    unreadCounts: { bot18: 0, bot25: 1 },
    messages: [
      { senderId: 'bot25', text: 'Your poem today was beautiful Isla' },
      { senderId: 'bot18', text: 'Thank you Ethan. That means a lot coming from you' },
      { senderId: 'bot25', text: 'Want to collab? I do wordplay comedy, you do poetry. Could be magic.' },
    ],
  },
  {
    chatKey: 'mb8',
    participants: ['bot16', 'bot24'],
    unreadCounts: { bot16: 0, bot24: 0 },
    messages: [
      { senderId: 'bot24', text: 'Morning session was incredible today!' },
      { senderId: 'bot16', text: 'I need to get back into that routine' },
      { senderId: 'bot24', text: 'Tomorrow morning? 6 AM? Let us hold each other accountable!' },
    ],
  },
];

// ============================================================
// NOTIFICATIONS DATA
// ============================================================

const notificationsData = [
  // Founder notifications
  { id: 'nf1', userId: 'founder', triggeredByUserId: 'bot04', action: 'liked your post', type: 'like', thumbnail: '/images/posts/dance1.jpg', postId: 'p0founder' },
  { id: 'nf2', userId: 'founder', triggeredByUserId: 'bot06', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'nf3', userId: 'founder', triggeredByUserId: 'bot13', action: 'commented: "ORRA is the future!"', type: 'comment', thumbnail: '/images/posts/fashion1.jpg', postId: 'p0founder' },
  { id: 'nf4', userId: 'founder', triggeredByUserId: 'bot15', action: 'shared your post', type: 'share', thumbnail: '/images/posts/album1.jpg', postId: 'p0founder2' },
  { id: 'nf5', userId: 'founder', triggeredByUserId: 'bot10', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'nf6', userId: 'founder', triggeredByUserId: 'bot22', action: 'commented: "Abuela loves ORRA!"', type: 'comment', thumbnail: '', postId: 'p0founder' },
  { id: 'nf7', userId: 'founder', triggeredByUserId: 'bot03', action: 'shared your post to their ORRA', type: 'share', thumbnail: '/images/posts/sunset1.jpg', postId: 'p0founder2' },

  // Bot notifications
  { id: 'n1', userId: 'bot13', triggeredByUserId: 'bot04', action: 'liked your dance video', type: 'like', thumbnail: '/images/posts/dance1.jpg', postId: 'p04a' },
  { id: 'n2', userId: 'bot13', triggeredByUserId: 'bot06', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'n3', userId: 'bot13', triggeredByUserId: 'bot04', action: 'commented: "Insane moves!"', type: 'comment', thumbnail: '/images/posts/dance2.jpg', postId: 'p04a' },
  { id: 'n4', userId: 'bot06', triggeredByUserId: 'bot13', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'n5', userId: 'bot06', triggeredByUserId: 'bot01', action: 'liked your salon post', type: 'like', thumbnail: '/images/posts/fashion1.jpg', postId: 'p06a' },
  { id: 'n6', userId: 'bot03', triggeredByUserId: 'bot17', action: 'commented: "This gives me hope!"', type: 'comment', thumbnail: '', postId: 'p03b' },
  { id: 'n7', userId: 'bot17', triggeredByUserId: 'bot20', action: 'liked your post', type: 'like', thumbnail: '', postId: 'p17b' },
  { id: 'n8', userId: 'bot21', triggeredByUserId: 'bot10', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'n9', userId: 'bot22', triggeredByUserId: 'bot13', action: 'liked your post', type: 'like', thumbnail: '', postId: 'p22a' },
  { id: 'n10', userId: 'bot12', triggeredByUserId: 'bot05', action: 'commented: "Recipe when?!"', type: 'comment', thumbnail: '/images/posts/food1.jpg', postId: 'p12a' },
  { id: 'n11', userId: 'bot20', triggeredByUserId: 'bot22', action: 'commented: "Keep winning mama!"', type: 'comment', thumbnail: '', postId: 'p20a' },
  { id: 'n12', userId: 'bot24', triggeredByUserId: 'bot19', action: 'liked your fitness post', type: 'like', thumbnail: '', postId: 'p24a' },
  { id: 'n13', userId: 'bot25', triggeredByUserId: 'bot07', action: 'liked your meme', type: 'like', thumbnail: '', postId: 'p25a' },
  { id: 'n14', userId: 'bot18', triggeredByUserId: 'bot10', action: 'liked your poem', type: 'like', thumbnail: '', postId: 'p18a' },
  { id: 'n15', userId: 'bot08', triggeredByUserId: 'bot12', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'n16', userId: 'bot04', triggeredByUserId: 'founder', action: 'liked your dance post', type: 'like', thumbnail: '/images/posts/dance1.jpg', postId: 'p04a' },
  { id: 'n17', userId: 'bot09', triggeredByUserId: 'bot15', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'n18', userId: 'bot23', triggeredByUserId: 'bot24', action: 'liked your post', type: 'like', thumbnail: '', postId: 'p23a' },
  { id: 'n19', userId: 'bot01', triggeredByUserId: 'bot16', action: 'started following you', type: 'follow', thumbnail: '', postId: null },
  { id: 'n20', userId: 'bot02', triggeredByUserId: 'bot24', action: 'liked your coaching post', type: 'like', thumbnail: '', postId: 'p02a' },
];


// ============================================================
// SEED FUNCTION
// ============================================================

// Counters for safe-seed reporting
interface SeedCounts {
  created: number;
  skipped: number;
}


// ============================================================
// SAFE SEED: Only creates data that doesn't already exist.
// NEVER wipes user customizations (profile changes, ads, etc.)
// Set ORRA_SEED_FORCE=1 to force full wipe + reseed (DANGEROUS).
// ============================================================

interface SeedCounts {
  usersCreated: number; usersSkipped: number;
  postsCreated: number; postsSkipped: number;
  commentsCreated: number; commentsSkipped: number;
  likesCreated: number; likesSkipped: number;
  followsCreated: number; followsSkipped: number;
  storiesCreated: number; storiesSkipped: number;
  reelsCreated: number; reelsSkipped: number;
  danceCreated: number; danceSkipped: number;
  hubsCreated: number; hubsSkipped: number;
  chatsCreated: number; chatsSkipped: number;
  notifsCreated: number; notifsSkipped: number;
}

async function main() {
  const counts: SeedCounts = {
    usersCreated: 0, usersSkipped: 0,
    postsCreated: 0, postsSkipped: 0,
    commentsCreated: 0, commentsSkipped: 0,
    likesCreated: 0, likesSkipped: 0,
    followsCreated: 0, followsSkipped: 0,
    storiesCreated: 0, storiesSkipped: 0,
    reelsCreated: 0, reelsSkipped: 0,
    danceCreated: 0, danceSkipped: 0,
    hubsCreated: 0, hubsSkipped: 0,
    chatsCreated: 0, chatsSkipped: 0,
    notifsCreated: 0, notifsSkipped: 0,
  };

  const FORCE_WIPE = process.env.ORRA_SEED_FORCE === '1';

  if (FORCE_WIPE) {
    console.log('⚠️  FORCE WIPE MODE — Deleting all existing data!\n');
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
      try { await op(); } catch { /* Table may not exist */ }
    }
    console.log('✅ All data wiped\n');
  }

  console.log('🌱 Seeding ORRA database (safe mode — preserving existing data)...\n');

  // ========================================
  // 1. Create Users (skip if already exists)
  // ========================================
  console.log('👤 Ensuring users exist...');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const founderPassword = await bcrypt.hash('Weareone504', SALT_ROUNDS);

  for (const u of mockUsers) {
    const existing = await prisma.user.findFirst({ where: { id: u.id } });
    if (existing) {
      counts.usersSkipped++;
      continue;
    }
    const song = u.profileSong ?? ORRA_SONGS[0];
    await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        name: u.name,
        handle: u.handle,
        password: u.id === 'founder' ? founderPassword : hashedPassword,
        avatar: u.avatar,
        coverImage: u.coverImage ?? '/images/profile-cover.jpg',
        bio: u.bio ?? '',
        location: u.location ?? '',
        website: u.website ?? '',
        verified: u.verified ?? false,
        online: u.online ?? false,
        auraTokens: u.auraTokens,
        auraLevel: u.auraLevel,
        auraXP: u.auraXP ?? 50,
        badges: JSON.stringify(u.badges ?? []),
        profileSetupComplete: true,
        profileSongUrl: song.url,
        profileSongTitle: song.title,
        profileSongArtist: song.artist,
      },
    });
    counts.usersCreated++;
  }
  console.log('✅ Users: ${counts.usersCreated} created, ${counts.usersSkipped} skipped\n');

  // ========================================
  // 2. Create Posts (skip if already exists)
  // ========================================
  console.log('📝 Ensuring posts exist...');
  for (const p of feedPosts) {
    const existing = await prisma.post.findFirst({ where: { id: p.id } });
    if (existing) {
      counts.postsSkipped++;
      continue;
    }
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
    counts.postsCreated++;
  }
  console.log('✅ Posts: ${counts.postsCreated} created, ${counts.postsSkipped} skipped\n');

  // ========================================
  // 3. Create Comments (skip if already exists)
  // ========================================
  console.log('💬 Ensuring comments exist...');
  for (const c of commentsData) {
    const existing = await prisma.comment.findFirst({ where: { id: c.id } });
    if (existing) {
      counts.commentsSkipped++;
      continue;
    }
    await prisma.comment.create({
      data: {
        id: c.id,
        text: c.text,
        postId: c.postId,
        authorId: c.authorId,
        parentId: c.parentId,
        replyToName: c.replyToName,
        createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
      },
    });
    counts.commentsCreated++;
  }
  console.log('✅ Comments: ${counts.commentsCreated} created, ${counts.commentsSkipped} skipped\n');

  // ========================================
  // 4. Create Likes (skip if already exists)
  // ========================================
  console.log('❤️  Ensuring likes exist...');
  for (const l of likesData) {
    const existing = await prisma.like.findFirst({ where: { id: l.id } });
    if (existing) {
      counts.likesSkipped++;
      continue;
    }
    await prisma.like.create({
      data: {
        id: l.id,
        userId: l.userId,
        targetId: l.targetId,
        targetType: l.targetType,
        reactionType: l.reactionType,
      },
    });
    counts.likesCreated++;
  }
  console.log('✅ Likes: ${counts.likesCreated} created, ${counts.likesSkipped} skipped\n');

  // ========================================
  // 5. Create Follow Relationships (skip if already exists)
  // ========================================
  console.log('🔗 Ensuring follow relationships exist...');
  for (const f of followsData) {
    const existing = await prisma.follow.findFirst({
      where: { followerId: f.followerId, followingId: f.followingId },
    });
    if (existing) {
      counts.followsSkipped++;
      continue;
    }
    await prisma.follow.create({
      data: {
        followerId: f.followerId,
        followingId: f.followingId,
      },
    });
    counts.followsCreated++;
  }
  console.log('✅ Follows: ${counts.followsCreated} created, ${counts.followsSkipped} skipped\n');

  // ========================================
  // 6. Create Stories (skip if author already has stories)
  // ========================================
  console.log('📸 Ensuring stories exist...');
  const allUserIds = mockUsers.map(u => u.id);
  const storyImages = [
    '/images/stories/story1.jpg', '/images/stories/story2.jpg', '/images/stories/story3.jpg',
    '/images/stories/story4.jpg', '/images/stories/story5.jpg', '/images/stories/story6.jpg',
    '/images/stories/story7.jpg', '/images/stories/story8.jpg', '/images/stories/story9.jpg',
    '/images/stories/story10.jpg', '/images/stories/story11.jpg', '/images/stories/story12.jpg',
    '/images/stories/story13.jpg', '/images/stories/story14.jpg', '/images/stories/story15.jpg',
    '/images/stories/story16.jpg', '/images/dance-party.png', '/images/stories/story1.jpg',
    '/images/stories/story2.jpg', '/images/stories/story3.jpg', '/images/stories/story4.jpg',
    '/images/stories/story5.jpg', '/images/stories/story6.jpg', '/images/stories/story7.jpg',
    '/images/stories/story8.jpg', '/images/stories/story9.jpg',
  ];

  for (let i = 0; i < allUserIds.length; i++) {
    const existing = await prisma.story.findFirst({ where: { authorId: allUserIds[i] } });
    if (existing) {
      counts.storiesSkipped++;
      continue;
    }
    await prisma.story.create({
      data: {
        image: storyImages[i % storyImages.length],
        viewed: false,
        authorId: allUserIds[i],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    counts.storiesCreated++;
  }
  console.log('✅ Stories: ${counts.storiesCreated} created, ${counts.storiesSkipped} skipped\n');

  // ========================================
  // 7. Create Reels (skip if already exists)
  // ========================================
  console.log('🎬 Ensuring reels exist...');
  for (const r of reelsData) {
    const existing = await prisma.reel.findFirst({ where: { id: r.id } });
    if (existing) {
      counts.reelsSkipped++;
      continue;
    }
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
    counts.reelsCreated++;
  }
  console.log('✅ Reels: ${counts.reelsCreated} created, ${counts.reelsSkipped} skipped\n');

  // ========================================
  // 8. Create Dance Challenge + Entries (skip if already exists)
  // ========================================
  console.log('💃 Ensuring dance challenge exists...');
  const existingChallenge = await prisma.danceChallenge.findFirst({ where: { id: 'dc1' } });
  if (!existingChallenge) {
    await prisma.danceChallenge.create({
      data: {
        id: 'dc1',
        name: 'ORRA DANCE OFF 2027',
        hashtag: '#OrraDanceOff2027',
        song: 'ORRA Gives Me Everything - ORRA',
        description: 'Show us your best moves! Create a dance video using the official ORRA track and tag #OrraDanceOff2027. The top 3 entries with the most likes win exclusive ORRA plaques and tokens!',
        prize: '100,000 ORRA + Champion Plaque',
        secondPrize: '50,000 ORRA + Runner-Up Plaque',
        thirdPrize: '25,000 ORRA + 3rd Place Plaque',
        bannerImage: '/images/dance-banner.png',
        timeRemaining: 72 * 60 * 60,
        active: true,
      },
    });
    counts.danceCreated++;
  } else {
    counts.danceSkipped++;
  }

  for (const e of danceEntriesData) {
    const existing = await prisma.danceEntry.findFirst({ where: { id: e.id } });
    if (existing) {
      counts.danceSkipped++;
      continue;
    }
    await prisma.danceEntry.create({
      data: {
        id: e.id,
        description: e.description,
        thumbnail: e.thumbnail,
        likesCount: e.likesCount,
        authorId: e.authorId,
        challengeId: 'dc1',
      },
    });
    counts.danceCreated++;
  }
  console.log('✅ Dance: ${counts.danceCreated} created, ${counts.danceSkipped} skipped\n');

  // ========================================
  // 9. Create Hubs + Members + Posts (skip if already exists)
  // ========================================
  console.log('🏠 Ensuring hubs exist...');
  for (const h of hubsData) {
    const existingHub = await prisma.hub.findFirst({ where: { id: h.id } });
    if (!existingHub) {
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
      counts.hubsCreated++;
    } else {
      counts.hubsSkipped++;
    }

    // Add members (skip if already joined)
    const members = (hubMembersData as any)[h.id] ?? [];
    for (const userId of members) {
      const existingMember = await prisma.hubMember.findFirst({
        where: { userId, hubId: h.id },
      });
      if (existingMember) continue;
      await prisma.hubMember.create({
        data: { userId, hubId: h.id },
      });
    }

    // Add posts (skip if already exists)
    const hubPosts = (hubPostsData as any)[h.id] ?? [];
    for (const hp of hubPosts) {
      const existingPost = await prisma.hubPost.findFirst({ where: { id: hp.id } });
      if (existingPost) continue;
      await prisma.hubPost.create({
        data: {
          id: hp.id,
          text: hp.text,
          likesCount: hp.likesCount,
          commentsCount: hp.commentsCount,
          authorId: hp.authorId,
          hubId: h.id,
        },
      });
    }
  }
  console.log('✅ Hubs: ${counts.hubsCreated} created, ${counts.hubsSkipped} skipped\n');

  // ========================================
  // 10. Create Chat Conversations (skip if already exists)
  // ========================================
  console.log('💬 Ensuring chat conversations exist...');
  for (const chatData of chatHistoryData) {
    const existingChat = await prisma.chat.findFirst({ where: { id: chatData.chatKey } });
    if (existingChat) {
      counts.chatsSkipped++;
      continue;
    }

    const chat = await prisma.chat.create({
      data: { id: chatData.chatKey },
    });

    // Add members
    for (const userId of chatData.participants) {
      await prisma.chatMember.create({
        data: {
          chatId: chat.id,
          userId,
          unreadCount: chatData.unreadCounts[userId] ?? 0,
        },
      });
    }

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
    counts.chatsCreated++;
  }
  console.log('✅ Chats: ${counts.chatsCreated} created, ${counts.chatsSkipped} skipped\n');

  // ========================================
  // 11. Create Notifications (skip if already exists)
  // ========================================
  console.log('🔔 Ensuring notifications exist...');
  for (const n of notificationsData) {
    const existing = await prisma.notification.findFirst({ where: { id: n.id } });
    if (existing) {
      counts.notifsSkipped++;
      continue;
    }
    await prisma.notification.create({
      data: {
        id: n.id,
        userId: n.userId,
        triggeredByUserId: n.triggeredByUserId,
        action: n.action,
        type: n.type,
        thumbnail: n.thumbnail,
        postId: n.postId,
        read: false,
        createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      },
    });
    counts.notifsCreated++;
  }
  console.log('✅ Notifications: ${counts.notifsCreated} created, ${counts.notifsSkipped} skipped\n');

  // ========================================
  // 12. ALWAYS ensure founder password is correct
  // ========================================
  console.log('🔑 Ensuring founder password is set...');
  try {
    await prisma.user.update({
      where: { id: 'founder' },
      data: { password: founderPassword },
    });
    console.log('✅ Founder password set to Weareone504\n');
  } catch {
    try {
      await prisma.user.update({
        where: { email: 'nickjoseph8087@gmail.com' },
        data: { password: founderPassword },
      });
      console.log('✅ Founder password set (by email)\n');
    } catch {
      console.log('⚠️  No founder account found to update password\n');
    }
  }

  // ========================================
  // Summary
  // ========================================
  console.log('🎉 ORRA database seeded (safe mode)!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Users:         ${counts.usersCreated} created / ${counts.usersSkipped} skipped');
  console.log('📝 Posts:         ${counts.postsCreated} created / ${counts.postsSkipped} skipped');
  console.log('💬 Comments:      ${counts.commentsCreated} created / ${counts.commentsSkipped} skipped');
  console.log('❤️  Likes:         ${counts.likesCreated} created / ${counts.likesSkipped} skipped');
  console.log('🔗 Follows:       ${counts.followsCreated} created / ${counts.followsSkipped} skipped');
  console.log('📸 Stories:       ${counts.storiesCreated} created / ${counts.storiesSkipped} skipped');
  console.log('🎬 Reels:         ${counts.reelsCreated} created / ${counts.reelsSkipped} skipped');
  console.log('💃 Dance:         ${counts.danceCreated} created / ${counts.danceSkipped} skipped');
  console.log('🏠 Hubs:          ${counts.hubsCreated} created / ${counts.hubsSkipped} skipped');
  console.log('💬 Chats:         ${counts.chatsCreated} created / ${counts.chatsSkipped} skipped');
  console.log('🔔 Notifications: ${counts.notifsCreated} created / ${counts.notifsSkipped} skipped');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
