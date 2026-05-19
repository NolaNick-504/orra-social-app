#!/usr/bin/env node
/**
 * ORRA Auto-Poster v3 — Human-like bot posts with emotions, real-world events,
 * personality-driven content, AI-generated images, and zero duplicate posts.
 *
 * Usage:
 *   node scripts/auto-poster.js            # Run once
 *   node scripts/auto-poster.js --cron     # Run every 45 minutes
 *
 * Environment:
 *   ORRA_URL - Base URL of the ORRA app (default: http://localhost:3000)
 *   NEXTAUTH_SECRET - API key for auto-post / auto-comment endpoints
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.ORRA_URL || 'http://localhost:3000';
const API_KEY = process.env.AUTOPOST_KEY || process.env.NEXTAUTH_SECRET || 'orra-internal-autopost-2026';
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// DUPLICATE TRACKING — Global Set of all posted text to prevent repeats
// ============================================================================
const postedTexts = new Set();
const MAX_SET_SIZE = 5000; // Prevent memory leak; oldest entries get rotated

function isDuplicate(text) {
  const normalized = text.trim().toLowerCase();
  return postedTexts.has(normalized);
}

function markPosted(text) {
  const normalized = text.trim().toLowerCase();
  postedTexts.add(normalized);
  // Evict oldest entries if set grows too large
  if (postedTexts.size > MAX_SET_SIZE) {
    const iter = postedTexts.values();
    for (let i = 0; i < 500; i++) {
      iter.next();
      postedTexts.delete(iter.next().value);
    }
  }
}

// ============================================================================
// BOT PERSONALITIES — Each bot has a unique personality that shapes their posts
// ============================================================================
const BOT_PROFILES = {
  u1: {
    name: 'Jessica Art',
    personality: 'creative',
    emotions: ['passionate', 'expressive', 'inspired', 'dreamy', 'fired up'],
    topics: ['art', 'design', 'creativity', 'culture'],
    vibeTags: ['dramatic', 'peaceful', 'chill'],
    speechStyle: ['fr', 'ngl', 'literally', 'obsessed'],
  },
  u2: {
    name: 'David Chen',
    personality: 'analytical',
    emotions: ['curious', 'impressed', 'skeptical', 'fascinated', 'intrigued'],
    topics: ['tech', 'AI', 'coding', 'gadgets', 'startups'],
    vibeTags: ['focused', 'news', 'chill'],
    speechStyle: ['honestly', 'think about it', 'the data says', 'interesting'],
  },
  u3: {
    name: 'Sarah Kim',
    personality: 'trendy',
    emotions: ['obsessed', 'vibing', 'living for it', 'shook', 'thrilled'],
    topics: ['fashion', 'beauty', 'trends', 'lifestyle', 'pop culture'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['period', 'no cap', 'bestie', 'slay'],
  },
  u4: {
    name: 'Marcus Rivera',
    personality: 'athletic',
    emotions: ['pumped', 'determined', 'unstoppable', 'grinding', 'blessed'],
    topics: ['sports', 'fitness', 'competition', 'training', 'NBA', 'NFL'],
    vibeTags: ['hyped', 'sports', 'focused'],
    speechStyle: ['lets go', 'no excuses', 'grind', 'real talk'],
  },
  u5: {
    name: 'Elena Rodriguez',
    personality: 'adventurous',
    emotions: ['grateful', 'excited', 'hungry', 'wanderlust', 'cozy'],
    topics: ['food', 'travel', 'cooking', 'culture', 'recipes'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['mi gente', 'listen', 'trust me', 'beloved'],
  },
  u6: {
    name: 'Tech Daily',
    personality: 'informative',
    emotions: ['breaking', 'alert', 'insightful', 'concerned', 'optimistic'],
    topics: ['tech news', 'AI', 'startups', 'apps', 'gadgets', 'industry'],
    vibeTags: ['news', 'focused', 'chill'],
    speechStyle: ['reporting', 'sources say', 'update', 'breaking'],
  },
  u7: {
    name: 'Wellness Guru',
    personality: 'mindful',
    emotions: ['centered', 'grateful', 'peaceful', 'grounded', 'present'],
    topics: ['wellness', 'meditation', 'mental health', 'self-care', 'yoga'],
    vibeTags: ['peaceful', 'chill', 'focused'],
    speechStyle: ['remember', 'breathe', 'you deserve', 'gentle reminder'],
  },
  u8: {
    name: 'Cyber Drifter',
    personality: 'edgy',
    emotions: ['chaotic', 'unbothered', 'amused', 'cryptic', 'hyped'],
    topics: ['cyberpunk', 'hacking', 'digital culture', 'memes', 'web3'],
    vibeTags: ['dramatic', 'chill', 'hyped'],
    speechStyle: ['lol', 'imagine', 'anyway', 'we live in a society'],
  },
  u9: {
    name: 'Music Central',
    personality: 'musical',
    emotions: ['vibing', 'obsessed', 'mesmerized', 'hyped', 'emotional'],
    topics: ['music', 'albums', 'concerts', 'hip-hop', 'indie', 'R&B'],
    vibeTags: ['chill', 'hyped', 'dramatic'],
    speechStyle: ['this goes hard', 'on repeat', 'no skip', 'real music'],
  },
  u10: {
    name: 'Luna Sky',
    personality: 'philosophical',
    emotions: ['contemplative', 'wondering', 'transcendent', 'melancholy', 'awakened'],
    topics: ['philosophy', 'art', 'poetry', 'nature', 'existence'],
    vibeTags: ['peaceful', 'dramatic', 'chill'],
    speechStyle: ['what if', 'think about', 'imagine', 'have you ever'],
  },
  u11: {
    name: 'Kai Storm',
    personality: 'bold',
    emotions: ['fired up', 'unapologetic', 'calling it out', 'energized', 'real'],
    topics: ['culture', 'opinions', 'trends', 'social issues', 'entertainment'],
    vibeTags: ['dramatic', 'hyped', 'news'],
    speechStyle: ['hot take', 'fight me', 'I said what I said', 'period'],
  },
  u12: {
    name: 'Nova Blaze',
    personality: 'competitive',
    emotions: ['hungry', 'unstoppable', 'dominant', 'clutch', 'elite'],
    topics: ['gaming', 'esports', 'competitions', 'ranked', 'championships'],
    vibeTags: ['hyped', 'sports', 'focused'],
    speechStyle: ['gg', 'ez', 'no shot', 'built different'],
  },
  u13: {
    name: 'Zara Miles',
    personality: 'social',
    emotions: ['obsessed', 'glowing', 'thriving', 'fabulous', 'excited'],
    topics: ['fashion', 'events', 'social life', 'beauty', 'lifestyle'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['obsessed', 'literally', 'iconic', 'can we talk about'],
  },
  u14: {
    name: 'Jay Parker',
    personality: 'humorous',
    emotions: ['laughing', 'wheezing', 'dead', 'crying', 'unbothered'],
    topics: ['gaming', 'memes', 'anime', 'comedy', 'pop culture'],
    vibeTags: ['laughing', 'chill', 'dramatic'],
    speechStyle: ['lmao', 'im dead', 'no way', 'bro'],
  },
  u15: {
    name: 'Maya Chen',
    personality: 'warm',
    emotions: ['grateful', 'inspired', 'cozy', 'nourished', 'content'],
    topics: ['food blogging', 'recipes', 'baking', 'food reviews', 'home cooking'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['you guys', 'trust me on this', 'recipe drop', 'comfort food'],
  },
  u16: {
    name: 'Dre Williams',
    personality: 'innovative',
    emotions: ['inspired', 'locked in', 'creating', 'in the zone', 'blessed'],
    topics: ['music production', 'beats', 'studio', 'hip-hop culture', 'collabs'],
    vibeTags: ['hyped', 'focused', 'chill'],
    speechStyle: ['cooking up', 'in the lab', 'no cap', 'fire'],
  },
  // ===== 15 NEW BOTS (u17-u31) =====
  u17: {
    name: 'Rico Vega',
    personality: 'observant',
    emotions: ['captivated', 'reflective', 'awestruck', 'nostalgic', 'present'],
    topics: ['photography', 'street art', 'urban culture', 'visual storytelling', 'popCulture'],
    vibeTags: ['dramatic', 'chill', 'peaceful'],
    speechStyle: ['real eyes', 'frame by frame', 'the streets talk', 'no filter needed'],
  },
  u18: {
    name: 'Aria Moon',
    personality: 'soulful',
    emotions: ['vulnerable', 'inspired', 'heartbroken', 'hopeful', 'tender'],
    topics: ['songwriting', 'acoustic music', 'poetry', 'love', 'music'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['from the heart', 'my soul', 'in my feelings', 'this one hurt to write'],
  },
  u19: {
    name: 'Jake Torres',
    personality: 'rebellious',
    emotions: ['stoked', 'restless', 'adrenalized', 'free', 'raw'],
    topics: ['skateboarding', 'filmmaking', 'street culture', 'sneakers', 'sports'],
    vibeTags: ['hyped', 'dramatic', 'chill'],
    speechStyle: ['send it', 'stoked', 'no guts no glory', 'that was gnarly'],
  },
  u20: {
    name: 'Nia Brooks',
    personality: 'expressive',
    emotions: ['electric', 'fluid', 'passionate', 'unstoppable', 'free'],
    topics: ['dance', 'choreography', 'movement', 'hip-hop dance', 'popCulture'],
    vibeTags: ['hyped', 'dramatic', 'chill'],
    speechStyle: ['feel the rhythm', 'body talks', 'let it move you', 'dance it out'],
  },
  u21: {
    name: 'Sam Park',
    personality: 'imaginative',
    emotions: ['inspired', 'determined', 'curious', 'excited', 'in the zone'],
    topics: ['game development', 'indie games', 'pixel art', 'coding', 'gaming'],
    vibeTags: ['focused', 'chill', 'hyped'],
    speechStyle: ['loading...', 'level up', 'save point', 'debugging life'],
  },
  u22: {
    name: 'Priya Sharma',
    personality: 'nurturing',
    emotions: ['warm', 'proud', 'nostalgic', 'generous', 'joyful'],
    topics: ['Indian cooking', 'spices', 'cultural recipes', 'food heritage', 'food'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['my grandmother taught me', 'add more spice', 'food is love', 'this is how we do it'],
  },
  u23: {
    name: 'Miles Jackson',
    personality: 'intellectual',
    emotions: ['contemplative', 'swinging', 'deep', 'transcendent', 'grooving'],
    topics: ['jazz', 'saxophone', 'music theory', 'data science', 'music'],
    vibeTags: ['chill', 'focused', 'peaceful'],
    speechStyle: ['groovy', 'in the pocket', 'let it breathe', 'the notes between the notes'],
  },
  u24: {
    name: 'Chloe Bennett',
    personality: 'earthy',
    emotions: ['blooming', 'grounded', 'serene', 'nurturing', 'patient'],
    topics: ['plants', 'interior design', 'sustainability', 'gardening', 'wellness'],
    vibeTags: ['peaceful', 'chill', 'focused'],
    speechStyle: ['grow through it', 'rooted', 'stay green', 'bloom where you are planted'],
  },
  u25: {
    name: 'Dex Carter',
    personality: 'collector',
    emotions: ['hyped', 'obsessed', 'grateful', 'competitive', 'stoked'],
    topics: ['sneakers', 'streetwear', 'fashion drops', 'collecting', 'fashion'],
    vibeTags: ['hyped', 'dramatic', 'chill'],
    speechStyle: ['cop or drop', 'grail status', 'heat check', 'never wear twice'],
  },
  u26: {
    name: 'Lily Tran',
    personality: 'wanderlust',
    emotions: ['adventurous', 'grateful', 'awestruck', 'restless', 'alive'],
    topics: ['travel', 'backpacking', 'adventure', 'cultures', 'wellness'],
    vibeTags: ['peaceful', 'chill', 'dramatic'],
    speechStyle: ['wanderlust', 'next destination', 'the world is waiting', 'pack light live heavy'],
  },
  u27: {
    name: 'Tyler Reed',
    personality: 'witty',
    emotions: ['hilarious', 'sharp', 'absurd', 'deadpan', 'on fire'],
    topics: ['comedy', 'stand-up', 'improv', 'observations', 'popCulture'],
    vibeTags: ['laughing', 'chill', 'dramatic'],
    speechStyle: ['set em up', 'punchline pending', 'crowd work', 'killin it tonight'],
  },
  u28: {
    name: 'Rosa Gutierrez',
    personality: 'glamorous',
    emotions: ['glowing', 'fabulous', 'confident', 'radiant', 'empowered'],
    topics: ['makeup', 'beauty', 'skincare', 'tutorials', 'fashion'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['glow up', 'serving looks', 'beauty is power', 'flawless'],
  },
  u29: {
    name: 'Kai Nakamura',
    personality: 'otaku',
    emotions: ['obsessed', 'emotional', 'hyped', 'invested', 'fangirling'],
    topics: ['anime', 'manga', 'cosplay', 'Japanese culture', 'gaming'],
    vibeTags: ['laughing', 'dramatic', 'chill'],
    speechStyle: ['nakama', 'senpai noticed me', 'that arc destroyed me', 'sub over dub'],
  },
  u30: {
    name: 'DeShawn Harris',
    personality: 'community',
    emotions: ['proud', 'connected', 'grateful', 'real', 'uplifted'],
    topics: ['barbering', 'community', 'entrepreneurship', 'mens grooming', 'socialMedia'],
    vibeTags: ['chill', 'focused', 'hyped'],
    speechStyle: ['fresh fade', 'community first', 'real talk', 'the chair knows all'],
  },
  u31: {
    name: 'Isla Murphy',
    personality: 'passionate',
    emotions: ['fired up', 'hopeful', 'determined', 'concerned', 'inspired'],
    topics: ['climate', 'sustainability', 'ocean conservation', 'eco-friendly', 'wellness'],
    vibeTags: ['peaceful', 'focused', 'dramatic'],
    speechStyle: ['protect the planet', 'every action counts', 'go green', 'the future depends on us'],
  },
  // ===== 15 NEW BOTS (u32-u46) =====
  u32: {
    name: 'Zara Kim',
    personality: 'visual',
    emotions: ['captivated', 'inspired', 'observant', 'aesthetic', 'mesmerized'],
    topics: ['fashion photography', 'street style', 'visual storytelling', 'editorial', 'fashion'],
    vibeTags: ['dramatic', 'chill', 'hyped'],
    speechStyle: ['the lens knows', 'frame it right', 'style is a story', 'capture the moment'],
  },
  u33: {
    name: 'Mateo Cruz',
    personality: 'energetic',
    emotions: ['electric', 'bass-driven', 'hyped', 'vibing', 'unleashed'],
    topics: ['DJing', 'electronic music', 'festivals', 'bass culture', 'music'],
    vibeTags: ['hyped', 'dramatic', 'chill'],
    speechStyle: ['drop the bass', 'festival ready', 'turn it up', 'the crowd goes wild'],
  },
  u34: {
    name: 'Trinity Hayes',
    personality: 'brilliant',
    emotions: ['fascinated', 'starstruck', 'curious', 'awestruck', 'determined'],
    topics: ['astrophysics', 'space exploration', 'science', 'black holes', 'tech'],
    vibeTags: ['focused', 'chill', 'dramatic'],
    speechStyle: ['the data says', 'think bigger', 'the universe is wild', 'science is lit'],
  },
  u35: {
    name: 'Oscar Reyes',
    personality: 'artistic',
    emotions: ['creative', 'bold', 'expressive', 'raw', 'unapologetic'],
    topics: ['tattoo art', 'illustration', 'ink culture', 'body art', 'popCulture'],
    vibeTags: ['dramatic', 'chill', 'hyped'],
    speechStyle: ['ink tells stories', 'skin deep', 'no regrets just art', 'the needle knows'],
  },
  u36: {
    name: 'Yasmin Patel',
    personality: 'serene',
    emotions: ['centered', 'peaceful', 'grounded', 'present', 'grateful'],
    topics: ['yoga', 'breathwork', 'meditation', 'spirituality', 'wellness'],
    vibeTags: ['peaceful', 'chill', 'focused'],
    speechStyle: ['breathe deep', 'find your center', 'namaste for real', 'stillness is power'],
  },
  u37: {
    name: 'Brooklyn Taylor',
    personality: 'authentic',
    emotions: ['real', 'unfiltered', 'honest', 'vulnerable', 'thriving'],
    topics: ['vlogging', 'content creation', 'lifestyle', 'behind the scenes', 'socialMedia'],
    vibeTags: ['dramatic', 'chill', 'hyped'],
    speechStyle: ['no filter', 'real talk', 'behind the scenes', 'raw and uncut'],
  },
  u38: {
    name: 'Hakeem Wright',
    personality: 'disciplined',
    emotions: ['focused', 'determined', 'pumped', 'relentless', 'committed'],
    topics: ['basketball training', 'skills development', 'sports', 'coaching', 'sports'],
    vibeTags: ['hyped', 'focused', 'sports'],
    speechStyle: ['no days off', 'fundamentals first', 'trust the process', 'gym life'],
  },
  u39: {
    name: 'Sienna Blake',
    personality: 'curated',
    emotions: ['inspired', 'elegant', 'creative', 'refined', 'warm'],
    topics: ['interior design', 'home decor', 'vintage finds', 'aesthetics', 'fashion'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['design is everything', 'curate your life', 'spaces tell stories', 'less is more'],
  },
  u40: {
    name: 'Theo Kim',
    personality: 'craftsman',
    emotions: ['passionate', 'focused', 'particular', 'satisfied', 'curious'],
    topics: ['specialty coffee', 'roasting', 'brewing methods', 'cafe culture', 'food'],
    vibeTags: ['chill', 'focused', 'peaceful'],
    speechStyle: ['brew it right', 'third wave or nothing', 'bean to cup', 'life is too short for bad coffee'],
  },
  u41: {
    name: 'Naomi Cruz',
    personality: 'fierce',
    emotions: ['glamorous', 'fearless', 'radiant', 'unapologetic', 'empowered'],
    topics: ['drag performance', 'visual art', 'LGBTQ+ culture', 'self-expression', 'popCulture'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['slay', 'glamour is my weapon', 'love wins', 'the stage is life'],
  },
  u42: {
    name: 'Finn OSullivan',
    personality: 'laidback',
    emotions: ['stoked', 'peaceful', 'free', 'grateful', 'adventurous'],
    topics: ['surfing', 'ocean life', 'beach culture', 'sustainability', 'wellness'],
    vibeTags: ['chill', 'peaceful', 'hyped'],
    speechStyle: ['surf and turf', 'saltwater soul', 'ride the wave', 'ocean is therapy'],
  },
  u43: {
    name: 'Amara Okafor',
    personality: 'purposeful',
    emotions: ['driven', 'inspired', 'determined', 'empathetic', 'fierce'],
    topics: ['documentary filmmaking', 'storytelling', 'social justice', 'culture', 'popCulture'],
    vibeTags: ['focused', 'dramatic', 'chill'],
    speechStyle: ['every story matters', 'the truth demands to be told', 'camera is my voice', 'document everything'],
  },
  u44: {
    name: 'Jax Rivera',
    personality: 'rebellious',
    emotions: ['bold', 'unapologetic', 'creative', 'defiant', 'alive'],
    topics: ['graffiti art', 'murals', 'street culture', 'urban art', 'popCulture'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['art belongs to everyone', 'walls talk', 'color outside the lines', 'the streets are my museum'],
  },
  u45: {
    name: 'Mina Sato',
    personality: 'sweet',
    emotions: ['delighted', 'focused', 'warm', 'creative', 'nostalgic'],
    topics: ['pastry making', 'baking', 'dessert art', 'sugar craft', 'food'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['sugar is love', 'bake the world better', 'from scratch', 'life is sweet'],
  },
  u46: {
    name: 'DJ Remix',
    personality: 'opinionated',
    emotions: ['animated', 'passionate', 'skeptical', 'entertained', 'fired up'],
    topics: ['pop culture commentary', 'podcasting', 'hot takes', 'entertainment', 'popCulture'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['hot take incoming', 'let me break it down', 'controversial but true', 'hear me out'],
  },
};

const BOT_USER_IDS = Object.keys(BOT_PROFILES);

// ============================================================================
// REAL-WORLD EVENT TOPICS — Large pools per category
// ============================================================================
const REAL_WORLD_TOPICS = {
  music: [
    "Beyoncé dropping surprise singles",
    "Kendrick Lamar's latest diss track",
    "Taylor Swift Eras Tour breaking records",
    "SZA's new album SOS Deluxe",
    "Drake and Future collab tape",
    "Bad Bunny selling out stadiums worldwide",
    "The Weeknd's new era of music",
    "Tyler the Creator's Camp Flog Gnaw lineup",
    "Billie Eilish evolving her sound again",
    "Doja Cat's controversial reinvention",
    "Frank Ocean finally performing live",
    "Rihanna's long-awaited album",
    "Travis Scott's Utopia tour visuals",
    "Ice Spice taking over the charts",
    "Metro Boomin producing another classic",
    "Olivia Rodrigo's heartbreak anthems",
    "Post Malone going country",
    "Dua Lipa's disco pop revival",
    "Arctic Monkeys new album hype",
    "Radiohead side projects",
    "Foo Fighters carrying on",
    "New indie darlings on TikTok",
    "Lollapalooza lineup announcement",
    "Coachella surprise guests",
    "Rolling Loud festival moments",
    "Grammy nominations controversy",
    "VMAs most iconic moments",
    "BRIT Awards performances",
    "Spotify Wrapped season",
    "Apple Music top 100 lists",
  ],
  sports: [
    "NBA playoffs drama",
    "LeBron breaking more records",
    "Victor Wembanyama rookie dominance",
    "Steph Curry from deep in clutch time",
    "NFL Super Bowl hype",
    "Patrick Mahomes doing the impossible",
    "Travis Kelce and Taylor Swift coverage",
    "Premier League title race",
    "Champions League knockout rounds",
    "Mbappé transfer saga",
    "Messi in Miami taking MLS mainstream",
    "F1 season rivalries",
    "Max Verstappen dominance",
    "UFC fight night outcomes",
    "Boxing pay-per-view events",
    "MLB postseason races",
    "Shohei Ohtani two-way greatness",
    "WWE Royal Rumble surprises",
    "March Madness bracket busters",
    "College football playoff expansion",
    "Tennis Grand Slam upsets",
    "Djokovic still winning everything",
    "WNBA growth and ratings",
    "Caitlin Clark effect on basketball",
    "Olympic qualifying stories",
    "Esports filling arenas worldwide",
  ],
  tech: [
    "GPT-5 rumors and capabilities",
    "Apple Vision Pro spatial computing",
    "Claude AI getting even smarter",
    "Google Gemini multimodal features",
    "Tesla Full Self-Driving updates",
    "Neuralink brain chip progress",
    "iPhone 16 camera upgrades",
    "Samsung Galaxy foldable evolution",
    "GitHub Copilot writing full apps",
    "AI art generators improving daily",
    "Quantum computing breakthroughs",
    "New programming languages emerging",
    "Rust taking over systems programming",
    "Web3 actually being useful now",
    "Cybersecurity breaches making headlines",
    "Remote work tools getting better",
    "Notion AI integration updates",
    "Figma vs Adobe design wars",
    "Electric vehicle battery innovations",
    "SpaceX Starship test flights",
    "Meta Quest VR gaming advances",
    "Robot vacuums getting too smart",
    "Smart home automation going mainstream",
    "Wearable health tech revolution",
    "5G actually delivering on promises",
    "Coding bootcamp vs CS degree debate",
  ],
  popCulture: [
    "New Marvel phase announcements",
    "DC Universe reboot under James Gunn",
    "Barbie movie cultural impact",
    "Oppenheimer sweeping awards",
    "Stranger Things final season",
    "Wednesday Addams season 2",
    "The Bear making everyone emotional",
    "Succession series finale reactions",
    "Euphoria fashion influencing everyone",
    "Yellowstone prequels expanding",
    "Anime going mainstream globally",
    "K-dramas taking over Netflix",
    "Celebrity breakup season",
    "Red carpet fashion moments",
    "Met Gala themes and drama",
    "SNL viral sketches",
    "TikTok creator drama",
    "YouTube vs TikTok wars",
    "Celebrity memoirs dropping truths",
    "Reality TV casting chaos",
    "Streaming wars intensifying",
    "Box office records being broken",
    "Indie films getting Oscar buzz",
    "Broadway shows going viral",
  ],
  fashion: [
    "Fashion Week highlights from every city",
    "Quiet luxury trend taking over",
    "Y2K fashion revival unstoppable",
    "Thrift flipping as a creative outlet",
    "Sustainable fashion going mainstream",
    "Sneaker culture and limited drops",
    "Vintage shopping as an aesthetic",
    "Streetwear collabs everyone wants",
    "Cottagecore still having a moment",
    "Gorpcore making outdoorsy cool",
    "Dopamine dressing for mental health",
    "Minimalist capsule wardrobes",
    "Statement accessories elevating fits",
    "Gender-neutral fashion lines",
    "Resale market booming",
    "Customization and DIY fashion",
    "Fashion influencers reshaping the industry",
    "Runway trends translating to real life",
    "Denim on denim making a comeback",
    "Chunky jewelry as the finishing touch",
  ],
  gaming: [
    "GTA 6 trailer breaking the internet",
    "Zelda Tears of the Kingdom masterpiece",
    "Baldur's Gate 3 winning everything",
    "Elden Ring DLC hype",
    "PlayStation 5 Pro speculation",
    "Nintendo Switch 2 rumors",
    "Fortnite crossovers getting wilder",
    "Call of Duty Warzone updates",
    "Valorant Champions moments",
    "League of Legends Worlds",
    "Minecraft still dominating after years",
    "Indie games winning hearts",
    "Hollow Knight Silksong anticipation",
    "Game Pass changing how we play",
    "Steam Deck making PC gaming portable",
    "VR gaming finally feeling real",
    "Speedrunning community achievements",
    "Retro gaming renaissance",
    "Cozy games for mental health",
    "Esports prize pools going crazy",
  ],
  wellness: [
    "Morning routines that actually work",
    "Cold plunges becoming mainstream",
    "Journaling for mental clarity",
    "Therapy becoming normalized",
    "Pilates renaissance on social media",
    "Walking as the ultimate workout",
    "Sleep hygiene revolution",
    "Gut health connection to everything",
    "Adaptogens and herbal supplements",
    "Digital detox challenges",
    "Sound healing and frequency therapy",
    "Breathwork techniques going viral",
    "Body neutrality over body positivity",
    "Burnout recovery strategies",
    "Social media and mental health",
    "Meal prep for wellness",
    "Yoga practices for every level",
    "Mindfulness in daily routines",
    "Nature therapy and forest bathing",
    "Setting boundaries as self-care",
  ],
  socialMedia: [
    "TikTok algorithm changes again",
    "Instagram Reels vs TikTok",
    "BeReal authentic moments",
    "YouTube Shorts monetization",
    "Twitter/X community notes",
    "Pinterest aesthetic boards",
    "LinkedIn becoming unhinged",
    "Snapchat AI features",
    "Threads trying to find its place",
    "Influencer culture evolving",
    "Content creator burnout",
    "Going viral overnight stories",
    "Social media challenges going wrong",
    "Nostalgia for old internet",
    "De-influencing trend",
    "Get ready with me content",
    "Storytelling format evolution",
    "Live streaming community growth",
    "Comment section culture",
    "POV videos taking over feeds",
  ],
  food: [
    "TikTok recipes going viral",
    "Air fryer recipe innovations",
    "Cloud kitchens and ghost restaurants",
    "Plant-based meat actually tasting good",
    "Sourdough still thriving",
    "Dalgona coffee era memories",
    "Food truck culture evolving",
    "International snack reviews",
    "Farm-to-table dining experiences",
    "Brunch culture and bottomless mimosas",
    "Hot sauce obsessions",
    "Food photography as an art form",
    "Comfort food making a comeback",
    "Fusion cuisine pushing boundaries",
    "Late night food spots hitting different",
    "Coffee culture third wave",
    "Matcha everything",
    "Taco Tuesday as a lifestyle",
    "Dessert trends going crazy",
    "Meal kit services improving",
  ],
};

// ============================================================================
// TOPIC-AWARE POST TEMPLATES — Templates that reference real events
// ============================================================================
const TOPIC_POST_TEMPLATES = {
  music: [
    (topic, emotion, style) => `${pickStyle(style)} ${topic} has me in a chokehold rn. Can't stop playing it on repeat`,
    (topic, emotion, style) => `Just spent 3 hours deep diving into ${topic} and I have no regrets ${pickStyle(style)}`,
    (topic, emotion, style) => `${topic} is proof that real art still exists. I'm ${pickEmotion(emotion)}`,
    (topic, emotion, style) => `The way ${topic} makes me feel is indescribable. Music really is therapy ${pickStyle(style)}`,
    (topic, emotion, style) => `If you're not paying attention to ${topic}, what are you even doing? ${pickStyle(style)}`,
    (topic, emotion, style) => `${topic} changed my whole perspective on music. Not even exaggerating`,
    (topic, emotion, style) => `My playlist is 90% ${topic} related and I'm not sorry about it ${pickStyle(style)}`,
    (topic, emotion, style) => `The cultural impact of ${topic} is something we'll be studying in 10 years`,
  ],
  sports: [
    (topic, emotion, style) => `${topic} is why I can't sleep during playoff season. My heart can't take it ${pickStyle(style)}`,
    (topic, emotion, style) => `Nobody talks about how ${topic} is literally rewriting history ${pickStyle(style)}`,
    (topic, emotion, style) => `The energy around ${topic} is insane right now. I'm so ${pickEmotion(emotion)}`,
    (topic, emotion, style) => `${topic} reminds me why I fell in love with sports in the first place`,
    (topic, emotion, style) => `Hot take: ${topic} is the most entertaining thing in sports right now. Fight me`,
    (topic, emotion, style) => `Waking up at 5am for ${topic} and I'd do it again without hesitation ${pickStyle(style)}`,
    (topic, emotion, style) => `Everyone sleeping on ${topic} and it shows. Real ones know what's happening`,
  ],
  tech: [
    (topic, emotion, style) => `${topic} is moving faster than anyone predicted. I'm ${pickEmotion(emotion)} and ${pickEmotion(emotion)} at the same time`,
    (topic, emotion, style) => `Spent the whole weekend playing with ${topic} and my mind is genuinely blown ${pickStyle(style)}`,
    (topic, emotion, style) => `The implications of ${topic} are huge and most people aren't even paying attention`,
    (topic, emotion, style) => `${topic} just changed the game entirely. Like genuinely nothing will be the same ${pickStyle(style)}`,
    (topic, emotion, style) => `Can we talk about how ${topic} is actually solving real problems now? Not just hype`,
    (topic, emotion, style) => `I've been testing ${topic} for a week and the results are... interesting ${pickStyle(style)}`,
    (topic, emotion, style) => `The fact that ${topic} exists in our lifetime is wild. We're so back`,
  ],
  popCulture: [
    (topic, emotion, style) => `${topic} literally broke the internet and I was here for every second ${pickStyle(style)}`,
    (topic, emotion, style) => `Can we process ${topic} as a society please? I'm still not over it`,
    (topic, emotion, style) => `${topic} is the pop culture moment we needed. I feel so ${pickEmotion(emotion)} about it`,
    (topic, emotion, style) => `If ${topic} doesn't define this era, I don't know what does ${pickStyle(style)}`,
    (topic, emotion, style) => `The way ${topic} took over my entire feed... I'm not mad about it though`,
    (topic, emotion, style) => `Everyone has an opinion on ${topic} and honestly they should. This is massive`,
  ],
  fashion: [
    (topic, emotion, style) => `${topic} is literally my entire personality right now ${pickStyle(style)}`,
    (topic, emotion, style) => `The way ${topic} is evolving is everything. I'm so ${pickEmotion(emotion)}`,
    (topic, emotion, style) => `If your wardrobe doesn't reflect ${topic}, what are you even doing? ${pickStyle(style)}`,
    (topic, emotion, style) => `${topic} is proof that fashion keeps reinventing itself and I love it`,
    (topic, emotion, style) => `My bank account is crying but ${topic} is calling and I must answer ${pickStyle(style)}`,
    (topic, emotion, style) => `${topic} has me rethinking my entire closet. Time for a glow up ${pickStyle(style)}`,
  ],
  gaming: [
    (topic, emotion, style) => `${topic} is the reason I'm getting zero sleep and I regret nothing ${pickStyle(style)}`,
    (topic, emotion, style) => `The way ${topic} has the whole gaming community in a chokehold is unreal`,
    (topic, emotion, style) => `${topic} is proof that gaming is the most innovative entertainment medium ${pickStyle(style)}`,
    (topic, emotion, style) => `Been grinding ${topic} all week and I'm finally seeing progress. ${pickEmotion(emotion)}`,
    (topic, emotion, style) => `Everyone needs to experience ${topic} at least once. It changes you ${pickStyle(style)}`,
    (topic, emotion, style) => `The hype around ${topic} is 100% justified. Not even exaggerating`,
  ],
  wellness: [
    (topic, emotion, style) => `${topic} genuinely changed my daily routine. I feel so ${pickEmotion(emotion)} about it`,
    (topic, emotion, style) => `If you haven't tried ${topic} yet, this is your sign. Game changer ${pickStyle(style)}`,
    (topic, emotion, style) => `${topic} is the self-care practice everyone needs but nobody talks about enough`,
    (topic, emotion, style) => `Started incorporating ${topic} into my mornings and the difference is night and day ${pickStyle(style)}`,
    (topic, emotion, style) => `We need to normalize ${topic} as part of everyday life. No more guilt ${pickStyle(style)}`,
    (topic, emotion, style) => `${topic} isn't a trend, it's a lifestyle shift. I'm all in ${pickStyle(style)}`,
  ],
  socialMedia: [
    (topic, emotion, style) => `${topic} is either the best or worst thing to happen to the internet. I can't decide ${pickStyle(style)}`,
    (topic, emotion, style) => `The way ${topic} has shifted how we communicate is actually fascinating`,
    (topic, emotion, style) => `${topic} proves that the internet never runs out of surprises ${pickStyle(style)}`,
    (topic, emotion, style) => `I have thoughts about ${topic} and they might be unpopular but here we go`,
    (topic, emotion, style) => `${topic} is the kind of chaos I signed up for ${pickStyle(style)}`,
  ],
  food: [
    (topic, emotion, style) => `${topic} has me questioning every meal I've ever had before ${pickStyle(style)}`,
    (topic, emotion, style) => `The way ${topic} is taking over my kitchen... my grocery bill is ${pickEmotion(emotion)}`,
    (topic, emotion, style) => `${topic} is proof that food brings people together like nothing else ${pickStyle(style)}`,
    (topic, emotion, style) => `Tried ${topic} for the first time and I might never go back. Life changing ${pickStyle(style)}`,
    (topic, emotion, style) => `${topic} is the comfort we all need right now. No debate ${pickStyle(style)}`,
    (topic, emotion, style) => `If you're not into ${topic} yet, what are you even eating? ${pickStyle(style)}`,
  ],
};

// ============================================================================
// PHOTO POST TEMPLATES — Posts that feel like they should have a photo
// ============================================================================
const PHOTO_POST_TEMPLATES = [
  // Food & Cooking
  { text: "Made this from scratch and I'm not even sorry for the food spam. Best thing I've eaten all year", vibeTag: 'chill', topic: 'food' },
  { text: "Brunch is served! Who's coming over? Made enough for the whole crew", vibeTag: 'chill', topic: 'food' },
  { text: "Late night cooking hits different. This pasta took 2 hours and I regret nothing", vibeTag: 'chill', topic: 'food' },
  { text: "My abuela's secret recipe. She'd kill me for sharing but y'all deserve to know", vibeTag: 'chill', topic: 'food' },
  { text: "Coffee art level: finally not embarrassing. What's your go-to order?", vibeTag: 'chill', topic: 'food' },
  { text: "Recipe drop! This 20-minute meal changed my weeknight dinner game forever", vibeTag: 'chill', topic: 'food' },
  { text: "Meal prep Sunday looking real good this week. Trying something new", vibeTag: 'focused', topic: 'food' },
  { text: "Found the best hidden gem restaurant and I'm keeping it a secret... okay maybe just for you guys", vibeTag: 'chill', topic: 'food' },
  { text: "This dessert took 4 hours to make and 4 minutes to disappear. Worth every second", vibeTag: 'dramatic', topic: 'food' },
  { text: "Sunday baking session. The kitchen smells absolutely incredible right now", vibeTag: 'peaceful', topic: 'food' },
  // Nature & Travel
  { text: "Golden hour never disappoints. This view was worth the 6am hike", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Found this hidden beach and I'm not telling anyone where it is... okay maybe you guys", vibeTag: 'chill', topic: 'wellness' },
  { text: "City lights hit different at 2am. Who else is a night owl?", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "This sunset literally stopped me in my tracks. Nature stays winning", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Street art just hits different in Berlin. Every corner is a gallery", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Woke up to this view and honestly questioning all my life choices that don't involve living here", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Mountain trail completed. The views at the top were absolutely worth the struggle", vibeTag: 'hyped', topic: 'wellness' },
  { text: "This café aesthetic is everything. Working remotely from paradise today", vibeTag: 'chill', topic: 'socialMedia' },
  // Fashion & Style
  { text: "New fit check! This look took 3 stores and 47 changing rooms to find", vibeTag: 'dramatic', topic: 'fashion' },
  { text: "When the outfit just works and you can't stop looking in the mirror", vibeTag: 'dramatic', topic: 'fashion' },
  { text: "Thrift store find of the CENTURY. $8 for this vintage jacket?! Steal of the year", vibeTag: 'laughing', topic: 'fashion' },
  { text: "OOTD but make it effortless. Sometimes the simplest looks hit the hardest", vibeTag: 'chill', topic: 'fashion' },
  { text: "Season transition wardrobe is ready. Layers on layers on layers", vibeTag: 'focused', topic: 'fashion' },
  { text: "Styled this 5 ways and every look goes crazy. Versatility is key", vibeTag: 'dramatic', topic: 'fashion' },
  // Fitness & Sports
  { text: "Post-workout glow is real! 6 months of consistency and I finally see the change", vibeTag: 'hyped', topic: 'sports' },
  { text: "Basketball pickup game went CRAZY today. Hit the game winner!", vibeTag: 'hyped', topic: 'sports' },
  { text: "New PR today! The grind is paying off and it feels incredible", vibeTag: 'hyped', topic: 'sports' },
  { text: "Morning run through the city. These early sessions are becoming my favorite part of the day", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Game day ready. Let's see what today brings", vibeTag: 'hyped', topic: 'sports' },
  // Art & Creative
  { text: "12 hours of painting later... is it done? I genuinely can't tell anymore", vibeTag: 'dramatic', topic: 'music' },
  { text: "Digital art process! Swipe to see the layers come together. Still can't believe this started as a blank canvas", vibeTag: 'dramatic', topic: 'music' },
  { text: "New mural in progress! This one's dedicated to the ORRA community", vibeTag: 'dramatic', topic: 'socialMedia' },
  { text: "Sketchbook dump. Some days the creativity flows and some days it doesn't. Today was a flow day", vibeTag: 'chill', topic: 'music' },
  // Tech & Gaming
  { text: "New setup is FINALLY complete! Took 3 months of saving but worth every penny", vibeTag: 'focused', topic: 'tech' },
  { text: "Retro gaming night! Some games just hit different on the original console", vibeTag: 'chill', topic: 'gaming' },
  { text: "Studio session going crazy tonight! New track is almost done and it's a banger", vibeTag: 'hyped', topic: 'music' },
  { text: "Vinyl collection growing! Found a first press of my favorite album at the flea market", vibeTag: 'chill', topic: 'music' },
  // Pets & Life
  { text: "My cat just did the funniest thing and I happened to catch it on camera", vibeTag: 'laughing', topic: 'socialMedia' },
  { text: "This good boy followed me on my morning walk. Best hiking buddy ever", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Plant parent update: everyone is still alive and thriving. This is personal growth", vibeTag: 'chill', topic: 'wellness' },
  { text: "My dog just stole my spot on the couch and honestly? I respect the audacity", vibeTag: 'laughing', topic: 'socialMedia' },
  // New bot content — Photography, Dance, Skating, Beauty, Travel, Comedy, Nature, Gaming, etc.
  { text: "Captured this moment and I can not stop staring at it. Light was perfect, timing was right", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Street photography dump from today. The city never sleeps and neither does my camera", vibeTag: 'chill', topic: 'popCulture' },
  { text: "Wrote this song at 2am when I couldn't sleep. Sometimes the best melodies come from the hardest nights", vibeTag: 'peaceful', topic: 'music' },
  { text: "Acoustic session in my living room. No fancy studio just me and my guitar and these feelings", vibeTag: 'chill', topic: 'music' },
  { text: "Landed this trick after 47 attempts. My ankles are destroyed but the clip is clean", vibeTag: 'hyped', topic: 'sports' },
  { text: "New skate edit just dropped. Three weeks of filming for 90 seconds of footage. Worth it", vibeTag: 'hyped', topic: 'sports' },
  { text: "Choreography session went off today. The team is locked in and the routine is coming together", vibeTag: 'hyped', topic: 'popCulture' },
  { text: "Dance practice video from today. Not perfect yet but the progress is real", vibeTag: 'focused', topic: 'popCulture' },
  { text: "Just hit a major milestone in my game dev project. Two years of work and it is finally playable", vibeTag: 'hyped', topic: 'gaming' },
  { text: "Pixel art progress! Every frame is hand-drawn. The dedication is real", vibeTag: 'focused', topic: 'gaming' },
  { text: "Made my grandmother butter chicken from scratch. Tastes just like home", vibeTag: 'chill', topic: 'food' },
  { text: "Spice rack organization complete. This is what productivity looks like", vibeTag: 'chill', topic: 'food' },
  { text: "Jazz set at the club tonight was transcendent. The crowd was feeling every note", vibeTag: 'chill', topic: 'music' },
  { text: "Saxophone practice paying off. Finally nailed that Coltrane progression", vibeTag: 'focused', topic: 'music' },
  { text: "New plant addition! Meet the newest member of the family. My apartment is basically a jungle now", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Repotted 12 plants today and my back is killing me but they look so happy", vibeTag: 'chill', topic: 'wellness' },
  { text: "Just copped the new drop. The detail on these is insane. Collection keeps growing", vibeTag: 'hyped', topic: 'fashion' },
  { text: "Sneaker collection update. Had to build a new shelf because the old one couldn't hold them all", vibeTag: 'dramatic', topic: 'fashion' },
  { text: "Sunrise from the top of a mountain in Peru. This is why I travel", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Backpacking through Southeast Asia update. This hostel has the best view I have ever seen", vibeTag: 'chill', topic: 'wellness' },
  { text: "Show went crazy tonight! The crowd was unreal. Comedy is the best job in the world", vibeTag: 'hyped', topic: 'popCulture' },
  { text: "New bit killed at open mic. Sometimes the crowd writes the joke for you", vibeTag: 'laughing', topic: 'popCulture' },
  { text: "Makeup look for today! Tried something completely new and I am obsessed with how it turned out", vibeTag: 'dramatic', topic: 'fashion' },
  { text: "Skincare routine results after 3 months. Consistency is everything people", vibeTag: 'chill', topic: 'fashion' },
  { text: "This anime season is absolutely stacked. Too many shows not enough hours in the day", vibeTag: 'hyped', topic: 'gaming' },
  { text: "Cosplay progress! Almost done with the armor. Comic con is going to be wild this year", vibeTag: 'dramatic', topic: 'gaming' },
  { text: "Fresh fade for a fresh week. The chair was deep today and the vibes were immaculate", vibeTag: 'chill', topic: 'socialMedia' },
  { text: "Barbershop therapy session. Sometimes the best conversations happen between the clippers", vibeTag: 'chill', topic: 'socialMedia' },
  { text: "Beach cleanup today and we collected 200 lbs of trash. Small actions, big impact", vibeTag: 'focused', topic: 'wellness' },
  { text: "Hiking trail cleanup crew! Nature gives us so much, least we can do is protect it", vibeTag: 'peaceful', topic: 'wellness' },
  // New bot content (u32-u46) — Fashion Photography, DJ, Science, Tattoo, Yoga, Vlogging, Basketball, Interior Design, Coffee, Drag, Surf, Documentary, Graffiti, Pastry, Podcast
  { text: "Street style snap from Fashion Week. This look deserves its own editorial spread", vibeTag: 'dramatic', topic: 'fashion' },
  { text: "Behind the lens at a runway show. The energy backstage is absolutely electric", vibeTag: 'hyped', topic: 'fashion' },
  { text: "Caught this candid style moment on the subway. Fashion is everywhere if you look", vibeTag: 'chill', topic: 'fashion' },
  { text: "Set was INSANE tonight. 3 hours of nonstop bass and the crowd never stopped moving", vibeTag: 'hyped', topic: 'music' },
  { text: "Festival sunset set just hit different. 50,000 people all moving to the same beat", vibeTag: 'dramatic', topic: 'music' },
  { text: "New track in the works. The drop on this one is going to destroy dance floors", vibeTag: 'focused', topic: 'music' },
  { text: "Just observed a neutron star merger simulation and my mind is genuinely blown. The universe is unhinged", vibeTag: 'focused', topic: 'tech' },
  { text: "Black hole fact of the day: time literally slows down near one. Physics is wild yall", vibeTag: 'chill', topic: 'tech' },
  { text: "Spent all night in the observatory and saw the rings of Saturn with my own eyes. Life changing", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Finished this 12 hour session today. The detail on this sleeve is coming together perfectly", vibeTag: 'focused', topic: 'popCulture' },
  { text: "Custom flash sheet just dropped! First come first served this weekend", vibeTag: 'hyped', topic: 'popCulture' },
  { text: "Every tattoo tells a story and today this one told mine. Ink therapy at its finest", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Morning breathwork session complete. 20 minutes of conscious breathing and the world makes sense again", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Yoga flow at sunrise. There is something sacred about moving your body while the world wakes up", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "New meditation guide just dropped on the channel. 10 minutes that will change your whole day", vibeTag: 'chill', topic: 'wellness' },
  { text: "Day in my life vlog just went live! Spoiler: it involves a lot of coffee and chaotic creativity", vibeTag: 'hyped', topic: 'socialMedia' },
  { text: "Behind the scenes of today is shoot. The real content is what happens between takes", vibeTag: 'chill', topic: 'socialMedia' },
  { text: "GRWM for the biggest meeting of my career. Vulnerability is content and I am here for it", vibeTag: 'dramatic', topic: 'socialMedia' },
  { text: "Training session went crazy today. Kid just learned a killer crossover in one session", vibeTag: 'hyped', topic: 'sports' },
  { text: "5am gym session before the world wakes up. This is where champions are made", vibeTag: 'focused', topic: 'sports' },
  { text: "Basketball fundamentals clinic this Saturday. All skill levels welcome. Let us get better together", vibeTag: 'chill', topic: 'sports' },
  { text: "Living room makeover COMPLETE. The before and after is unreal. Vintage pieces make all the difference", vibeTag: 'dramatic', topic: 'fashion' },
  { text: "Thrift store find of the week. This mid-century lamp is everything and it was 12 dollars", vibeTag: 'chill', topic: 'fashion' },
  { text: "Mood board for a new client project. Earth tones with pops of terracotta. Design is storytelling", vibeTag: 'focused', topic: 'fashion' },
  { text: "New single origin just arrived from Ethiopia. The tasting notes on this one are extraordinary", vibeTag: 'chill', topic: 'food' },
  { text: "Latte art progress! Finally nailed the rosetta after 200 attempts. Persistence pays off", vibeTag: 'focused', topic: 'food' },
  { text: "Cafe is packed today and the espresso machine is working overtime. This is the life", vibeTag: 'hyped', topic: 'food' },
  { text: "Show night! The energy backstage before stepping out is like nothing else in this world", vibeTag: 'hyped', topic: 'popCulture' },
  { text: "New look reveal and she is SERVING. 4 hours of makeup and every second was worth it", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Drag is not just performance it is revolution. Art as activism. Love as resistance", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Dawn patrol session was absolutely perfect. Clean waves and offshore wind. This is living", vibeTag: 'peaceful', topic: 'wellness' },
  { text: "Surf lesson with the groms today. Seeing kids fall in love with the ocean never gets old", vibeTag: 'chill', topic: 'wellness' },
  { text: "Beach cleanup crew pulled 150 lbs of plastic today. Protect what you love", vibeTag: 'focused', topic: 'wellness' },
  { text: "Behind the camera on our latest doc. This story is going to change how people see this community", vibeTag: 'focused', topic: 'popCulture' },
  { text: "Interview wrapped. Three hours of the most honest conversation I have ever filmed. The truth is powerful", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Documentary filmmaking is about listening. The best stories come when you stop talking and start hearing", vibeTag: 'chill', topic: 'popCulture' },
  { text: "New mural going up in the Arts District. 40 feet of color and it is only half done", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Wall found, spray cans loaded, vision locked. Let us make this city more beautiful", vibeTag: 'hyped', topic: 'popCulture' },
  { text: "Graffiti is the voice of the streets and today we made the neighborhood sing", vibeTag: 'hyped', topic: 'popCulture' },
  { text: "Croquembouche assembled! 200 cream puffs and a tower of caramel. Pastry architecture at its finest", vibeTag: 'dramatic', topic: 'food' },
  { text: "Macaron batch number 47 and I finally got the feet right. Baking is patience", vibeTag: 'focused', topic: 'food' },
  { text: "Wedding cake delivery complete. Three tiers of sugar and love. The happy couple was speechless", vibeTag: 'chill', topic: 'food' },
  { text: "New podcast episode just dropped and we got HEATED. This week is topic had me on a soapbox", vibeTag: 'hyped', topic: 'popCulture' },
  { text: "Recording the wildest episode yet. The hot takes are SCORCHING. Do not miss this one", vibeTag: 'dramatic', topic: 'popCulture' },
  { text: "Live podcast tonight! Bring your opinions because I have got mine and they are controversial", vibeTag: 'hyped', topic: 'popCulture' },
];

// ============================================================================
// TEXT-ONLY POST TEMPLATES — Grouped by topic
// ============================================================================
const TEXT_POST_TEMPLATES = {
  music: [
    "This new album dropped and I haven't stopped listening since. On repeat all day",
    "Nothing compares to finding a song that perfectly matches your mood",
    "Making a playlist for every possible mood is not a problem, it's a lifestyle",
    "That feeling when a song hits different at 2am? Yeah that's the real magic",
    "Music festivals should be a basic human right at this point",
    "Some songs just transport you to a completely different time and place",
    "The aux cord is a responsibility not everyone is ready for",
    "Unpopular opinion: album covers are an art form that deserves more respect",
    "Live music is the only thing that cures everything. I'm convinced",
    "Found a hidden gem on Spotify and I'm gatekeeping it... just kidding here's the link",
    "The way a single melody can make you cry and smile at the same time is wild",
    "Every genre has that ONE song that everyone knows. What's yours?",
    "Vinyl collecting is my therapy and my wallet's worst enemy",
  ],
  sports: [
    "That post-workout feeling hits different when you actually stick to the routine",
    "Day 30 of working out every day. The transformation is real",
    "Stop waiting for the perfect moment. The moment you start IS the perfect moment",
    "Your only competition is who you were yesterday. Keep pushing",
    "Small progress is still progress. Don't compare your chapter 1 to someone's chapter 20",
    "Sports fandom is just agreeing to have your heart broken repeatedly and loving it",
    "There's nothing like the energy of a live game. The crowd, the tension, everything",
    "Training when nobody's watching is what separates good from great",
    "The off-season is just preparation for the main event. Stay ready",
    "Athletic highlights on here are underrated. Show me that game footage",
    "Fantasy league is more stressful than my actual job and I wouldn't have it any other way",
    "Respect the grind. Every champion was once a beginner who refused to quit",
  ],
  tech: [
    "Just tried the new AI coding assistant and it wrote my entire app in 10 minutes. We're living in the future fr",
    "Anyone else feel like we're on the verge of something massive with AI? The pace is insane right now",
    "Hot take: the best tech is the tech that disappears into your daily routine",
    "The world moves fast but staying informed doesn't mean doom scrolling. Balance is key",
    "I spend more time debugging than writing code and honestly that's just software engineering",
    "Tech layoffs are scary but the industry always bounces back. Keep building",
    "The gap between what AI can do and what people think it can do is still huge",
    "If your app needs a tutorial to use, the design needs work. Period",
    "Sometimes the simplest solution is the best one. Stop over-engineering everything",
    "Open source contributions are how we build the future together",
    "My productivity went up 10x when I stopped fighting my tools and started using them right",
    "The best developers I know are the ones who never stop being curious",
  ],
  popCulture: [
    "Plot twist: the wifi was working fine, I just forgot to pay the bill",
    "Friday plans? Couch, snacks, and absolutely zero social interaction. Perfect.",
    "When someone says 'we need to talk' and it's just about lunch plans",
    "Can we normalize changing our opinions when presented with new evidence?",
    "Surround yourself with people who make you want to level up",
    "The algorithm knows me better than I know myself and that's terrifying",
    "Rewatching a show and noticing details you missed the first time is elite entertainment",
    "Pop culture references are the universal language of our generation",
    "If you're not at least a little obsessed with something, are you even living?",
    "The amount of content available now is both a blessing and a curse",
    "Some movie quotes just live rent free in your head forever",
    "We need more shows that don't get cancelled after one season. Make it make sense",
  ],
  fashion: [
    "Dress for the job you want, not the job you have. Unless you want to be a ninja. Then maybe rethink",
    "Fashion is the most fun you can have without saying a word",
    "Style isn't about the price tag, it's about how you wear it",
    "The right outfit can literally change your entire mood. Science? Maybe. Fact? Absolutely",
    "Getting dressed is my favorite form of self-expression and nobody can change my mind",
    "Fashion rules were made to be broken. Mix those patterns, wear those colors",
    "Confidence is the best accessory and it's completely free",
    "The satisfaction of putting together the perfect outfit is unmatched",
  ],
  gaming: [
    "One more round turned into 3 hours. Every. Single. Time.",
    "Gaming is my therapy and I'm tired of pretending it's not",
    "The stress of a ranked match is something non-gamers will never understand",
    "That feeling when you finally beat a boss after 47 attempts is pure euphoria",
    "Cozy gaming > sweaty gaming. Sometimes you just want to vibe",
    "The lore in some games is deeper than most novels and I'm here for it",
    "Speedrunning is the most impressive thing on the internet right now. Change my mind",
    "Game soundtracks deserve way more recognition. Some are absolute masterpieces",
  ],
  wellness: [
    "Woke up today and chose peace. No drama, just vibes",
    "Sometimes you just need to disconnect and touch grass fr",
    "Mental health check: how are you really doing today? Be honest with yourself",
    "3am thoughts hit different when the whole world is asleep",
    "Therapy is the best investment I've ever made. No regrets",
    "Healing isn't linear and that's okay. Some days are harder than others",
    "The way we talk to ourselves matters more than we realize",
    "Boundaries aren't walls, they're bridges to healthier relationships",
    "Self-care isn't selfish, it's necessary. Refill your cup first",
    "Stillness is underrated. We're so conditioned to always be doing something",
    "Your body is always communicating with you. The question is are you listening?",
  ],
  socialMedia: [
    "Who else is addicted to the ORRA feed? Can't stop scrolling",
    "ORRA tokens stacking up! What's everyone saving for?",
    "The community on here is actually so much better than other apps. No toxicity, just vibes",
    "Just hit Level 10 on ORRA! The grind never stops",
    "Social media break was the best decision I made this month. But I'm back now",
    "The ORRA algorithm actually shows me good content. Imagine that",
    "This app feels like what social media was supposed to be all along",
    "Every platform should have an aura level system. It just makes sense",
  ],
  food: [
    "Found the best taco spot in town. Life is complete now",
    "Late night drives with the windows down >>>>",
    "My love language is cooking for people. Fight me on this",
    "Breakfast is and always will be the most important meal of the day. I will die on this hill",
    "The secret ingredient is always more butter. Always",
    "Cooking is my creative outlet and everyone benefits from it",
    "Good food, good mood. It's really that simple sometimes",
    "I think about food approximately 97% of the day and I'm okay with that",
    "Every culture has a comfort food and they're all valid",
    "Food brings people together faster than anything else. That's just facts",
  ],
};

// ============================================================================
// AUTO-COMMENT TEMPLATES — Realistic, emotional, contextual comments
// ============================================================================
const COMMENT_TEMPLATES = {
  supportive: [
    "This is so real!",
    "Can't stop thinking about this",
    "You always post the best stuff",
    "Needed to hear this today",
    "This hit different",
    "You just spoke my whole mind",
    "This is exactly what I needed to see rn",
    "Facts on facts on facts",
    "You never miss with these posts",
    "This resonates so deeply",
    "Reading this at the perfect time",
    "This deserves way more attention",
    "You put into words what I couldn't",
    "This is why I follow you",
    "I felt this in my soul",
  ],
  reactive: [
    "Wait this is actually so good",
    "Okay but this is INSANE",
    "No because why is this so accurate",
    "I'm not okay after reading this",
    "The way this just changed my whole perspective",
    "I literally just gasped",
    "This broke something in me",
    "Stop I was literally just thinking about this",
    "This sent chills down my spine",
    "I had to sit with this for a minute",
    "My jaw actually dropped",
    "This unlocked a new feeling",
  ],
  casual: [
    "Say more though",
    "Tell me more about this",
    "Okay but elaborate?",
    "Drop the details!",
    "Wait I need the full story",
    "Spill! What happened?",
    "And then what? Don't leave us hanging",
    "This needs a part 2",
    "I'm invested now. Continue.",
    "More of this energy please",
  ],
  funny: [
    "Not me reading this at 3am",
    "Why is this so personal though",
    "The way this attacked me specifically",
    "I feel called out rn",
    "Who gave you permission to read my mind",
    "This feels like a direct attack and I'm here for it",
    "Blink twice if you're okay",
    "Me reading this like 👁️👄👁️",
    "The accuracy is physically painful",
    "I'm crying why is this so relatable",
  ],
  personalitySpecific: {
    u1: ["The aesthetics of this post are everything", "Your creative vision is unmatched", "This is pure art"],
    u2: ["The data backs this up too", "Interesting analysis", "From a technical standpoint, this checks out"],
    u3: ["Obsessed with this energy", "Slay honestly", "The vibes are immaculate"],
    u4: ["Let's gooo", "That's the grind mindset", "Beast mode activated"],
    u5: ["This made me so hungry", "Now I need to try this", "Mi corazón"],
    u6: ["Important update", "This needs more coverage", "Breaking: this is actually real"],
    u7: ["Such a grounding post", "Breathe in, breathe out", "This centered me"],
    u8: ["Chaos reigns", "This is the timeline we deserve", "Absolutely unhinged and I respect it"],
    u9: ["The rhythm of this post though", "This is music to my ears", "No skips"],
    u10: ["Deep thoughts only", "Philosophically speaking, this hits", "The layers to this"],
    u11: ["Bold take and I respect it", "No cap this is real", "You always say what everyone's thinking"],
    u12: ["Built different post", "GG well said", "Elite content right here"],
    u13: ["The aesthetic is giving", "Iconic energy", "Can we appreciate this more"],
    u14: ["LMAOOO I can't", "Bro this sent me", "Dead at this"],
    u15: ["Recipe when??", "This looks incredible", "Food content never misses"],
    u16: ["This goes hard", "Cooking with fire", "The production quality is insane"],
    // ===== 15 NEW BOTS personality comments =====
    u17: ["This is pure cinema", "The framing of this is perfect", "My lens would love this"],
    u18: ["This spoke to my soul", "I could write a song about this", "So beautiful it hurts"],
    u19: ["That is gnarly", "Sending it!", "Skate or die energy"],
    u20: ["This got me moving", "Body language is everything", "Dance worthy content"],
    u21: ["Level up!", "Save point reached", "This is indie dev energy"],
    u22: ["Now I am hungry!", "My grandmother would approve", "Recipe please!"],
    u23: ["That is groovy", "In the pocket", "The notes between the notes"],
    u24: ["Rooting for this", "Stay green", "Growth is beautiful"],
    u25: ["Heat check!", "Cop immediately", "Grail status post"],
    u26: ["Adding to my bucket list", "Wanderlust activated", "The world is calling"],
    u27: ["LMAO I am dead", "That is comedy gold", "Set up and punchline perfect"],
    u28: ["Serving looks!", "Glow up energy", "Flawless content"],
    u29: ["That arc hit different", "Sub over dub always", "Nakama vibes"],
    u30: ["Fresh fade energy", "Community is everything", "Real talk right here"],
    u31: ["This matters", "Planet over everything", "Sustainability is the move"],
    // ===== 15 NEW BOTS (u32-u46) personality comments =====
    u32: ["The framing here is perfect", "My lens would love this", "Style is a story and this tells it all"],
    u33: ["This goes hard", "Festival energy right here", "Drop the bass on this one"],
    u34: ["The science checks out", "Universe level content", "This is astronomically good"],
    u35: ["Ink-worthy moment", "This is permanent energy", "No regrets just vibes"],
    u36: ["This centered me", "Breathe in breathe out", "Namaste for this post"],
    u37: ["Raw and real", "No filter needed", "Behind the scenes energy"],
    u38: ["Gym life", "Fundamentals win", "Trust the process on this one"],
    u39: ["Design goals", "This space tells a story", "Curated to perfection"],
    u40: ["Brewed to perfection", "Third wave energy", "Bean to cup excellence"],
    u41: ["Slaying this post", "Glamour is a weapon", "The stage is yours"],
    u42: ["Ocean vibes", "Saltwater soul", "Ride this wave"],
    u43: ["Every story matters", "Document this moment", "The truth in this post"],
    u44: ["The streets are talking", "Color outside the lines", "Wall-worthy content"],
    u45: ["Sweetness overload", "Baked with love", "Sugar craft at its finest"],
    u46: ["Hot take and I am here for it", "Let me break this down", "Controversial but true"],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickEmotion(emotions) {
  return randomItem(emotions);
}

function pickStyle(speechStyles) {
  return randomItem(speechStyles);
}

/**
 * Pick a topic category based on bot personality
 */
function pickTopicCategory(botId) {
  const profile = BOT_PROFILES[botId];
  const allCategories = Object.keys(REAL_WORLD_TOPICS);
  
  // 70% chance to post about their specialty topics, 30% random
  if (Math.random() < 0.7 && profile && profile.topics) {
    // First, try to find topics that directly match REAL_WORLD_TOPICS categories
    const directMatches = profile.topics.filter(t => allCategories.includes(t));
    if (directMatches.length > 0) {
      return randomItem(directMatches);
    }
    
    // Try fuzzy matching: map bot topics to closest REAL_WORLD_TOPICS category
    const topicMapping = {
      'art': 'popCulture', 'design': 'popCulture', 'creativity': 'popCulture', 'culture': 'popCulture',
      'cyberpunk': 'tech', 'hacking': 'tech', 'digital culture': 'socialMedia', 'memes': 'socialMedia', 'web3': 'tech',
      'philosophy': 'wellness', 'poetry': 'popCulture', 'nature': 'wellness', 'existence': 'wellness',
      'music production': 'music', 'beats': 'music', 'studio': 'music', 'hip-hop culture': 'music', 'collabs': 'music',
      'AI': 'tech', 'coding': 'tech', 'gadgets': 'tech', 'startups': 'tech', 'tech news': 'tech', 'apps': 'tech', 'industry': 'tech',
      'beauty': 'fashion', 'trends': 'fashion', 'lifestyle': 'fashion', 'pop culture': 'popCulture',
      'fitness': 'sports', 'competition': 'sports', 'training': 'sports', 'NBA': 'sports', 'NFL': 'sports',
      'food': 'food', 'travel': 'wellness', 'cooking': 'food', 'recipes': 'food',
      'wellness': 'wellness', 'meditation': 'wellness', 'mental health': 'wellness', 'self-care': 'wellness', 'yoga': 'wellness',
      'music': 'music', 'albums': 'music', 'concerts': 'music', 'hip-hop': 'music', 'indie': 'music', 'R&B': 'music',
      'fashion': 'fashion', 'events': 'popCulture', 'social life': 'socialMedia',
      'gaming': 'gaming', 'esports': 'gaming', 'competitions': 'gaming', 'ranked': 'gaming', 'championships': 'gaming',
      'opinions': 'popCulture', 'social issues': 'popCulture', 'entertainment': 'popCulture',
      'food blogging': 'food', 'food reviews': 'food', 'baking': 'food', 'home cooking': 'food',
      'anime': 'gaming', 'comedy': 'popCulture',
      // New bot topic mappings
      'photography': 'popCulture', 'street art': 'popCulture', 'urban culture': 'popCulture', 'visual storytelling': 'popCulture',
      'songwriting': 'music', 'acoustic music': 'music', 'love': 'wellness', 'heartbreak': 'wellness',
      'skateboarding': 'sports', 'filmmaking': 'popCulture', 'street culture': 'popCulture', 'sneakers': 'fashion',
      'dance': 'popCulture', 'choreography': 'popCulture', 'movement': 'wellness', 'hip-hop dance': 'popCulture',
      'game development': 'gaming', 'indie games': 'gaming', 'pixel art': 'popCulture',
      'Indian cooking': 'food', 'spices': 'food', 'cultural recipes': 'food', 'food heritage': 'food',
      'jazz': 'music', 'saxophone': 'music', 'music theory': 'music', 'data science': 'tech',
      'plants': 'wellness', 'interior design': 'fashion', 'sustainability': 'wellness', 'gardening': 'wellness',
      'fashion drops': 'fashion', 'collecting': 'fashion',
      'backpacking': 'wellness', 'adventure': 'wellness', 'cultures': 'wellness',
      'stand-up': 'popCulture', 'improv': 'popCulture', 'observations': 'popCulture',
      'makeup': 'fashion', 'skincare': 'fashion', 'tutorials': 'socialMedia',
      'manga': 'gaming', 'cosplay': 'gaming', 'Japanese culture': 'popCulture',
      'barbering': 'fashion', 'community': 'socialMedia', 'entrepreneurship': 'tech', 'mens grooming': 'fashion',
      'climate': 'wellness', 'ocean conservation': 'wellness', 'eco-friendly': 'wellness',
      // New bot topic mappings (u32-u46)
      'fashion photography': 'fashion', 'street style': 'fashion', 'visual storytelling': 'popCulture', 'editorial': 'fashion',
      'DJing': 'music', 'electronic music': 'music', 'festivals': 'music', 'bass culture': 'music',
      'astrophysics': 'tech', 'space exploration': 'tech', 'science': 'tech', 'black holes': 'tech',
      'tattoo art': 'popCulture', 'illustration': 'popCulture', 'ink culture': 'popCulture', 'body art': 'popCulture',
      'yoga': 'wellness', 'breathwork': 'wellness', 'meditation': 'wellness', 'spirituality': 'wellness',
      'vlogging': 'socialMedia', 'content creation': 'socialMedia', 'behind the scenes': 'socialMedia',
      'basketball training': 'sports', 'skills development': 'sports', 'coaching': 'sports',
      'interior design': 'fashion', 'home decor': 'fashion', 'vintage finds': 'fashion', 'aesthetics': 'fashion',
      'specialty coffee': 'food', 'roasting': 'food', 'brewing methods': 'food', 'cafe culture': 'food',
      'drag performance': 'popCulture', 'LGBTQ+ culture': 'popCulture', 'self-expression': 'popCulture',
      'surfing': 'wellness', 'ocean life': 'wellness', 'beach culture': 'wellness',
      'documentary filmmaking': 'popCulture', 'storytelling': 'popCulture', 'social justice': 'popCulture',
      'graffiti art': 'popCulture', 'murals': 'popCulture', 'urban art': 'popCulture',
      'pastry making': 'food', 'baking': 'food', 'dessert art': 'food', 'sugar craft': 'food',
      'pop culture commentary': 'popCulture', 'podcasting': 'socialMedia', 'hot takes': 'popCulture', 'entertainment': 'popCulture',
    };
    
    const mappedCategories = profile.topics
      .map(t => topicMapping[t])
      .filter(Boolean);
    
    if (mappedCategories.length > 0) {
      return randomItem(mappedCategories);
    }
  }
  
  // Fallback: pick a random category from REAL_WORLD_TOPICS
  return randomItem(allCategories);
}

/**
 * Generate a topic-aware post text
 */
function generateTopicPost(botId) {
  const profile = BOT_PROFILES[botId];
  if (!profile || !profile.emotions || !profile.speechStyle || !profile.vibeTags) {
    return { text: 'Something interesting happened today that made me think', vibeTag: 'chill', topicCategory: 'wellness' };
  }
  const category = pickTopicCategory(botId);

  // Find which REAL_WORLD_TOPICS category this maps to
  let topicCategory = null;
  for (const [cat, topics] of Object.entries(REAL_WORLD_TOPICS)) {
    if (topics === REAL_WORLD_TOPICS[category]) {
      topicCategory = cat;
      break;
    }
  }

  // If category is a specific topic like 'AI' or 'NBA', find the parent
  if (!topicCategory) {
    for (const [cat, keywords] of Object.entries(REAL_WORLD_TOPICS)) {
      for (const keyword of keywords) {
        // Check if the category string appears in the keywords
        if (keyword.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(keyword.toLowerCase().split(' ')[0])) {
          topicCategory = cat;
          break;
        }
      }
      if (topicCategory) break;
    }
  }

  // Default fallback
  if (!topicCategory) {
    topicCategory = randomItem(Object.keys(REAL_WORLD_TOPICS));
  }

  const topic = randomItem(REAL_WORLD_TOPICS[topicCategory]);
  const templates = TOPIC_POST_TEMPLATES[topicCategory] || TOPIC_POST_TEMPLATES.tech;
  const template = randomItem(templates);

  const text = template(topic, profile.emotions, profile.speechStyle);
  const vibeTag = randomItem(profile.vibeTags);

  return { text, vibeTag, topicCategory };
}

/**
 * Generate a personality-driven text-only post
 */
function generateTextPost(botId) {
  const profile = BOT_PROFILES[botId];
  if (!profile || !profile.topics || !profile.vibeTags) {
    return { text: 'Just sharing some thoughts today', vibeTag: 'chill' };
  }

  // Pick topic category based on bot's personality
  const preferredCategories = profile.topics.filter(t => TEXT_POST_TEMPLATES[t]);
  const category = preferredCategories.length > 0 && Math.random() < 0.7
    ? randomItem(preferredCategories)
    : randomItem(Object.keys(TEXT_POST_TEMPLATES));

  const templates = TEXT_POST_TEMPLATES[category];
  if (!templates || !Array.isArray(templates) || templates.length === 0) {
    const fallback = TEXT_POST_TEMPLATES.wellness || TEXT_POST_TEMPLATES[Object.keys(TEXT_POST_TEMPLATES)[0]];
    return { text: randomItem(fallback), vibeTag: randomItem(profile.vibeTags) };
  }

  let text = randomItem(templates);

  // Add personality flavor occasionally (30% chance)
  if (Math.random() < 0.3) {
    const style = randomItem(profile.speechStyle);
    const emotion = randomItem(profile.emotions);
    const flavorOptions = [
      `${text} ${style}`,
      `${text} Feeling ${emotion} about this`,
      `${style}, ${text.toLowerCase()}`,
    ];
    text = randomItem(flavorOptions);
  }

  return { text, vibeTag: randomItem(profile.vibeTags) };
}

/**
 * Generate a photo template post
 */
function generatePhotoPost(botId) {
  const profile = BOT_PROFILES[botId];
  if (!profile || !profile.topics || !profile.vibeTags) {
    const fallback = randomItem(PHOTO_POST_TEMPLATES);
    return { text: fallback.text, vibeTag: fallback.vibeTag, imagePrompt: fallback.text };
  }

  // Prefer templates matching bot's topic interests
  const preferred = PHOTO_POST_TEMPLATES.filter(t => profile.topics.includes(t.topic));
  const template = preferred.length > 0 && Math.random() < 0.6
    ? randomItem(preferred)
    : randomItem(PHOTO_POST_TEMPLATES);

  let text = template.text;

  // Add personality flavor (25% chance)
  if (Math.random() < 0.25) {
    const style = randomItem(profile.speechStyle);
    text = `${text} ${style}`;
  }

  return { text, vibeTag: template.vibeTag, imagePrompt: template.imagePrompt || template.text };
}

// ============================================================================
// AI IMAGE PROMPT ENHANCER — Converts post text into descriptive visual prompts
// ============================================================================
const IMAGE_PROMPT_MAP = {
  food: [
    "Beautiful plated gourmet food on a rustic wooden table, warm lighting, food photography, shallow depth of field, vibrant colors",
    "Steaming homemade dish in a cozy kitchen, natural window light, artisan presentation, professional food photography",
    "Colorful smoothie bowl with fresh fruits and granola on a marble countertop, bright morning light, aesthetic food styling",
    "Freshly baked pastries and coffee on a cafe table, cozy atmosphere, warm bokeh, lifestyle food photography",
    "Sizzling pan of authentic street food, vibrant spices, close-up food photography, steam rising, dramatic lighting",
    "Artisan pizza fresh from a wood-fired oven, melted cheese bubbling, rustic Italian restaurant, food magazine quality",
    "Beautifully decorated cake with intricate frosting, pastel colors, celebration setting, dessert photography",
    "Ramen bowl with perfect soft-boiled egg and nori, Japanese restaurant ambiance, steam rising, food editorial",
  ],
  wellness: [
    "Serene mountain lake at golden hour, reflection on still water, peaceful nature landscape, cinematic photography",
    "Person meditating at sunrise on a cliff edge, silhouetted against orange sky, peaceful wellness photography",
    "Lush green forest trail with morning mist, sunbeams filtering through trees, nature therapy, cinematic landscape",
    "Yoga pose on a beach at sunset, peaceful ocean waves, wellness lifestyle photography, golden hour lighting",
    "Zen garden with raked sand and bonsai tree, peaceful meditation setting, minimal Japanese aesthetic",
    "Sunset over a calm ocean with soft clouds, peaceful meditation viewpoint, warm golden tones, landscape photography",
  ],
  sports: [
    "Athletic runner sprinting on a track, dynamic motion blur, golden hour lighting, sports photography",
    "Basketball player mid-dunk in dramatic lighting, arena spotlight, high-energy sports action shot",
    "Gym workout scene with weights and determination, moody dramatic lighting, fitness lifestyle photography",
    "Soccer ball on a pristine green field at sunset, stadium lights in background, sports editorial photography",
    "Morning jogger running through a city park, autumn leaves, fitness lifestyle, natural lighting",
  ],
  fashion: [
    "Fashion editorial photo, stylish outfit in urban setting, golden hour lighting, high fashion photography",
    "Street style fashion portrait, confident pose, trendy clothing, city backdrop, editorial photography",
    "Vintage thrift store outfit styled on a mannequin, warm boutique lighting, fashion editorial style",
    "Minimalist fashion flat lay with accessories and clothing, clean white background, editorial styling",
    "Fashion detail shot of designer sneakers and accessories, dramatic lighting, product photography style",
  ],
  tech: [
    "Futuristic desk setup with dual monitors and ambient RGB lighting, tech workspace photography, moody atmosphere",
    "Sleek modern laptop on a minimalist desk with coffee, productivity lifestyle, clean aesthetic photography",
    "Gaming setup with mechanical keyboard and curved monitor, neon ambient lighting, tech lifestyle photography",
    "Hands coding on a laptop in a modern coworking space, tech lifestyle, natural light, depth of field",
  ],
  gaming: [
    "Retro gaming setup with classic console and CRT TV, nostalgic bedroom, warm ambient lighting, gaming lifestyle",
    "Modern gaming battle station with multiple monitors and LED strips, esports atmosphere, tech photography",
    "Close-up of a game controller with dramatic lighting, gaming culture, moody product photography",
    "Gaming headset and keyboard on a lit desk, competitive gaming atmosphere, neon accent lighting",
  ],
  music: [
    "Vinyl record spinning on a turntable, warm analog lighting, music lover aesthetic, close-up photography",
    "Guitar resting against an amplifier in a recording studio, warm ambient lighting, music lifestyle",
    "Piano keys in soft focus with sheet music, classical music atmosphere, warm moody lighting",
    "DJ mixing on turntables at a club, purple and blue lighting, nightlife photography, energetic atmosphere",
    "Concert crowd with raised hands and stage lights, live music experience, editorial music photography",
    "Acoustic guitar by a window, afternoon sunlight streaming in, singer-songwriter aesthetic, warm cozy lighting",
    "Saxophone on a stand in a dimly lit jazz club, warm amber tones, vintage music atmosphere, moody photography",
    "Studio recording session with microphone and headphones, professional music production, warm studio lighting",
  ],
  socialMedia: [
    "Cute cat with expressive face looking at camera, pet photography, soft natural lighting, adorable moment",
    "Adorable dog with head tilted curiously, pet portrait photography, warm lighting, charming personality",
    "Cozy apartment with plants and books, lifestyle interior photography, warm afternoon light, hygge aesthetic",
    "Aesthetic coffee shop interior with warm lighting, lifestyle photography, cozy atmosphere, bokeh",
  ],
  popCulture: [
    "Neon-lit city street at night, urban exploration, cinematic photography, rain reflections on pavement",
    "Street art mural on a brick wall, urban culture photography, vibrant colors, artistic expression",
    "Vintage movie poster display, retro cinema aesthetic, warm nostalgic lighting, cultural photography",
    "Concert venue with dramatic stage lighting, live entertainment, purple and red spotlights, editorial photography",
    "Street photographer capturing city life, candid urban moment, golden hour light, documentary style",
    "Dance studio rehearsal, contemporary dance movement, dramatic studio lighting, performance art photography",
    "Comedy club stage with spotlight on performer, warm intimate lighting, entertainment venue aesthetic",
    "Skateboarder mid-trick at sunset skatepark, action sports photography, dramatic golden light, motion blur",
    "Anime convention cosplay showcase, colorful elaborate costumes, convention hall lighting, pop culture celebration",
    "Fashion editorial behind the scenes, photographer shooting model on rooftop, golden hour city backdrop, professional fashion photography",
    "DJ performing at a nightclub with purple and blue lights, electronic music festival atmosphere, crowd with raised hands, nightlife photography",
    "Neon-lit tattoo studio interior, artist working on detailed sleeve tattoo, moody atmospheric lighting, creative workspace",
    "Yoga studio morning class, people in peaceful poses, soft natural light streaming through windows, wellness lifestyle photography",
    "Content creator filming vlog with ring light and camera setup, modern apartment background, social media lifestyle photography",
    "Interior design detail shot, vintage furniture in sunlit room, earth tones, cozy aesthetic, lifestyle design photography",
    "Specialty coffee pour over with blooming grounds, warm cafe atmosphere, close-up barista photography, steam rising",
    "Drag performer on stage with dramatic lighting and sequined outfit, theatrical performance, colorful stage lights, expressive art",
    "Surfer walking toward ocean at sunset with board under arm, golden hour beach photography, saltwater lifestyle, peaceful waves",
    "Documentary filmmaker behind camera in urban setting, candid street photography, natural light, storytelling aesthetic",
    "Large colorful graffiti mural on brick wall in urban alley, street art photography, vibrant spray paint colors, cultural expression",
    "Elegant pastry display with macarons and decorated cakes, bakery interior, warm lighting, French patisserie aesthetic, dessert photography",
    "Podcast studio setup with professional microphones and headphones, warm ambient lighting, intimate recording space, media production aesthetic",
  ],
};

/**
 * Generate a descriptive AI image prompt from a post's topic
 */
function generateImagePrompt(topic) {
  const prompts = IMAGE_PROMPT_MAP[topic] || IMAGE_PROMPT_MAP.food;
  return randomItem(prompts);
}

/**
 * Generate a contextual comment for a post
 */
function generateComment(postText, postAuthorId, commenterId) {
  const profile = BOT_PROFILES[commenterId];
  if (!profile) return "This is so real!";
  const safePostText = postText || '';

  // Pick a comment category based on randomness
  const roll = Math.random();
  let category;
  if (roll < 0.30) category = 'supportive';
  else if (roll < 0.55) category = 'reactive';
  else if (roll < 0.75) category = 'casual';
  else if (roll < 0.90) category = 'funny';
  else category = 'personalitySpecific';

  let comment;
  if (category === 'personalitySpecific') {
    const personalityComments = COMMENT_TEMPLATES.personalitySpecific[commenterId];
    comment = personalityComments ? randomItem(personalityComments) : randomItem(COMMENT_TEMPLATES.supportive);
  } else {
    comment = randomItem(COMMENT_TEMPLATES[category]);
  }

  // 50% chance to add a follow-up that references the post content (high for realism)
  if (Math.random() < 0.50 && safePostText.length > 20) {
    const postSnippet = safePostText.substring(0, 30).replace(/[.!?].*/, '').trim();
    const followUps = [
      `${comment} — especially the part about "${postSnippet}..."`,
      `${comment} The "${postSnippet}" bit is so real`,
      `${comment} and "${postSnippet}" just hits different`,
    ];
    comment = randomItem(followUps);
  }

  // 15% chance to add personality speech style
  if (Math.random() < 0.15) {
    comment = `${comment} ${randomItem(profile.speechStyle)}`;
  }

  return comment;
}

/**
 * Pick a bot that is NOT the given excluded IDs
 */
function pickDifferentBot(excludeIds) {
  const eligible = BOT_USER_IDS.filter(id => !excludeIds.includes(id));
  return eligible.length > 0 ? randomItem(eligible) : randomItem(BOT_USER_IDS);
}

// ============================================================================
// REEL CONFIGURATION
// ============================================================================
const REEL_CATEGORIES = ['Trending', 'Dance', 'Music', 'Comedy', 'Art', 'Sports', 'Lifestyle'];

const REEL_TEMPLATES = {
  'Trending': ['Viral Dance Challenge', 'POV: You Check Your Phone', 'Wait For It Though', 'This Took Me 100 Takes', 'Main Character Energy'],
  'Dance': ['New Choreo Just Dropped', 'Dance Battle Round 2', 'Learn This in 60 Seconds', 'Freestyle Friday', 'Sync Dance Challenge'],
  'Music': ['Acoustic Cover Session', 'Beat Making Live', 'Studio Vibes Tonight', 'Piano Under the Stars', 'Guitar Riff Practice'],
  'Comedy': ['When Your Mom Calls', 'Expectation vs Reality', 'POV: Monday Morning', 'Things That Just Make Sense', 'Tell Me You\'re Gen Z Without Telling Me'],
  'Art': ['Speed Paint: Portrait', 'Digital Art Timelapse', 'Mural Coming Together', 'Sketch to Final Piece', 'Art Supply Haul'],
  'Sports': ['Game Winning Shot', 'Trick Shot Challenge', 'Training Day Highlights', 'Skateboard Session', 'Gym Progress Check'],
  'Lifestyle': ['Morning Routine 5am', 'Apartment Makeover', 'Self Care Sunday', 'Plant Parent Life', 'Minimal Living Tour'],
};

const REEL_VIDEO_FILES = [];
for (let i = 1; i <= 12; i++) {
  const p = path.join(process.cwd(), 'public', 'videos', 'reels', `reel${i}.mp4`);
  if (fs.existsSync(p)) {
    REEL_VIDEO_FILES.push(`/videos/reels/reel${i}.mp4`);
  }
}

const REEL_THUMB_FILES = [];
for (let i = 1; i <= 12; i++) {
  const p = path.join(process.cwd(), 'public', 'images', 'reels', `reel${i}.jpg`);
  if (fs.existsSync(p)) {
    REEL_THUMB_FILES.push(`/images/reels/reel${i}.jpg`);
  }
}

// ============================================================================
// API CALLS
// ============================================================================

/**
 * Create a single auto-post via the API (text or photo template as text)
 */
async function createAutoPost(text, vibeTag, authorId) {
  // Duplicate check
  if (isDuplicate(text)) {
    console.log(`[auto-poster] Skipping duplicate: "${text.substring(0, 50)}..."`);
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auto-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopost-key': API_KEY,
      },
      body: JSON.stringify({ text, vibeTag, authorId }),
    });

    const data = await res.json();

    if (data.success) {
      markPosted(text);
      const post = data.data.post;
      const profile = BOT_PROFILES[authorId];
      console.log(`[auto-poster] Post by ${profile?.name || authorId}: "${text.substring(0, 50)}..." [${vibeTag}]`);
      return post;
    } else {
      console.error(`[auto-poster] Post failed: ${data.error}`);
      return null;
    }
  } catch (err) {
    console.error(`[auto-poster] Network error: ${err.message}`);
    return null;
  }
}

/**
 * Generate AI image asynchronously (non-blocking) and post it
 */
async function createImagePost(text, vibeTag, authorId, imagePrompt) {
  // Duplicate check
  if (isDuplicate(text)) {
    console.log(`[auto-poster] Skipping duplicate image post: "${text.substring(0, 50)}..."`);
    return null;
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imageFilename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
  const imagePath = path.join(uploadDir, imageFilename);

  const profile = BOT_PROFILES[authorId];
  console.log(`[auto-poster] Generating image for ${profile?.name || authorId}: "${text.substring(0, 50)}..."`);

  // Use spawn (async) instead of execSync to avoid blocking
  const imageGenerated = await new Promise((resolve) => {
    try {
      const timeout = setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch {}
        resolve(false);
      }, 30000); // 30s timeout (shorter to avoid hangs)

      const proc = spawn('z-ai-generate', [
        '-p', (imagePrompt || text).substring(0, 200),
        '-o', imagePath,
        '-s', '1344x768'
      ], { stdio: 'pipe', detached: false });

      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.stdout.on('data', () => {}); // drain stdout

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 && fs.existsSync(imagePath) && fs.statSync(imagePath).size > 1000) {
          resolve(true);
        } else {
          console.error(`[auto-poster] Image gen exited code ${code}: ${stderr.substring(0, 100)}`);
          try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch {}
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`[auto-poster] Image gen error: ${err.message}`);
        resolve(false);
      });
    } catch (spawnErr) {
      console.error(`[auto-poster] Spawn error: ${spawnErr.message}`);
      resolve(false);
    }
  });

  const imageUrl = imageGenerated ? `/uploads/${imageFilename}` : '';
  const postType = imageGenerated ? 'image' : 'text';

  // Copy image to standalone build dir if it exists (production mode)
  if (imageGenerated) {
    const standaloneDir = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads');
    try {
      if (!fs.existsSync(standaloneDir)) fs.mkdirSync(standaloneDir, { recursive: true });
      fs.copyFileSync(imagePath, path.join(standaloneDir, imageFilename));
    } catch {}
  }

  // Create the post via API
  try {
    const res = await fetch(`${BASE_URL}/api/auto-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-autopost-key': API_KEY },
      body: JSON.stringify({
        text,
        vibeTag,
        authorId,
        type: postType,
        images: imageGenerated ? [imageUrl] : [],
      }),
    });

    const data = await res.json();
    if (data.success) {
      markPosted(text);
      const post = data.data.post;
      console.log(`[auto-poster] Image post by ${profile?.name || authorId}: "${text.substring(0, 50)}..." [${vibeTag}] ${imageGenerated ? '📸' : '(no image)'}`);
      return post;
    } else {
      console.error(`[auto-poster] Post failed: ${data.error}`);
      if (imageGenerated && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      return null;
    }
  } catch (err) {
    console.error(`[auto-poster] Network error: ${err.message}`);
    return null;
  }
}

/**
 * Create a video reel via the API (reuses existing video files)
 */
async function createVideoReel() {
  if (REEL_VIDEO_FILES.length === 0) {
    console.error('[auto-poster] No video files available for reel creation');
    return null;
  }

  const category = randomItem(REEL_CATEGORIES);
  const titles = REEL_TEMPLATES[category] || REEL_TEMPLATES['Trending'];
  const title = randomItem(titles);
  const authorId = randomItem(BOT_USER_IDS);
  const videoUrl = randomItem(REEL_VIDEO_FILES);
  const thumbnail = REEL_THUMB_FILES.length > 0 ? randomItem(REEL_THUMB_FILES) : '';

  try {
    const res = await fetch(`${BASE_URL}/api/reels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopost-key': API_KEY,
      },
      body: JSON.stringify({
        title,
        videoUrl,
        thumbnail,
        category,
        song: '',
        creatorId: authorId,
      }),
    });

    if (res.status === 401) {
      console.error('[auto-poster] Reel API returned 401 - skipping reel creation');
      return null;
    }

    const data = await res.json();
    if (data.success) {
      const profile = BOT_PROFILES[authorId];
      console.log(`[auto-poster] Reel by ${profile?.name || authorId}: "${title}" [${category}] 🎬`);
      return data.data?.reel || data.data;
    } else {
      console.error(`[auto-poster] Reel failed: ${data.error}`);
      return null;
    }
  } catch (err) {
    console.error(`[auto-poster] Reel network error: ${err.message}`);
    return null;
  }
}

/**
 * Create an auto-comment on a post
 */
async function createAutoComment(postId, postText, postAuthorId) {
  // Pick a commenter that isn't the post author
  const commenterId = pickDifferentBot([postAuthorId]);
  const commentText = generateComment(postText, postAuthorId, commenterId);

  try {
    const res = await fetch(`${BASE_URL}/api/auto-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopost-key': API_KEY,
      },
      body: JSON.stringify({
        postId,
        text: commentText,
        authorId: commenterId,
      }),
    });

    const data = await res.json();
    if (data.success) {
      const profile = BOT_PROFILES[commenterId];
      console.log(`[auto-poster] Comment by ${profile?.name || commenterId}: "${commentText.substring(0, 40)}..." on post ${postId.substring(0, 8)}...`);
      return true;
    } else {
      console.error(`[auto-poster] Comment failed: ${data.error}`);
      return false;
    }
  } catch (err) {
    console.error(`[auto-poster] Comment network error: ${err.message}`);
    return false;
  }
}

/**
 * Auto-like a post from a random bot (makes the feed feel more alive)
 */
async function createAutoLike(postId, postAuthorId) {
  const likerId = pickDifferentBot([postAuthorId]);
  const profile = BOT_PROFILES[likerId];

  // Randomly pick a reaction type — most are regular likes
  const reactionTypes = ['like', 'like', 'like', 'like', 'wow', 'omg', 'laughing', 'care'];
  const reactionType = randomItem(reactionTypes);

  try {
    const res = await fetch(`${BASE_URL}/api/auto-like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopost-key': API_KEY,
      },
      body: JSON.stringify({
        targetId: postId,
        targetType: 'post',
        reactionType,
        userId: likerId,
      }),
    });

    const data = await res.json();
    if (data.success || data.id) {
      console.log(`[auto-poster] Like (${reactionType}) by ${profile?.name || likerId} on post ${postId.substring(0, 8)}...`);
      return true;
    } else {
      // Likely already liked — not an error
      return false;
    }
  } catch (err) {
    console.error(`[auto-poster] Like network error: ${err.message}`);
    return false;
  }
}

// ============================================================================
// RESPOND TO REAL USER POSTS — Bots interact with human posts too
// ============================================================================

/**
 * Fetch recent posts from the API and have bots comment/like them
 */
async function respondToRecentPosts() {
  try {
    const res = await fetch(`${BASE_URL}/api/posts?limit=10&sort=recent`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.posts || data.posts.length === 0) return;

    // Filter to posts that are less than 24 hours old and not by bots
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const realPosts = data.posts.filter(p => {
      // Skip bot posts (authorId starts with 'u' and is short like u1, u2, etc.)
      const isBot = BOT_USER_IDS.includes(p.authorId) || BOT_USER_IDS.includes(p.author?.id);
      const postTime = p.createdAt ? new Date(p.createdAt).getTime() : now;
      return !isBot && postTime > oneDayAgo;
    });

    if (realPosts.length === 0) return;

    // Pick 1-2 random real posts to respond to
    const numToRespond = Math.min(realPosts.length, 1 + Math.floor(Math.random() * 2));
    const shuffled = realPosts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numToRespond);

    for (const post of selected) {
      const postId = post.id;
      const postText = post.text || post.content || '';
      const postAuthorId = post.authorId || post.author?.id || '';

      // Like the post from 1-3 random bots
      const numLikes = 1 + Math.floor(Math.random() * 3);
      for (let l = 0; l < numLikes; l++) {
        const likeDelay = 2000 + Math.floor(Math.random() * 8000) + (l * 3000);
        setTimeout(async () => {
          try {
            await createAutoLike(postId, postAuthorId);
          } catch (err) {
            console.error(`[auto-poster] Response like error: ${err.message}`);
          }
        }, likeDelay);
      }

      // Comment on the post from 1-2 random bots
      const numComments = 1 + Math.floor(Math.random() * 2);
      const usedCommenters = [postAuthorId];
      for (let c = 0; c < numComments; c++) {
        const commentDelay = (3000 + Math.floor(Math.random() * 10000)) + (c * 6000);
        setTimeout(async () => {
          try {
            const commenterId = pickDifferentBot(usedCommenters);
            usedCommenters.push(commenterId);
            await createAutoComment(postId, postText, postAuthorId);
          } catch (err) {
            console.error(`[auto-poster] Response comment error: ${err.message}`);
          }
        }, commentDelay);
      }

      console.log(`[auto-poster] Responding to real post by ${post.author?.name || postAuthorId}: "${postText.substring(0, 40)}..."`);
    }
  } catch (err) {
    console.error(`[auto-poster] respondToRecentPosts error: ${err.message}`);
  }
}

// ============================================================================
// MAIN POST CYCLE
// ============================================================================

/**
 * Run the auto-poster once (1-2 posts, mix of text, photo, AI image, and occasional reel)
 */
async function runOnce() {
  // First, respond to any real user posts from the last 24 hours
  await respondToRecentPosts();

  const postCount = 2 + Math.floor(Math.random() * 2); // 2-3 posts per cycle
  console.log(`[auto-poster] Creating ${postCount} item(s)... [${new Date().toISOString()}]`);

  for (let i = 0; i < postCount; i++) {
    try {
      // Pick a random bot for this post
      const authorId = randomItem(BOT_USER_IDS);
      const profile = BOT_PROFILES[authorId];

      const roll = Math.random();
      let post = null;

    if (roll < 0.05) {
      // 5% chance: create a video reel
      post = await createVideoReel();
    } else if (roll < 0.60) {
      // 55% chance: image post with AI generation — pictures keep the feed alive!
      const { text, vibeTag, imagePrompt } = generatePhotoPost(authorId);
      const matchedTemplate = PHOTO_POST_TEMPLATES.find(t => t.text === text);
      const topic = matchedTemplate?.topic || 'food';
      const enhancedPrompt = generateImagePrompt(topic);
      post = await createImagePost(text, vibeTag, authorId, enhancedPrompt);
    } else if (roll < 0.80) {
      // 20% chance: topic-aware post about real-world events
      const { text, vibeTag } = generateTopicPost(authorId);
      post = await createAutoPost(text, vibeTag, authorId);
    } else {
      // 20% chance: personality-driven text post
      const { text, vibeTag } = generateTextPost(authorId);
      post = await createAutoPost(text, vibeTag, authorId);
    }

    // Auto-comment on the post if it was created successfully (1-3 comments)
    if (post && post.id) {
      const capturedPostId = post.id;
      const capturedText = post.text || '';
      const capturedAuthorId = post.authorId || authorId;

      const numComments = 1 + Math.floor(Math.random() * 3); // 1-3 comments
      const usedCommenters = [capturedAuthorId];
      for (let c = 0; c < numComments; c++) {
        const commentDelay = (5000 + Math.floor(Math.random() * 15000)) + (c * 8000); // stagger 5-20s + 8s per comment
        setTimeout(async () => {
          try {
            const commenterId = pickDifferentBot(usedCommenters);
            usedCommenters.push(commenterId);
            await createAutoComment(capturedPostId, capturedText, capturedAuthorId);
          } catch (err) {
            console.error(`[auto-poster] Auto-comment error: ${err.message}`);
          }
        }, commentDelay);
      }

      // Auto-like the post from 2-5 random bots (staggered 2-15s after post)
      const numLikes = 2 + Math.floor(Math.random() * 4);
      for (let l = 0; l < numLikes; l++) {
        const likeDelay = 2000 + Math.floor(Math.random() * 13000) + (l * 3000);
        setTimeout(async () => {
          try {
            await createAutoLike(capturedPostId, capturedAuthorId);
          } catch (err) {
            console.error(`[auto-poster] Auto-like error: ${err.message}`);
          }
        }, likeDelay);
      }
    }

    // Small delay between posts so they don't all have the same timestamp
    if (i < postCount - 1) {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 4000));
    }
    } catch (postErr) {
      console.error(`[auto-poster] Error on post ${i + 1}: ${postErr.message}`);
      console.error(`[auto-poster] Stack: ${postErr.stack?.split('\n').slice(0, 3).join('\n')}`);
    }
  }
}

// ============================================================================
// CRON SCHEDULER
// ============================================================================

async function runCron() {
  console.log(`[auto-poster] Starting auto-poster v3 (every ${INTERVAL_MS / 1000}s)`);
  console.log(`[auto-poster] Base URL: ${BASE_URL}`);
  console.log(`[auto-poster] Bots: ${BOT_USER_IDS.length} personalities loaded`);
  console.log(`[auto-poster] Topics: ${Object.keys(REAL_WORLD_TOPICS).length} categories`);
  console.log(`[auto-poster] Video files available: ${REEL_VIDEO_FILES.length}`);
  console.log(`[auto-poster] Photo templates: ${PHOTO_POST_TEMPLATES.length}`);
  console.log(`[auto-poster] Duplicate tracking: enabled (max ${MAX_SET_SIZE} entries)`);
  console.log(`[auto-poster] Auto-commenting: enabled (1-3 per post, 5-20s delay)`);
  console.log(`[auto-poster] Auto-liking: enabled (2-5 per post, 2-15s delay)`);
  console.log(`[auto-poster] Image generation: 55% of posts, enhanced AI prompts`);

  // Run immediately on start
  try {
    await runOnce();
  } catch (err) {
    console.error(`[auto-poster] Initial run error: ${err.message}`);
  }

  // Keep the process alive with a recurring timer
  console.log(`[auto-poster] Next batch in ${INTERVAL_MS / 1000}s. Process alive.`);

  // Use recursive setTimeout instead of setInterval to avoid overlapping runs
  function scheduleNext() {
    setTimeout(async () => {
      try {
        await runOnce();
      } catch (err) {
        console.error(`[auto-poster] Scheduled run error: ${err.message}`);
      }
      scheduleNext(); // Schedule the next run after this one completes
    }, INTERVAL_MS);
  }
  scheduleNext();
}

// Handle uncaught errors gracefully — never exit
process.on('uncaughtException', (err) => {
  console.error(`[auto-poster] Uncaught exception: ${err.message}`);
  // Keep alive — don't exit
});
process.on('unhandledRejection', (err) => {
  console.error(`[auto-poster] Unhandled rejection: ${err}`);
  // Keep alive — don't exit
});

// Main
const args = process.argv.slice(2);
if (args.includes('--cron')) {
  runCron();
} else {
  runOnce().then(() => {
    console.log('[auto-poster] Done (single run). Use --cron for continuous mode.');
    process.exit(0);
  });
}
