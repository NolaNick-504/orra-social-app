#!/usr/bin/env node
/**
 * ORRA Generate Matched Images — For each image-type post without an image,
 * generate an AI image that matches the post text, then add comments and reactions.
 *
 * Usage:
 *   node scripts/generate-matched-images.js
 *   node scripts/generate-matched-images.js --batch-size 3   # Parallel images (default 3)
 *   node scripts/generate-matched-images.js --max-posts 50   # Only process 50 posts
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads');
const STANDALONE_UPLOAD_DIR = path.join(PROJECT_ROOT, '.next', 'standalone', 'public', 'uploads');
const IMAGE_SIZE = '1344x768';
const BATCH_SIZE = parseInt(process.argv.includes('--batch-size') ? process.argv[process.argv.indexOf('--batch-size') + 1] : '3', 10);
const MAX_POSTS = process.argv.includes('--max-posts') ? parseInt(process.argv[process.argv.indexOf('--max-posts') + 1], 10) : Infinity;

// ─── Image prompt mapping based on post text content ──────────────────
const TEXT_TO_PROMPT_MAP = [
  // Food
  { keywords: ['from scratch', 'food spam', 'best thing i\'ve eaten'], prompt: 'A steaming bowl of homemade ramen with soft boiled egg, chashu pork, nori, and green onions, top-down view, warm lighting, food photography, high quality' },
  { keywords: ['brunch', 'coming over', 'whole crew'], prompt: 'A beautiful brunch spread with pancakes, fresh berries, avocado toast, and orange juice on a white table, morning sunlight, food photography' },
  { keywords: ['pasta', 'late night cooking', '2 hours'], prompt: 'A plate of homemade pasta with rich tomato sauce, fresh basil, and parmesan cheese, candlelight dinner setting, cozy atmosphere, food photography' },
  { keywords: ['abuela', 'secret recipe', 'taco'], prompt: 'Fresh homemade tacos with cilantro, lime, and salsa on a colorful ceramic plate, Mexican restaurant setting, vibrant colors, food photography' },
  { keywords: ['coffee art', 'go-to order', 'latte'], prompt: 'A beautiful latte art heart in a ceramic cup on a wooden table, coffee shop atmosphere, warm tones, professional photography' },
  { keywords: ['recipe drop', 'weeknight dinner', '20-minute'], prompt: 'A colorful healthy meal prep bowl with grilled chicken, quinoa, roasted vegetables, and avocado, meal prep photography, bright lighting' },
  { keywords: ['meal prep', 'sunday', 'trying something new'], prompt: 'Multiple meal prep containers lined up with different colorful meals, organized kitchen counter, food photography, bright natural light' },
  { keywords: ['hidden gem', 'restaurant', 'secret'], prompt: 'A cozy hidden restaurant entrance with warm string lights, brick wall, small tables with candles, intimate dining atmosphere, restaurant photography' },
  { keywords: ['dessert', '4 hours', 'disappear'], prompt: 'A chocolate lava cake with molten center flowing out, vanilla ice cream on the side, dark moody lighting, dessert food photography' },
  { keywords: ['baking', 'kitchen smells', 'sunday'], prompt: 'Golden flaky croissants fresh from the oven on a baking sheet, flour dusted kitchen counter, warm morning light, baking food photography' },
  { keywords: ['sushi', 'rolled', 'first try'], prompt: 'A plate of homemade sushi rolls with salmon, avocado, and cucumber, chopsticks, soy sauce, professional food photography' },
  { keywords: ['pancake', 'stack', 'morning'], prompt: 'Tall stack of fluffy pancakes with maple syrup dripping down, fresh blueberries and butter on top, morning light, food photography' },
  { keywords: ['smoothie bowl', 'rainbow', 'acai'], prompt: 'A colorful acai smoothie bowl topped with granola, fresh berries, banana slices, and coconut flakes, food photography, bright lighting' },
  { keywords: ['bbq', 'ribs', '8 hours'], prompt: 'Smoky BBQ ribs on a grill with glaze dripping, outdoor cooking setting, summer afternoon, food photography' },
  { keywords: ['pizza', 'best spot', 'heaven'], prompt: 'A wood-fired pizza with bubbling cheese, fresh basil, and tomato sauce, rustic Italian restaurant setting, close-up food photography' },
  { keywords: ['croissant', 'baking therapy'], prompt: 'Golden flaky croissants fresh from the oven on a baking sheet, flour dusted kitchen counter, warm morning light, food photography' },
  { keywords: ['matcha', 'latte'], prompt: 'A vibrant green matcha latte in a clear glass with oat milk swirl, minimal cafe setting, food photography' },
  { keywords: ['dumpling', 'first time'], prompt: 'Homemade dumplings steaming in a bamboo basket, various shapes and folds, kitchen setting, food photography' },
  { keywords: ['chocolate lava', 'cake'], prompt: 'A chocolate lava cake with molten center flowing out, vanilla ice cream on the side, dark moody lighting, dessert food photography' },
  { keywords: ['mango sticky rice', 'night market'], prompt: 'Mango sticky rice with coconut milk drizzle on a banana leaf, Thai night market setting, food photography' },
  { keywords: ['cook', 'recipe', 'food', 'eat', 'hungry', 'meal', 'dinner', 'lunch', 'breakfast'], prompt: 'A beautifully plated homemade dish on a rustic wooden table, warm lighting, food photography, shallow depth of field, vibrant colors' },

  // Travel & Nature
  { keywords: ['golden hour', 'hike', '6am'], prompt: 'A breathtaking mountain viewpoint at golden hour with rolling hills, mist, and warm sunset colors, landscape photography, cinematic' },
  { keywords: ['hidden beach', 'not telling', 'tropical'], prompt: 'A hidden tropical beach with crystal clear turquoise water, white sand, palm trees, and no people, paradise, aerial view, travel photography' },
  { keywords: ['city lights', '2am', 'night owl'], prompt: 'A stunning nighttime cityscape with illuminated skyscrapers, neon lights reflecting in water, cyberpunk atmosphere, long exposure photography' },
  { keywords: ['sunset', 'stopped me', 'nature stays winning'], prompt: 'An incredible sunset with dramatic orange and purple clouds over a calm lake, silhouette of trees, professional landscape photography' },
  { keywords: ['street art', 'berlin', 'gallery'], prompt: 'Colorful street art and graffiti on a brick wall in an urban alley, vibrant colors, artistic, city culture photography' },
  { keywords: ['woke up to this view', 'life choices', 'living here'], prompt: 'A stunning mountain cabin view with misty valleys and pine trees at sunrise, breathtaking landscape, travel photography, golden light' },
  { keywords: ['mountain trail', 'views at the top', 'struggle'], prompt: 'A hiker standing on a mountain peak above the clouds, dramatic landscape, sunrise, adventure photography' },
  { keywords: ['café aesthetic', 'working remotely', 'paradise'], prompt: 'A beautiful aesthetic cafe interior with plants, wooden furniture, laptop on table with coffee, warm lighting, remote work lifestyle photography' },
  { keywords: ['road trip', 'views keep getting'], prompt: 'A scenic desert highway stretching to the horizon with mesas and big sky, road trip photography, golden hour' },
  { keywords: ['cherry blossom', 'spring', 'japan'], prompt: 'Cherry blossom trees in full bloom lining a path in a Japanese garden, pink petals falling, serene atmosphere, travel photography' },
  { keywords: ['temple', 'ancient', '1000 years'], prompt: 'An ancient stone temple with intricate carvings, overgrown with moss, jungle setting, dramatic lighting, travel photography' },
  { keywords: ['northern lights', 'aurora', 'bucket list'], prompt: 'Vibrant green and purple aurora borealis over a snow-covered landscape, night sky full of stars, landscape photography' },
  { keywords: ['santorini', 'sunset'], prompt: 'White-washed buildings with blue domes in Santorini Greece at sunset, Mediterranean sea, travel photography, warm golden light' },
  { keywords: ['hot air balloon', 'cappadocia', 'sunrise'], prompt: 'Colorful hot air balloons floating over Cappadocia fairy chimneys at sunrise, dozens of balloons, landscape photography' },
  { keywords: ['rain', 'city', 'reflections'], prompt: 'Rainy city street at night with neon reflections in puddles, people with umbrellas, cinematic urban photography' },
  { keywords: ['waterfall', 'hidden', 'mosquito'], prompt: 'A secluded waterfall in a lush tropical forest, moss-covered rocks, mist, nature photography' },
  { keywords: ['desert', 'sunrise', 'silence'], prompt: 'Desert landscape at sunrise with sand dunes and warm orange light, vast empty horizon, landscape photography' },
  { keywords: ['travel', 'view', 'landscape', 'beach', 'mountain'], prompt: 'A breathtaking travel destination view with stunning natural scenery, golden hour lighting, professional travel photography' },

  // Fashion
  { keywords: ['fit check', '3 stores', '47 changing'], prompt: 'A stylish streetwear outfit displayed on a mannequin or flat lay, trendy sneakers, oversized hoodie, accessories, fashion photography, clean background' },
  { keywords: ['outfit just works', 'mirror'], prompt: 'A stylish fashion flat lay with designer sunglasses, watch, sneakers, and accessories on a marble surface, luxury aesthetic, fashion photography' },
  { keywords: ['thrift store', 'vintage jacket', '$8', 'steal'], prompt: 'A cool vintage denim jacket with patches and pins on a brick wall background, thrift store aesthetic, casual fashion photography' },
  { keywords: ['ootd', 'effortless', 'simplest looks'], prompt: 'A minimalist outfit flat lay with white tee, denim, and clean sneakers on a neutral background, effortless style, fashion photography' },
  { keywords: ['season transition', 'layers', 'wardrobe'], prompt: 'A curated fall wardrobe with layered outfits, cozy sweaters, jackets, and scarves on hangers, autumn fashion photography, warm tones' },
  { keywords: ['styled this', '5 ways', 'versatility'], prompt: 'Five different outfit stylings of the same piece displayed side by side, fashion editorial, clean white background, style guide photography' },
  { keywords: ['sneaker', 'collection', 'copped'], prompt: 'A pair of limited edition sneakers in a display box, clean white background, sneakerhead collection photography' },
  { keywords: ['fashion', 'outfit', 'style', 'wardrobe', 'fit'], prompt: 'A stylish fashion flat lay with trendy clothing and accessories, clean aesthetic, fashion editorial photography' },

  // Fitness & Sports
  { keywords: ['post-workout', 'glow', '6 months', 'consistency'], prompt: 'A modern gym interior with weights and equipment, morning light streaming through windows, motivational atmosphere, fitness photography' },
  { keywords: ['basketball', 'pickup game', 'game winner'], prompt: 'An outdoor basketball court at sunset with a ball near the hoop, urban setting, golden light, sports photography' },
  { keywords: ['new pr', 'grind', 'paying off'], prompt: 'A barbell with weight plates on a gym floor, dramatic lighting, motivational fitness photography, power and strength aesthetic' },
  { keywords: ['morning run', 'early sessions', 'favorite part'], prompt: 'A jogging path through an autumn park with golden and red leaves, morning mist, nature and fitness photography, peaceful atmosphere' },
  { keywords: ['game day', 'ready', 'today brings'], prompt: 'A sports jersey hanging in a locker room, athletic gear and shoes nearby, dramatic lighting, game day atmosphere, sports photography' },
  { keywords: ['yoga', 'sunrise', 'peace'], prompt: 'A person practicing yoga on a mat at sunrise on a wooden deck overlooking mountains, peaceful atmosphere, wellness photography' },
  { keywords: ['marathon', 'training', 'finish line'], prompt: 'Running shoes on a trail at dawn, misty morning, determination, sports photography, cinematic' },
  { keywords: ['swimming', 'laps', 'wakes up'], prompt: 'An infinity pool with calm blue water at dawn, lane lines visible, resort or athletic club setting, sports photography' },
  { keywords: ['rock climbing', 'v6', 'sends'], prompt: 'A rock climber on an indoor climbing wall reaching for the next hold, dramatic angle, sports photography' },
  { keywords: ['boxing', 'kicked my butt', 'fights'], prompt: 'Boxing gloves hanging on a heavy bag in a boxing gym, dramatic lighting, sweat and determination, sports photography' },
  { keywords: ['surf', 'waves', 'session'], prompt: 'A surfer carrying a surfboard walking toward the ocean at sunrise, peaceful beach, sports lifestyle photography' },
  { keywords: ['cycling', '50 miles', 'sunday'], prompt: 'A road cyclist on a scenic mountain road, dramatic landscape, cycling photography, motion blur' },
  { keywords: ['gym', 'workout', 'fitness', 'exercise', 'training'], prompt: 'A modern gym interior with equipment, motivational atmosphere, dramatic lighting, fitness photography' },

  // Pets
  { keywords: ['cat', 'funniest thing', 'camera'], prompt: 'A cute cat looking surprised with wide eyes, funny expression, soft lighting, pet photography' },
  { keywords: ['good boy', 'morning walk', 'hiking buddy'], prompt: 'A happy dog sitting on a hiking trail in a forest, tongue out, beautiful nature background, golden hour lighting, pet photography' },
  { keywords: ['adopted', 'little one', 'heart is full'], prompt: 'An adorable rescue puppy looking at camera with big eyes, soft blanket, warm lighting, pet adoption photography' },
  { keywords: ['parrot', 'inappropriate'], prompt: 'A colorful parrot on a perch looking mischievous, vibrant feathers, pet photography' },
  { keywords: ['cardboard box', 'cat vs'], prompt: 'A cat squeezed into a small cardboard box looking content, funny pet photography, home setting' },
  { keywords: ['kitten', 'that person', 'cat pics'], prompt: 'A tiny kitten sleeping curled up in a ball, soft pastel blanket, dreamy lighting, pet photography' },
  { keywords: ['dog park', '4 new friends'], prompt: 'Dogs playing and running at a dog park, happy and energetic, sunny day, pet photography' },
  { keywords: ['turtle', 'chill'], prompt: 'A small turtle on a rock by a pond, serene nature setting, macro pet photography' },
  { keywords: ['fish tank', 'aquarium', 'ecosystem'], prompt: 'A beautiful planted aquarium with colorful tropical fish, aquascaping, nature aquarium photography' },
  { keywords: ['bunny', 'cuddles', 'rainy day'], prompt: 'A fluffy rabbit being petted, soft indoor lighting, cozy atmosphere, pet photography' },
  { keywords: ['dog', 'stole my spot', 'couch', 'audacity'], prompt: 'A dog lying comfortably on couch cushions looking smug, cozy living room, funny pet photography, warm indoor lighting' },
  { keywords: ['plant parent', 'alive and thriving', 'personal growth'], prompt: 'A collection of healthy indoor plants on a windowsill with natural sunlight, green leaves, cozy apartment setting, plant parent photography' },

  // Art & Creative
  { keywords: ['12 hours', 'painting', 'is it done'], prompt: 'An abstract colorful painting on canvas with vibrant acrylic paints, splatter technique, art studio setting, creative atmosphere' },
  { keywords: ['digital art', 'layers', 'blank canvas'], prompt: 'A stunning digital art piece showing a futuristic cyberpunk cityscape with neon lights, holographic elements, digital art style' },
  { keywords: ['mural', 'in progress', 'community'], prompt: 'A colorful street art mural being painted on a large wall, spray paint cans, artistic process, urban art photography' },
  { keywords: ['sketchbook', 'creativity flows', 'flow day'], prompt: 'An open sketchbook filled with pencil sketches and ink drawings on a wooden desk, art supplies scattered around, creative workspace, natural light' },
  { keywords: ['pottery', 'class', 'harder than'], prompt: 'A handmade ceramic bowl on a potters wheel, clay covered hands, pottery studio, craft photography' },
  { keywords: ['watercolor', 'experiment', 'mistakes'], prompt: 'A delicate watercolor painting of flowers with soft bleeding colors, art supplies nearby, art studio, natural light' },
  { keywords: ['calligraphy', 'practice', 'patience'], prompt: 'Beautiful hand lettering and calligraphy on thick paper, ink and pen, art desk, close-up photography' },
  { keywords: ['sculpture', 'clay figure', 'soul'], prompt: 'A detailed clay sculpture on a pedestal, art studio with dramatic lighting, fine art photography' },
  { keywords: ['oil painting', 'turpentine', 'in the zone'], prompt: 'An oil painting on an easel with rich colors, paint palette with mixed colors, art studio, warm lighting' },

  // Tech & Gaming
  { keywords: ['setup', 'complete', '3 months', 'saving'], prompt: 'A clean gaming setup with RGB lighting, dual monitors, mechanical keyboard, and gaming chair, desk setup photography, cyberpunk aesthetic' },
  { keywords: ['retro gaming', 'original console', 'hit different'], prompt: 'A retro gaming setup with an old CRT TV, vintage game controllers, and classic game cartridges, nostalgic atmosphere, warm lighting' },
  { keywords: ['mechanical keyboard', 'click-clack', 'built'], prompt: 'A custom mechanical keyboard with colorful keycaps on a desk, close-up photography, tech aesthetic' },
  { keywords: ['coding', '3am', 'bug', 'coffee count'], prompt: 'A laptop screen showing code in a dark room with blue light, coffee cup nearby, programmer aesthetic, moody lighting' },
  { keywords: ['vr', 'virtual reality', 'forgot what year'], prompt: 'A person wearing a VR headset in a modern room with colorful lights, virtual reality experience, tech photography' },
  { keywords: ['headphones', 'noise cancelling'], prompt: 'Premium over-ear headphones on a desk, sleek design, tech product photography, dark background' },
  { keywords: ['3d printing', 'desk accessories', 'diy'], prompt: 'A 3D printer creating a small object, tech workspace, maker culture, photography' },
  { keywords: ['smart home', 'control', 'phone'], prompt: 'A smart home control panel and devices, modern living room, tech lifestyle photography' },
  { keywords: ['monitor', 'productivity', 'superpowers'], prompt: 'An ultrawide monitor displaying multiple windows, clean desk setup, productivity workspace, tech photography' },

  // Music
  { keywords: ['studio session', 'track', 'banger'], prompt: 'A music production studio with mixing board, studio monitors, and ambient purple lighting, professional recording studio, moody atmosphere' },
  { keywords: ['vinyl', 'collection', 'first press', 'flea market'], prompt: 'A collection of vinyl records displayed on a wooden shelf, warm vintage lighting, record player nearby, music lover aesthetic' },
  { keywords: ['guitar', 'solo', '200 attempts'], prompt: 'An electric guitar on a stand with amplifier, practice room, dramatic lighting, music photography' },
  { keywords: ['concert', 'life changing', 'ears ringing'], prompt: 'A live concert with stage lights and crowd, energetic atmosphere, music event photography' },
  { keywords: ['beats', '2am', 'inspiration'], prompt: 'Music production software on a laptop screen with MIDI controller, late night creative session, moody blue lighting' },
  { keywords: ['piano', 'morning', 'magical'], prompt: 'A grand piano in a room with morning light streaming through windows, elegant setting, music photography' },
  { keywords: ['ep', 'dropped', 'two years'], prompt: 'Album artwork displayed on a phone screen with streaming app, music release celebration, modern aesthetic' },
  { keywords: ['drum', 'beach', 'community'], prompt: 'A group drum circle on a beach at sunset, people playing djembe drums, community and music, warm lighting' },
  { keywords: ['record store', 'digging', 'gems'], prompt: 'Rows of vinyl records in a record store, browsing through crates, music store atmosphere, photography' },
  { keywords: ['saxophone', 'street corner', '$47'], prompt: 'A saxophone player performing on a city street at dusk, passersby, urban music scene, street photography' },

  // General fallbacks
  { keywords: ['vibes', 'chill', 'mood'], prompt: 'A cozy aesthetic lifestyle scene with warm lighting, relaxed atmosphere, lifestyle photography' },
  { keywords: ['grind', 'hustle', 'work'], prompt: 'A focused workspace with laptop and coffee, productive atmosphere, lifestyle photography, natural lighting' },
];

/**
 * Find the best matching image prompt for a given post text
 */
function findMatchingPrompt(postText) {
  const lowerText = postText.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const mapping of TEXT_TO_PROMPT_MAP) {
    let score = 0;
    for (const keyword of mapping.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keyword matches = better score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping;
    }
  }

  return bestMatch ? bestMatch.prompt : 'A beautiful lifestyle photograph, warm lighting, professional quality, social media aesthetic';
}

/**
 * Generate a single AI image (async with spawn)
 */
function generateImage(prompt, outputPath) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve(false);
    }, 60000);

    const proc = spawn('z-ai-generate', [
      '-p', prompt.substring(0, 300),
      '-o', outputPath,
      '-s', IMAGE_SIZE
    ], { stdio: 'pipe' });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(true);
      } else {
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
        resolve(false);
      }
    });

    proc.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

/**
 * Copy file to both upload directories
 */
function copyToBothDirs(srcFile, filename) {
  for (const dir of [UPLOAD_DIR, STANDALONE_UPLOAD_DIR]) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(srcFile, path.join(dir, filename));
    } catch {}
  }
}

// ─── Comment templates by topic ──────────────────────────────────────
const COMMENT_TEMPLATES = {
  food: [
    "That looks absolutely incredible! Need the recipe ASAP",
    "My stomach just growled looking at this",
    "Okay you NEED to open a restaurant",
    "The plating is chef's kiss",
    "Save me a plate! I'm on my way",
    "This is the content I'm here for",
    "Recipe when?? I need this in my life",
    "This looks incredible, drop the recipe!",
    "My mouth is literally watering right now",
  ],
  travel: [
    "Adding this to my bucket list right now",
    "The colors in this are unreal",
    "Take me there! Living vicariously through your posts",
    "This is straight out of a movie",
    "How do you find these places?!",
    "Okay I'm booking flights right now",
  ],
  fashion: [
    "The vibes are immaculate",
    "Need links immediately",
    "Style icon behavior",
    "This whole look is everything",
    "Where did you get that?!",
    "You always come through with the fits",
  ],
  fitness: [
    "Dedication is inspiring! Keep going",
    "Goals right there",
    "The consistency is showing! Proud of you",
    "What's your routine? Need to step up my game",
    "Beast mode activated",
    "This motivated me to get off the couch",
  ],
  pets: [
    "I'm obsessed. Need 100 more pics",
    "THE CUTEST THING I'VE SEEN ALL DAY",
    "My heart just exploded",
    "Tell them I love them",
    "This should be illegal levels of cute",
    "Pet tax: accepted",
  ],
  art: [
    "The talent is unreal. How long did this take?",
    "This belongs in a museum",
    "Your creativity inspires me so much",
    "The colors are giving me life",
    "I need prints of this immediately",
    "Okay you're literally a genius",
  ],
  tech: [
    "My wallet is crying but my setup would be too",
    "RGB everything! Love the setup",
    "The cable management alone deserves an award",
    "What monitor is that? Looks incredible",
    "Dream setup right there",
    "This is peak productivity vibes",
  ],
  music: [
    "The taste! Drop the playlist link",
    "Need that vinyl in my collection",
    "Music is the universal language fr",
    "When's the album dropping??",
    "This gives me chills every time",
    "The dedication is real. Keep creating",
  ],
  general: [
    "This is so real!",
    "Can't stop thinking about this",
    "You always post the best stuff",
    "Needed to hear this today",
    "This hit different",
    "You just spoke my whole mind",
    "Facts on facts on facts",
    "This is exactly what I needed to see rn",
    "Reading this at the perfect time",
    "This is why I follow you",
    "I felt this in my soul",
    "Big mood",
    "This is the energy I needed today",
    "Say it louder for the people in the back",
    "Valid. So valid.",
  ],
};

const REACTION_TYPES = ['like', 'like', 'like', 'like', 'wow', 'omg', 'laughing', 'care'];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getCommentCategory(text) {
  const lower = text.toLowerCase();
  if (/food|cook|recipe|brunch|coffee|sushi|bbq|baking|dumpling|smoothie|matcha|chocolate|mango|pancake|croissant|pasta|taco|eat|meal|dinner|lunch|breakfast|restaurant/.test(lower)) return 'food';
  if (/beach|mountain|city|sunset|street art|road|cherry|temple|aurora|santorini|balloon|rain|hiker|waterfall|desert|travel|view|hike|landscape/.test(lower)) return 'travel';
  if (/fashion|outfit|style|wardrobe|fit|sneaker|vintage|thrift|ootd/.test(lower)) return 'fashion';
  if (/gym|basketball|workout|running|swimming|climbing|boxing|surf|cycling|marathon|yoga|fitness|exercise|training|pr/.test(lower)) return 'fitness';
  if (/cat|dog|puppy|parrot|kitten|turtle|aquarium|bunny|pet|plant parent/.test(lower)) return 'pets';
  if (/painting|art|mural|pottery|watercolor|calligraphy|sculpture|sketchbook|digital art|oil painting/.test(lower)) return 'art';
  if (/gaming|keyboard|coding|vr|headphones|3d print|smart home|monitor|setup|tech/.test(lower)) return 'tech';
  if (/studio|vinyl|guitar|concert|beats|piano|album|drum|record|saxophone|music|track/.test(lower)) return 'music';
  return 'general';
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  ORRA Generate Matched Images + Engagement   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();
  console.log(`Batch size: ${BATCH_SIZE} parallel image generations`);

  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();

  // Ensure upload dirs exist
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(STANDALONE_UPLOAD_DIR)) fs.mkdirSync(STANDALONE_UPLOAD_DIR, { recursive: true });

  // Get all posts without images that should be image posts
  const allPosts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: MAX_POSTS,
  });

  const postsNeedingImages = allPosts.filter(p => {
    const images = JSON.parse(p.images || '[]');
    return images.length === 0;
  });

  console.log(`Total posts: ${allPosts.length}`);
  console.log(`Posts needing images: ${postsNeedingImages.length}`);
  console.log();

  // Phase 1: Generate matching images in batches
  let generated = 0;
  let failed = 0;

  for (let i = 0; i < postsNeedingImages.length; i += BATCH_SIZE) {
    const batch = postsNeedingImages.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(batch.map(async (post, idx) => {
      const globalIdx = i + idx + 1;
      const prompt = findMatchingPrompt(post.text);
      const imageFilename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
      const imagePath = path.join(UPLOAD_DIR, imageFilename);

      console.log(`  [${globalIdx}/${postsNeedingImages.length}] Post: "${post.text.substring(0, 50)}..."`);
      console.log(`    Prompt: "${prompt.substring(0, 60)}..."`);

      const success = await generateImage(prompt, imagePath);
      if (success) {
        copyToBothDirs(imagePath, imageFilename);
        const imageUrl = `/uploads/${imageFilename}`;
        await db.post.update({
          where: { id: post.id },
          data: { images: JSON.stringify([imageUrl]), type: 'image' },
        });
        console.log(`    ✓ Image generated and linked`);
        return true;
      } else {
        console.log(`    ✗ Image generation failed`);
        return false;
      }
    }));

    for (const r of results) {
      if (r) generated++;
      else failed++;
    }
  }

  console.log(`\n  ✓ Images generated: ${generated}, Failed: ${failed}`);

  // Phase 2: Add contextual comments to all posts
  console.log('\n[Phase 2] Adding contextual comments...');
  const allPostsUpdated = await db.post.findMany({ orderBy: { createdAt: 'desc' } });
  const botUsers = await db.user.findMany({ where: { id: { startsWith: 'u' } }, select: { id: true } });
  const botIds = botUsers.map(u => u.id);

  let totalComments = 0;
  for (const post of allPostsUpdated) {
    const category = getCommentCategory(post.text);
    const commentPool = COMMENT_TEMPLATES[category] || COMMENT_TEMPLATES.general;
    const numComments = randomInt(2, 6);
    const shuffledBots = [...botIds].sort(() => Math.random() - 0.5);

    for (let j = 0; j < numComments && j < shuffledBots.length; j++) {
      if (shuffledBots[j] === post.authorId) continue;
      try {
        const postTime = new Date(post.createdAt).getTime();
        const now = Date.now();
        const commentTime = new Date(postTime + Math.random() * (now - postTime));

        await db.comment.create({
          data: {
            text: randomItem(commentPool),
            postId: post.id,
            authorId: shuffledBots[j],
            createdAt: commentTime,
          },
        });
        totalComments++;
      } catch {}
    }
  }
  console.log(`  ✓ Created ${totalComments} contextual comments`);

  // Phase 3: Add random likes/reactions
  console.log('\n[Phase 3] Adding reactions...');
  let totalReactions = 0;
  for (const post of allPostsUpdated) {
    const numReactions = randomInt(3, 12);
    const shuffledBots = [...botIds].sort(() => Math.random() - 0.5);

    for (let j = 0; j < numReactions && j < shuffledBots.length; j++) {
      if (shuffledBots[j] === post.authorId) continue;
      try {
        await db.like.create({
          data: {
            userId: shuffledBots[j],
            targetId: post.id,
            targetType: 'post',
            reactionType: randomItem(REACTION_TYPES),
          },
        });
        totalReactions++;
      } catch {}
    }
  }
  console.log(`  ✓ Created ${totalReactions} reactions`);

  // Phase 4: Update post counts
  console.log('\n[Phase 4] Updating post counts...');
  for (const post of allPostsUpdated) {
    try {
      const [actualLikes, actualComments] = await Promise.all([
        db.like.count({ where: { targetId: post.id, targetType: 'post' } }),
        db.comment.count({ where: { postId: post.id } }),
      ]);
      await db.post.update({
        where: { id: post.id },
        data: {
          likesCount: actualLikes + randomInt(5, 50),
          commentsCount: actualComments,
        },
      });
    } catch {}
  }
  console.log('  ✓ Counts updated');

  // Final stats
  const finalStats = await Promise.all([
    db.post.count(),
    db.post.count({ where: { type: 'image' } }),
    db.comment.count(),
    db.like.count(),
  ]);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║            COMPLETE ✓                        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Total Posts:  ${String(finalStats[0]).padEnd(29)}║`);
  console.log(`║  With Images:  ${String(finalStats[1]).padEnd(29)}║`);
  console.log(`║  Comments:     ${String(finalStats[2]).padEnd(29)}║`);
  console.log(`║  Reactions:    ${String(finalStats[3]).padEnd(29)}║`);
  console.log('╚══════════════════════════════════════════════╝');

  await db.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
