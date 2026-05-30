import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ADMIN_KEY = 'orra504';

// Resolve public directories: standalone mode runs from .next/standalone/
const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public'),
  path.resolve(process.cwd(), '..', '..', 'public'),
];

// Bot definitions with image generation prompts
const BOTS = [
  {
    id: 'bot26',
    name: 'Zoe Castillo',
    avatarPrompt: 'realistic portrait photo of a young Latina woman late 20s warm smile dark brown wavy hair casual travel outfit golden hour lighting natural outdoor portrait headshot 4k photorealistic',
    coverPrompt: 'beautiful tropical travel landscape golden sunset over Southeast Asian temple and river Bangkok skyline warm colors professional travel photography cover photo banner',
  },
  {
    id: 'bot27',
    name: 'Dex Murphy',
    avatarPrompt: 'realistic portrait photo of a young white man early 30s short brown hair rectangular glasses dark hoodie slight stubble monitor glow lighting indoor cyberpunk lite portrait headshot 4k photorealistic',
    coverPrompt: 'dark cyberpunk cityscape neon blue and purple lights rain reflections digital matrix code aesthetic moody night city professional photography cover photo banner',
  },
  {
    id: 'bot28',
    name: 'Amara Okafor',
    avatarPrompt: 'realistic portrait photo of a beautiful Black woman mid 20s natural hair in styled afro bold colorful African print fashion earrings confident radiant smile studio lighting fashion editorial headshot 4k photorealistic',
    coverPrompt: 'vibrant African textile fabric patterns Ankara wax print colorful geometric designs fashion studio professional photography cover photo banner',
  },
  {
    id: 'bot29',
    name: 'Sam Nakamura',
    avatarPrompt: 'realistic portrait photo of a young Japanese-American man late 20s white chef coat dark hair slightly messy warm friendly smile flour dust kitchen warm lighting professional headshot 4k photorealistic',
    coverPrompt: 'artisan pastry kitchen beautiful croissants and baked goods on marble counter warm golden lighting professional food photography cover photo banner',
  },
  {
    id: 'bot30',
    name: 'Rio Santos',
    avatarPrompt: 'realistic portrait photo of a young Brazilian man mid 20s sun-bleached wavy hair golden tan skin white linen shirt open collar salt water spray carefree smile beach sunlight portrait headshot 4k photorealistic',
    coverPrompt: 'stunning tropical beach ocean wave turquoise water golden sunset surf beach lifestyle professional photography cover photo banner',
  },
  {
    id: 'bot31',
    name: 'Imani Williams',
    avatarPrompt: 'realistic portrait photo of a young Black woman late 20s warm compassionate professional smile natural hair styled neatly soft indoor lighting cozy office therapist portrait headshot 4k photorealistic',
    coverPrompt: 'peaceful calm nature scene soft morning light through trees greenery wellness mindfulness professional photography cover photo banner',
  },
  {
    id: 'bot32',
    name: 'Felix Andersen',
    avatarPrompt: 'realistic portrait photo of a young Nordic man early 30s short blond hair clean shaven minimalist black turtleneck modern architectural background natural lighting professional headshot 4k photorealistic',
    coverPrompt: 'modern minimalist architecture concrete and glass building geometric lines natural light professional architectural photography cover photo banner',
  },
  {
    id: 'bot33',
    name: 'Lex Rivera',
    avatarPrompt: 'realistic portrait photo of a young Latino person mid 20s tattoo sleeves visible creative artistic style dark hair styled edgy confident smile studio lighting tattoo artist portrait headshot 4k photorealistic',
    coverPrompt: 'tattoo parlor interior neon signs tattoo art on walls dark moody lighting artistic creative studio professional photography cover photo banner',
  },
  {
    id: 'bot34',
    name: 'Nadia Hassan',
    avatarPrompt: 'realistic portrait photo of a young Middle Eastern woman late 20s hijab elegant professional warm intelligent smile soft lighting journalist reporter portrait headshot 4k photorealistic',
    coverPrompt: 'bustling Middle Eastern cityscape at sunset ancient and modern architecture golden hour warm tones professional travel journalism photography cover photo banner',
  },
  {
    id: 'bot35',
    name: 'Kai Tan',
    avatarPrompt: 'realistic portrait photo of a young Asian man mid 20s stylish modern outfit creative dark hair well-groomed confident smile moody bar lighting mixologist bartender portrait headshot 4k photorealistic',
    coverPrompt: 'elegant speakeasy bar interior dim amber lighting cocktail glasses shelves of bottles moody atmospheric professional photography cover photo banner',
  },
];

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botId = req.nextUrl.searchParams.get('bot');
  const results: string[] = [];

  try {
    // Import the SDK
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    results.push('ZAI SDK initialized');

    const botsToProcess = botId ? BOTS.filter(b => b.id === botId) : BOTS;

    for (const bot of botsToProcess) {
      try {
        results.push(`\n--- Processing ${bot.id} (${bot.name}) ---`);

        // Generate avatar
        results.push(`Generating avatar for ${bot.id}...`);
        const avatarResponse = await zai.images.generations.create({
          prompt: bot.avatarPrompt,
          size: '1024x1024',
        });

        if (avatarResponse.data?.[0]?.base64) {
          const avatarBuffer = Buffer.from(avatarResponse.data[0].base64, 'base64');
          
          // Save to all public directories
          for (const dir of PUBLIC_DIRS) {
            const avatarsDir = path.join(dir, 'images', 'avatars', 'bots');
            try {
              if (!existsSync(avatarsDir)) {
                await mkdir(avatarsDir, { recursive: true });
              }
              const filePath = path.join(avatarsDir, `${bot.id}.jpg`);
              
              // Use sharp to process and save
              const sharp = (await import('sharp')).default;
              await sharp(avatarBuffer)
                .resize(1024, 1024, { fit: 'cover' })
                .jpeg({ quality: 90 })
                .toFile(filePath);
              
              results.push(`Avatar saved to ${filePath} (${avatarBuffer.length} bytes)`);
            } catch (err: any) {
              results.push(`Avatar save failed for ${dir}: ${err.message}`);
            }
          }
        } else {
          results.push(`Avatar generation returned no data for ${bot.id}`);
        }

        // Generate cover
        results.push(`Generating cover for ${bot.id}...`);
        const coverResponse = await zai.images.generations.create({
          prompt: bot.coverPrompt,
          size: '1344x768',
        });

        if (coverResponse.data?.[0]?.base64) {
          const coverBuffer = Buffer.from(coverResponse.data[0].base64, 'base64');
          
          for (const dir of PUBLIC_DIRS) {
            const coversDir = path.join(dir, 'images', 'covers');
            try {
              if (!existsSync(coversDir)) {
                await mkdir(coversDir, { recursive: true });
              }
              const filePath = path.join(coversDir, `${bot.id}.jpg`);
              
              const sharp = (await import('sharp')).default;
              await sharp(coverBuffer)
                .resize(1344, 768, { fit: 'cover' })
                .jpeg({ quality: 90 })
                .toFile(filePath);
              
              results.push(`Cover saved to ${filePath} (${coverBuffer.length} bytes)`);
            } catch (err: any) {
              results.push(`Cover save failed for ${dir}: ${err.message}`);
            }
          }
        } else {
          results.push(`Cover generation returned no data for ${bot.id}`);
        }

        results.push(`✅ ${bot.id} complete`);

      } catch (err: any) {
        results.push(`❌ Error processing ${bot.id}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
    }, { status: 500 });
  }
}
