import { NextRequest, NextResponse } from 'next/server';

// Audio proxy — fetches remote audio files server-side to bypass CORS restrictions
// Usage: /api/audio-proxy?url=https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3

const ALLOWED_HOSTS = [
  'www.soundhelix.com',
  'soundhelix.com',
  'cdn.pixabay.com',
  'pixabay.com',
  'files.freemusicarchive.org',
  'freemusicarchive.org',
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Only allow specific hosts to prevent abuse
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ORRA-AudioProxy/1.0',
        'Accept': 'audio/mpeg, audio/ogg, audio/wav, audio/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': body.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Audio proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 502 });
  }
}
