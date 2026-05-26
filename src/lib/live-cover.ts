import fs from 'fs';
import path from 'path';
import ZAI from 'z-ai-web-dev-sdk';

/**
 * Generate a cover image for a live stream using AI image generation.
 * The prompt is based on the stream title and category.
 * Returns the relative URL path for the generated image.
 */
export async function generateLiveCover(
  title: string,
  category: string = 'Trending'
): Promise<string> {
  try {
    const zai = await ZAI.create();

    // Build a prompt that creates an attractive cover matching the stream's topic
    const categoryStyles: Record<string, string> = {
      Music: 'vibrant concert stage with neon lights and musical notes, energetic atmosphere',
      Gaming: 'epic gaming setup with glowing RGB lights, futuristic digital landscape',
      Dance: 'dynamic dance floor with colorful spotlights and motion trails',
      Comedy: 'warm comedy club stage with spotlight and microphone, laughing audience silhouettes',
      Sports: 'athletic stadium with dramatic lighting and action silhouettes',
      Art: 'creative art studio with colorful paint splashes and canvas',
      Lifestyle: 'cozy aesthetic room with warm lighting and plants',
      Trending: 'trendy social media aesthetic with vibrant gradient and modern design',
      Cooking: 'kitchen scene with steam and delicious food, warm ambient lighting',
      Fitness: 'gym with dramatic lighting and fitness equipment silhouettes',
      Tech: 'futuristic tech setup with holographic displays and circuit patterns',
      Fashion: 'runway with dramatic lighting and fashion silhouettes',
      Education: 'modern classroom with warm lighting and book aesthetics',
      Talk: 'podcast studio setup with warm lighting and microphones',
    };

    const styleHint = categoryStyles[category] || categoryStyles.Trending;

    // Build a detailed prompt from the title that creates a visually matching cover
    const prompt = `Live stream cover image for "${title}": ${styleHint}. Create a visually striking, atmospheric background image that directly represents what this stream is about. Dark moody aesthetic with vibrant accent colors. No text, no faces, no people. Cinematic quality, 16:9 aspect ratio feel.`;

    const response = await zai.images.generations.create({
      prompt,
      size: '1344x768', // Wide format good for stream covers
    });

    const imageBase64 = response.data[0]?.base64;
    if (!imageBase64) {
      console.warn('No image data returned from AI, using fallback');
      return getFallbackCover(category);
    }

    // Save the image to the uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'live-covers');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `live-cover-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(imageBase64, 'base64');
    fs.writeFileSync(filePath, buffer);

    return `/uploads/live-covers/${filename}`;
  } catch (error) {
    console.error('Failed to generate live cover:', error);
    return getFallbackCover(category);
  }
}

/**
 * Get a fallback cover image URL based on category.
 * Uses AI-generated covers that match the category visually.
 */
export function getFallbackCover(category: string): string {
  const normalized = (category || 'trending').toLowerCase().trim();
  const categoryMap: Record<string, string> = {
    music: '/uploads/live-covers/late-night-vibes.jpg',
    gaming: '/uploads/live-covers/ranked-grind.jpg',
    dance: '/uploads/live-covers/dance-challenge.jpg',
    comedy: '/uploads/live-covers/storytime-qa.jpg',
    sports: '/uploads/live-covers/pregame-warmup.jpg',
    art: '/uploads/live-covers/painting-session.jpg',
    lifestyle: '/uploads/live-covers/cooking-special.jpg',
    trending: '/uploads/live-covers/just-chatting.jpg',
    cooking: '/uploads/live-covers/making-ramen.jpg',
    food: '/uploads/live-covers/cooking-special.jpg',
    fitness: '/uploads/live-covers/morning-yoga.jpg',
    tech: '/uploads/live-covers/tech-news.jpg',
    fashion: '/uploads/live-covers/fashion-lookbook.jpg',
    education: '/uploads/live-covers/study-session.jpg',
    talk: '/uploads/live-covers/storytime-qa.jpg',
    live: '/uploads/live-covers/just-chatting.jpg',
  };

  return categoryMap[normalized] || '/uploads/live-covers/just-chatting.jpg';
}
