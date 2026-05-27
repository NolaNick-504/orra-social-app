const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

// Map of post ID → new image to replace the duplicate
// For each duplicate image, we keep it on ONE post and give the others unique images
const fixes = {
  // nurse-shift.jpg used by p01a, p01c → p01c gets nurse-night-3am.jpg (night shift post)
  'p01c': '/images/posts/nurse-night-3am.jpg',

  // summer-porch.jpg used by p01e, psummer21, psummer27, psummer37
  'psummer21': '/images/posts/brunch.jpg',          // church fan/lemonade on porch → brunch setting
  'psummer27': '/images/posts/summer-roadtrip.jpg',  // washing car → car related
  'psummer37': '/images/posts/frozen-grapes.jpg',    // sun tea windowsill → cold summer treat

  // coaching-field.jpg used by p02a, p02c, p02d
  'p02c': '/images/posts/nola-strong-workout.jpg',   // first game of season → workout/football
  'p02d': '/images/posts/gym.jpg',                    // two-a-days Alabama heat → gym workout

  // summer-bayou.jpg used by p02e, psummer35
  'psummer35': '/images/posts/summer-pool-night.jpg', // backyard bonfire → summer night outdoors

  // dance-studio.jpg used by p04a, p04b
  'p04b': '/images/posts/dance-student-nailing.jpg',  // student nailing routine → dance student

  // summer-festival.jpg used by p04d, psummer23, psummer40
  'psummer23': '/images/posts/comedy1.jpg',            // graduation party season → party/comedy
  'psummer40': '/images/posts/summer-pool-night.jpg',  // summer alive/met someone → summer night

  // butter-chicken.jpg used by p05a, p05c (p05a is about coding not food!)
  'p05a': '/images/posts/laptop-code.jpg',             // code works/doesn't work → coding

  // summer-bbq.jpg used by p05d, p15d, psummer15, psummer36
  'p15d': '/images/posts/food-truck-night.jpg',        // block party speakers → food truck night
  'psummer15': '/images/posts/summer-roadtrip.jpg',    // parking lot cookout/car show → car related
  'psummer36': '/images/posts/frozen-grapes.jpg',      // mosquito bites at BBQ → summer treat (reassign)

  // salon-chair.jpg used by p06a, p06b, p06d
  'p06b': '/images/posts/salon-lease-signing.jpg',     // signed lease for own shop → lease signing
  'p06d': '/images/posts/salon-chemo-client.jpg',      // summer hair care → hair care client

  // gaming-setup-leds.jpg used by p07b, p07c, p07d
  'p07c': '/images/posts/diamond-rank-achieved.jpg',   // RGB = more FPS → gaming achievement
  'p07d': '/images/posts/wifi-died-gaming.jpg',        // inside with AC gaming → gaming problem

  // lisbon-cafe.jpg used by p08b, p08c
  'p08c': '/images/posts/latte-art.jpg',               // pastel de nata cafe → latte art cafe

  // studio-beats.jpg used by p09a, p15a, p15b
  'p15a': '/images/posts/late-night-studio-session.jpg', // producing beat samples → studio session
  'p15b': '/images/posts/studio-collab-6-beats.jpg',     // 6 beats in one session → collab beats

  // summer-rooftop.jpg used by p0founder4, psummer19
  'psummer19': '/images/posts/summer-pool-night.jpg',   // patio drinks with crew → summer night

  // digital-art-screen.jpg used by p10a, p10c
  'p10c': '/images/posts/art-block-canvas.jpg',          // commission slots → art/canvas

  // lake-sunset.jpg used by p10d, psummer34
  'psummer34': '/images/posts/summer-bayou.jpg',         // fishing at 5AM lake → bayou/water (swap)

  // truck-engine.jpg used by p11a, psummer01
  'psummer01': '/images/posts/home-renovation-reveal.jpg', // garage/truck summer evening → renovation

  // fashion-streetwear.jpg used by p13a, p13b
  'p13b': '/images/posts/met-gala-orra.jpg',              // Met Gala look → met gala

  // yoga-morning.jpg used by p16a, p16d, p24b
  'p16d': '/images/posts/breathwork-morning.jpg',         // sunrise yoga lake → breathwork
  'p24b': '/images/posts/self-care-rest.jpg',             // yoga poses for desk posture → self care

  // meditation-candle.jpg used by p16b, psummer08
  'psummer08': '/images/posts/summer-pool-night.jpg',     // moonlight meditation pool → summer night

  // textbook-calculus.jpg used by p17a, psummer03
  'psummer03': '/images/posts/calculus-study.jpg',        // summer school calc → study (swap img)

  // open-mic.jpg used by p18b, p18c
  'p18c': '/images/posts/poem-coffee-cup.jpg',            // poem on cups → coffee cup poem

  // skate-park.jpg used by p19b, p19d, psummer38
  'p19d': '/images/posts/skate-deck-art.jpg',             // skatepark 8PM cool concrete → deck art
  'psummer38': '/images/posts/comedy3.jpg',                // bike race ate it → funny/fail

  // summer-sprinklers.jpg used by p20d, psummer16
  'psummer16': '/images/posts/frozen-grapes.jpg',         // sprinkler for kids → summer treat (swap)

  // architecture-model.jpg used by p21a, p21c
  'p21c': '/images/posts/3d-print-architecture.jpg',      // 3D printing model → 3D print

  // architecture-internship.jpg used by p21b, p21d
  'p21d': '/images/posts/internship-celebration.jpg',      // summer internship contribute → celebration

  // garden-spring.jpg used by p22c, p22d
  'p22d': '/images/posts/community-garden-win.jpg',        // tomatoes coming in → garden win

  // fire-station.jpg used by p23b, p23c
  'p23c': '/images/posts/firefighter-return.jpg',          // appreciating normal days → firefighter return

  // summer-crawfish.jpg used by p23d, psummer30
  'psummer30': '/images/posts/food-truck-night.jpg',       // family reunion cooking → food event

  // running-trail.jpg used by p24a, p24c
  'p24c': '/images/posts/running-trail-10k.jpg',           // early morning run → 10K run

  // calculus-study.jpg used by p25e, psummer29
  'psummer29': '/images/posts/student-loan-celebration.jpg', // summer school torture → student struggle

  // summer-beach.jpg used by psummer04, psummer14, psummer26
  'psummer14': '/images/posts/frozen-grapes.jpg',           // sunburn peeling → summer (swap again)
  'psummer26': '/images/posts/summer-roadtrip.jpg',         // beach sand everywhere → road trip

  // summer-fireworks.jpg used by psummer09, psummer24
  'psummer24': '/images/posts/summer-pool-night.jpg',       // front yard fireworks → summer night

  // summer-watermelon.jpg used by psummer10, psummer13, psummer33
  'psummer13': '/images/posts/frozen-grapes.jpg',           // watermelon hot sauce → summer food
  'psummer33': '/images/posts/late-night-binge.jpg',        // corner store popsicles → late night treat
};

async function fixDuplicates() {
  console.log('Fixing', Object.keys(fixes).length, 'duplicate image posts...');
  
  let fixed = 0;
  let errors = 0;
  
  for (const [postId, newImg] of Object.entries(fixes)) {
    try {
      const post = await db.post.findUnique({ where: { id: postId } });
      if (!post) {
        console.log('  SKIP:', postId, '(not found)');
        continue;
      }
      
      let currentImages;
      try { currentImages = JSON.parse(post.images); } catch { currentImages = [post.images]; }
      if (!Array.isArray(currentImages)) currentImages = [currentImages];
      
      // Replace the first image with the new one
      const oldImg = currentImages[0];
      currentImages[0] = newImg;
      
      await db.post.update({
        where: { id: postId },
        data: { images: JSON.stringify(currentImages) }
      });
      
      console.log('  FIXED:', postId, oldImg, '→', newImg);
      fixed++;
    } catch (err) {
      console.error('  ERROR:', postId, err.message);
      errors++;
    }
  }
  
  console.log('\nDone! Fixed:', fixed, 'Errors:', errors);
  
  // Verify no more duplicates
  const allPosts = await db.post.findMany({ select: { id: true, images: true } });
  const imageMap = {};
  allPosts.forEach(p => {
    let imgs;
    try { imgs = JSON.parse(p.images); } catch { imgs = [p.images]; }
    if (!Array.isArray(imgs)) imgs = [imgs];
    imgs.forEach(img => {
      if (!imageMap[img]) imageMap[img] = [];
      imageMap[img].push(p.id);
    });
  });
  const remainingDupes = Object.entries(imageMap).filter(([k,v]) => v.length > 1);
  console.log('Remaining duplicates:', remainingDupes.length);
  remainingDupes.forEach(([img, ids]) => console.log('  ', img, '→', ids.join(', ')));
  
  await db.$disconnect();
}

fixDuplicates();
