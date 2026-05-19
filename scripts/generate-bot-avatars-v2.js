#!/usr/bin/env node
/**
 * Generate AI avatar images for the 15 new bots (u32-u46).
 * Run: node scripts/generate-bot-avatars-v2.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AVATAR_DIR = path.join(__dirname, '..', 'public', 'images', 'avatars');

const BOT_AVATARS = [
  { id: 'u32', handle: 'zarafoto', prompt: 'Portrait of a young Asian woman with a professional camera, fashion photographer aesthetic, chic urban style, leather jacket, studio lighting, confident pose' },
  { id: 'u33', handle: 'mateocruz', prompt: 'Portrait of a young Latino man wearing DJ headphones around neck, electronic music producer aesthetic, neon-lit background, stylish streetwear, energetic vibe' },
  { id: 'u34', handle: 'trinityhayes', prompt: 'Portrait of a young Black woman with glasses and natural curly hair, astrophysicist aesthetic, starry backdrop, warm library lighting, intellectual and cool' },
  { id: 'u35', handle: 'oscarreyes', prompt: 'Portrait of a young Latino man with tattoo sleeves visible, tattoo artist aesthetic, edgy style, dim studio lighting, creative and bold, rolled up sleeves' },
  { id: 'u36', handle: 'yasminpatel', prompt: 'Portrait of a young Indian woman in yoga attire, serene expression, soft natural light, wellness aesthetic, peaceful outdoor setting, gentle smile' },
  { id: 'u37', handle: 'brooklyntaylor', prompt: 'Portrait of a young Black woman holding a vlog camera on a gimbal, content creator aesthetic, trendy streetwear, golden hour city backdrop, vibrant energy' },
  { id: 'u38', handle: 'hakeemwright', prompt: 'Portrait of a young Black man in athletic gear on a basketball court, skills trainer aesthetic, determined expression, gym lighting, powerful stance' },
  { id: 'u39', handle: 'siennablake', prompt: 'Portrait of a young white woman in a beautifully designed living room, interior designer aesthetic, earth tones, warm natural light, creative and elegant' },
  { id: 'u40', handle: 'theokim', prompt: 'Portrait of a young Asian man behind a coffee bar, specialty barista aesthetic, pouring latte art, warm café lighting, focused and passionate' },
  { id: 'u41', handle: 'naomicruz', prompt: 'Portrait of a young Latina drag performer in stunning glamorous makeup and outfit, stage lighting, colorful and bold, confident expression, art as identity' },
  { id: 'u42', handle: 'finnosullivan', prompt: 'Portrait of a young white man with sun-bleached hair holding a surfboard, ocean backdrop, saltwater lifestyle, golden hour beach light, laid back smile' },
  { id: 'u43', handle: 'amaraokafor', prompt: 'Portrait of a young Black woman holding a professional video camera, documentary filmmaker aesthetic, urban setting, natural light, purposeful and strong' },
  { id: 'u44', handle: 'jaxrivera', prompt: 'Portrait of a young Latino man in paint-splattered clothes in front of a colorful mural, graffiti artist aesthetic, spray paint cans, bold and creative' },
  { id: 'u45', handle: 'minasato', prompt: 'Portrait of a young Asian woman in a pastry kitchen, pastry chef aesthetic, beautifully decorated cake nearby, warm kitchen lighting, sweet and focused' },
  { id: 'u46', handle: 'djremix', prompt: 'Portrait of a young Black man with studio headphones, podcast host aesthetic, microphone visible, warm studio lighting, conversational and engaging, confident smile' },
];

async function main() {
  console.log(`\n🎨 Generating ${BOT_AVATARS.length} bot avatars...\n`);

  // Ensure avatar directory exists
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }

  let success = 0;
  let failed = 0;

  for (const bot of BOT_AVATARS) {
    const filename = `u${bot.id.slice(1)}-${bot.handle}.jpg`;
    const filepath = path.join(AVATAR_DIR, filename);

    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 5000) {
      console.log(`  ⏭️  ${bot.handle} avatar exists, skipping`);
      success++;
      continue;
    }

    try {
      console.log(`  🎨 Generating ${bot.handle}...`);
      execSync(
        `z-ai-generate -p "${bot.prompt}" -o "${filepath}" -s 768x1344`,
        { stdio: 'pipe', timeout: 90000 }
      );
      if (fs.existsSync(filepath) && fs.statSync(filepath).size > 5000) {
        console.log(`  ✅ ${bot.handle} avatar generated`);
        success++;
      } else {
        console.log(`  ⚠️  ${bot.handle} avatar too small, retrying...`);
        throw new Error('File too small');
      }
    } catch (err) {
      // Fallback with simpler prompt
      try {
        const fallback = `Professional headshot portrait photo, warm lighting, clean background, social media profile picture`;
        execSync(
          `z-ai-generate -p "${fallback}" -o "${filepath}" -s 768x1344`,
          { stdio: 'pipe', timeout: 90000 }
        );
        console.log(`  ✅ ${bot.handle} avatar generated (fallback)`);
        success++;
      } catch (err2) {
        console.error(`  ❌ ${bot.handle} avatar failed`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Results: ${success} success, ${failed} failed out of ${BOT_AVATARS.length}`);
  await Promise.resolve();
}

main().catch(console.error);
