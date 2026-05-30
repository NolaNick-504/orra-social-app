import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import ZAI from 'z-ai-web-dev-sdk';

export const dynamic = 'force-dynamic';

const ADMIN_KEY = 'orra504';

const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public'),
  path.resolve(process.cwd(), '..', '..', 'public'),
];

const BOTS = [
  {
    id: 'bot26',
    name: 'Zoe Castillo',
    avatarPrompt: 'realistic portrait photo of a young Latina woman late 20s warm smile dark brown wavy hair casual travel outfit golden hour lighting natural outdoor portrait headshot photorealistic',
    coverPrompt: 'beautiful tropical travel landscape golden sunset over Southeast Asian temple and river Bangkok skyline warm colors professional travel photography cover photo banner',
  },
  {
    id: 'bot27',
    name: 'Dex Murphy',
    avatarPrompt: 'realistic portrait photo of a young white man early 30s short brown hair rectangular glasses dark hoodie slight stubble monitor glow lighting indoor portrait headshot photorealistic',
    coverPrompt: 'dark cyberpunk cityscape neon blue and purple lights rain reflections digital aesthetic moody night city professional photography cover photo banner',
  },
  {
    id: 'bot28',
    name: 'Amara Okafor',
    avatarPrompt: 'realistic portrait photo of a beautiful Black woman mid 20s natural hair in styled afro bold colorful fashion earrings confident radiant smile studio lighting fashion editorial headshot photorealistic',
    coverPrompt: 'vibrant African textile fabric patterns Ankara wax print colorful geometric designs fashion studio professional photography cover photo banner',
  },
  {
    id: 'bot29',
    name: 'Sam Nakamura',
    avatarPrompt: 'realistic portrait photo of a young Japanese-American man late 20s white chef coat dark hair slightly messy warm friendly smile kitchen warm lighting professional headshot photorealistic',
    coverPrompt: 'artisan pastry kitchen beautiful croissants and baked goods on marble counter warm golden lighting professional food photography cover photo banner',
  },
  {
    id: 'bot30',
    name: 'Rio Santos',
    avatarPrompt: 'realistic portrait photo of a young Brazilian man mid 20s sun-bleached wavy hair golden tan skin white linen shirt open collar carefree smile beach sunlight portrait headshot photorealistic',
    coverPrompt: 'stunning tropical beach ocean wave turquoise water golden sunset surf lifestyle professional photography cover photo banner',
  },
  {
    id: 'bot31',
    name: 'Imani Williams',
    avatarPrompt: 'realistic portrait photo of a young Black woman late 20s warm compassionate professional smile natural hair styled neatly soft indoor lighting cozy office therapist portrait headshot photorealistic',
    coverPrompt: 'peaceful calm nature scene soft morning light through trees greenery wellness mindfulness professional photography cover photo banner',
  },
  {
    id: 'bot32',
    name: 'Felix Andersen',
    avatarPrompt: 'realistic portrait photo of a young Nordic man early 30s short blond hair clean shaven minimalist black turtleneck modern background natural lighting professional headshot photorealistic',
    coverPrompt: 'modern minimalist architecture concrete and glass building geometric lines natural light professional architectural photography cover photo banner',
  },
  {
    id: 'bot33',
    name: 'Lex Rivera',
    avatarPrompt: 'realistic portrait photo of a young Latino person mid 20s tattoo sleeves visible creative artistic style dark hair styled edgy confident smile studio lighting portrait headshot photorealistic',
    coverPrompt: 'tattoo parlor interior neon signs tattoo art on walls dark moody lighting artistic creative studio professional photography cover photo banner',
  },
  {
    id: 'bot34',
    name: 'Nadia Hassan',
    avatarPrompt: 'realistic portrait photo of a young Middle Eastern woman late 20s hijab elegant professional warm intelligent smile soft lighting journalist reporter portrait headshot photorealistic',
    coverPrompt: 'bustling Middle Eastern cityscape at sunset ancient and modern architecture golden hour warm tones professional travel journalism photography cover photo banner',
  },
  {
    id: 'bot35',
    name: 'Kai Tan',
    avatarPrompt: 'realistic portrait photo of a young Asian man mid 20s stylish modern outfit dark hair well-groomed confident smile moody bar lighting mixologist bartender portrait headshot photorealistic',
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
    const zai = await ZAI.create();
    results.push('ZAI SDK initialized successfully');

    const botsToProcess = botId ? BOTS.filter(b => b.id === botId) : BOTS;

    for (const bot of botsToProcess) {
      try {
        results.push(`Processing ${bot.id} (${bot.name})...`);

        // Generate avatar
        const avatarResponse = await zai.images.generations.create({
          prompt: bot.avatarPrompt,
          size: '1024x1024',
        });

        if (avatarResponse.data?.[0]?.base64) {
          const avatarBuffer = Buffer.from(avatarResponse.data[0].base64, 'base64');
          
          for (const dir of PUBLIC_DIRS) {
            const avatarsDir = path.join(dir, 'images', 'avatars', 'bots');
            try {
              if (!existsSync(avatarsDir)) await mkdir(avatarsDir, { recursive: true });
              const filePath = path.join(avatarsDir, `${bot.id}.jpg`);
              const sharp = (await import('sharp')).default;
              await sharp(avatarBuffer).resize(1024, 1024, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(filePath);
              results.push(`Avatar saved: ${filePath}`);
            } catch (err: any) {
              results.push(`Avatar save error: ${err.message}`);
            }
          }
        } else {
          results.push(`No avatar data for ${bot.id}`);
        }

        // Generate cover
        const coverResponse = await zai.images.generations.create({
          prompt: bot.coverPrompt,
          size: '1344x768',
        });

        if (coverResponse.data?.[0]?.base64) {
          const coverBuffer = Buffer.from(coverResponse.data[0].base64, 'base64');
          
          for (const dir of PUBLIC_DIRS) {
            const coversDir = path.join(dir, 'images', 'covers');
            try {
              if (!existsSync(coversDir)) await mkdir(coversDir, { recursive: true });
              const filePath = path.join(coversDir, `${bot.id}.jpg`);
              const sharp = (await import('sharp')).default;
              await sharp(coverBuffer).resize(1344, 768, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(filePath);
              results.push(`Cover saved: ${filePath}`);
            } catch (err: any) {
              results.push(`Cover save error: ${err.message}`);
            }
          }
        } else {
          results.push(`No cover data for ${bot.id}`);
        }

        results.push(`Done: ${bot.id}`);

      } catch (err: any) {
        results.push(`Error ${bot.id}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 });
  }
}
