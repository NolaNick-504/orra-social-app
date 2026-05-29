#!/usr/bin/env node
/**
 * Download personalized images for ORRA live streams and profile covers.
 * Uses picsum.photos with specific IDs curated to match each person's personality.
 * Also downloads from Unsplash direct URLs for thematic images.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE = '/home/z/my-project/public/images';
const LIVE_DIR = `${BASE}/live-thumbnails`;
const COVER_DIR = `${BASE}/profile-covers`;

// Ensure directories exist
[LIVE_DIR, COVER_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const follow = (u, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(dest); });
      }).on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
    };
    follow(url);
  });
}

// ─── Live Stream Thumbnails ──────────────────────────────────────────────
// Carefully selected picsum IDs that visually match each stream category
const liveThumbnails = [
  // Luna Sky → Art stream - "Painting session pt.2 🎨"
  // ID 100: nature/green, ID 119: flowers, ID 160: colorful - pick something artistic
  { name: 'luna-art.jpg', id: 160, desc: 'Art - Luna Sky' },
  // Kai Storm → Gaming stream - "Ranked grind — push to diamond"
  // ID 201: dark/moody, ID 370: urban night
  { name: 'kai-gaming.jpg', id: 370, desc: 'Gaming - Kai Storm' },
  // Nova Blaze → Trending/Chat stream - "Just chatting fr fr 🔥"
  // ID 274: warm interior, ID 325: modern
  { name: 'nova-trending.jpg', id: 274, desc: 'Trending - Nova Blaze' },
  // Zara Miles → Fashion stream - "OOTD haul try-on 👗"
  // ID 102: fashion/model, ID 225: elegant
  { name: 'zara-fashion.jpg', id: 102, desc: 'Fashion - Zara Miles' },
  // Jay Parker → Gaming stream - "COD marathon 🎮"
  // ID 201: dark/tech, ID 396: dramatic
  { name: 'jay-gaming.jpg', id: 396, desc: 'Gaming - Jay Parker' },
  // Maya Chen → Cooking/Food stream - "Cooking something special 👨‍🍳"
  // ID 292: food, ID 429: kitchen
  { name: 'maya-cooking.jpg', id: 292, desc: 'Cooking - Maya Chen' },
  // Dre Williams → Music stream - "Beat making live 🔥"
  // ID 357: music/studio, ID 416: dark interior
  { name: 'dre-music.jpg', id: 357, desc: 'Music - Dre Williams' },
  // Sarah Kim → Music stream - "Late night vibes 🌙"
  // ID 180: night/moody, ID 244: purple/dark
  { name: 'sarah-music.jpg', id: 244, desc: 'Music - Sarah Kim' },
  // Marcus Rivera → Dance stream - "Dance challenge"
  // ID 386: movement, ID 203: action
  { name: 'marcus-dance.jpg', id: 386, desc: 'Dance - Marcus Rivera' },
  // Elena Rodriguez → Lifestyle/Yoga stream - "Morning yoga flow 🧘‍♀️"
  // ID 122: peaceful/nature, ID 169: calm
  { name: 'elena-yoga.jpg', id: 169, desc: 'Yoga - Elena Rodriguez' },
  // Cyber Drifter → Tech stream - "Building a PC 🖥️"
  // ID 201: tech, ID 399: dark/complex
  { name: 'cyber-tech.jpg', id: 399, desc: 'Tech - Cyber Drifter' },
  // Music Central → Music stream - "Live performance 🎵"
  // ID 252: stage/performance, ID 312: concert
  { name: 'music-live.jpg', id: 312, desc: 'Music - Music Central' },
];

// ─── Profile Cover Images ────────────────────────────────────────────────
// Selected picsum IDs that match each user's personality
const profileCovers = [
  // Nick Joseph - CEO/Founder - professional/tech
  { name: 'nick-ceo.jpg', id: 488, desc: 'CEO - Nick Joseph' },
  // Jessica Art - Art/Creative - colorful
  { name: 'jessica-art.jpg', id: 160, desc: 'Art - Jessica Art' },
  // David Chen - Sports/Basketball - athletic
  { name: 'david-sports.jpg', id: 382, desc: 'Sports - David Chen' },
  // Sarah Kim - Music/Chill - moody/dark
  { name: 'sarah-music.jpg', id: 244, desc: 'Music - Sarah Kim' },
  // Marcus Rivera - Dance - dynamic
  { name: 'marcus-dance.jpg', id: 386, desc: 'Dance - Marcus Rivera' },
  // Elena Rodriguez - Lifestyle/Yoga - peaceful
  { name: 'elena-wellness.jpg', id: 169, desc: 'Wellness - Elena Rodriguez' },
  // Tech Daily - Tech - futuristic
  { name: 'tech-daily.jpg', id: 201, desc: 'Tech - Tech Daily' },
  // Wellness Guru - Wellness/Spa - calming
  { name: 'wellness-guru.jpg', id: 122, desc: 'Wellness - Wellness Guru' },
  // Cyber Drifter - Cyberpunk - dark/neon
  { name: 'cyber-drifter.jpg', id: 399, desc: 'Cyberpunk - Cyber Drifter' },
  // Luna Sky - Art/Illustration - dreamy
  { name: 'luna-sky.jpg', id: 180, desc: 'Dreamy - Luna Sky' },
  // Kai Storm - Skater/Chaos - urban
  { name: 'kai-storm.jpg', id: 370, desc: 'Urban - Kai Storm' },
  // Nova Blaze - Fire/Energetic - dramatic
  { name: 'nova-blaze.jpg', id: 396, desc: 'Energetic - Nova Blaze' },
  // Zara Miles - Fashion/Lifestyle - elegant
  { name: 'zara-fashion.jpg', id: 225, desc: 'Fashion - Zara Miles' },
  // Jay Parker - Gaming - dark/neon
  { name: 'jay-gaming.jpg', id: 203, desc: 'Gaming - Jay Parker' },
  // Maya Chen - Food/Cooking - warm
  { name: 'maya-cooking.jpg', id: 429, desc: 'Food - Maya Chen' },
  // Dre Williams - Music/DJ - studio
  { name: 'dre-music.jpg', id: 357, desc: 'Music - Dre Williams' },
];

async function main() {
  let success = 0;
  let fail = 0;

  console.log('=== Downloading Live Stream Thumbnails ===');
  for (const img of liveThumbnails) {
    const dest = path.join(LIVE_DIR, img.name);
    // Use picsum with specific ID for consistent results
    const url = `https://picsum.photos/id/${img.id}/1344/768`;
    try {
      await download(url, dest);
      const size = fs.statSync(dest).size;
      console.log(`✅ ${img.desc} → ${img.name} (${(size/1024).toFixed(0)}KB)`);
      success++;
    } catch (e) {
      console.error(`❌ ${img.desc} → FAILED: ${e.message}`);
      fail++;
    }
  }

  console.log('\n=== Downloading Profile Cover Images ===');
  for (const img of profileCovers) {
    const dest = path.join(COVER_DIR, img.name);
    const url = `https://picsum.photos/id/${img.id}/1440/720`;
    try {
      await download(url, dest);
      const size = fs.statSync(dest).size;
      console.log(`✅ ${img.desc} → ${img.name} (${(size/1024).toFixed(0)}KB)`);
      success++;
    } catch (e) {
      console.error(`❌ ${img.desc} → FAILED: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n=== Done: ${success} success, ${fail} failed ===`);
}

main().catch(console.error);
