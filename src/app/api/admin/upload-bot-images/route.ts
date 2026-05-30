import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ADMIN_KEY = 'orra504';

const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public'),
  path.resolve(process.cwd(), '..', '..', 'public'),
];

// POST: Upload avatar or cover image for a bot
// Body: { botId: string, type: 'avatar' | 'cover', imageData: string (base64) }
export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { botId, type, imageData } = body;

    if (!botId || !type || !imageData) {
      return NextResponse.json({ error: 'Missing botId, type, or imageData' }, { status: 400 });
    }

    if (!['avatar', 'cover'].includes(type)) {
      return NextResponse.json({ error: 'Type must be avatar or cover' }, { status: 400 });
    }

    if (!/^bot\d+$/.test(botId)) {
      return NextResponse.json({ error: 'Invalid botId format' }, { status: 400 });
    }

    const buffer = Buffer.from(imageData, 'base64');
    const subdir = type === 'avatar' ? 'images/avatars/bots' : 'images/covers';
    const filename = `${botId}.jpg`;

    const savedPaths: string[] = [];

    for (const dir of PUBLIC_DIRS) {
      const targetDir = path.join(dir, subdir);
      try {
        if (!existsSync(targetDir)) {
          await mkdir(targetDir, { recursive: true });
        }
        const filePath = path.join(targetDir, filename);

        // Use sharp to process the image
        const sharp = (await import('sharp')).default;
        const pipeline = sharp(buffer).jpeg({ quality: 90 });
        if (type === 'avatar') {
          pipeline.resize(1024, 1024, { fit: 'cover' });
        } else {
          pipeline.resize(1344, 768, { fit: 'cover' });
        }
        await pipeline.toFile(filePath);
        savedPaths.push(filePath);
      } catch (err: any) {
        // Fallback: save raw buffer
        try {
          const filePath = path.join(targetDir, filename);
          await writeFile(filePath, buffer);
          savedPaths.push(filePath + ' (raw)');
        } catch (writeErr: any) {
          savedPaths.push(`FAILED: ${dir}: ${writeErr.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      botId,
      type,
      size: buffer.length,
      savedPaths,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
