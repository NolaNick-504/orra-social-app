const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

const IMAGE_POSTS = [
  { authorId: 'u32', text: 'Behind the lens at a runway show. The energy backstage is absolutely electric', vibeTag: 'hyped', prompt: 'Fashion editorial behind the scenes, photographer shooting model on rooftop, golden hour city backdrop, professional fashion photography' },
  { authorId: 'u33', text: 'New track in the works. The drop on this one is going to destroy dance floors', vibeTag: 'focused', prompt: 'DJ producing music in studio with synthesizers and monitors, electronic music production, neon ambient lighting, creative workspace' },
  { authorId: 'u35', text: 'Every tattoo tells a story and today this one told mine. Ink therapy at its finest', vibeTag: 'dramatic', prompt: 'Neon-lit tattoo studio interior, artist working on detailed sleeve tattoo, moody atmospheric lighting, creative workspace' },
  { authorId: 'u36', text: 'New meditation guide just dropped on the channel. 10 minutes that will change your whole day', vibeTag: 'chill', prompt: 'Yoga studio morning class, people in peaceful poses, soft natural light streaming through windows, wellness lifestyle photography' },
  { authorId: 'u37', text: 'Behind the scenes of todays shoot. The real content is what happens between takes', vibeTag: 'chill', prompt: 'Content creator filming vlog with ring light and camera setup, modern apartment background, social media lifestyle photography' },
  { authorId: 'u38', text: 'Basketball fundamentals clinic this Saturday. All skill levels welcome', vibeTag: 'chill', prompt: 'Basketball player mid-dunk in dramatic lighting, arena spotlight, high-energy sports action shot' },
  { authorId: 'u39', text: 'Mood board for a new client project. Earth tones with pops of terracotta. Design is storytelling', vibeTag: 'focused', prompt: 'Interior design detail shot, vintage furniture in sunlit room, earth tones, cozy aesthetic, lifestyle design photography' },
  { authorId: 'u40', text: 'Cafe is packed today and the espresso machine is working overtime. This is the life', vibeTag: 'hyped', prompt: 'Specialty coffee pour over with blooming grounds, warm cafe atmosphere, close-up barista photography, steam rising' },
  { authorId: 'u41', text: 'New look reveal and she is SERVING. 4 hours of makeup and every second was worth it', vibeTag: 'dramatic', prompt: 'Drag performer on stage with dramatic lighting and sequined outfit, theatrical performance, colorful stage lights, expressive art' },
  { authorId: 'u42', text: 'Beach cleanup crew pulled 150 lbs of plastic today. Protect what you love', vibeTag: 'focused', prompt: 'Surfer walking toward ocean at sunset with board under arm, golden hour beach photography, saltwater lifestyle, peaceful waves' },
  { authorId: 'u43', text: 'Documentary filmmaking is about listening. The best stories come when you stop talking and start hearing', vibeTag: 'chill', prompt: 'Documentary filmmaker behind camera in urban setting, candid street photography, natural light, storytelling aesthetic' },
  { authorId: 'u44', text: 'Graffiti is the voice of the streets and today we made the neighborhood sing', vibeTag: 'hyped', prompt: 'Large colorful graffiti mural on brick wall in urban alley, street art photography, vibrant spray paint colors, cultural expression' },
  { authorId: 'u45', text: 'Wedding cake delivery complete. Three tiers of sugar and love. The happy couple was speechless', vibeTag: 'chill', prompt: 'Elegant pastry display with macarons and decorated cakes, bakery interior, warm lighting, French patisserie aesthetic, dessert photography' },
  { authorId: 'u46', text: 'Live podcast tonight! Bring your opinions because I have got mine and they are controversial', vibeTag: 'hyped', prompt: 'Podcast studio setup with professional microphones and headphones, warm ambient lighting, intimate recording space, media production aesthetic' },
  { authorId: 'u34', text: 'Spent all night in the observatory and saw the rings of Saturn with my own eyes. Life changing', vibeTag: 'peaceful', prompt: 'Person looking through large telescope at night observatory, starry sky, dramatic astrophotography, deep space wonder' },
];

const UPLOAD_DIR = '/home/z/my-project/public/uploads';

async function main() {
  console.log(`Creating ${IMAGE_POSTS.length} image posts for new bots...\n`);
  let success = 0, failed = 0;

  for (const post of IMAGE_POSTS) {
    try {
      // Generate AI image
      const timestamp = Date.now();
      const randStr = Math.random().toString(36).substring(2, 8);
      const imagePath = `${UPLOAD_DIR}/ai-${timestamp}-${randStr}.jpg`;
      
      console.log(`  🎨 Generating image for ${post.authorId}: "${post.text.substring(0, 35)}..."`);
      
      try {
        execSync(`z-ai-generate -p "${post.prompt}" -o "${imagePath}" -s 1024x1024`, { stdio: 'pipe', timeout: 90000 });
      } catch (e) {
        console.log(`  ⚠️ Image gen failed, creating text-only post`);
      }
      
      // Check if image was generated
      const fs = require('fs');
      const hasImage = fs.existsSync(imagePath) && fs.statSync(imagePath).size > 5000;
      const imageUrl = hasImage ? `/uploads/ai-${timestamp}-${randStr}.jpg` : '';
      const images = hasImage ? JSON.stringify([imageUrl]) : '[]';
      const postType = hasImage ? 'image' : 'text';
      
      await prisma.post.create({
        data: {
          text: post.text,
          vibeTag: post.vibeTag,
          type: postType,
          images: images,
          authorId: post.authorId,
          likesCount: Math.floor(Math.random() * 45) + 8,
          commentsCount: 0,
          sharesCount: Math.floor(Math.random() * 15),
        }
      });
      
      console.log(`  ✅ ${post.authorId} (${postType}): "${post.text.substring(0, 40)}..."`);
      success++;
    } catch (err) {
      console.log(`  ❌ ${post.authorId}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 ${success} success, ${failed} failed`);
  await prisma.$disconnect();
}

main();
