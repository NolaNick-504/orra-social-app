#!/usr/bin/env node
/**
 * ORRA — Generate matching images for bot posts
 * Reads posts that need images, matches them to their specific imagePrompt,
 * generates the image, and updates the post record.
 * 
 * Run: node scripts/generate-post-images.js [--batch 5]
 */
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const uploadDir = '/home/z/my-project/public/uploads';
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch'))?.split('=')[1] || '10', 10);

// Image prompt map from the seeding scripts - maps post text (first 60 chars) to imagePrompt
const PROMPT_MAP = {
  // u32 Zoe Castillo
  "Woke up to roosters and monks chanting at 5am in Chiang Mai": "Golden dawn light over Chiang Mai temple rooftops with mist rising between them, monks in orange robes walking, peaceful Thailand morning, travel photography, warm golden tones",
  "Street food discovery: grilled squid on a stick at the Bangko": "Sizzling grilled squid on wooden sticks at a vibrant Bangkok night market stall, smoke rising, colorful market lights, Thai street food photography, warm amber lighting",
  "Island hopping in the Philippines. El Nido looks like someon": "Turquoise lagoon surrounded by towering limestone karst cliffs in El Nido Philippines, wooden boat in crystal clear water, tropical paradise, aerial drone travel photography",
  "Digital nomad truth: sometimes the wifi is just a guy named ": "Laptop on a bamboo table with ocean view from a tropical beach hut, coconut drink beside it, white sand beach, remote work lifestyle photography, bright natural daylight",
  "Vietnam by motorbike day 7: my butt hurts, my heart is full": "Solo traveler on a motorbike winding through lush Vietnamese rice terraces, mountains in background, adventure travel photography, wide angle scenic view",
  // u33 Dex Murphy
  "Won our CTF qualifier this weekend! 12 hours, 47 challenges": "Computer screen showing terminal with CTF challenge flags captured, green text on black background, energy drinks on desk, dark room with blue LED lighting, hacker workspace photography",
  "New blog post: Why your smart home is a security nightmare.": "Smart home devices on a desk with red warning overlay, cybersecurity concept photography, moody dark background with red accent lighting",
  "DEF CON 2025 was insane. Met the 15-year-old who social-engi": "Crowded hacker convention floor at DEF CON, people with laptops, colorful LED badges, cybersecurity conference photography, energetic atmosphere with dim lighting",
  // u34 Amara Okafor
  "Just showed my new collection at Lagos Fashion Week. Ankara ": "Model walking the runway in African-print modern architectural fashion, bold Ankara fabric structured like brutalist buildings, Lagos Fashion Week runway, dramatic stage lighting",
  "My grandmother taught me to sew on a treadle machine in Enug": "Vintage treadle sewing machine with colorful African fabric draped over it, warm village interior, Nigerian heritage photography, nostalgic warm lighting",
  "New fabric shipment from Accra. Kente cloth that took 3 wea": "Handwoven Kente cloth in vibrant gold, green, and red patterns, displayed on a wooden loom, Ghanaian artisan workshop, textile photography, rich warm natural lighting",
  "Design process: start with the fabric, not the sketch. Let ": "Fashion designer hands working with vibrant African fabric on a cutting table, sketches pinned to mood board above, Lagos design studio, creative workspace photography",
  "Mood board for the next collection: Yoruba mythology meets c": "Fashion mood board with Yoruba art and cyberpunk neon imagery side by side, fabric swatches in bright colors, design studio wall, creative process photography",
  // u35 Sam Nakamura
  "72-hour croissant dough: 27 folds, 3 lamination turns, and": "Hands performing lamination folds on croissant dough, visible butter layers between pastry, flour-dusted wooden board, bakery kitchen, professional pastry photography",
  "New recipe testing: matcha black sesame danish. 4 attempts,": "Beautiful matcha black sesame danish pastry on a ceramic plate, green and black swirl pattern, flaky layers visible, professional food photography",
  "Cookbook update: 80 recipes tested, 65 finalized. The sugar": "Pastry chef holding a mockup cookbook manuscript surrounded by plated desserts and recipe notes, bakery kitchen, warm ambient lighting, creative food photography",
  "Sunday morning kouign-amann. 14 hours from start to finish.": "Golden caramelized kouign-amann pastry with visible sugar crust layers on rustic French baking paper, morning light, artisan bakery photography, warm golden tones",
  "Just taught my first baking workshop. 12 students, 120 crois": "Baking workshop class with students shaping croissants, flour on tables, instructor demonstrating, warm bakery classroom, culinary education photography",
  // u36 Rio Santos
  "Dawn patrol session. Perfect 4-foot swell, offshore wind, an": "Surfer walking toward the ocean at dawn with surfboard under arm, empty beach, pink and orange sunrise over calm Pacific waves, golden hour surf photography",
  "Beach cleanup this morning: 47 pounds of trash in 2 hours. ": "Group of volunteers collecting trash on a sandy beach at low tide, filled bags in foreground, ocean background, community conservation photography, bright morning daylight",
  "Taught a 7-year-old to stand up on her first wave today. He": "Young girl standing up on a surfboard riding a small wave, instructor running alongside in shallow water, joyful expression, surf lesson photography, sunny beach",
  "New wetsuit made from recycled ocean plastics. Finally gear": "Eco-friendly recycled wetsuit displayed on a surfboard at the beach, ocean background, sustainable surf product photography, bright natural daylight",
  "Sunset session with the crew. 6 waves, 1 barrel, and a dolp": "Silhouettes of surfers on waves at sunset, dolphin visible in the wave alongside surfer, orange and purple sky, golden hour surf photography, dramatic backlit scene",
  // u37 Imani Williams
  "Just facilitated my first intergenerational healing circle.": "Intimate circle of Black women of different ages sitting together in a warmly lit room, candles and tissues on a table between them, therapy group photography, warm soft lighting",
  "Therapy is not just for crises. It is for the Tuesday after": "Cozy therapy office with two comfortable chairs, warm light through curtains, plant on windowsill, peaceful counseling room, interior photography, soft diffused natural light",
  // u38 Felix Andersen
  "Just won our second AIA award for the Copenhagen Living Tow": "Modern 14-story mass timber residential tower in Copenhagen with green terraces, sustainable architecture, dramatic architectural photography, overcast Nordic sky",
  "Design with purpose: every material in our new school proje": "Sustainable school building with recycled timber facade, green roof, solar panels, modern eco-architecture photography, bright natural daylight",
  "Sketching at 6am with coffee and silence. This is where the": "Architectural hand sketches on trace paper with coffee cup, drafting tools, morning light on desk, Scandinavian minimalist studio, creative process photography",
  "Visited a building I designed 5 years ago. The tenants turn": "Lush community garden on a green rooftop of a modern sustainable building, residents tending vegetables, Copenhagen skyline, urban green living photography",
  // u39 Lex Rivera
  "Just finished a 14-hour back piece. Japanese koi swimming u": "Intricate Japanese koi tattoo on a back, vibrant orange and blue ink, traditional tattoo style, close-up tattoo photography, studio lighting showing skin detail",
  "Flash day this Saturday! $100 flat rate, first come first s": "Tattoo flash art sheets pinned to a studio wall, traditional and neo-traditional designs, colorful tattoo flash sheets, tattoo studio photography, dramatic wall display lighting",
  "Client brought in their grandmother handwriting for a tattoo": "Tattoo artist hands carefully inking handwriting script on a client arm, close-up of tattoo machine and skin, emotional tattoo session, intimate studio photography",
  "New flash sheet inspired by Day of the Dead and Texas wildf": "Tattoo flash art combining Day of the Dead sugar skull imagery with Texas bluebonnet wildflowers, colorful illustration, tattoo studio wall, creative process photography",
  // u40 Nadia Hassan
  "Just published my investigation into water privatization in": "African women carrying water containers across a dry Sahel landscape, drought conditions, documentary journalism photography, harsh sunlight",
  "Reporting from the ground in Khartoum. Internet is spotty b": "Journalist in press vest taking notes in a Middle Eastern urban conflict zone, damaged buildings in background, documentary war journalism photography, dramatic natural lighting",
  "New podcast episode: The Women Smugglers of the Sinai. They": "Recording studio with microphone and headphones, podcast setup with notes from field reporting, journalism workspace photography, warm intimate lighting",
  // u41 Kai Tan
  "New cocktail on the menu: The Midnight Garden. Gin, butterf": "Deep purple-blue cocktail in a crystal coupe glass with lavender garnish, dark moody bar counter, professional cocktail photography, dramatic backlit bar lighting",
  "Friday night at the speakeasy. The door is unmarked, the co": "Intimate speakeasy bar interior with amber lighting, bartender shaking a cocktail, small tables with candles, jazz trio in corner, moody nightlife photography",
  "Bon Appetit just featured our bar. The cocktail that caught": "Smoked rosemary old fashioned cocktail in a rocks glass with rosemary sprig on fire, wisps of smoke rising, dark walnut bar top, professional cocktail photography",
  "Tasting menu pairing night: 7 courses, 7 cocktails. Each d": "Elegant tasting menu with paired cocktails on a dark restaurant table, multiple courses and drinks in sequence, fine dining cocktail pairing photography",
  // u42 Bella Thompson
  "Just walked for Savage X Fenty. Every body is a runway body": "Curvy model walking a fashion runway in bold lingerie, confident powerful stride, dramatic stage lighting, fashion show photography, audience in background",
  "Every body is a runway body. I do not say this as a motivat": "Plus-size model posing confidently in high fashion editorial outfit, studio lighting, powerful pose, fashion photography, bold confident energy",
  "New campaign shot just dropped. No retouching. No slimming.": "Stunning unretouched fashion campaign photo of a curvy woman in a designer outfit, natural beauty, powerful confident gaze, editorial fashion photography, bright studio lighting",
  // u43 Omar Farouk
  "Just wrapped filming in rural Kenya. The story is about wat": "Documentary filmmaker operating a camera in a rural African village, children gathered around, dry landscape, documentary photography, warm natural light",
  "3 films, 12 countries, infinite stories. My next project is": "Female wildlife ranger standing guard in an African savanna, elephant herd in background, golden hour light, wildlife conservation documentary photography",
  "Editing bay at 2am. Watching footage of a grandmother teach": "Editing bay with video timeline on screen showing documentary footage, coffee cups and hard drives, dark room with screen glow, filmmaking workspace photography",
  // u44 Chloe Park
  "Just shipped our first AR experience for medical training. ": "Person wearing AR headset in a medical training simulation, holographic surgical overlay visible, futuristic medical tech, XR development photography, clean lab lighting",
  "Built a virtual art gallery in 48 hours. Walked through it ": "Virtual reality art gallery with floating digital art pieces, person in VR headset experiencing the space, neon-lit VR environment, XR photography, colorful immersive lighting",
  "Prototyped a haptic feedback glove that lets you feel virtu": "Haptic VR glove prototype on a tech workbench, electronic components visible, XR lab background, tech product photography, dramatic blue-purple lighting",
  // u45 Marcus Hayes
  "State championship game tonight. 15 years coaching and I st": "High school basketball team huddle before a championship game, coach in center with clipboard, gymnasium background, sports photography, dramatic indoor lighting",
  "One of my players just got his first college scholarship of": "High school basketball player signing a letter of intent, coach standing proudly behind him, family watching, gymnasium setting, emotional sports photography",
  "3 state championships in 15 years. But the real stat: 47 o": "Basketball coach standing in an empty gymnasium looking at championship banners on the wall, morning light through gym windows, sports documentary photography",
  // u46 Ava Sterling
  "Plant parent milestone: 200 houseplants and counting. The r": "Lush indoor jungle with hundreds of houseplants on shelves, hanging plants, and window displays, green botanical paradise, botanical photography, bright natural daylight",
  "Your fern is dying because you are loving it wrong. Not too": "Overwatered fern with yellowing fronds next to a properly cared for fern, comparison plant care, botanical photography, soft natural daylight, educational style",
  "Rare Monstera Thai Constellation just unfurled a new leaf.": "Rare Monstera Thai Constellation with stunning white variegation on a new leaf, close-up botanical photography, soft diffused natural light, plant collector aesthetic",
  "Greenhouse tour this weekend! Come see 200+ plants and lear": "Beautiful home greenhouse filled with lush tropical plants, person tending plants inside, botanical lifestyle photography, warm filtered sunlight through glass",
  "Repotting day. There is something meditative about getting ": "Hands repotting a plant with fresh soil on a potting bench, gardening tools, warm greenhouse light, botanical hobby photography, earthy natural tones",
};

function findPromptForPost(text) {
  const prefix = text.substring(0, 60);
  // Exact match first
  if (PROMPT_MAP[prefix]) return PROMPT_MAP[prefix];
  // Fuzzy match - try shorter prefixes
  for (let len = 50; len >= 20; len -= 5) {
    const shortPrefix = text.substring(0, len);
    for (const [key, val] of Object.entries(PROMPT_MAP)) {
      if (key.startsWith(shortPrefix) || shortPrefix.startsWith(key)) return val;
    }
  }
  // Last resort: generate a basic prompt from the text
  return text.substring(0, 150) + ", social media post photo, professional photography";
}

async function main() {
  console.log('📸 ORRA — Generate matching images for bot posts');
  console.log('==================================================\n');

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // Find posts that need images
  const postsNeedingImages = await prisma.post.findMany({
    where: {
      authorId: { in: ['u32','u33','u34','u35','u36','u37','u38','u39','u40','u41','u42','u43','u44','u45','u46'] },
      type: 'image',
      images: '[]'
    },
    select: { id: true, text: true, authorId: true },
    take: BATCH_SIZE,
  });

  console.log(`Found ${postsNeedingImages.length} posts needing images (batch: ${BATCH_SIZE})\n`);

  let generated = 0;
  let failed = 0;

  for (const post of postsNeedingImages) {
    const prompt = findPromptForPost(post.text);
    const imageFilename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    const imagePath = path.join(uploadDir, imageFilename);

    console.log(`Generating for ${post.authorId}: "${post.text.substring(0, 45)}..."`);
    console.log(`  Prompt: "${prompt.substring(0, 80)}..."`);

    try {
      execSync(`z-ai-generate -p ${JSON.stringify(prompt)} -o "${imagePath}" -s 1344x768`, {
        timeout: 60000,
        stdio: 'pipe'
      });

      if (fs.existsSync(imagePath)) {
        const imageUrl = `/uploads/${imageFilename}`;
        await prisma.post.update({
          where: { id: post.id },
          data: { images: JSON.stringify([imageUrl]) }
        });
        generated++;
        console.log(`  ✅ Generated and saved: ${imageUrl}`);
      } else {
        failed++;
        console.log(`  ⚠️ Image file not created`);
      }
    } catch (e) {
      failed++;
      console.log(`  ❌ Failed: ${e.message?.substring(0, 80)}`);
    }

    // Small delay to avoid overloading
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n==================================================`);
  console.log(`✅ Image generation complete!`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Remaining: ${await prisma.post.count({
    where: {
      authorId: { in: ['u32','u33','u34','u35','u36','u37','u38','u39','u40','u41','u42','u43','u44','u45','u46'] },
      type: 'image',
      images: '[]'
    }
  })} posts still need images`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
