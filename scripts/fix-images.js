#!/usr/bin/env node
/**
 * Fix all image issues in ORRA:
 * 1. Replace duplicate/gradient images with unique real photos
 * 2. Add images to text-only posts about today's world
 * 
 * Uses loremflickr.com for keyword-matched stock photos (free, no API key needed)
 */
const { execSync } = require('child_process');
const { existsSync, unlinkSync } = require('fs');
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();
const IMG_DIR = '/home/z/my-project/public/images/posts';

// Known bad images that need replacement (duplicates + gradients)
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

// Map post content to search keywords for loremflickr
function getKeywords(postText, postId) {
  const t = postText.toLowerCase();
  
  // Keyword mapping - returns comma-separated search terms for loremflickr
  const mappings = [
    // Dance/music
    { keys: ['dance', 'choreography', 'sequence'], kw: 'dance,studio,practice' },
    { keys: ['open mic', 'stage', 'microphone'], kw: 'open,mic,night,stage' },
    { keys: ['beats', 'studio session', 'producer', '6 beats'], kw: 'music,studio,production' },
    { keys: ['vinyl', 'record', 'flea market', 'crate digging', 'rare pressing'], kw: 'vinyl,records,music' },
    { keys: ['guitar', 'acoustic', 'song'], kw: 'guitar,acoustic,music' },
    { keys: ['late night studio', 'city sleeps', 'beats'], kw: 'music,studio,night' },
    
    // Sports/fitness
    { keys: ['coaching', '6 am', 'young bulls', 'thursday grind'], kw: 'football,coaching,practice' },
    { keys: ['trail', '10k', 'run', 'jello'], kw: 'trail,running,nature' },
    { keys: ['yoga', 'sunrise', 'mat', 'breathwork', 'quiet'], kw: 'yoga,sunrise,wellness' },
    { keys: ['gym', 'workout', 'sweat'], kw: 'gym,workout,fitness' },
    
    // Gaming/tech
    { keys: ['gaming', 'diamond', 'rank', 'controller', 'madden', 'tournament'], kw: 'gaming,setup,esports' },
    { keys: ['wifi', 'disconnect', 'lag', 'rage', 'controller'], kw: 'gaming,frustration,computer' },
    { keys: ['smart contract', 'blockchain', 'deploy', '2 am'], kw: 'coding,blockchain,technology' },
    { keys: ['coding', 'programming', 'developer'], kw: 'programming,laptop,code' },
    
    // Food/cooking
    { keys: ['noodle', 'hand-pulled', 'from scratch', '4 attempts'], kw: 'noodles,cooking,kitchen' },
    { keys: ['meal prep', 'cooking', 'sunday'], kw: 'meal,prep,food' },
    { keys: ['groceries', 'grocery', 'price'], kw: 'grocery,store,shopping' },
    { keys: ['kids', 'dino', 'nuggets', 'picky'], kw: 'kids,food,meal' },
    
    // Nursing/healthcare
    { keys: ['nurse', 'shift', 'hospital', '12-hour', 'night shift', 'feet screaming'], kw: 'nurse,hospital,healthcare' },
    { keys: ['chemo', 'wig', 'salon', 'compassion', 'cancer'], kw: 'salon,hair,care' },
    
    // Education/teaching
    { keys: ['teacher', 'student', 'classroom', 'math', 'medical school', 'accepted'], kw: 'teacher,student,education' },
    
    // Fashion/art
    { keys: ['street style', 'streetwear', 'attitude', 'labels'], kw: 'street,fashion,urban' },
    { keys: ['digital art', 'illustration', 'japanese', 'traditional'], kw: 'digital,art,creative' },
    { keys: ['art', 'creative', 'painting', 'breakthrough'], kw: 'art,painting,canvas' },
    
    // Summer/seasonal
    { keys: ['summer', 'fan', 'sleeping', 'hot', 'leg out'], kw: 'summer,bedroom,relaxing' },
    { keys: ['heat wave', 'ac', 'arctic', 'survival'], kw: 'air,conditioning,cool' },
    { keys: ['stoop', 'summer night', 'speaker', 'neighborhood'], kw: 'stoop,urban,night' },
    { keys: ['sleeping', 'noon', 'alarm', 'lazy', 'no responsibilities'], kw: 'sleeping,bed,peaceful' },
    { keys: ['cold', 'sick', 'suffering'], kw: 'sick,bed,rest' },
    
    // Skate/surf
    { keys: ['skate', 'park', 'tre flip', 'trick', 'landed'], kw: 'skateboard,park,trick' },
    
    // Travel
    { keys: ['lisbon', 'underground', 'music spot', 'basement'], kw: 'lisbon,music,venue' },
    { keys: ['barcelona', 'golden hour'], kw: 'barcelona,golden,hour' },
    
    // ORRA/social
    { keys: ['orra', 'milestone', 'built', 'community', 'platform'], kw: 'community,celebration,people' },
    
    // Writing/poetry
    { keys: ['poem', 'writing', 'journal', 'letter', 'rewriting'], kw: 'writing,journal,coffee' },
    { keys: ['poetry', 'spoken word'], kw: 'poetry,spoken,word' },
    
    // Beauty/salon
    { keys: ['salon', 'lease', 'signed', 'business', 'own boss'], kw: 'salon,beauty,business' },
  ];
  
  for (const { keys, kw } of mappings) {
    if (keys.some(k => t.includes(k))) return kw;
  }
  
  return 'lifestyle,photography,warm';
}

// Keywords for text-only world posts
function getWorldKeywords(postText) {
  const t = postText.toLowerCase();
  
  const mappings = [
    { keys: ['mental health', 'burnout', 'anxiety', 'depression', 'therapy', 'self-care', 'self care'], kw: 'mental,health,wellness' },
    { keys: ['climate', 'environment', 'planet', 'sustainability', 'eco', 'earth'], kw: 'climate,nature,environment' },
    { keys: ['economy', 'inflation', 'rent', 'cost', 'housing', 'afford'], kw: 'economy,bills,stress' },
    { keys: ['social media', 'instagram', 'tiktok', 'followers', 'likes', 'algorithm', 'doom scroll'], kw: 'social,media,phone' },
    { keys: ['education', 'school', 'student', 'tuition', 'arts education'], kw: 'education,school,learning' },
    { keys: ['race', 'racial', 'black woman', 'identity', 'culture', 'copied'], kw: 'black,culture,identity' },
    { keys: ['beauty standard', 'body', 'ozempic', 'shrinking', 'women'], kw: 'beauty,wellness,woman' },
    { keys: ['gig economy', 'side hustle', 'uber', 'freelance', 'hustle', 'freelancer'], kw: 'freelance,laptop,work' },
    { keys: ['gentrification', 'neighborhood', 'displacement'], kw: 'neighborhood,community,urban' },
    { keys: ['healthcare', 'medical', 'insurance', 'doctor'], kw: 'healthcare,medical,hospital' },
    { keys: ['police', 'justice', 'system', 'reform', 'prison', 'incarceration'], kw: 'justice,courthouse,law' },
    { keys: ['single mom', 'parent', 'mother', 'guilt', 'kids'], kw: 'mother,child,love' },
    { keys: ['food desert', 'hunger', 'nutrition', 'groceries'], kw: 'food,fresh,produce' },
    { keys: ['creative', 'art', 'artist', 'passion', 'illustration'], kw: 'artist,creative,studio' },
    { keys: ['music', 'streaming', 'spotify', 'playlist'], kw: 'music,headphones,listen' },
    { keys: ['rehabilitation', 'second chance', 'recovery'], kw: 'rehabilitation,hope,new' },
    { keys: ['minimum wage', 'labor', 'union', 'worker', 'work'], kw: 'work,labor,people' },
    { keys: ['skate', 'public space', 'parks', 'skate-stopped'], kw: 'skate,park,community' },
    { keys: ['older generation', 'boomer', 'blame'], kw: 'generations,family,talk' },
    { keys: ['content creation', 'creator', 'views', 'viral'], kw: 'content,creator,video' },
    { keys: ['fast fashion', 'sustainable', 'clothing', 'workers'], kw: 'fashion,sustainable,clothing' },
    { keys: ['ai', 'artificial intelligence', 'automation'], kw: 'artificial,intelligence,technology' },
    { keys: ['disability', 'accessible', 'inclusion'], kw: 'inclusion,accessibility,community' },
    { keys: ['immigrant', 'immigration', 'dream'], kw: 'immigrant,hope,dream' },
    { keys: ['addiction', 'recovery', 'sobriety', 'sober'], kw: 'recovery,sunrise,hope' },
    { keys: ['lgbtq', 'pride', 'queer'], kw: 'pride,rainbow,community' },
    { keys: ['student debt', 'loan', 'tuition', 'college'], kw: 'college,graduate,debt' },
    { keys: ['remote work', 'zoom', 'home office'], kw: 'home,office,remote' },
    { keys: ['phone', 'screen time', 'scroll'], kw: 'phone,screen,mindful' },
    { keys: ['friendship', 'friends', 'loneliness', 'connection'], kw: 'friends,connection,together' },
    { keys: ['book', 'reading', 'library'], kw: 'books,reading,library' },
    { keys: ['public transport', 'bus', 'commute'], kw: 'commute,bus,city' },
  ];
  
  for (const { keys, kw } of mappings) {
    if (keys.some(k => t.includes(k))) return kw;
  }
  
  return 'life,people,community';
}

function downloadImage(keywords, outputPath) {
  try {
    // Add a random lock value to get different images for same keywords
    const lock = Math.random().toString(36).substring(2, 8);
    const url = `https://loremflickr.com/800/600/${keywords}?lock=${lock}`;
    execSync(`curl -sL "${url}" -o "${outputPath}"`, { timeout: 30000, stdio: 'pipe' });
    
    // Verify the download was successful and file is a valid JPEG
    if (existsSync(outputPath)) {
      const stat = require('fs').statSync(outputPath);
      if (stat.size > 5000) { // Valid JPEG should be at least 5KB
        return true;
      }
      // Too small, probably an error page - delete it
      try { unlinkSync(outputPath); } catch {}
    }
    return false;
  } catch (e) {
    // Clean up partial file
    try { unlinkSync(outputPath); } catch {}
    return false;
  }
}

async function main() {
  console.log('=== ORRA Image Fix Script ===\n');
  
  const allPosts = await db.post.findMany({
    select: { id: true, text: true, images: true, type: true },
    orderBy: { createdAt: 'desc' }
  });
  
  // Phase 1: Fix posts with duplicate/gradient images
  const dupPosts = allPosts.filter(p => {
    const imgs = JSON.parse(p.images || '[]');
    return imgs.some(img => BAD_IMAGES.has(img.split('/').pop()));
  });
  
  console.log(`Phase 1: Fixing ${dupPosts.length} posts with duplicate/gradient images`);
  
  let success1 = 0, fail1 = 0;
  for (let i = 0; i < dupPosts.length; i++) {
    const post = dupPosts[i];
    const oldImgs = JSON.parse(post.images || '[]');
    const newFilename = `fix-${post.id}.jpg`;
    const outputPath = `${IMG_DIR}/${newFilename}`;
    
    const keywords = getKeywords(post.text, post.id);
    console.log(`[${i+1}/${dupPosts.length}] ${post.id}: "${post.text.substring(0, 45)}..." -> keywords: ${keywords}`);
    
    // Try up to 3 times
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      ok = downloadImage(keywords, outputPath);
      if (!ok && attempt < 3) {
        console.log(`  Retry ${attempt}...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    if (ok) {
      const newImgs = oldImgs.map(img => 
        BAD_IMAGES.has(img.split('/').pop()) ? `/images/posts/${newFilename}` : img
      );
      await db.post.update({
        where: { id: post.id },
        data: { images: JSON.stringify(newImgs) }
      });
      success1++;
      console.log(`  ✓ Saved ${newFilename}`);
    } else {
      fail1++;
      console.log(`  ✗ All attempts failed`);
    }
    
    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\nPhase 1 complete: ${success1} fixed, ${fail1} failed\n`);
  
  // Phase 2: Add images to text-only posts
  const textOnlyPosts = allPosts.filter(p => 
    p.type === 'text' || !JSON.parse(p.images || '[]').length
  );
  
  console.log(`Phase 2: Adding images to ${textOnlyPosts.length} text-only posts`);
  
  let success2 = 0, fail2 = 0;
  for (let i = 0; i < textOnlyPosts.length; i++) {
    const post = textOnlyPosts[i];
    const newFilename = `world-${post.id}.jpg`;
    const outputPath = `${IMG_DIR}/${newFilename}`;
    
    const keywords = getWorldKeywords(post.text);
    console.log(`[${i+1}/${textOnlyPosts.length}] ${post.id}: "${post.text.substring(0, 45)}..." -> keywords: ${keywords}`);
    
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      ok = downloadImage(keywords, outputPath);
      if (!ok && attempt < 3) {
        console.log(`  Retry ${attempt}...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    if (ok) {
      await db.post.update({
        where: { id: post.id },
        data: { 
          images: JSON.stringify([`/images/posts/${newFilename}`]),
          type: 'image'
        }
      });
      success2++;
      console.log(`  ✓ Saved ${newFilename}`);
    } else {
      fail2++;
      console.log(`  ✗ All attempts failed`);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\nPhase 2 complete: ${success2} added, ${fail2} failed`);
  console.log(`\n=== TOTAL: ${success1 + success2} images fixed/added, ${fail1 + fail2} failures ===`);
  
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
