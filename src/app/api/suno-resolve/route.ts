import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve a Suno URL to get the direct MP3 CDN URL and metadata.
 * 
 * Supports:
 * - Short URLs: https://suno.com/s/{shareId}
 * - Song URLs: https://suno.com/song/{uuid}?sh={shareId}
 * 
 * Returns: { songUuid, mp3Url, title, artist, imageUrl }
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    
    if (!host.includes('suno.com')) {
      return NextResponse.json({ error: 'Not a Suno URL' }, { status: 400 });
    }

    let songUuid: string | null = null;

    // Check if it's already a /song/{uuid} URL
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'song' && pathParts[1]) {
      songUuid = pathParts[1];
    } else if (pathParts[0] === 's' && pathParts[1]) {
      // It's a short URL - follow redirect to get the song UUID
      const redirectResponse = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      const resolvedUrl = redirectResponse.url;
      
      // Parse the redirected URL to extract the song UUID
      const resolvedParsed = new URL(resolvedUrl);
      const resolvedParts = resolvedParsed.pathname.split('/').filter(Boolean);
      if (resolvedParts[0] === 'song' && resolvedParts[1]) {
        songUuid = resolvedParts[1];
      }
    }

    if (!songUuid) {
      return NextResponse.json({ error: 'Could not resolve song ID from URL' }, { status: 400 });
    }

    // Validate UUID format (Suno uses standard UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(songUuid)) {
      return NextResponse.json({ error: 'Invalid song ID format' }, { status: 400 });
    }

    // Construct the direct CDN MP3 URL
    const mp3Url = `https://cdn1.suno.ai/${songUuid}.mp3`;
    const imageUrl = `https://cdn2.suno.ai/image_${songUuid}.jpeg`;
    const largeImageUrl = `https://cdn2.suno.ai/image_large_${songUuid}.jpeg`;

    // Try to get metadata from the embed page (lighter than full page)
    let title = '';
    let artist = '';
    
    try {
      const pageResponse = await fetch(`https://suno.com/embed/${songUuid}`, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ORRA/1.0)',
        },
      });
      
      if (pageResponse.ok) {
        const html = await pageResponse.text();
        
        // Extract title from og:title meta tag
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
        if (titleMatch) {
          title = decodeHTMLEntities(titleMatch[1]);
        }
        
        // Extract description which contains artist info
        const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
        if (descMatch) {
          const desc = decodeHTMLEntities(descMatch[1]);
          // Description format: "Song Title by Artist (@handle). Listen and make your own on Suno."
          const artistMatch = desc.match(/by\s+(.+?)(?:\s*\(@?[^)]+\))?\.\s*Listen/i);
          if (artistMatch) {
            artist = artistMatch[1].trim();
          }
        }
      }
    } catch {
      // Metadata extraction failed - still return the MP3 URL
    }

    return NextResponse.json({
      songUuid,
      mp3Url,
      imageUrl,
      largeImageUrl,
      title,
      artist,
    });
  } catch (error) {
    console.error('Suno resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve Suno URL' }, { status: 500 });
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}
