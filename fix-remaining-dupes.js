const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

// Second round fixes for remaining duplicates
// These need unique images - we'll use existing ones that aren't used at all yet
const fixes = {
  // laptop-code.jpg → p05b needs something else (p05a keeps laptop-code)
  'p05b': '/images/posts/smart-contract-deploy.jpg',  // coding/tech related

  // latte-art.jpg → p03e needs something else (p08c keeps latte-art)
  // p03e text unknown, but let's check
  'p03e': '/images/posts/hand-pulled-noodles.jpg',

  // art-block-canvas.jpg → p10b needs something else (p10c keeps art-block-canvas) 
  'p10b': '/images/posts/street-art.jpg',  // art related

  // late-night-studio-session.jpg → p09c needs something else (p15a keeps it)
  'p09c': '/images/posts/vinyl.jpg',  // music related

  // self-care-rest.jpg → p16c needs something else (p24b keeps it)
  'p16c': '/images/posts/meditation-candle.jpg',  // wellness related (but it's also a dup...)
  
  // skate-deck-art.jpg → p19a needs something else (p19d keeps it)
  'p19a': '/images/posts/skate-park.jpg',  // but skate-park is also a dup... 

  // firefighter-return.jpg → p23a needs something else (p23c keeps it)
  'p23a': '/images/posts/fire-station.jpg',  // but fire-station is also a dup...

  // summer-bayou.jpg → psummer34 needs something else (p02e keeps it)
  'psummer34': '/images/posts/mountain.jpg',

  // frozen-grapes.jpg → massively overused, need unique for each
  'psummer13': '/images/posts/meal-prep-sunday.jpg',
  'psummer14': '/images/posts/late-night-binge.jpg',
  'psummer16': '/images/posts/summer-sprinklers.jpg',  // sprinkler/kids
  'psummer36': '/images/posts/comedy1.jpg',  // mosquito bites at BBQ = funny
  'psummer37': '/images/posts/succulent-collection.jpg',  // sun tea windowsill = home

  // food-truck-night.jpg → p15d and psummer30 need unique
  'p15d': '/images/posts/food1.jpg',  // block party food
  'psummer30': '/images/posts/dishwasher-repair.jpg',  // just something different

  // brunch.jpg → psummer21 needs something else (p12c keeps brunch)
  'psummer21': '/images/posts/pop-up-shop.jpg',

  // calculus-study.jpg → psummer03 needs something else (p25e keeps it)  
  'psummer03': '/images/posts/textbook-calculus.jpg',  // opposite swap

  // summer-pool-night.jpg → massively overused, need unique for each
  'psummer08': '/images/posts/meditation-candle.jpg',
  'psummer19': '/images/posts/latte-art.jpg',
  'psummer24': '/images/posts/comedy3.jpg',
  'psummer35': '/images/posts/summer-crawfish.jpg',
  'psummer40': '/images/posts/summer-festival.jpg',

  // summer-roadtrip.jpg → overused
  'psummer15': '/images/posts/car-show.jpg',  // need to generate or use different
  'psummer26': '/images/posts/summer-fireworks.jpg',
  'psummer27': '/images/posts/summer-beach.jpg',  // car washing → beach
};

async function fix() {
  console.log('Fixing', Object.keys(fixes).length, 'remaining duplicates...');
  
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
      
      const oldImg = currentImages[0];
      currentImages[0] = newImg;
      
      await db.post.update({
        where: { id: postId },
        data: { images: JSON.stringify(currentImages) }
      });
      
      console.log('  FIXED:', postId, oldImg, '→', newImg);
    } catch (err) {
      console.error('  ERROR:', postId, err.message);
    }
  }
  
  // Verify
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
  console.log('\nRemaining duplicates:', remainingDupes.length);
  remainingDupes.forEach(([img, ids]) => console.log('  ', img, '→', ids.join(', ')));
  
  await db.$disconnect();
}

fix();
