#!/usr/bin/env node
/**
 * Fix duplicate and gradient images by generating real photos
 * that match each post's content using AI image generation.
 * 
 * Also adds images to text-only posts.
 */
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const IMG_DIR = '/home/z/my-project/public/images/posts';

// Known duplicate/gradient images that need replacement
const BAD_IMAGES = new Set([
  'coaching-6am-field.jpg', 'dance-student-victory.jpg', 'digital-japanese-art.jpg',
  'gaming-dual-monitors.jpg', 'heat-wave-indoor.jpg', 'late-night-beats.jpg',
  'lisbon-music-venue.jpg', 'madden-tournament.jpg', 'noodle-pulling.jpg',
  'nurse-shift-done.jpg', 'nurse-sick-home.jpg', 'open-mic-night.jpg',
  'orra-milestone-thu.jpg', 'poet-writing-journal.jpg', 'salon-wig-compassion.jpg',
  'smart-contract-code.jpg', 'street-style-bold.jpg', 'studio-six-beats.jpg',
  'studio-sunset-dance.jpg', 'summer-stoop-night.jpg', 'sunrise-yoga.jpg',
  'teacher-email-joy.jpg', 'teacher-student-moment.jpg', 'trail-10k-finish.jpg',
  'tre-flip-landed.jpg', 'vinyl-crate-digging.jpg', 'wifi-rage-gaming.jpg',
  'summer-sleeping-fan.jpg', 'sleeping-peaceful.jpg', 'coaching-field-6am.jpg',
  'kids-food-plate.jpg', 'skate-park-trick.jpg', 'salon-lease-signed.jpg'
]);

// Map post topics to good image generation prompts
function createImagePrompt(postText, postId) {
  const text = postText.toLowerCase();
  
  // Specific topic matching with photography-style prompts
  const topicPrompts = [
    // Dance/music
    { keywords: ['dance', 'choreography', 'studio', 'rehearsal'], prompt: 'A vibrant dance studio with mirrors and wooden floors, warm golden lighting, dance shoes on the floor, professional photography, warm tones' },
    { keywords: ['open mic', 'performance', 'stage', 'microphone'], prompt: 'An intimate open mic night venue with warm stage lighting, microphone on a small stage, audience silhouettes, atmospheric moody photography' },
    { keywords: ['beats', 'studio session', 'producer', 'music'], prompt: 'A professional music production studio at night, glowing audio equipment, mixing board with colorful LED lights, cozy creative atmosphere, cinematic photography' },
    { keywords: ['vinyl', 'record', 'flea market', 'crate digging'], prompt: 'Vintage vinyl records stacked at a flea market booth, warm afternoon light, crates full of album covers, nostalgic music lover atmosphere, documentary photography' },
    { keywords: ['guitar', 'acoustic', 'song'], prompt: 'An acoustic guitar leaning against a window with warm golden hour light, cozy room setting, intimate musical moment, professional photography' },
    
    // Sports/fitness
    { keywords: ['coaching', '6 am', 'grind', 'morning practice', 'young bulls'], prompt: 'An early morning football practice field with mist, coach and young athletes training at dawn, golden sunrise light, motivational sports photography' },
    { keywords: ['trail', '10k', 'run', 'running'], prompt: 'A scenic forest trail running path with morning sunlight filtering through trees, trail running shoes on dirt path, outdoor adventure photography' },
    { keywords: ['yoga', 'sunrise', 'mat', 'breathwork'], prompt: 'A serene yoga practice at sunrise on a wooden deck overlooking mountains, morning mist, peaceful wellness photography, golden hour light' },
    { keywords: ['gym', 'workout', 'sweat', 'fitness'], prompt: 'An intense gym workout session, dumbbells and weights, sweat and determination, modern fitness center, motivational fitness photography' },
    
    // Gaming/tech
    { keywords: ['gaming', 'diamond', 'rank', 'controller', 'madden'], prompt: 'A competitive gaming setup with dual monitors showing a game, RGB lighting, gaming headset and controller, esports atmosphere, dramatic photography' },
    { keywords: ['wifi', 'disconnect', 'lag'], prompt: 'Frustrated gamer with controller, dramatic blue screen glow, gaming setup with RGB lights, relatable gaming moment photography' },
    { keywords: ['smart contract', 'blockchain', 'deploy', 'coding'], prompt: 'Late night coding session, multiple screens showing code and blockchain interfaces, coffee cup, green terminal text glow, tech startup photography' },
    { keywords: ['coding', 'programming', 'developer'], prompt: 'A programmer working late at night, laptop screen with code, coffee cup nearby, warm desk lamp light, focused tech workspace photography' },
    
    // Food/cooking
    { keywords: ['noodle', 'hand-pulled', 'cooking', 'from scratch'], prompt: 'Hand-pulled noodles being stretched in a kitchen, flour dusted hands, traditional cooking process, warm kitchen lighting, food photography' },
    { keywords: ['meal prep', 'cooking', 'food'], prompt: 'Colorful meal prep containers arranged on a kitchen counter, fresh vegetables and healthy portions, bright clean kitchen photography' },
    { keywords: ['groceries', 'grocery', 'price'], prompt: 'A grocery store aisle with shopping cart, colorful produce section, everyday shopping scene, bright commercial photography' },
    
    // Nursing/healthcare
    { keywords: ['nurse', 'shift', 'hospital', '12-hour', 'night shift'], prompt: 'A tired but fulfilled nurse at the end of a hospital shift, scrubs, stethoscope, warm hospital corridor light, heartfelt healthcare photography' },
    { keywords: ['chemo', 'wig', 'salon', 'compassion'], prompt: 'A compassionate hair salon moment, warm and supportive atmosphere, hair styling tools, gentle caring hands, emotional beauty photography' },
    
    // Education/teaching
    { keywords: ['teacher', 'student', 'classroom', 'math', 'school'], prompt: 'An inspiring classroom moment, teacher helping a student at a desk, warm educational environment, books and supplies, educational photography' },
    { keywords: ['medical school', 'accepted', 'scholarship'], prompt: 'A joyful student opening an acceptance letter, bright future moment, campus setting, celebratory photography, warm golden light' },
    
    // Fashion/art
    { keywords: ['street style', 'streetwear', 'attitude', 'fashion'], prompt: 'Bold street style fashion on an urban sidewalk, confident pose, city backdrop, editorial fashion photography, dramatic lighting' },
    { keywords: ['digital art', 'illustration', 'japanese', 'traditional'], prompt: 'A digital artist workspace with tablet showing Japanese-inspired artwork, blend of traditional and digital, creative studio photography' },
    { keywords: ['art', 'creative', 'painting', 'canvas'], prompt: 'An artist working on a colorful canvas in a bright studio, paint supplies scattered around, creative process, artistic photography' },
    
    // Summer/seasonal
    { keywords: ['summer', 'fan', 'sleeping', 'hot'], prompt: 'A relatable summer scene, fan blowing curtains, cool bedroom with light sheets, hot summer day atmosphere, warm lifestyle photography' },
    { keywords: ['heat wave', 'ac', 'arctic', 'survival'], prompt: 'A cool air-conditioned room during summer, person relaxing with AC blowing, iced drink, relief from heat, lifestyle photography' },
    { keywords: ['stoop', 'summer night', 'speaker', 'neighborhood'], prompt: 'A summer night gathering on brownstone stoop, portable speaker, warm street lights, urban neighborhood atmosphere, documentary photography' },
    { keywords: ['sleeping', 'noon', 'alarm', 'lazy'], prompt: 'A peaceful lazy morning scene, person sleeping in, soft bedroom light, no alarm clock, cozy relaxed lifestyle photography' },
    
    // Skate/surf
    { keywords: ['skate', 'park', 'tre flip', 'trick'], prompt: 'A skateboarder performing a trick at a skatepark, action shot with motion blur, golden hour lighting, extreme sports photography' },
    { keywords: ['surf', 'wave', 'ocean'], prompt: 'A surfer riding a wave at sunrise, ocean spray, golden light on water, action surf photography' },
    
    // Travel/explore
    { keywords: ['lisbon', 'basement', 'underground', 'music spot'], prompt: 'An underground music venue in Lisbon, intimate dimly lit space, vintage decor and warm lights, European nightlife photography' },
    { keywords: ['barcelona', 'golden hour', 'sunset'], prompt: 'Barcelona cityscape at golden hour, warm Mediterranean light on architecture, beautiful travel photography' },
    
    // ORRA/social
    { keywords: ['orra', 'milestone', 'built', 'community', 'platform'], prompt: 'A diverse community celebration, people connecting and celebrating together, warm festive lighting, social gathering photography' },
    
    // Writing/poetry
    { keywords: ['poem', 'writing', 'journal', 'letter'], prompt: 'A handwritten journal on a wooden desk with coffee cup, pen, and soft natural light, intimate writing moment, lifestyle photography' },
    { keywords: ['poetry', 'spoken word', 'open mic'], prompt: 'A spoken word poet performing at a cozy venue, warm spotlight, intimate audience, artistic performance photography' },
    
    // Food
    { keywords: ['kids', 'food', 'nuggets', 'dino', 'picky'], prompt: 'A fun kids meal with dino nuggets on a colorful plate, playful food presentation, bright kitchen photography' },
    
    // Beauty/salon
    { keywords: ['salon', 'lease', 'signed', 'business'], prompt: 'A beautiful new hair salon space, styling chairs with mirrors, warm lighting, small business dream come true, professional salon photography' },
  ];
  
  // Try to match a specific topic
  for (const { keywords, prompt } of topicPrompts) {
    if (keywords.some(kw => text.includes(kw))) {
      return prompt;
    }
  }
  
  // Fallback: create a prompt from the post text
  const snippet = postText.substring(0, 100).replace(/"/g, '');
  return `A professional photograph capturing the mood of: "${snippet}", warm natural lighting, authentic moment, high quality photography`;
}

// Prompts for text-only "today's world" posts
function createWorldPostPrompt(postText) {
  const text = postText.toLowerCase();
  
  const worldTopicPrompts = [
    { keywords: ['mental health', 'burnout', 'anxiety', 'depression', 'therapy'], prompt: 'A peaceful mental health self-care moment, person meditating in a calm space, soft natural light, wellness photography, serene atmosphere' },
    { keywords: ['climate', 'environment', 'planet', 'sustainability', 'eco'], prompt: 'A dramatic environmental landscape showing both beauty and climate impact, golden light through trees, nature conservation photography' },
    { keywords: ['economy', 'inflation', 'rent', 'cost', 'housing', 'groceries'], prompt: 'A thoughtful image of everyday economics, person looking at bills at a kitchen table, warm domestic light, documentary photography' },
    { keywords: ['social media', 'instagram', 'tiktok', 'followers', 'likes', 'algorithm'], prompt: 'A person looking at their phone with a thoughtful expression, soft screen glow, contemplative moment about digital life, modern lifestyle photography' },
    { keywords: ['education', 'school', 'student', 'tuition', 'arts education'], prompt: 'Students engaged in creative learning, art supplies and books, bright classroom, hopeful educational atmosphere, warm photography' },
    { keywords: ['race', 'racial', 'black', 'identity', 'culture'], prompt: 'A powerful portrait celebrating Black culture and identity, warm golden light, confident expression, portrait photography' },
    { keywords: ['women', 'beauty standard', 'fashion', 'body'], prompt: 'A woman confidently expressing her authentic self, warm natural lighting, empowering portrait photography' },
    { keywords: ['gig economy', 'side hustle', 'uber', 'freelance', 'hustle'], prompt: 'A freelancer working from a coffee shop, laptop and coffee, productive but tired atmosphere, modern work life photography' },
    { keywords: ['gentrification', 'neighborhood', 'community', 'displacement'], prompt: 'A neighborhood street showing community character, local businesses, warm community feel, urban documentary photography' },
    { keywords: ['healthcare', 'medical', 'insurance', 'hospital'], prompt: 'A healthcare scene with stethoscope and medical equipment, warm professional lighting, medical care photography' },
    { keywords: ['police', 'justice', 'system', 'reform'], prompt: 'A symbolic image of justice and hope, courthouse with warm light, community and reform concept, documentary style photography' },
    { keywords: ['single mom', 'parent', 'mother', 'guilt'], prompt: 'A hardworking single mother with her child, warm tender moment, authentic family photography, soft natural light' },
    { keywords: ['food', 'food desert', 'hunger', 'nutrition'], prompt: 'Fresh fruits and vegetables at a community market, colorful produce, food access and nutrition concept, bright food photography' },
    { keywords: ['creative', 'art', 'artist', 'passion', 'illustration'], prompt: 'An artist in their creative element, paint or digital tools, vibrant workspace, passionate creative process photography' },
    { keywords: ['music', 'streaming', 'spotify', 'playlist'], prompt: 'A person enjoying music with headphones, warm ambient light, musical passion and discovery, lifestyle photography' },
    { keywords: ['prison', 'incarceration', 'rehabilitation', 'second chance'], prompt: 'A hopeful image of new beginnings, open door with warm light streaming through, second chances concept, inspiring photography' },
    { keywords: ['work', 'minimum wage', 'labor', 'union', 'worker'], prompt: 'Hardworking people in an honest day of work, warm respect and dignity, labor photography with natural light' },
    { keywords: ['skate', 'public space', 'parks'], prompt: 'A community skate park with skaters, urban recreation, golden hour light, youth culture documentary photography' },
    { keywords: ['older generation', 'boomer', 'blame', 'fight'], prompt: 'An intergenerational conversation, older and younger person connecting, warm family atmosphere, portrait photography' },
    { keywords: ['content creation', 'creator', 'views', 'viral'], prompt: 'A content creator setting up for a shoot, ring light and camera, creative workspace, digital creator lifestyle photography' },
    { keywords: ['fast fashion', 'sustainable', 'clothing'], prompt: 'Sustainable fashion clothing rack with unique pieces, warm boutique lighting, ethical fashion photography' },
    { keywords: ['ai', 'artificial intelligence', 'automation', 'job'], prompt: 'Technology and human hands, AI concept with warm light, future of work, thoughtful tech photography' },
    { keywords: ['disability', 'accessible', 'inclusion'], prompt: 'An inclusive community scene, accessibility and belonging, warm atmosphere, inclusive photography' },
    { keywords: ['immigrant', 'immigration', 'dream'], prompt: 'A hopeful immigrant journey scene, American dream concept, warm golden light, documentary style photography' },
    { keywords: ['addiction', 'recovery', 'sobriety', 'sober'], prompt: 'A peaceful recovery journey moment, sunrise symbolizing new beginning, hope and healing, warm photography' },
    { keywords: ['lgbtq', 'pride', 'identity', 'community'], prompt: 'A joyful Pride celebration moment, rainbow colors and warm light, community love, celebration photography' },
    { keywords: ['student debt', 'loan', 'tuition', 'college'], prompt: 'A college graduate celebrating, cap and gown, hopeful future, warm golden light, achievement photography' },
    { keywords: ['remote work', 'zoom', 'home office'], prompt: 'A comfortable home office setup, person on a video call, warm natural light, modern remote work lifestyle photography' },
    { keywords: ['self care', 'self-care', 'bubble bath', 'rest'], prompt: 'A peaceful self-care moment, soft candles and warm bath, relaxation and wellness, gentle lifestyle photography' },
    { keywords: ['public transport', 'bus', 'commute', 'transit'], prompt: 'A morning commute scene on public transit, city through the window, everyday life, urban documentary photography' },
    { keywords: ['phone', 'screen time', 'doom scroll', 'scroll'], prompt: 'A person thoughtfully setting down their phone, choosing presence over screens, warm natural light, mindful lifestyle photography' },
    { keywords: ['friendship', 'friends', 'loneliness', 'connection'], prompt: 'Friends sharing a genuine moment together, warm golden light, authentic connection, lifestyle photography' },
    { keywords: ['book', 'reading', 'library', 'literature'], prompt: 'A cozy reading nook with books, warm lamp light, peaceful reading moment, lifestyle photography' },
  ];
  
  for (const { keywords, prompt } of worldTopicPrompts) {
    if (keywords.some(kw => text.includes(kw))) {
      return prompt;
    }
  }
  
  // Generic thoughtful prompt for unmatched topics
  return 'A thoughtful and authentic moment captured in warm natural light, documentary style photography, emotional depth and human connection';
}

async function generateImage(prompt, outputPath) {
  try {
    const cmd = `z-ai-generate --prompt "${prompt.replace(/"/g, '\\"')}" --output "${outputPath}" --size 864x1152`;
    execSync(cmd, { timeout: 120000, stdio: 'pipe' });
    return existsSync(outputPath);
  } catch (e) {
    console.error(`  Failed to generate: ${e.message?.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('=== ORRA Image Fix Script ===\n');
  
  // Phase 1: Fix posts with duplicate/gradient images
  const allPosts = await db.post.findMany({
    select: { id: true, text: true, images: true, type: true },
    orderBy: { createdAt: 'desc' }
  });
  
  const dupPosts = allPosts.filter(p => {
    const imgs = JSON.parse(p.images || '[]');
    return imgs.some(img => BAD_IMAGES.has(img.split('/').pop()));
  });
  
  console.log(`Phase 1: Fixing ${dupPosts.length} posts with duplicate/gradient images`);
  
  let success1 = 0, fail1 = 0;
  for (let i = 0; i < dupPosts.length; i++) {
    const post = dupPosts[i];
    const oldImgs = JSON.parse(post.images || '[]');
    const badImg = oldImgs.find(img => BAD_IMAGES.has(img.split('/').pop()));
    const newFilename = `fix-${post.id}.jpg`;
    const outputPath = `${IMG_DIR}/${newFilename}`;
    
    console.log(`[${i+1}/${dupPosts.length}] Post ${post.id}: ${post.text.substring(0, 50)}...`);
    
    const prompt = createImagePrompt(post.text, post.id);
    const ok = await generateImage(prompt, outputPath);
    
    if (ok) {
      // Update database
      const newImgs = oldImgs.map(img => 
        BAD_IMAGES.has(img.split('/').pop()) ? `/images/posts/${newFilename}` : img
      );
      await db.post.update({
        where: { id: post.id },
        data: { images: JSON.stringify(newImgs) }
      });
      success1++;
      console.log(`  ✓ Generated ${newFilename}`);
    } else {
      fail1++;
      console.log(`  ✗ Failed`);
    }
  }
  
  console.log(`\nPhase 1 complete: ${success1} fixed, ${fail1} failed`);
  
  // Phase 2: Add images to text-only posts
  const textOnlyPosts = allPosts.filter(p => 
    p.type === 'text' || !JSON.parse(p.images || '[]').length
  );
  
  console.log(`\nPhase 2: Adding images to ${textOnlyPosts.length} text-only posts`);
  
  let success2 = 0, fail2 = 0;
  for (let i = 0; i < textOnlyPosts.length; i++) {
    const post = textOnlyPosts[i];
    const newFilename = `world-${post.id}.jpg`;
    const outputPath = `${IMG_DIR}/${newFilename}`;
    
    console.log(`[${i+1}/${textOnlyPosts.length}] Post ${post.id}: ${post.text.substring(0, 50)}...`);
    
    const prompt = createWorldPostPrompt(post.text);
    const ok = await generateImage(prompt, outputPath);
    
    if (ok) {
      await db.post.update({
        where: { id: post.id },
        data: { 
          images: JSON.stringify([`/images/posts/${newFilename}`]),
          type: 'image'
        }
      });
      success2++;
      console.log(`  ✓ Generated ${newFilename}`);
    } else {
      fail2++;
      console.log(`  ✗ Failed`);
    }
  }
  
  console.log(`\nPhase 2 complete: ${success2} added, ${fail2} failed`);
  console.log(`\n=== Total: ${success1 + success2} images fixed/added, ${fail1 + fail2} failures ===`);
  
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
