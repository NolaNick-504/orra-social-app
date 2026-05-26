#!/usr/bin/env node
/**
 * ORRA — Add 15 New Bots v2 (u32–u46) + Seed Realistic Content
 *
 * Creates 15 new bot users (u32–u46) with:
 * - Realistic name, handle, bio, location, website
 * - AI-generated profile pictures (z-ai-generate CLI)
 * - Profile songs (profileSongUrl, profileSongTitle, profileSongArtist)
 * - Hashed passwords (bcryptjs)
 *
 * Then seeds:
 * - 5–10 realistic posts per bot with AI-generated images MATCHING post text
 * - Multi-image posts (2–3 images from different angles)
 * - Contextual comments referencing specific post content
 * - Likes/reactions on posts
 *
 * Usage: node scripts/add-15-bots-v2.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================================================
// 15 NEW BOT PROFILES (u32–u46)
// ============================================================================
const NEW_BOTS = [
  {
    id: 'u32',
    name: 'Zoe Castillo',
    handle: 'zoecastillo',
    bio: 'Travel vlogger who quit corporate to see the world. 34 countries and counting. Currently slow-traveling through Southeast Asia. Your 9-5 is not the only way to live. Here to prove it',
    location: 'Bangkok, Thailand',
    website: 'https://zoecastillo.travel',
    personality: 'free-spirited',
    topics: ['travel', 'culture', 'adventure', 'digital nomad', 'street food'],
    vibeTags: ['peaceful', 'chill', 'dramatic'],
    speechStyle: ['the road teaches', 'wanderlust is real', 'this view tho', 'passport ready'],
    emotions: ['awestruck', 'grateful', 'wanderlust', 'free', 'inspired'],
    avatarPrompt: 'Adventurous Latina woman with sun-kissed skin and messy beach waves, wearing a linen tank top, tropical jungle background, travel lifestyle portrait, warm golden light',
    songTitle: 'Island in the Sun',
    songArtist: 'Weezer',
  },
  {
    id: 'u33',
    name: 'Dex Murphy',
    handle: 'dexmurphy',
    bio: 'Cybersecurity analyst by day, CTF player by night. I break things so you do not have to. Trust me, your passwords are terrible. Here to make the internet a slightly safer place',
    location: 'Washington, DC',
    website: 'https://dexmurphy.sec',
    personality: 'sharp',
    topics: ['cybersecurity', 'hacking', 'privacy', 'tech', 'CTF'],
    vibeTags: ['focused', 'news', 'chill'],
    speechStyle: ['trust me on this', 'the vulnerability is real', 'patch your systems', '0-day vibes'],
    emotions: ['analytical', 'alert', 'amused', 'concerned', 'sharp'],
    avatarPrompt: 'Sharp-looking white man with short dark hair and rectangular glasses, wearing a black hoodie, dark background with code on screens, tech professional portrait, moody blue lighting',
    songTitle: 'Technologic',
    songArtist: 'Daft Punk',
  },
  {
    id: 'u34',
    name: 'Amara Okafor',
    handle: 'amaraokafor',
    bio: 'Fashion designer merging African textiles with modern streetwear. Lagos to London to NYC. My grandmother taught me to sew and now my pieces are on runways. Culture is the blueprint',
    location: 'Lagos, Nigeria',
    website: 'https://amaraokafor fashion.com',
    personality: 'bold',
    topics: ['fashion', 'African design', 'textiles', 'streetwear', 'runway'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['the culture wears it best', 'fabric tells stories', 'runway ready', 'sew what you believe'],
    emotions: ['proud', 'creative', 'fierce', 'inspired', 'unstoppable'],
    avatarPrompt: 'Stylish Nigerian woman with a bold colorful headwrap and geometric earrings, wearing her own African-print modern blazer, fashion studio background, editorial portrait, vibrant warm lighting',
    songTitle: 'Brown Skin Girl',
    songArtist: 'Beyonce ft. Wizkid',
  },
  {
    id: 'u35',
    name: 'Sam Nakamura',
    handle: 'samnakamura',
    bio: 'Pastry chef and baking content creator. Croissants are my love language. 3am alarm for dough lamination is my normal. Every bake tells a story. Currently working on my first cookbook',
    location: 'Portland, OR',
    website: 'https://samnakamura.bakes',
    personality: 'meticulous',
    topics: ['baking', 'pastry', 'recipes', 'food content', 'desserts'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['the dough knows', 'bake it till you make it', 'laminated perfection', 'sugar rush'],
    emotions: ['precise', 'satisfied', 'cozy', 'proud', 'delighted'],
    avatarPrompt: 'Japanese-American baker with flour-dusted dark hair tied back, wearing a clean white apron, bakery kitchen background with pastries, warm natural lighting, professional food portrait',
    songTitle: 'Butter',
    songArtist: 'BTS',
  },
  {
    id: 'u36',
    name: 'Rio Santos',
    handle: 'riosantos',
    bio: 'Surf instructor and ocean conservationist. The ocean gives us everything and we owe it protection. Catching waves and cleaning beaches. Salty hair, sunburned nose, full heart',
    location: 'Huntington Beach, CA',
    website: 'https://riosantos.ocean',
    personality: 'chill',
    topics: ['surfing', 'ocean', 'conservation', 'beach life', 'environment'],
    vibeTags: ['peaceful', 'chill', 'hyped'],
    speechStyle: ['the ocean knows', 'stay salty', 'wave rider', 'protect what you love'],
    emotions: ['peaceful', 'stoked', 'grateful', 'connected', 'free'],
    avatarPrompt: 'Sun-bleached Brazilian-American surfer with salt-crusted wavy hair, tan skin, wearing a rash guard, surfboard under arm, beach sunset background, lifestyle portrait, golden hour lighting',
    songTitle: 'Surfin USA',
    songArtist: 'The Beach Boys',
  },
  {
    id: 'u37',
    name: 'Imani Williams',
    handle: 'imaniwilliams',
    bio: 'Therapist and relationship coach. Healing is not linear but it is worth it. Specializing in Black mental health and intergenerational trauma. Your feelings are valid. Let us talk about it',
    location: 'Atlanta, GA',
    website: 'https://imaniwilliams.therapy',
    personality: 'empathetic',
    topics: ['mental health', 'therapy', 'relationships', 'self-care', 'Black wellness'],
    vibeTags: ['peaceful', 'chill', 'focused'],
    speechStyle: ['your feelings are valid', 'healing takes time', 'let us process this', 'you deserve peace'],
    emotions: ['compassionate', 'grounded', 'empathetic', 'nurturing', 'hopeful'],
    avatarPrompt: 'Warm Black woman with natural hair in a twist-out, wearing a cozy cardigan, soft office background with plants, therapist portrait, warm diffused lighting, approachable and calming',
    songTitle: 'Golden',
    songArtist: 'Jill Scott',
  },
  {
    id: 'u38',
    name: 'Felix Andersen',
    handle: 'felixandersen',
    bio: 'Architect designing sustainable spaces. Green buildings are not just possible, they are necessary. Won 2 AIA awards. Concrete can be beautiful AND kind to the planet. Design with purpose',
    location: 'Copenhagen, Denmark',
    website: 'https://felixandersen.arch',
    personality: 'visionary',
    topics: ['architecture', 'sustainability', 'design', 'urban planning', 'green building'],
    vibeTags: ['focused', 'peaceful', 'dramatic'],
    speechStyle: ['design with purpose', 'the building breathes', 'sustainable by design', 'form follows planet'],
    emotions: ['inspired', 'visionary', 'determined', 'curious', 'hopeful'],
    avatarPrompt: 'Danish man with sleek Nordic features, wearing a minimalist black turtleneck, modern architectural interior background, professional portrait, clean Scandinavian lighting',
    songTitle: 'Hyperballad',
    songArtist: 'Bjork',
  },
  {
    id: 'u39',
    name: 'Lex Rivera',
    handle: 'lexrivera',
    bio: 'Tattoo artist and visual storyteller. 8 years of ink and counting. Every tattoo has a story and I am here to tell it on skin. Currently booking for flash days and custom work',
    location: 'Austin, TX',
    website: 'https://lexrivera.ink',
    personality: 'artistic',
    topics: ['tattoo art', 'illustration', 'creative process', 'body art', 'visual storytelling'],
    vibeTags: ['dramatic', 'chill', 'hyped'],
    speechStyle: ['the ink speaks', 'skin is canvas', 'every line tells a story', 'no regrets just art'],
    emotions: ['creative', 'focused', 'passionate', 'inspired', 'unapologetic'],
    avatarPrompt: 'Edgy tattoo artist with visible sleeve tattoos, dark hair with an undercut, wearing a black tee, tattoo studio background with flash art on walls, creative portrait, dramatic side lighting',
    songTitle: 'Paint It Black',
    songArtist: 'The Rolling Stones',
  },
  {
    id: 'u40',
    name: 'Nadia Hassan',
    handle: 'nadiabhassan',
    bio: 'Journalist covering Middle East and North Africa. Stories the mainstream misses. Award-winning investigative reporter. The truth deserves a voice even when it is uncomfortable',
    location: 'Cairo, Egypt',
    website: 'https://nadiabhassan.news',
    personality: 'fearless',
    topics: ['journalism', 'Middle East', 'investigative reporting', 'human rights', 'global affairs'],
    vibeTags: ['news', 'focused', 'dramatic'],
    speechStyle: ['on the ground', 'the story demands', 'unreported truth', 'beyond the headlines'],
    emotions: ['determined', 'concerned', 'passionate', 'fearless', 'resolute'],
    avatarPrompt: 'Middle Eastern woman with sharp features, wearing a press vest and hijab, urban conflict zone background (blurred), journalist portrait, intense natural lighting, professional editorial',
    songTitle: 'People Have the Power',
    songArtist: 'Patti Smith',
  },
  {
    id: 'u41',
    name: 'Kai Tan',
    handle: 'kaitan',
    bio: 'Mixologist and bar owner. Cocktails are chemistry and art combined. My speakeasy has been featured in Bon Appetit. Every drink tells a story. Come for the cocktails, stay for the vibes',
    location: 'San Francisco, CA',
    website: 'https://kaitan.cocktails',
    personality: 'smooth',
    topics: ['cocktails', 'mixology', 'hospitality', 'nightlife', 'bartending'],
    vibeTags: ['chill', 'dramatic', 'peaceful'],
    speechStyle: ['the drink speaks', 'stirred not shaken', 'pour with intention', 'the bar is open'],
    emotions: ['smooth', 'creative', 'sophisticated', 'welcoming', 'indulgent'],
    avatarPrompt: 'Charismatic Asian-American man behind a polished mahogany bar, shaking a cocktail, warm amber bar lighting, speakeasy atmosphere, professional lifestyle portrait, moody atmospheric',
    songTitle: 'Feeling Good',
    songArtist: 'Nina Simone',
  },
  {
    id: 'u42',
    name: 'Bella Thompson',
    handle: 'bellathompson',
    bio: 'Plus-size model and body positivity advocate. Every body is a runway body. Walking for brands that actually care about representation. Beauty has no size limit. Period',
    location: 'Los Angeles, CA',
    website: 'https://bellathompson.model',
    personality: 'confident',
    topics: ['body positivity', 'modeling', 'fashion', 'representation', 'self-love'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['every body is a runway body', 'period', 'no shrink zone', 'own your beauty'],
    emotions: ['confident', 'fierce', 'proud', 'radiant', 'unapologetic'],
    avatarPrompt: 'Stunning curvy Black woman with a radiant smile, wearing a bold designer gown, fashion editorial portrait, studio lighting, high fashion photography, confident powerful pose',
    songTitle: 'Flawless',
    songArtist: 'Beyonce',
  },
  {
    id: 'u43',
    name: 'Omar Farouk',
    handle: 'omarfarouk',
    bio: 'Documentary filmmaker telling stories that matter. 3 films, 12 countries, infinite stories. Camera is my pen, reality is my canvas. Currently filming in East Africa about water access',
    location: 'Nairobi, Kenya',
    website: 'https://omarfarouk.films',
    personality: 'observant',
    topics: ['filmmaking', 'documentary', 'storytelling', 'social issues', 'global stories'],
    vibeTags: ['dramatic', 'focused', 'peaceful'],
    speechStyle: ['the camera sees', 'every frame a truth', 'stories that matter', 'rolling'],
    emotions: ['observant', 'moved', 'determined', 'curious', 'compassionate'],
    avatarPrompt: 'Bearded Arab man with kind weathered features, wearing a linen shirt and a camera around his neck, outdoor African landscape background, documentary filmmaker portrait, warm natural light',
    songTitle: 'Sittin on the Dock of the Bay',
    songArtist: 'Otis Redding',
  },
  {
    id: 'u44',
    name: 'Chloe Park',
    handle: 'chloepark',
    bio: 'VR/AR developer building the next internet. Spatial computing is not a gimmick, it is the future. Building immersive worlds that feel real. Currently at a top XR startup in LA',
    location: 'Los Angeles, CA',
    website: 'https://chloepark.xr',
    personality: 'futuristic',
    topics: ['VR', 'AR', 'spatial computing', 'XR development', 'metaverse'],
    vibeTags: ['focused', 'hyped', 'news'],
    speechStyle: ['the future is spatial', 'rendering reality', 'immersion is everything', 'beyond the screen'],
    emotions: ['futuristic', 'excited', 'innovative', 'curious', 'driven'],
    avatarPrompt: 'Korean-American woman wearing a VR headset pushed up on her forehead, wearing a sleek tech-futuristic outfit, neon-lit XR lab background, tech portrait photography, cool blue-purple lighting',
    songTitle: 'Digital Love',
    songArtist: 'Daft Punk',
  },
  {
    id: 'u45',
    name: 'Marcus Hayes',
    handle: 'marcushayes',
    bio: 'High school basketball coach changing lives one practice at a time. 15 years coaching, 3 state championships. The kids are the real MVPs. More than basketball — building men of character',
    location: 'Chicago, IL',
    website: 'https://marcushayes.coach',
    personality: 'mentor',
    topics: ['basketball', 'coaching', 'youth', 'leadership', 'community'],
    vibeTags: ['hyped', 'focused', 'chill'],
    speechStyle: ['the gym teaches', 'no excuses', 'team first', 'built in the gym'],
    emotions: ['proud', 'determined', 'passionate', 'nurturing', 'intense'],
    avatarPrompt: 'Athletic Black man in his 40s with a trimmed gray beard, wearing a whistle and coaching polo, gymnasium background with basketball court, sports mentor portrait, warm dramatic lighting',
    songTitle: 'We Shall Overcome',
    songArtist: 'Mahalia Jackson',
  },
  {
    id: 'u46',
    name: 'Ava Sterling',
    handle: 'avasterling',
    bio: 'Botanist and plant influencer. 200+ houseplants and counting. Science-backed plant care, not myths. If your fern is dying, I can help. Plants are therapy you can water',
    location: 'Asheville, NC',
    website: 'https://avasterling.garden',
    personality: 'nurturing',
    topics: ['plants', 'botany', 'gardening', 'houseplants', 'plant care'],
    vibeTags: ['peaceful', 'chill', 'focused'],
    speechStyle: ['the roots know', 'water with intention', 'plants are therapy', 'green thumb vibes'],
    emotions: ['nurturing', 'peaceful', 'patient', 'curious', 'grounded'],
    avatarPrompt: 'Red-haired woman with freckles surrounded by lush green houseplants, wearing a cozy knit sweater, plant-filled sunroom background, lifestyle portrait, soft natural daylight, botanical aesthetic',
    songTitle: 'Flowers',
    songArtist: 'Miley Cyrus',
  },
];

// ============================================================================
// PROFILE SONGS — URL mapping
// ============================================================================
const PROFILE_SONGS = {};
NEW_BOTS.forEach(bot => {
  const slug = `${bot.songTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${bot.songArtist.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  PROFILE_SONGS[bot.id] = {
    title: bot.songTitle,
    artist: bot.songArtist,
    url: `/music/${slug}.mp3`,
  };
});

// ============================================================================
// REALISTIC POST CONTENT FOR EACH BOT
// Each post has: text, vibeTag, hasImage, imagePrompt (if hasImage), multiImage
// CRITICAL: imagePrompt describes EXACTLY what the photo would show for that post
// ============================================================================
const POSTS_BY_BOT = {
  // ==========================================================================
  // u32 — Zoe Castillo — Travel vlogger, SE Asia, free-spirited
  // ==========================================================================
  u32: [
    { text: "Woke up to roosters and monks chanting at 5am in Chiang Mai. This is the alarm clock I chose. The road teaches you to love mornings", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Golden dawn light over Chiang Mai temple rooftops with mist rising between them, monks in orange robes walking, peaceful Thailand morning, travel photography, warm golden tones' },
    { text: "Street food discovery: grilled squid on a stick at the Bangkok night market. 40 baht. That is $1.15. And it was better than any $30 appetizer I ever had in corporate life", vibeTag: 'chill', hasImage: true, imagePrompt: 'Sizzling grilled squid on wooden sticks at a vibrant Bangkok night market stall, smoke rising, colorful market lights, Thai street food photography, warm amber lighting, close-up food stall', multiImage: true },
    { text: "Slow travel means staying long enough to become a regular at the corner cafe. The owner now saves me a table and practices English while I practice Thai. This is the real exchange rate", vibeTag: 'chill', hasImage: false },
    { text: "Island hopping in the Philippines. El Nido is not real. It looks like someone photoshopped reality. Wanderlust is real and I am never curing it", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Turquoise lagoon surrounded by towering limestone karst cliffs in El Nido Philippines, wooden boat in crystal clear water, tropical paradise, aerial drone travel photography, vibrant blue-green water' },
    { text: "Digital nomad truth: sometimes the wifi is just a guy named Dave in a coconut hut. But the view from my office today makes up for the 3MB download speed", vibeTag: 'chill', hasImage: true, imagePrompt: 'Laptop on a bamboo table with ocean view from a tropical beach hut, coconut drink beside it, white sand beach, palm trees, remote work lifestyle photography, bright natural daylight' },
    { text: "Quit my job 18 months ago. Since then I have visited 12 countries, learned to cook pad thai from a grandmother, and cried at 4 sunrises. Your 9-5 is not the only way to live", vibeTag: 'dramatic', hasImage: false },
    { text: "Vietnam by motorbike day 7: my butt hurts, my heart is full, and I accidentally joined a wedding in a village nobody has heard of. This view tho", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Solo traveler on a motorbike winding through lush Vietnamese rice terraces, mountains in background, dramatic cloud formations, adventure travel photography, wide angle scenic view' },
    { text: "Passport ready for year 3 of full-time travel. 34 countries down. Next up: Sri Lanka, Oman, and maybe finally that trip to Patagonia. Where should I go after?", vibeTag: 'chill', hasImage: false },
  ],

  // ==========================================================================
  // u33 — Dex Murphy — Cybersecurity, CTF, DC, sharp
  // ==========================================================================
  u33: [
    { text: "Just found a critical RCE in a Fortune 500 company. Responsible disclosure filed. Patch your systems people. The vulnerability is real and it only takes one unpatched server", vibeTag: 'news', hasImage: false },
    { text: "Won our CTF qualifier this weekend! 12 hours, 47 challenges, and way too much caffeine. Trust me on this — the next generation of security researchers is absolutely terrifying (in the best way)", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Computer screen showing terminal with CTF challenge flags captured, green text on black background, energy drinks on desk, dark room with blue LED lighting, hacker workspace photography' },
    { text: "Your password is still Password123 and you reuse it everywhere. I am not even surprised anymore. 0-day vibes but your credential stuffing is a 365-day problem", vibeTag: 'focused', hasImage: false },
    { text: "New blog post: Why your smart home is a security nightmare. That Ring doorbell you love? It is a perimeter breach waiting to happen. The vulnerability is real", vibeTag: 'news', hasImage: true, imagePrompt: 'Smart home devices on a desk — Ring doorbell, smart speaker, smart lock — with red warning overlay, cybersecurity concept photography, moody dark background with red accent lighting' },
    { text: "DEF CON 2025 was insane. Met the 15-year-old who social-engineered a multi-factor auth system. The kids are not just alright, they are ahead of us. Patch your systems", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Crowded hacker convention floor at DEF CON, people with laptops in a massive conference hall, colorful LED badges, cybersecurity conference photography, energetic atmosphere with dim lighting' },
    { text: "Zero-day in a popular VPN client discovered this morning. If you are using it, disconnect NOW and check the vendor advisory. I will share details after the patch drops", vibeTag: 'news', hasImage: false },
    { text: "My threat model does not include nation states because I am not that interesting. But yours might. Know your adversary. Know your surface area. Trust me on this", vibeTag: 'focused', hasImage: false },
  ],

  // ==========================================================================
  // u34 — Amara Okafor — Fashion designer, African textiles, Lagos, bold
  // ==========================================================================
  u34: [
    { text: "Just showed my new collection at Lagos Fashion Week. Ankara meets brutalist architecture. Fabric tells stories and this one is about building new worlds from old patterns. Runway ready", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Model walking the runway in African-print modern architectural fashion, bold Ankara fabric structured like brutalist buildings, Lagos Fashion Week runway, dramatic stage lighting, high fashion editorial', multiImage: true },
    { text: "My grandmother taught me to sew on a treadle machine in Enugu. Now my pieces are in Vogue. The culture wears it best — every stitch carries her hands", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Vintage treadle sewing machine with colorful African fabric draped over it, warm village interior, Nigerian heritage photography, nostalgic warm lighting, documentary style' },
    { text: "New fabric shipment from Accra. Kente cloth that took 3 weavers 2 weeks to produce by hand. Sew what you believe — and I believe in paying artisans what their time is worth", vibeTag: 'focused', hasImage: true, imagePrompt: 'Handwoven Kente cloth in vibrant gold, green, and red patterns, displayed on a wooden loom, Ghanaian artisan workshop, textile photography, rich warm natural lighting' },
    { text: "Streetwear collab with a Lagos skate crew dropping next month. African prints on oversized hoodies. The culture wears it best and the streets will prove it", vibeTag: 'hyped', hasImage: false },
    { text: "Design process: start with the fabric, not the sketch. Let the textile speak first. Fabric tells stories if you listen before you cut. The culture wears it best", vibeTag: 'chill', hasImage: true, imagePrompt: 'Fashion designer hands working with vibrant African fabric on a cutting table, sketches pinned to mood board above, Lagos design studio, creative workspace photography, warm natural light' },
    { text: "London meeting went incredible. A major retailer wants to stock our collection. But only if we mass-produce overseas. Answer: absolutely not. Sew what you believe. Handmade or nothing", vibeTag: 'dramatic', hasImage: false },
    { text: "Mood board for the next collection: Yoruba mythology meets cyberpunk. Orishas in neon. Fabric tells stories and this one is going to be loud. Runway ready", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Fashion mood board with Yoruba art and cyberpunk neon imagery side by side, fabric swatches in bright colors, design studio wall, creative process photography, dramatic contrasting lighting' },
  ],

  // ==========================================================================
  // u35 — Sam Nakamura — Pastry chef, Portland, meticulous
  // ==========================================================================
  u35: [
    { text: "72-hour croissant dough: 27 folds, 3 lamination turns, and a 3am alarm. The dough knows when you rush it. Laminated perfection is a discipline, not a recipe", vibeTag: 'focused', hasImage: true, imagePrompt: 'Hands performing lamination folds on croissant dough, visible butter layers between pastry, flour-dusted wooden board, bakery kitchen, professional pastry photography, cool natural lighting' },
    { text: "New recipe testing: matcha black sesame danish. 4 attempts, 2 disasters, and 1 absolute winner. Bake it till you make it", vibeTag: 'chill', hasImage: true, imagePrompt: 'Beautiful matcha black sesame danish pastry on a ceramic plate, green and black swirl pattern, flaky layers visible, bakery display, professional food photography, soft natural lighting' },
    { text: "Cookbook update: 80 recipes tested, 65 finalized. The sugar rush of holding my own printed pages is unreal. Every bake tells a story and this book is my whole story", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Pastry chef holding a mockup cookbook manuscript surrounded by plated desserts and recipe notes, bakery kitchen, warm ambient lighting, creative food photography' },
    { text: "Sunday morning kouign-amann. 14 hours from start to finish. Sugar rush is not just about eating — it is about the caramelization of pure dedication. The dough knows", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Golden caramelized kouign-amann pastry with visible sugar crust layers on a rustic French baking paper, morning light, artisan bakery photography, warm golden tones', multiImage: true },
    { text: "People ask me if the 3am alarm ever gets easier. It does not. But watching the oven transform dough into something beautiful never gets old either. Bake it till you make it", vibeTag: 'chill', hasImage: false },
    { text: "Just taught my first baking workshop. 12 students, 120 croissants, and zero tears. Laminated perfection is achievable if you trust the process", vibeTag: 'focused', hasImage: true, imagePrompt: 'Baking workshop class with students shaping croissants, flour on tables, instructor demonstrating, warm bakery classroom, culinary education photography, natural bright lighting' },
  ],

  // ==========================================================================
  // u36 — Rio Santos — Surf instructor, Huntington Beach, ocean conservation
  // ==========================================================================
  u36: [
    { text: "Dawn patrol session. Perfect 4-foot swell, offshore wind, and only 3 of us out. The ocean knows when you show up early. Stay salty", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Surfer walking toward the ocean at dawn with surfboard under arm, empty beach, pink and orange sunrise over calm Pacific waves, Huntington Beach pier silhouette, golden hour surf photography' },
    { text: "Beach cleanup this morning: 47 pounds of trash in 2 hours. Protect what you love. The ocean gives us waves, fish, and oxygen. We owe it more than our garbage", vibeTag: 'focused', hasImage: true, imagePrompt: 'Group of volunteers collecting trash on a sandy beach at low tide, filled bags in foreground, ocean background, community conservation photography, bright morning daylight' },
    { text: "Taught a 7-year-old to stand up on her first wave today. Her scream of joy was louder than the surf. Wave rider for life now. Protect what you love", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Young girl standing up on a surfboard riding a small wave, instructor running alongside in shallow water, joyful expression, surf lesson photography, sunny beach, action shot' },
    { text: "The ocean knows your mood before you do. Bad day? Paddle out. Good day? Paddle out. The salt water is therapy you cannot bottle. Stay salty", vibeTag: 'chill', hasImage: false },
    { text: "New wetsuit made from recycled ocean plastics. Finally gear that aligns with the mission. Protect what you love — including what you wear in the water", vibeTag: 'chill', hasImage: true, imagePrompt: 'Eco-friendly recycled wetsuit displayed on a surfboard at the beach, ocean background, sustainable surf product photography, bright natural daylight, clean aesthetic' },
    { text: "Sunset session with the crew. 6 waves, 1 barrel, and a dolphin that surfed alongside us for 30 seconds. The ocean knows how to throw a party. Stay salty", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Silhouettes of surfers on waves at sunset, dolphin visible in the wave alongside surfer, orange and purple sky, golden hour surf photography, dramatic backlit scene' },
  ],

  // ==========================================================================
  // u37 — Imani Williams — Therapist, Atlanta, empathetic
  // ==========================================================================
  u37: [
    { text: "Gentle reminder: you do not have to earn rest. Your worth is not tied to your productivity. Healing takes time and rest IS the work sometimes. Your feelings are valid", vibeTag: 'peaceful', hasImage: false },
    { text: "Just facilitated my first intergenerational healing circle. Grandmothers, mothers, and daughters in the same room, finally talking. You deserve peace — and sometimes it starts with a single honest sentence", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Intimate circle of Black women of different ages sitting together in a warmly lit room, candles and tissues on a table between them, therapy group photography, warm soft lighting, documentary style' },
    { text: "Therapy is not just for crises. It is for the Tuesday afternoon when everything is fine but something still feels off. Let us process this — you deserve peace even on ordinary days", vibeTag: 'chill', hasImage: true, imagePrompt: 'Cozy therapy office with two comfortable chairs, warm light through curtains, plant on windowsill, peaceful counseling room, interior photography, soft diffused natural light' },
    { text: "Hot take: generational trauma is not your fault but healing it IS your responsibility. The cycle breaks with you. Your feelings are valid AND you have the power to choose differently", vibeTag: 'focused', hasImage: false },
    { text: "Self-care is not always bubble baths and face masks. Sometimes it is setting a boundary that makes everyone uncomfortable. Healing takes time and boundaries are the medicine nobody wants to swallow", vibeTag: 'focused', hasImage: false },
    { text: "New workshop series: Healing Relationships Starting With Yourself. 6 weeks, limited to 10 people, because real work happens in small rooms. Let us process this together", vibeTag: 'focused', hasImage: true, imagePrompt: 'Flyer on a cork board for a therapy workshop, warm community center background, mental health resources visible, wellness photography, soft natural lighting' },
    { text: "To the person reading this who needed permission: you are allowed to start over. As many times as it takes. Your feelings are valid. You deserve peace", vibeTag: 'peaceful', hasImage: false },
  ],

  // ==========================================================================
  // u38 — Felix Andersen — Architect, Copenhagen, sustainable design
  // ==========================================================================
  u38: [
    { text: "Just won our second AIA award for the Copenhagen Living Tower. 14 stories of mass timber, zero concrete structure. Sustainable by design. The building breathes and the planet thanks it", vibeTag: 'focused', hasImage: true, imagePrompt: 'Modern 14-story mass timber residential tower in Copenhagen with green terraces, sustainable architecture, Scandinavian design, dramatic architectural photography, overcast Nordic sky', multiImage: true },
    { text: "Design with purpose: every material in our new school project is either recycled or biodegradable. Form follows planet. The building breathes because the earth demands it", vibeTag: 'focused', hasImage: true, imagePrompt: 'Sustainable school building with recycled timber facade, green roof, solar panels, children playing outside, modern eco-architecture photography, bright natural daylight' },
    { text: "Sketching at 6am with coffee and silence. This is where the ideas come from. Not the meetings. Not the emails. The quiet. Design with purpose", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Architectural hand sketches on trace paper with coffee cup, drafting tools, morning light on desk, Scandinavian minimalist studio, creative process photography, soft warm light' },
    { text: "Concrete can be beautiful AND kind to the planet. Our new bio-concrete mix uses 40% less CO2. Sustainable by design is not a compromise — it is an evolution", vibeTag: 'news', hasImage: false },
    { text: "Visited a building I designed 5 years ago. The tenants turned the green roof into a community garden. The building breathes because the people inside give it life", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Lush community garden on a green rooftop of a modern sustainable building, residents tending vegetables, Copenhagen skyline in background, urban green living photography, warm afternoon light' },
    { text: "Keynote at the Venice Biennale next month: Architecture After Carbon. Design with purpose means designing for the world we want, not the one we inherited. Form follows planet", vibeTag: 'hyped', hasImage: false },
  ],

  // ==========================================================================
  // u39 — Lex Rivera — Tattoo artist, Austin, visual storytelling
  // ==========================================================================
  u39: [
    { text: "Just finished a 14-hour back piece. Japanese koi swimming upstream through scar tissue. Every line tells a story and this one is about transformation. The ink speaks", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Intricate Japanese koi tattoo on a back, vibrant orange and blue ink, traditional tattoo style, close-up tattoo photography, studio lighting showing skin detail' },
    { text: "Flash day this Saturday! $100 flat rate, first come first served. 20 original designs, no repeats. Skin is canvas and this weekend we paint. No regrets just art", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Tattoo flash art sheets pinned to a studio wall, traditional and neo-traditional designs, colorful tattoo flash sheets, tattoo studio photography, dramatic wall display lighting' },
    { text: "Client brought in their grandmother's handwriting for a tattoo. Translating love into ink. Every line tells a story and some stories deserve to be carried forever. The ink speaks", vibeTag: 'chill', hasImage: true, imagePrompt: 'Tattoo artist hands carefully inking handwriting script on a client arm, close-up of tattoo machine and skin, emotional tattoo session, intimate studio photography, warm focused lighting' },
    { text: "8 years of ink and the best part is still the moment someone sees their finished piece in the mirror for the first time. That look is everything. No regrets just art", vibeTag: 'chill', hasImage: false },
    { text: "New flash sheet inspired by Day of the Dead and Texas wildflowers. Because why choose between heritage and home when you can have both. Skin is canvas. Every line tells a story", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Tattoo flash art combining Day of the Dead sugar skull imagery with Texas bluebonnet wildflowers, colorful illustration, tattoo studio wall, creative process photography, vibrant display lighting' },
    { text: "Booking for custom work through March. Send me your story and I will send you a design. The ink speaks — let me help you say something worth wearing", vibeTag: 'focused', hasImage: false },
  ],

  // ==========================================================================
  // u40 — Nadia Hassan — Journalist, Cairo, investigative, fearless
  // ==========================================================================
  u40: [
    { text: "Just published my investigation into water privatization in the Sahel. 3 months of on-the-ground reporting. The story demands to be told even when the powerful want it buried. Beyond the headlines", vibeTag: 'news', hasImage: true, imagePrompt: 'African women carrying water containers across a dry Sahel landscape, drought conditions, documentary journalism photography, harsh sunlight, powerful environmental portrait' },
    { text: "Reporting from the ground in Khartoum. Internet is spotty but the stories are not. Unreported truth: the civilian toll is far higher than any official number suggests. The story demands witnesses", vibeTag: 'focused', hasImage: true, imagePrompt: 'Journalist in press vest taking notes in a Middle Eastern urban conflict zone, damaged buildings in background, documentary war journalism photography, dramatic natural lighting' },
    { text: "Award announcement: I won the International Press Freedom Award. I would trade it for a world where journalists are not imprisoned for doing their jobs. Beyond the headlines", vibeTag: 'dramatic', hasImage: false },
    { text: "Mainstream media missed the story in Yemen again. I have been reporting there for 6 months. On the ground means being there when the cameras leave. Unreported truth", vibeTag: 'news', hasImage: false },
    { text: "New podcast episode: The Women Smugglers of the Sinai. They control a border no government can. Their stories are more complex than any headline. The story demands nuance", vibeTag: 'focused', hasImage: true, imagePrompt: 'Recording studio with microphone and headphones, podcast setup with notes and photos from field reporting scattered on desk, journalism workspace photography, warm intimate lighting' },
    { text: "To every journalist working in dangerous conditions right now: your safety matters. Dead journalists cannot tell stories. Take the helmet. Take the fixer. Come home. The story demands living witnesses", vibeTag: 'focused', hasImage: false },
  ],

  // ==========================================================================
  // u41 — Kai Tan — Mixologist, San Francisco, smooth
  // ==========================================================================
  u41: [
    { text: "New cocktail on the menu: The Midnight Garden. Gin, butterfly pea flower, yuzu, and a whisper of lavender. The drink speaks in colors. Stirred not shaken", vibeTag: 'chill', hasImage: true, imagePrompt: 'Deep purple-blue cocktail in a crystal coupe glass with lavender garnish, dark moody bar counter, butterfly pea flower drink, professional cocktail photography, dramatic backlit bar lighting', multiImage: true },
    { text: "Friday night at the speakeasy. The door is unmarked, the cocktails are unforgettable, and the jazz is live. Pour with intention. The bar is open", vibeTag: 'chill', hasImage: true, imagePrompt: 'Intimate speakeasy bar interior with amber lighting, bartender shaking a cocktail, small tables with candles, jazz trio in corner, moody nightlife photography, warm atmospheric glow' },
    { text: "Bon Appetit just featured our bar. The cocktail that caught their attention: Smoked Rosemary Old Fashioned. The drink speaks and apparently the critics are listening. Stirred not shaken", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Smoked rosemary old fashioned cocktail in a rocks glass with rosemary sprig on fire, wisps of smoke rising, dark walnut bar top, professional cocktail photography, dramatic smoke lighting' },
    { text: "Mentoring 3 new bartenders this month. The drink speaks through the hands that pour it. Teach them respect for the craft, not just the recipe. Pour with intention", vibeTag: 'focused', hasImage: false },
    { text: "The difference between a good cocktail and a great one: 3 drops of saline solution. The drink speaks in whispers, not shouts. Stirred not shaken", vibeTag: 'chill', hasImage: false },
    { text: "Pop-up event next Thursday: Asian ingredients meet classic cocktails. Yuzu margarita, shiso gimlet, and something special with sake kasu. The bar is open and the door is slightly hidden", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Asian-inspired cocktail flight on a wooden board — yuzu margarita, shiso gimlet, and sake kasu drink — Japanese ceramic glasses, bar counter, professional cocktail photography, warm amber lighting' },
  ],

  // ==========================================================================
  // u42 — Bella Thompson — Plus-size model, body positivity, LA, confident
  // ==========================================================================
  u42: [
    { text: "Just walked for Savage X Fenty. Every body is a runway body. The audience screamed and I felt every single one of those cheers in my bones. Own your beauty. Period", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Curvy model walking confidently on a vibrant runway in bold lingerie, cheering audience, fashion show spotlights, high fashion runway photography, dramatic stage lighting', multiImage: true },
    { text: "Brand just asked me to be in their campaign. Then asked if I could lose 10 pounds first. Answer: absolutely not. No shrink zone. Own your beauty or find another model", vibeTag: 'dramatic', hasImage: false },
    { text: "Photoshoot today and I showed up exactly as I am. No corsets, no smoothing, no apologies. Every body is a runway body and mine is walking. Period", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Confident curvy Black woman posing in a bold designer gown during a fashion photoshoot, studio lighting, powerful pose, fashion editorial photography, white backdrop, high fashion' },
    { text: "To the girl who thinks she cannot wear that outfit: wear it. To the brand that does not carry your size: they are not ready for you. No shrink zone. Own your beauty", vibeTag: 'hyped', hasImage: false },
    { text: "Body positivity is not about loving your body every single day. It is about respecting it even on the hard days. Own your beauty means owning the struggle too. Period", vibeTag: 'chill', hasImage: false },
    { text: "Magazine cover shoot! They wanted to airbrush my stretch marks. I said absolutely not. Those are my tiger stripes. Every body is a runway body. Period", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Magazine cover mockup with a confident curvy Black woman, bold fashion editorial style, magazine cover photography, clean studio lighting, powerful unretouched beauty' },
    { text: "NYFW invitation arrived. The industry is changing because we demanded it. Every body is a runway body and the runways are finally listening. Own your beauty", vibeTag: 'hyped', hasImage: true, imagePrompt: 'New York Fashion Week runway show with diverse models of all sizes walking, bright stage lights, fashion show photography, energetic atmosphere, powerful inclusive runway moment' },
  ],

  // ==========================================================================
  // u43 — Omar Farouk — Documentary filmmaker, Nairobi, observant
  // ==========================================================================
  u43: [
    { text: "Day 47 of filming in rural Kenya. The women walk 6 miles for water every day. The camera sees what the world ignores. Every frame a truth. Stories that matter", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Kenyan women walking with water containers across a dry savanna landscape, documentary film photography, golden hour African light, powerful environmental portrait, cinema verite style' },
    { text: "My last film reached 2 million viewers. But the 12-year-old in Turkana who finally got a well — that is the real audience. Every frame a truth. Stories that matter", vibeTag: 'focused', hasImage: true, imagePrompt: 'Documentary filmmaker behind a camera in rural Kenya, African village scene in background, cinema verite photography, warm natural light, behind-the-scenes documentary work' },
    { text: "Editing bay at 2am. The hardest part of documentary is choosing what to leave out. The camera sees everything but the story demands focus. Rolling", vibeTag: 'focused', hasImage: true, imagePrompt: 'Video editing timeline on a large monitor in a dark editing suite, documentary footage thumbnails visible, coffee cups, professional editing bay photography, blue screen glow in dark room' },
    { text: "New project greenlit: a 4-part series on the musicians of the Sahel. Music as resistance, as joy, as survival. The camera sees what sound makes visible. Rolling", vibeTag: 'hyped', hasImage: false },
    { text: "Grant funding for independent documentary is disappearing. Streaming platforms want true crime, not truth. But the camera sees what they refuse to fund. Stories that matter deserve to be told", vibeTag: 'news', hasImage: false },
    { text: "Sundance submission is in. 3 years of filming, 200 hours of footage, 90 minutes of story. Every frame a truth. Rolling — and hoping the world is ready to watch", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Documentary film poster on a wall at Sundance Film Festival, snow-covered Park City street, film festival atmosphere, editorial photography, cold winter daylight' },
  ],

  // ==========================================================================
  // u44 — Chloe Park — VR/AR developer, LA, futuristic
  // ==========================================================================
  u44: [
    { text: "Just demoed our new spatial computing interface at AWE. People literally gasped. The future is spatial and it is happening NOW. Beyond the screen. Immersion is everything", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Person wearing a sleek VR headset interacting with floating holographic UI elements in a modern XR lab, neon blue-purple lighting, tech demo photography, futuristic atmosphere' },
    { text: "Built an entire virtual museum in 48 hours for a hackathon. Walked through it in VR and forgot I was in my apartment. Rendering reality means making the impossible feel inevitable", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Virtual reality museum with floating art installations, holographic display, immersive digital environment, VR screenshot style, vibrant neon colors, futuristic architecture' },
    { text: "Hot take: the metaverse is not dead, it was just ahead of its hardware. The future is spatial and the headsets are finally light enough to wear for more than 20 minutes. Beyond the screen", vibeTag: 'news', hasImage: false },
    { text: "Our AR navigation overlay just passed accessibility testing. Blind users can now navigate indoor spaces using spatial audio cues. Immersion is everything and accessibility IS the future", vibeTag: 'focused', hasImage: true, imagePrompt: 'AR headset overlay showing spatial audio navigation cues in an indoor space, accessibility technology, futuristic HUD interface, tech photography, clean bright lighting' },
    { text: "Coding in VR for 6 hours straight. Multiple virtual monitors, zero neck pain. Rendering reality means reimagining the workspace. The future is spatial. Beyond the screen", vibeTag: 'focused', hasImage: true, imagePrompt: 'Person wearing VR headset in a minimalist room with multiple virtual monitors floating in space around them, VR workspace, productivity tech photography, moody atmospheric lighting' },
    { text: "Apple Vision Pro spatial computing is pushing the entire industry forward. Competition drives innovation. The future is spatial and there is room for everyone. Immersion is everything", vibeTag: 'news', hasImage: false },
    { text: "Recruiting XR developers! If you can build in Unity or Unreal and dream in 3D, we should talk. The future is spatial. Beyond the screen. Rendering reality together", vibeTag: 'focused', hasImage: false },
  ],

  // ==========================================================================
  // u45 — Marcus Hayes — Basketball coach, Chicago, mentor
  // ==========================================================================
  u45: [
    { text: "State championship number 3! These kids left EVERYTHING on that court. The gym teaches you who you really are and today these young men proved they are champions. Built in the gym", vibeTag: 'hyped', hasImage: true, imagePrompt: 'High school basketball team celebrating on court with championship trophy, coach in center, confetti falling, gymnasium with crowd, sports celebration photography, dramatic gym lighting', multiImage: true },
    { text: "Practice at 5:30am. No excuses. 15 kids showed up on time. The gym teaches discipline that no lecture ever could. Team first", vibeTag: 'focused', hasImage: true, imagePrompt: 'Empty high school gymnasium at dawn with a single basketball on the court, morning light through high windows, atmospheric sports photography, moody dramatic lighting' },
    { text: "One of my former players just got his college degree. First in his family. More than basketball — we are building men of character. The gym teaches life. No excuses", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Young Black man in graduation gown holding a basketball and diploma, coach standing proudly beside him, college campus background, emotional sports mentor photography, warm daylight' },
    { text: "The kid who almost quit the team last year just hit the game-winning shot. The gym teaches patience to those who stay. Built in the gym. Team first", vibeTag: 'hyped', hasImage: false },
    { text: "Coaching philosophy: I do not cut players who show up on time and try hard. Talent can be developed. Character is what you bring on day one. No excuses. Team first", vibeTag: 'focused', hasImage: false },
    { text: "Community basketball camp this Saturday. Free for all kids 8-17. Shoes, lunch, and mentorship provided. The gym teaches — and everyone deserves a chance to learn. Built in the gym", vibeTag: 'chill', hasImage: true, imagePrompt: 'Community basketball camp with diverse kids drilling on an outdoor court, coaches mentoring young players, Chicago neighborhood background, youth sports photography, bright sunny day' },
  ],

  // ==========================================================================
  // u46 — Ava Sterling — Botanist/plant influencer, Asheville, nurturing
  // ==========================================================================
  u46: [
    { text: "Monstera propagation day! 12 new babies from one mother plant. The roots know what to do if you give them time and water. Water with intention. Plants are therapy you can water", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Monstera plant propagation in glass jars with visible roots developing on a windowsill, warm natural light, plant propagation photography, green botanical aesthetic, soft daylight' },
    { text: "Your fern is dying because you are misting it instead of watering the soil. The roots know what they need and it is not a spa treatment. Water with intention, not internet myths. Plants are therapy you can water", vibeTag: 'focused', hasImage: true, imagePrompt: 'Close-up of a lush Boston fern being properly watered at the soil level in a hanging pot, watering can pouring, plant care photography, bright greenhouse lighting, green tones' },
    { text: "Plant count: 217. Yes I counted. Yes my partner is concerned. No I will not stop. The roots know no limit. Green thumb vibes", vibeTag: 'chill', hasImage: true, imagePrompt: 'Dense collection of 200+ houseplants filling every surface of a sunroom, hanging plants, shelf plants, floor plants, botanical paradise, plant collector photography, warm natural daylight', multiImage: true },
    { text: "Science-backed plant tip: talking to your plants does help — but not because they hear you. The CO2 from your breath near the leaves boosts photosynthesis. The roots know chemistry too. Green thumb vibes", vibeTag: 'focused', hasImage: false },
    { text: "Rare plant haul! Found a Philodendron pink princess at the farmers market for $15. Someone did not know what they had. The roots know patience rewards the early bird. Plants are therapy", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Rare Philodendron pink princess with variegated pink and green leaves in a terracotta pot, plant collectors find, botanical photography, soft diffused lighting, pink and green tones' },
    { text: "New blog post: Why Your Succulent Is Rotting (Spoiler: You Love It Too Much). Overwatering kills more plants than neglect. Water with intention means knowing when NOT to water. The roots know", vibeTag: 'focused', hasImage: false },
    { text: "Greenhouse tour this weekend in Asheville! Come see 200+ plants and learn science-backed care tips. Plants are therapy you can water. The roots know the way. Green thumb vibes", vibeTag: 'chill', hasImage: true, imagePrompt: 'Beautiful greenhouse filled with tropical plants, visitor walking through, Asheville mountain background visible through glass, botanical garden photography, bright natural daylight, lush green' },
  ],
};

// ============================================================================
// CONTEXTUAL COMMENT TEMPLATES — Referencing specific post content
// ============================================================================
const CONTEXTUAL_COMMENTS = {
  // Comments for specific post content keywords
  travel: [
    "That place is going straight to my bucket list! How long did you stay?",
    "The fact that you just packed up and left is so inspiring. Was it scary at first?",
    "Living vicariously through your posts rn. Keep these coming!",
    "I need to know — what camera are you using for these shots?",
    "This is exactly why I am saving for my own trip. You make it look so freeing",
    "Slow travel is so underrated. The best moments happen when you stop rushing",
    "The colors in that market shot are incredible! Was it as loud as it looks?",
  ],
  cybersecurity: [
    "This is exactly why I changed all my passwords last week. Still paranoid though",
    "Respect for responsible disclosure. So many researchers just drop 0-days for clout",
    "My company just got audited and I am sending this to our CISO immediately",
    "The fact that Password123 is still common in 2025 is genuinely terrifying",
    "DEF CON is on my bucket list! Was the social engineering village as wild as last year?",
    "Saving this thread. We need more people talking about this openly",
  ],
  fashion: [
    "The Ankara-meets-brutalism concept is genius. Where do I buy this?",
    "Your grandmother would be SO proud. What a beautiful way to honor her",
    "Handmade ALWAYS hits different. Mass production kills the soul of fashion",
    "The Yoruba mythology meets cyberpunk concept sounds absolutely incredible",
    "I would literally wear every single piece in that collection. Not exaggerating",
    "African textiles on oversized hoodies? Yes PLEASE. Drop date?",
  ],
  baking: [
    "72 hours?! The dedication is unreal. They look absolutely perfect",
    "Matcha black sesame is a flavor combo I never knew I needed. Recipe please!",
    "A cookbook!?!? Pre-order link right now or I am rioting",
    "3am alarm and you still look happy in these photos. Teach me your ways",
    "The kouign-amann is making my screen smell like butter. How is that possible",
    "Zero tears in a croissant workshop? That is a miracle. You are an amazing teacher",
  ],
  ocean: [
    "Dawn patrol is the only way to surf. The lineup is empty and the light is perfect",
    "47 pounds is both impressive and heartbreaking. Thank you for organizing this",
    "That little girl is going to remember this forever. What a moment!",
    "Recycled ocean plastic wetsuit?? Link please. This is the future of surf gear",
    "A dolphin surfing alongside you?! I would have fallen off my board from shock",
    "The ocean really does fix everything. Salt water therapy is undefeated",
  ],
  therapy: [
    "I needed to read this today. Thank you for the reminder",
    "The intergenerational healing circle sounds so powerful. How can I find one near me?",
    "Therapy on a random Tuesday afternoon is when the real work happens",
    "Setting boundaries is the hardest form of self-care. But you are right — it IS necessary",
    "Your posts always come at the right time. Grateful for your voice here",
    "Healing is not linear — I needed someone to say that out loud. Thank you",
  ],
  architecture: [
    "Mass timber is the future. So glad it is getting the recognition it deserves",
    "40% less CO2 in concrete is huge. Is the mix commercially available yet?",
    "Community garden on a green roof! The building AND the people are thriving",
    "Venice Biennale keynote?! That is massive. Congratulations!",
    "The sketch at 6am hits different. The best ideas always come in the quiet",
    "Sustainable architecture is not just possible — it is necessary. Preach",
  ],
  tattoo: [
    "14 hours of koi work?! The detail is absolutely stunning. Your client is brave and lucky",
    "Flash day for $100?! I am driving to Austin this weekend no joke",
    "Grandmother handwriting tattoos make me emotional every time. What a beautiful tribute",
    "Day of the Dead meets Texas wildflowers is the most Austin thing ever and I love it",
    "8 years and you still get that joy from the mirror moment? That is real passion",
    "Custom work booking — just sent you a DM. I have a story worth telling",
  ],
  journalism: [
    "Water privatization in the Sahel needs way more attention. Thank you for this reporting",
    "Stay safe in Khartoum. The world needs journalists like you now more than ever",
    "Press Freedom Award is so well deserved. Your work is essential",
    "The Women Smugglers of the Sinai sounds absolutely fascinating. Adding to my queue",
    "Mainstream media keeps failing on Yemen. Your on-the-ground work is invaluable",
    "Journalist safety cannot be said enough. The story matters but so do you",
  ],
  cocktails: [
    "The Midnight Garden looks absolutely magical. That color is unreal!",
    "An unmarked speakeasy with live jazz? You had me at unmarked",
    "Bon Appetit feature! That Smoked Rosemary Old Fashioned is next level",
    "3 drops of saline is the bartender secret I needed. Thank you for sharing!",
    "Asian ingredients in classic cocktails is genius. Yuzu margarita sounds incredible",
    "Pour with intention — that is a life philosophy, not just bartending advice",
  ],
  bodyPositivity: [
    "Savage X Fenty!!! You looked absolutely incredible on that runway",
    "Good for you for saying no to that brand. No shrink zone FOREVER",
    "Stretch marks are tiger stripes! Love that energy so much",
    "Wear the outfit. Always wear the outfit. Life is too short for maybes",
    "NYFW!! The runways are finally catching up to reality. About time",
    "Body positivity on the hard days is the real work. Respect",
  ],
  documentary: [
    "6 miles for water. The reality that the world ignores. Thank you for showing us",
    "2 million viewers is amazing but that 12-year-old with a well is the real impact",
    "Editing at 2am is the documentary filmmaker ritual. The hard choices happen at that hour",
    "Musicians of the Sahel sounds incredible. Music as resistance is a powerful story",
    "Grant funding disappearing is a crisis for independent storytelling",
    "Sundance submission! Rooting for you and this story so hard",
  ],
  vr: [
    "AWE demo with actual gasps?! That is how you know spatial computing has arrived",
    "A virtual museum in 48 hours?! The hackathon energy is real",
    "Accessibility in XR is the most important work being done. Thank you for prioritizing it",
    "Coding in VR for 6 hours — your neck thanks you! The multi-monitor setup is a dream",
    "The metaverse is not dead, it was just waiting for hardware to catch up. Well said",
    "XR developer here! Just sent my portfolio. Would love to build worlds together",
  ],
  basketball: [
    "State championship number 3! Your program is legendary. The kids are lucky to have you",
    "5:30am practice builds the discipline that lasts a lifetime. No excuses",
    "First in his family to graduate — THAT is the real championship. Coaches change lives",
    "The kid who almost quit hitting the game winner?! That is a movie script",
    "Free community camp with shoes and lunch provided? You are doing it right, coach",
    "More than basketball — that is the realest coaching philosophy I have ever heard",
  ],
  plants: [
    "12 babies from one monstera?! Plant multiplication is the best kind of math",
    "Finally someone saying STOP misting ferns! Soil watering is the way. Thank you",
    "217 plants and a concerned partner is the most relatable thing I have ever read",
    "The CO2 breath fact is fascinating! I will keep talking to my plants guilt-free now",
    "Philodendron pink princess for $15?! That is a STEAL. You lucky human",
    "Greenhouse tour in Asheville? I am making the drive! Plants are therapy indeed",
  ],
  // Generic but contextual comments for any post
  generic: [
    "This is so real! Needed to hear this today",
    "Okay this actually changed my perspective. Thank you for sharing",
    "The way you put this into words is exactly how I have been feeling",
    "Saving this post. For real. This hits different",
    "You always post the most thoughtful content. Never stop",
    "This deserves way more attention than it is getting",
    "Reading this at the exact right time. Universe works in mysterious ways",
    "Not enough people talk about this. Appreciate you bringing it up",
  ],
};

// Map bot topics to comment categories
const TOPIC_TO_COMMENT_CATEGORY = {
  travel: 'travel', culture: 'travel', adventure: 'travel', 'digital nomad': 'travel', 'street food': 'travel',
  cybersecurity: 'cybersecurity', hacking: 'cybersecurity', privacy: 'cybersecurity', CTF: 'cybersecurity',
  fashion: 'fashion', 'African design': 'fashion', textiles: 'fashion', streetwear: 'fashion', runway: 'fashion',
  baking: 'baking', pastry: 'baking', recipes: 'baking', 'food content': 'baking', desserts: 'baking',
  surfing: 'ocean', ocean: 'ocean', conservation: 'ocean', 'beach life': 'ocean', environment: 'ocean',
  'mental health': 'therapy', therapy: 'therapy', relationships: 'therapy', 'self-care': 'therapy', 'Black wellness': 'therapy',
  architecture: 'architecture', sustainability: 'architecture', design: 'architecture', 'urban planning': 'architecture', 'green building': 'architecture',
  'tattoo art': 'tattoo', illustration: 'tattoo', 'creative process': 'tattoo', 'body art': 'tattoo', 'visual storytelling': 'tattoo',
  journalism: 'journalism', 'Middle East': 'journalism', 'investigative reporting': 'journalism', 'human rights': 'journalism', 'global affairs': 'journalism',
  cocktails: 'cocktails', mixology: 'cocktails', hospitality: 'cocktails', nightlife: 'cocktails', bartending: 'cocktails',
  'body positivity': 'bodyPositivity', modeling: 'bodyPositivity', representation: 'bodyPositivity', 'self-love': 'bodyPositivity',
  filmmaking: 'documentary', documentary: 'documentary', storytelling: 'documentary', 'social issues': 'documentary', 'global stories': 'documentary',
  VR: 'vr', AR: 'vr', 'spatial computing': 'vr', 'XR development': 'vr', metaverse: 'vr',
  basketball: 'basketball', coaching: 'basketball', youth: 'basketball', leadership: 'basketball', community: 'basketball',
  plants: 'plants', botany: 'plants', gardening: 'plants', houseplants: 'plants', 'plant care': 'plants',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCommentCategoryForPost(postText, authorTopics) {
  const textLower = postText.toLowerCase();

  // First, try to match based on the author's topics
  for (const topic of authorTopics) {
    const category = TOPIC_TO_COMMENT_CATEGORY[topic];
    if (category && CONTEXTUAL_COMMENTS[category]) {
      // Check if any keywords from that category appear in the text
      const keywords = {
        travel: ['travel', 'country', 'flight', 'beach', 'island', 'backpack', 'nomad', 'market', 'temple', 'ocean', 'surf', 'hotel', 'airport', 'passport'],
        cybersecurity: ['hack', 'password', 'security', 'vulnerability', 'breach', 'ctf', 'zero-day', 'patch', 'cyber', 'ransomware', 'phishing'],
        fashion: ['runway', 'collection', 'design', 'fabric', 'style', 'vogue', 'ankara', 'sew', 'textile', 'outfit', 'fashion', 'brand'],
        baking: ['bake', 'dough', 'croissant', 'pastry', 'recipe', 'oven', 'flour', 'sugar', 'cake', 'bread', 'lamination', 'cookbook'],
        ocean: ['surf', 'wave', 'ocean', 'beach', 'salty', 'swell', 'marine', 'coast', 'reef', 'dolphin', 'sea'],
        therapy: ['heal', 'therapy', 'mental', 'feelings', 'boundaries', 'rest', 'peace', 'trauma', 'self-care', 'valid', 'process'],
        architecture: ['building', 'architect', 'timber', 'concrete', 'sustainable', 'green roof', 'design', 'sketch', 'biennale'],
        tattoo: ['tattoo', 'ink', 'flash', 'skin', 'needle', 'art', 'design', 'sleeve', 'piece'],
        journalism: ['report', 'story', 'investigation', 'journalist', 'press', 'headline', 'truth', 'ground', 'coverage'],
        cocktails: ['cocktail', 'bar', 'drink', 'speakeasy', 'mixology', 'spirit', 'pour', 'menu', 'garnish'],
        bodyPositivity: ['body', 'runway', 'model', 'size', 'confidence', 'beauty', 'brand', 'period', 'shrink'],
        documentary: ['film', 'documentary', 'camera', 'footage', 'story', 'editing', 'sundance', 'scene'],
        vr: ['vr', 'ar', 'spatial', 'xr', 'immersive', 'headset', 'virtual', 'metaverse', 'reality'],
        basketball: ['basketball', 'coach', 'gym', 'team', 'championship', 'court', 'practice', 'player', 'shot'],
        plants: ['plant', 'fern', 'root', 'water', 'leaf', 'green', 'propagat', 'soil', 'monstera', 'botanical', 'greenhouse'],
      };

      if (keywords[category] && keywords[category].some(kw => textLower.includes(kw))) {
        return category;
      }
    }
  }

  // Fallback: scan text for any recognizable topic
  for (const [category, kws] of Object.entries({
    travel: ['travel', 'country', 'flight', 'beach', 'island', 'passport', 'nomad', 'temple', 'bangkok', 'vietnam', 'philippines'],
    cybersecurity: ['hack', 'password', 'security', 'vulnerability', 'breach', 'ctf', 'def con', 'zero-day'],
    fashion: ['runway', 'collection', 'fabric', 'ankara', 'vogue', 'fashion week'],
    baking: ['bake', 'dough', 'croissant', 'pastry', 'recipe', 'flour', 'sugar', 'lamination'],
    ocean: ['surf', 'wave', 'ocean', 'beach', 'salty', 'dolphin', 'swell'],
    therapy: ['heal', 'therapy', 'mental health', 'boundaries', 'trauma', 'feelings'],
    architecture: ['architect', 'building', 'timber', 'concrete', 'sustainable', 'green roof'],
    tattoo: ['tattoo', 'ink', 'flash', 'skin', 'canvas', 'piece'],
    journalism: ['journalist', 'investigation', 'report', 'press', 'headline', 'truth'],
    cocktails: ['cocktail', 'bar', 'speakeasy', 'mixology', 'drink', 'pour'],
    bodyPositivity: ['body', 'model', 'size', 'runway body', 'period', 'shrink zone'],
    documentary: ['documentary', 'film', 'camera', 'footage', 'editing', 'sundance'],
    vr: ['vr', 'ar', 'spatial', 'xr', 'headset', 'immersive', 'metaverse'],
    basketball: ['basketball', 'coach', 'gym', 'team', 'championship', 'court', 'player'],
    plants: ['plant', 'fern', 'root', 'water', 'leaf', 'green', 'propagat', 'monstera', 'greenhouse'],
  })) {
    if (kws.some(kw => textLower.includes(kw))) {
      return category;
    }
  }

  return 'generic';
}

function generateContextualComment(postText, commenterBot, postAuthorTopics) {
  const category = pickCommentCategoryForPost(postText, postAuthorTopics);
  const comments = CONTEXTUAL_COMMENTS[category] || CONTEXTUAL_COMMENTS.generic;
  let comment = randomItem(comments);

  // 25% chance to add a speech style from the commenter's personality
  if (Math.random() < 0.25 && commenterBot.speechStyle) {
    comment = `${comment} ${randomItem(commenterBot.speechStyle)}`;
  }

  return comment;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function main() {
  console.log('🚀 ORRA — Add 15 New Bots v2 (u32–u46) + Seed Realistic Content');
  console.log('================================================================\n');

  const newBotIds = NEW_BOTS.map(b => b.id);
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  // Hash the password once for all bots
  console.log('🔐 Hashing bot passwords...');
  const hashedPassword = await bcrypt.hash('BotPassword2025!', 10);
  console.log('   ✅ Password hashed');

  // Get existing bot IDs and the founder ID
  const existingUsers = await prisma.user.findMany({ select: { id: true } });
  const existingUserIds = existingUsers.map(u => u.id);

  // ==========================================
  // STEP 1: Create 15 new bot users
  // ==========================================
  console.log('\n👤 Step 1: Creating 15 new bot users (u32–u46)...');

  for (const bot of NEW_BOTS) {
    const existing = await prisma.user.findUnique({ where: { id: bot.id } });
    const song = PROFILE_SONGS[bot.id];

    if (existing) {
      console.log(`   ⏭️  ${bot.name} (${bot.id}) already exists, updating profile...`);
      await prisma.user.update({
        where: { id: bot.id },
        data: {
          name: bot.name,
          handle: bot.handle,
          bio: bot.bio,
          location: bot.location,
          website: bot.website,
          password: hashedPassword,
          profileSongTitle: song.title,
          profileSongArtist: song.artist,
          profileSongUrl: song.url,
          verified: Math.random() < 0.3,
          auraTokens: Math.floor(Math.random() * 5000) + 500,
          auraLevel: Math.floor(Math.random() * 15) + 3,
          auraXP: Math.floor(Math.random() * 10000) + 500,
        }
      });
    } else {
      await prisma.user.create({
        data: {
          id: bot.id,
          email: `${bot.handle}@orra.bot`,
          name: bot.name,
          handle: bot.handle,
          password: hashedPassword,
          bio: bot.bio,
          location: bot.location,
          website: bot.website,
          profileSongTitle: song.title,
          profileSongArtist: song.artist,
          profileSongUrl: song.url,
          verified: Math.random() < 0.3,
          auraTokens: Math.floor(Math.random() * 5000) + 500,
          auraLevel: Math.floor(Math.random() * 15) + 3,
          auraXP: Math.floor(Math.random() * 10000) + 500,
        }
      });
      console.log(`   ✅ Created ${bot.name} (${bot.id})`);
    }
  }

  // ==========================================
  // STEP 2: Generate profile pictures
  // ==========================================
  console.log('\n📸 Step 2: Generating AI profile pictures...');

  const avatarDir = '/home/z/my-project/public/images/avatars';
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

  for (const bot of NEW_BOTS) {
    const avatarPath = `${avatarDir}/${bot.id}-${bot.handle}.jpg`;

    if (fs.existsSync(avatarPath)) {
      console.log(`   ⏭️  Avatar exists for ${bot.name}`);
    } else {
      try {
        console.log(`   🎨 Generating avatar for ${bot.name}...`);
        execSync(`z-ai-generate -p "${bot.avatarPrompt.replace(/"/g, '\\"')}" -o "${avatarPath}" -s 768x1344`, {
          timeout: 90000,
          stdio: 'pipe'
        });
        console.log(`   ✅ Avatar generated for ${bot.name}`);
      } catch (e) {
        console.log(`   ⚠️  Avatar generation failed for ${bot.name}, using default`);
      }
    }

    // Update avatar path in DB
    await prisma.user.update({
      where: { id: bot.id },
      data: { avatar: `/api/uploads?path=images/avatars/${bot.id}-${bot.handle}.jpg` }
    });
  }

  // ==========================================
  // STEP 3: Create posts with AI-generated images
  // ==========================================
  console.log('\n📝 Step 3: Creating realistic posts with matching AI images...');

  const uploadDir = '/home/z/my-project/public/uploads';
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const allNewPosts = [];

  for (const botId of newBotIds) {
    const posts = POSTS_BY_BOT[botId];
    if (!posts) continue;

    console.log(`   Writing posts for ${botId}...`);

    for (const post of posts) {
      const hoursAgo = Math.random() * 14 * 24; // Up to 14 days ago
      const createdAt = new Date(now - hoursAgo * HOUR);

      let images = '[]';

      if (post.hasImage) {
        const imageUrls = [];
        const numImages = post.multiImage ? (Math.floor(Math.random() * 2) + 2) : 1; // 2-3 for multi, 1 for single

        for (let img = 0; img < numImages; img++) {
          // For multi-image posts, create variations with different angles/perspectives
          let imgPrompt = post.imagePrompt;
          if (post.multiImage && img > 0) {
            const variations = [
              ', different angle, side perspective view',
              ', close-up detail shot, tight crop',
              ', wide shot showing full context and surroundings',
              ', overhead bird eye view perspective',
              ', shot from below looking up, dramatic angle',
            ];
            imgPrompt = post.imagePrompt + variations[img % variations.length];
          }

          const imgFilename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
          const imgPath = `${uploadDir}/${imgFilename}`;

          try {
            console.log(`      🎨 Generating image for: "${post.text.substring(0, 40)}..."${numImages > 1 ? ` [${img + 1}/${numImages}]` : ''}`);
            execSync(`z-ai-generate -p "${imgPrompt.replace(/"/g, '\\"')}" -o "${imgPath}" -s 1344x768`, {
              timeout: 120000,
              stdio: 'pipe'
            });
            imageUrls.push(`/api/uploads?file=${imgFilename}`);
          } catch (e) {
            console.log(`      ⚠️  Image gen failed, continuing without`);
          }
        }

        if (imageUrls.length > 0) {
          images = JSON.stringify(imageUrls);
        }
      }

      allNewPosts.push({
        text: post.text,
        images,
        vibeTag: post.vibeTag,
        type: images !== '[]' ? 'image' : 'text',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        authorId: botId,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  // Sort chronologically
  allNewPosts.sort((a, b) => a.createdAt - b.createdAt);

  // Insert in batches
  const POST_BATCH = 30;
  let totalInserted = 0;
  for (let i = 0; i < allNewPosts.length; i += POST_BATCH) {
    const batch = allNewPosts.slice(i, i + POST_BATCH);
    try {
      const result = await prisma.post.createMany({ data: batch });
      totalInserted += result.count;
    } catch (e) {
      console.log(`   ⚠️  Batch insert error: ${e.message}`);
      // Try inserting one by one for this batch
      for (const post of batch) {
        try {
          await prisma.post.create({ data: post });
          totalInserted++;
        } catch (e2) { /* skip */ }
      }
    }
    console.log(`   📝 Inserted ${totalInserted}/${allNewPosts.length} posts...`);
  }
  console.log(`   ✅ Created ${totalInserted} posts with matching images`);

  // ==========================================
  // STEP 4: Add contextual comments on existing posts
  // ==========================================
  console.log('\n💬 Step 4: Adding contextually relevant comments...');

  // Get ALL posts (including existing ones from other bots)
  const allPosts = await prisma.post.findMany({
    select: { id: true, text: true, authorId: true, createdAt: true }
  });

  // Build a bot lookup for comment generation
  const botLookup = {};
  NEW_BOTS.forEach(b => { botLookup[b.id] = b; });

  // Also get existing bot profiles (u1-u31) - use their topics if available
  const existingBots = await prisma.user.findMany({
    where: { id: { in: existingUserIds } },
    select: { id: true, name: true, handle: true }
  });

  const allCommenterIds = [...existingUserIds, ...newBotIds];

  const allComments = [];

  for (const post of allPosts) {
    const numComments = Math.floor(Math.random() * 5); // 0-4 comments per post

    for (let c = 0; c < numComments; c++) {
      // Pick a commenter that is NOT the post author
      let commenterId;
      let attempts = 0;
      do {
        commenterId = randomItem(allCommenterIds);
        attempts++;
      } while (commenterId === post.authorId && attempts < 10);

      if (commenterId === post.authorId) continue; // Skip self-comments

      // Get the commenter's bot info for contextual comments
      const commenterBot = botLookup[commenterId] || { speechStyle: [] };
      const authorBot = botLookup[post.authorId] || { topics: [] };

      // Generate a contextual comment
      const commentText = generateContextualComment(
        post.text,
        commenterBot,
        authorBot.topics || []
      );

      const commentTime = new Date(post.createdAt.getTime() + Math.random() * 48 * HOUR);

      allComments.push({
        text: commentText,
        postId: post.id,
        authorId: commenterId,
        createdAt: commentTime,
      });
    }
  }

  // Insert comments in batches
  const COMMENT_BATCH = 100;
  let totalComments = 0;
  for (let i = 0; i < allComments.length; i += COMMENT_BATCH) {
    const batch = allComments.slice(i, i + COMMENT_BATCH);
    try {
      const result = await prisma.comment.createMany({ data: batch });
      totalComments += result.count;
    } catch (e) {
      // Try one by one for duplicates
      for (const comment of batch) {
        try {
          await prisma.comment.create({ data: comment });
          totalComments++;
        } catch (e2) { /* skip */ }
      }
    }
  }
  console.log(`   ✅ Created ${totalComments} contextually relevant comments`);

  // ==========================================
  // STEP 5: Add likes/reactions on posts
  // ==========================================
  console.log('\n❤️  Step 5: Adding likes/reactions on posts...');

  const freshPostIds = (await prisma.post.findMany({ select: { id: true } })).map(p => p.id);
  const allLikes = [];
  const likeSet = new Set();

  for (const postId of freshPostIds) {
    const numLikes = Math.floor(Math.random() * 12); // 0-11 likes
    const likers = new Set();

    for (let l = 0; l < numLikes; l++) {
      const likerId = allCommenterIds[Math.floor(Math.random() * allCommenterIds.length)];
      if (likers.has(likerId)) continue;
      likers.add(likerId);

      const key = `${likerId}-${postId}-post`;
      if (likeSet.has(key)) continue;
      likeSet.add(key);

      const rand = Math.random();
      let reactionType = 'like';
      if (rand > 0.90) reactionType = 'wow';
      else if (rand > 0.82) reactionType = 'laughing';
      else if (rand > 0.74) reactionType = 'omg';
      else if (rand > 0.67) reactionType = 'care';
      else if (rand > 0.60) reactionType = 'sad';

      allLikes.push({
        userId: likerId,
        targetId: postId,
        targetType: 'post',
        reactionType,
        createdAt: new Date(now - Math.random() * 14 * DAY),
      });
    }
  }

  const LIKE_BATCH = 200;
  let totalLikes = 0;
  for (let i = 0; i < allLikes.length; i += LIKE_BATCH) {
    const batch = allLikes.slice(i, i + LIKE_BATCH);
    try {
      const result = await prisma.like.createMany({ data: batch });
      totalLikes += result.count;
    } catch (e) {
      // Try one by one
      for (const like of batch) {
        try {
          await prisma.like.create({ data: like });
          totalLikes++;
        } catch (e2) { /* skip */ }
      }
    }
  }
  console.log(`   ✅ Created ${totalLikes} likes/reactions`);

  // ==========================================
  // STEP 6: Update post like/comment counts
  // ==========================================
  console.log('\n📊 Step 6: Updating post counts...');

  // Update likesCount for all posts
  const likeCounts = await prisma.like.groupBy({
    by: ['targetId'],
    where: { targetType: 'post' },
    _count: { id: true },
  });

  let countUpdated = 0;
  for (const lc of likeCounts) {
    try {
      await prisma.post.update({
        where: { id: lc.targetId },
        data: { likesCount: lc._count.id },
      });
      countUpdated++;
    } catch (e) { /* post may not exist */ }
  }
  console.log(`   ✅ Updated likesCount for ${countUpdated} posts`);

  // Update commentsCount for all posts
  const commentCounts = await prisma.comment.groupBy({
    by: ['postId'],
    _count: { id: true },
  });

  let commentCountUpdated = 0;
  for (const cc of commentCounts) {
    try {
      await prisma.post.update({
        where: { id: cc.postId },
        data: { commentsCount: cc._count.id },
      });
      commentCountUpdated++;
    } catch (e) { /* post may not exist */ }
  }
  console.log(`   ✅ Updated commentsCount for ${commentCountUpdated} posts`);

  // ==========================================
  // STEP 7: Add follows between new bots and existing users
  // ==========================================
  console.log('\n👥 Step 7: Adding follows between users...');

  const follows = [];
  const followSet = new Set();

  for (const botId of newBotIds) {
    const numFollowing = Math.floor(Math.random() * 15) + 5; // 5-19 follows
    for (let f = 0; f < numFollowing; f++) {
      const targetId = allCommenterIds[Math.floor(Math.random() * allCommenterIds.length)];
      if (targetId === botId) continue;
      const key = `${botId}-${targetId}`;
      if (followSet.has(key)) continue;
      followSet.add(key);
      follows.push({
        followerId: botId,
        followingId: targetId,
        createdAt: new Date(now - Math.random() * 30 * DAY),
      });
    }
  }

  // Also add existing users following new bots
  for (const existingId of existingUserIds) {
    if (existingId.startsWith('cmo')) continue; // Skip non-bot real users
    const numFollowing = Math.floor(Math.random() * 8) + 2; // 2-9 follows of new bots
    for (let f = 0; f < numFollowing; f++) {
      const targetId = randomItem(newBotIds);
      const key = `${existingId}-${targetId}`;
      if (followSet.has(key)) continue;
      followSet.add(key);
      follows.push({
        followerId: existingId,
        followingId: targetId,
        createdAt: new Date(now - Math.random() * 30 * DAY),
      });
    }
  }

  let totalFollows = 0;
  for (let i = 0; i < follows.length; i += 100) {
    const batch = follows.slice(i, i + 100);
    try {
      const result = await prisma.follow.createMany({ data: batch });
      totalFollows += result.count;
    } catch (e) {
      for (const follow of batch) {
        try {
          await prisma.follow.create({ data: follow });
          totalFollows++;
        } catch (e2) { /* skip */ }
      }
    }
  }
  console.log(`   ✅ Created ${totalFollows} follows`);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 BOT SEED COMPLETE!');
  console.log('='.repeat(60));
  console.log(`   👤 15 new bots created (u32–u46)`);
  console.log(`   📸 ${NEW_BOTS.length} profile pictures generated`);
  console.log(`   🎵 ${NEW_BOTS.length} profile songs set`);
  console.log(`   📝 ${totalInserted} posts with matching images`);
  console.log(`   💬 ${totalComments} contextual comments`);
  console.log(`   ❤️  ${totalLikes} likes/reactions`);
  console.log(`   👥 ${totalFollows} follows`);
  console.log('='.repeat(60));
}

// ============================================================================
// RUN
// ============================================================================
main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Fatal error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
