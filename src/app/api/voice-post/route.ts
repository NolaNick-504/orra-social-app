import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
// Fallback for standalone mode
const PROJECT_UPLOAD_DIR = path.resolve(process.cwd(), '..', '..', 'public', 'uploads');

function getUploadDir(): string {
  if (existsSync(PROJECT_UPLOAD_DIR)) {
    return PROJECT_UPLOAD_DIR;
  }
  return UPLOAD_DIR;
}

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
]);

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

const EXTENSION_MAP: Record<string, string> = {
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
};

// POST /api/voice-post - Upload a voice post (base64 audio data)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { audio, contentType, filename } = body;

    if (!audio) {
      return NextResponse.json(
        { success: false, error: 'Audio data is required' },
        { status: 400 }
      );
    }

    const audioContentType = contentType || 'audio/webm';

    if (!ALLOWED_AUDIO_TYPES.has(audioContentType)) {
      return NextResponse.json(
        { success: false, error: `Unsupported audio format: ${audioContentType}. Supported: webm, ogg, mp4, mp3, wav` },
        { status: 400 }
      );
    }

    // Extract raw base64 data (remove data:xxx;base64, prefix if present)
    const base64Match = audio.match(/^data:[^;]+;base64,(.+)$/);
    const rawBase64 = base64Match ? base64Match[1] : audio;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(rawBase64, 'base64');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid base64 audio data' },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Audio file too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = getUploadDir();
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = EXTENSION_MAP[audioContentType] || path.extname(filename || '') || '.webm';
    const safeFilename = `voice-${crypto.randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, safeFilename);

    await writeFile(filepath, buffer);

    const audioUrl = `/uploads/${safeFilename}`;

    return NextResponse.json({
      success: true,
      data: {
        audioUrl,
        filename: safeFilename,
        size: buffer.length,
        contentType: audioContentType,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Voice post upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload voice post' },
      { status: 500 }
    );
  }
}
