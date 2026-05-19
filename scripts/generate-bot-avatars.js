#!/usr/bin/env node
/**
 * Generate AI avatar images for the 15 new bots (u17-u31).
 * Run: node scripts/generate-bot-avatars.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AVATAR_DIR = path.join(__dirname, '..', 'public', 'images', 'avatars');

const BOT_AVATARS = [
  { id: 'u17', handle: 'ricovega', prompt: 'Portrait of a young Latino man with a camera around his neck, urban street style, warm golden hour lighting, street photographer aesthetic, beanie, casual jacket' },
  { id: 'u18', handle: 'ariamoon', prompt: 'Portrait of a young Black woman with natural hair holding an acoustic guitar, warm studio lighting, bohemian aesthetic, soft smile, artistic vibe' },
  { id: 'u19', handle: 'jaketorres', prompt: 'Portrait of a young Latino man with a skateboard, casual streetwear, cap backwards, edgy urban style, overcast skylight, authentic skater aesthetic' },
  { id: 'u20', handle: 'niabrooks', prompt: 'Portrait of a young Black woman in dance pose, athletic wear, dynamic movement, studio lighting, confident expression, dance studio background' },
  { id: 'u21', handle: 'sampark', prompt: 'Portrait of a young Asian man with glasses at a computer desk, indie game developer aesthetic, dual monitors with code, warm ambient lighting, focused expression' },
  { id: 'u22', handle: 'priyasharma', prompt: 'Portrait of a young Indian woman in a bright kitchen, traditional-modern fusion outfit, warm lighting, spices on counter, inviting smile, food blogger aesthetic' },
  { id: 'u23', handle: 'milesjackson', prompt: 'Portrait of a young Black man playing saxophone, jazz club atmosphere, moody amber lighting, sharp dressed, musical performance aesthetic' },
  { id: 'u24', handle: 'chloebennett', prompt: 'Portrait of a young white woman surrounded by lush green plants, natural window light, earthy aesthetic, linen clothing, gentle smile, plant parent vibe' },
  { id: 'u25', handle: 'dexcarter', prompt: 'Portrait of a young Black man in premium streetwear, sneaker collection wall behind, cool blue lighting, confident pose, urban luxury aesthetic' },
  { id: 'u26', handle: 'lilytran', prompt: 'Portrait of a young Asian woman with backpack at a scenic overlook, travel blogger aesthetic, golden hour mountain backdrop, wind in hair, adventurous spirit' },
  { id: 'u27', handle: 'tylerreed', prompt: 'Portrait of a young white man on a comedy club stage, spotlight, casual cool outfit, mid-laugh expression, comedian aesthetic, warm stage lighting' },
  { id: 'u28', handle: 'rosagutierrez', prompt: 'Portrait of a young Latina woman with stunning makeup, beauty lighting, vanity mirror, glamorous aesthetic, ring light reflection, confident beauty look' },
  { id: 'u29', handle: 'kainakamura', prompt: 'Portrait of a young Japanese-American person with anime merchandise shelf behind them, colorful ambient lighting, casual otaku aesthetic, headphones' },
  { id: 'u30', handle: 'deshawnharris', prompt: 'Portrait of a young Black man in a barbershop, wearing barber apron, sharp fade, warm shop lighting, classic barbershop interior, professional and confident' },
  { id: 'u31', handle: 'islamurphy', prompt: 'Portrait of a young white woman in outdoor hiking gear, mountain backdrop, natural lighting, eco-conscious aesthetic, windblown hair, determined expression' },
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
