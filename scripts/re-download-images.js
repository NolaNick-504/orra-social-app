#!/usr/bin/env node
/**
 * Re-download personalized images for ORRA live streams and profile covers.
 * Uses picsum.photos with specific IDs curated to match each person's personality.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = '/home/z/my-project/public/images';
const LIVE_DIR = `${BASE}/live-thumbnails`;
const COVER_DIR = `${BASE}/profile-covers`;

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
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(dest); });
      }).on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
    };
    follow(url);
  });
}

const liveThumbnails = [
  { name: 'luna-art.jpg', id: 160 },
  { name: 'kai-gaming.jpg', id: 370 },
  { name: 'nova-trending.jpg', id: 274 },
  { name: 'zara-fashion.jpg', id: 102 },
  { name: 'jay-gaming.jpg', id: 396 },
  { name: 'maya-cooking.jpg', id: 292 },
  { name: 'dre-music.jpg', id: 357 },
  { name: 'sarah-music.jpg', id: 244 },
  { name: 'marcus-dance.jpg', id: 386 },
  { name: 'elena-yoga.jpg', id: 169 },
  { name: 'cyber-tech.jpg', id: 399 },
  { name: 'music-live.jpg', id: 312 },
];

const profileCovers = [
  { name: 'nick-ceo.jpg', id: 488 },
  { name: 'jessica-art.jpg', id: 160 },
  { name: 'david-sports.jpg', id: 382 },
  { name: 'sarah-music.jpg', id: 244 },
  { name: 'marcus-dance.jpg', id: 386 },
  { name: 'elena-wellness.jpg', id: 169 },
  { name: 'tech-daily.jpg', id: 201 },
  { name: 'wellness-guru.jpg', id: 122 },
  { name: 'cyber-drifter.jpg', id: 399 },
  { name: 'luna-sky.jpg', id: 180 },
  { name: 'kai-storm.jpg', id: 370 },
  { name: 'nova-blaze.jpg', id: 396 },
  { name: 'zara-fashion.jpg', id: 225 },
  { name: 'jay-gaming.jpg', id: 203 },
  { name: 'maya-cooking.jpg', id: 429 },
  { name: 'dre-music.jpg', id: 357 },
];

async function downloadBatch(items, dir, width, height) {
  const results = [];
  // Download in parallel batches of 4
  for (let i = 0; i < items.length; i += 4) {
    const batch = items.slice(i, i + 4);
    const promises = batch.map(async (img) => {
      const dest = path.join(dir, img.name);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        console.log(`✓ ${img.name} already exists`);
        return true;
      }
      const url = `https://picsum.photos/id/${img.id}/${width}/${height}`;
      try {
        await download(url, dest);
        const size = fs.statSync(dest).size;
        console.log(`✅ ${img.name} (${(size/1024).toFixed(0)}KB)`);
        return true;
      } catch (e) {
        console.error(`❌ ${img.name}: ${e.message}`);
        return false;
      }
    });
    results.push(...await Promise.all(promises));
  }
  return results;
}

async function main() {
  console.log('=== Downloading Live Stream Thumbnails ===');
  await downloadBatch(liveThumbnails, LIVE_DIR, 1344, 768);
  
  console.log('\n=== Downloading Profile Cover Images ===');
  await downloadBatch(profileCovers, COVER_DIR, 1440, 720);
  
  console.log('\n=== Done ===');
}

main().catch(console.error);
