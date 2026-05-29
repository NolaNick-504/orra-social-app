const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Map each post ID to an appropriate Unsplash photo that matches the content
// Using Unsplash's free photo IDs - these are real, high-quality, free-to-use photos
const imageMap = {
  // === No-image posts (26) ===
  'p20c': { url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80', filename: 'tax-accountant-late.jpg' }, // person working late at desk with papers
  'p25b': { url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80', filename: 'awkward-moment-funny.jpg' }, // people laughing
  'psummer25': { url: 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=800&q=80', filename: 'ice-cream-truck-summer.jpg' }, // ice cream truck summer
  'p11b': { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', filename: 'dishwasher-kitchen-proud.jpg' }, // kitchen repair
  'p18a': { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80', filename: 'poet-writing-journal.jpg' }, // writing in journal coffee
  'p03c': { url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', filename: 'ai-music-laptop.jpg' }, // AI music generation
  'psummer22': { url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', filename: 'nurse-sick-home.jpg' }, // sick at home
  'p15c': { url: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&q=80', filename: 'dance-app-phone.jpg' }, // phone screen excited
  'p14b': { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', filename: 'gaming-dual-monitors.jpg' }, // gaming dual monitors
  'psummer07': { url: 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=800&q=80', filename: 'summer-stoop-night.jpg' }, // summer night hangout
  'p18d': { url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80', filename: 'summer-fan-writing.jpg' }, // fan writing
  'psummer32': { url: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80', filename: 'summer-thunderstorm.jpg' }, // thunderstorm
  'psummer31': { url: 'https://images.unsplash.com/photo-1508161915440-7c6c8b7ed6e0?w=800&q=80', filename: 'sleeping-no-alarm.jpg' }, // sleeping peacefully
  'p0founder': { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', filename: 'orra-launch-celebration.jpg' }, // team celebration launch
  'p25d': { url: 'https://images.unsplash.com/photo-1631567091196-48aa7bad9de5?w=800&q=80', filename: 'ac-relief-cool.jpg' }, // AC relief
  'p01f': { url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', filename: 'popsicles-children-hospital.jpg' }, // kids popsicles happy
  'p04c': { url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80', filename: 'choreography-notes.jpg' }, // dance choreography
  'psummer17': { url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', filename: 'summer-warehouse-job.jpg' }, // warehouse work
  'p07a': { url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80', filename: 'wifi-disconnect-gaming.jpg' }, // frustrated gamer
  'psummer11': { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', filename: 'broken-ac-hot.jpg' }, // hot room fan
  'p25c': { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', filename: 'teacher-student-moment.jpg' }, // teacher student
  'psummer39': { url: 'https://images.unsplash.com/photo-1596460107916-430662021049?w=800&q=80', filename: 'heat-wave-indoor.jpg' }, // hot day indoors
  'psummer28': { url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80', filename: 'waffle-house-late.jpg' }, // late night diner food
  'psummer12': { url: 'https://images.unsplash.com/photo-1546484396-fb3fc10f73df?w=800&q=80', filename: 'fan-one-leg-out.jpg' }, // summer night sleeping
  'p22a': { url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80', filename: 'grandma-phone-learning.jpg' }, // grandma using phone
  'psummer20': { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', filename: 'cookout-friend-fun.jpg' }, // bbq friends fun

  // === Duplicate image posts (64) - Thursday posts ===
  'pthu-trevon1': { url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80', filename: 'student-loan-freedom.jpg' }, // celebration freedom
  'pthu-founder1': { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', filename: 'orra-milestone-thu.jpg' }, // team milestone
  'pthu-elena1': { url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80', filename: 'barcelona-golden-hour.jpg' }, // Barcelona alley
  'pthu-marcus1': { url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80', filename: 'dance-student-victory.jpg' }, // dance victory
  'pthu-rosa1': { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', filename: 'retired-teacher-email.jpg' }, // teacher reading
  'pthu-bri1': { url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&q=80', filename: 'mom-child-card.jpg' }, // mom child love
  'pthu-dre1': { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80', filename: 'open-mic-night.jpg' }, // open mic stage
  'pthu-maya1': { url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80', filename: 'meal-prep-thursday.jpg' }, // meal prep
  'pthu-tasha1': { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', filename: 'salon-wig-compassion.jpg' }, // salon chair
  'pthu-amira1': { url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', filename: 'nurse-shift-done.jpg' }, // nurse tired
  'pthu-sofia1': { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', filename: 'popup-shop-collab.jpg' }, // pop-up shop
  'pthu-ethan1': { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', filename: 'student-meme-funny.jpg' }, // classroom fun
  'pthu-liam1': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', filename: 'firefighter-welcome.jpg' }, // firefighter station
  'pthu-kai1': { url: 'https://images.unsplash.com/photo-1561052967-61fc91e48d79?w=800&q=80', filename: 'skate-deck-art.jpg' }, // skateboard art
  'pthu-nia1': { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', filename: 'morning-breathwork.jpg' }, // meditation morning
  'pthu-zara1': { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80', filename: 'street-style-bold.jpg' }, // street fashion
  'pthu-donte1': { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80', filename: 'studio-six-beats.jpg' }, // music studio
  'pthu-devin1': { url: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=800&q=80', filename: 'coaching-early-morning.jpg' }, // early morning coaching
  'pthu-raj1': { url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80', filename: 'smart-contract-code.jpg' }, // code on screen
  'pthu-jade1': { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', filename: 'nola-strong-workout.jpg' }, // workout
  'pthu-isla1': { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80', filename: 'coffee-shop-poem.jpg' }, // writing coffee
  'pthu-jaylen1': { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', filename: 'wifi-rage-gaming.jpg' }, // gaming frustrated
  'pthu-luna1': { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80', filename: 'art-breakthrough.jpg' }, // art painting
  'pthu-chris1': { url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', filename: 'repair-fixed.jpg' }, // repair tools
  'pthu-omar1': { url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', filename: '3d-print-arch.jpg' }, // 3D printing
  'pthu-terry1': { url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80', filename: 'engine-repair.jpg' }, // engine repair
  'pthu-stock1': { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80', filename: 'met-gala-look.jpg' }, // fashion gala
  'pthu-stock2': { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', filename: 'latte-rosetta.jpg' }, // latte art
  'pthu-stock3': { url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80', filename: 'led-gaming-battlestation.jpg' }, // gaming setup
  'pthu-stock4': { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', filename: 'sunrise-yoga.jpg' }, // yoga sunrise
  'pthu-stock5': { url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80', filename: 'city-night-traveler.jpg' }, // city night
  'pthu-stock6': { url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80', filename: 'blockchain-deploy.jpg' }, // code screen
  'pthu-stock7': { url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&q=80', filename: 'succulent-garden.jpg' }, // plants
  'pthu-stock8': { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', filename: 'vinyl-crate-digging.jpg' }, // vinyl records
  'pthu-stock9': { url: 'https://images.unsplash.com/photo-1562968197-762b6e3e8e0c?w=800&q=80', filename: 'dino-nuggets-kid.jpg' }, // kids food
  'pthu-stock10': { url: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&q=80', filename: 'dog-hiking-trail.jpg' }, // dog hiking
  'pthu-stock11': { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', filename: 'fire-station-calm.jpg' }, // fire station
  'pthu-stock12': { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', filename: 'gym-sweat-done.jpg' }, // gym workout
  'pthu-stock13': { url: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&q=80', filename: 'bywater-street-art.jpg' }, // street art
  'pthu-stock14': { url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80', filename: 'studio-sunset-dance.jpg' }, // dance studio
  'pthu-stock15': { url: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=800&q=80', filename: 'architecture-acceptance.jpg' }, // architecture student
  'pthu-trevon2': { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80', filename: 'calculus-grind.jpg' }, // studying
  'pthu-founder2': { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', filename: 'late-night-coding.jpg' }, // coding at night
  'pthu-elena2': { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80', filename: 'lisbon-music-venue.jpg' }, // music venue
  'pthu-marcus2': { url: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&q=80', filename: 'dance-rehearsal-energy.jpg' }, // dance rehearsal
  'pthu-rosa2': { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80', filename: 'garden-bloom-rosa.jpg' }, // garden blooming
  'pthu-bri2': { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', filename: 'tax-refund-joy.jpg' }, // shopping joy
  'pthu-dre2': { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80', filename: 'late-night-beats.jpg' }, // late night studio
  'pthu-maya2': { url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', filename: 'food-truck-prep.jpg' }, // food truck
  'pthu-tasha2': { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', filename: 'salon-lease-signed.jpg' }, // salon signing
  'pthu-amira2': { url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', filename: 'nurse-3am-quiet.jpg' }, // quiet hospital
  'pthu-sofia2': { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', filename: 'brunch-creative.jpg' }, // brunch meeting
  'pthu-ethan2': { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', filename: 'professor-encourage.jpg' }, // professor student
  'pthu-liam2': { url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80', filename: 'fire-cooking-comp.jpg' }, // cooking competition
  'pthu-kai2': { url: 'https://images.unsplash.com/photo-1561052967-61fc91e48d79?w=800&q=80', filename: 'tre-flip-landed.jpg' }, // skatepark
  'pthu-nia2': { url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', filename: 'self-care-rest-nia.jpg' }, // self care
  'pthu-donte2': { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80', filename: 'first-placement-call.jpg' }, // music studio
  'pthu-devin2': { url: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=800&q=80', filename: 'coach-heart-talk.jpg' }, // coaching
  'pthu-raj2': { url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80', filename: 'noodle-pulling.jpg' }, // cooking
  'pthu-jade2': { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', filename: 'trail-10k-finish.jpg' }, // running
  'pthu-isla2': { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', filename: 'poetry-open-mic.jpg' }, // open mic
  'pthu-jaylen2': { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', filename: 'madden-tournament.jpg' }, // gaming tournament
  'pthu-luna2': { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80', filename: 'digital-japanese-art.jpg' }, // digital art
  'pthu-chris2': { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', filename: 'diamond-rank-screen.jpg' }, // gaming achievement
  'pthu-omar2': { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', filename: 'reno-reveal.jpg' }, // home renovation
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { timeout: 15000 }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(filepath);
      response.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        // Verify it's a real image (not HTML error page)
        const stats = fs.statSync(filepath);
        if (stats.size < 5000) {
          fs.unlinkSync(filepath);
          reject(new Error('File too small - likely error page'));
          return;
        }
        resolve(stats.size);
      });
      stream.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function main() {
  const entries = Object.entries(imageMap);
  console.log(`Downloading ${entries.length} real stock images...`);
  
  let success = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < entries.length; i++) {
    const [postId, info] = entries[i];
    const outputPath = `/home/z/my-project/public/images/posts/${info.filename}`;
    
    // Skip if file already exists and is a real image (not a gradient box)
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 10000) { // Real image should be > 10KB
        console.log(`[${i+1}/${entries.length}] SKIP ${postId} - ${info.filename} already exists (${(stats.size/1024).toFixed(1)}KB)`);
        results.push({ postId, filename: info.filename, status: 'existing' });
        success++;
        continue;
      }
    }

    try {
      const size = await downloadImage(info.url, outputPath);
      console.log(`[${i+1}/${entries.length}] ✓ ${postId} -> ${info.filename} (${(size/1024).toFixed(1)}KB)`);
      results.push({ postId, filename: info.filename, status: 'downloaded' });
      success++;
    } catch (error) {
      console.log(`[${i+1}/${entries.length}] ✗ ${postId} - ${error.message}`);
      results.push({ postId, filename: info.filename, status: 'failed', error: error.message });
      failed++;
    }

    // Small delay to avoid rate limiting
    if (i % 10 === 9) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n=== Download Complete ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  // Now update the database
  console.log(`\nUpdating database...`);
  let updated = 0;

  for (const result of results) {
    if (result.status === 'failed') continue;
    
    try {
      const newImageUrl = `/images/posts/${result.filename}`;
      await prisma.post.update({
        where: { id: result.postId },
        data: {
          images: JSON.stringify([newImageUrl]),
          type: 'image'
        }
      });
      updated++;
    } catch (error) {
      console.log(`  Error updating ${result.postId}: ${error.message}`);
    }
  }

  console.log(`Updated ${updated} posts in database`);

  // Clean up old gradient box images
  const allFiles = fs.readdirSync('/home/z/my-project/public/images/posts/');
  const gradientFiles = allFiles.filter(f => f.startsWith('unique-'));
  console.log(`\nCleaning up ${gradientFiles.length} gradient box images...`);
  gradientFiles.forEach(f => {
    fs.unlinkSync(`/home/z/my-project/public/images/posts/${f}`);
  });
  console.log('Cleaned up gradient images');

  // Also remove the test files
  try { fs.unlinkSync('/home/z/my-project/public/images/posts/test-gen.png'); } catch(e) {}
  try { fs.unlinkSync('/home/z/my-project/public/images/posts/test-stock.jpg'); } catch(e) {}

  // Verify
  const total = await prisma.post.count();
  const allPosts = await prisma.post.findMany({ select: { images: true } });
  const allImages = [];
  allPosts.forEach(p => {
    try { JSON.parse(p.images).forEach(url => allImages.push(url)); } catch(e) {}
  });
  const uniqueImages = new Set(allImages);
  
  console.log(`\n=== Final Verification ===`);
  console.log(`Total posts: ${total}`);
  console.log(`Total images: ${allImages.length}`);
  console.log(`Unique images: ${uniqueImages.size}`);
  console.log(`Image files on disk: ${fs.readdirSync('/home/z/my-project/public/images/posts/').length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
