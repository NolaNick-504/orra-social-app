const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

// Map each remaining duplicate's SECOND post to a truly unused image
const fixes = {
  // succulent-collection.jpg → p01d keeps it, psummer37 (sun tea windowsill) → plant/home
  'psummer37': '/images/posts/aura-hq.jpg',

  // pop-up-shop.jpg → p06c keeps it, psummer21 (church fan/porch/lemonade) → home
  'psummer21': '/images/posts/retired-teacher-email.jpg',

  // latte-art.jpg → p08c keeps it, psummer19 (patio drinks crew) → social
  'psummer19': '/images/posts/lisbon-basement-music.jpg',

  // hand-pulled-noodles.jpg → p12a keeps it, p03e (unknown text) → food
  'p03e': '/images/posts/dino-nuggets-plate.jpg',

  // meditation-candle.jpg → p16b keeps it, p16c and psummer08 need new
  'p16c': '/images/posts/art1.jpg',            // wellness/creative
  'psummer08': '/images/posts/city-night.jpg',  // moonlight meditation → night

  // textbook-calculus.jpg → p17a keeps it, psummer03 (summer school calc) 
  'psummer03': '/images/posts/orra-dev-desk.jpg',  // studying at desk

  // skate-park.jpg → p19b keeps it, p19a (ate pavement/road rash)
  'p19a': '/images/posts/funny-cat.jpg',  // fail/funny

  // fire-station.jpg → p23b keeps it, p23a (risotto for station)
  'p23a': '/images/posts/firefighter-cooking.jpg',

  // summer-festival.jpg → p04d keeps it, psummer40 (summer alive/met someone)
  'psummer40': '/images/posts/dance-off-stage.jpg',

  // summer-sprinklers.jpg → p20d keeps it, psummer16 (sprinkler kids 2 hours)
  'psummer16': '/images/posts/nurse-child-drawing.jpg',  // kids related

  // summer-crawfish.jpg → p23d keeps it, psummer35 (backyard bonfire)
  'psummer35': '/images/posts/album1.jpg',  // outdoor evening vibe

  // summer-beach.jpg → psummer04 keeps it, psummer27 (washing car driveway)
  'psummer27': '/images/posts/basketball.jpg',  // outdoor activity (not beach)

  // summer-fireworks.jpg → psummer09 keeps it, psummer26 (sand in everything from beach)
  'psummer26': '/images/posts/game2.jpg',  // something different

  // late-night-binge.jpg → psummer33 keeps it, psummer14 (sunburn peeling like snake)
  'psummer14': '/images/posts/haircare-popup-soho.jpg',  // skin care related!

  // comedy1.jpg → psummer23 keeps it, psummer36 (mosquito bites at BBQ)
  'psummer36': '/images/posts/producer-first-placement.jpg',  // just unique

  // comedy3.jpg → psummer38 keeps it, psummer24 (front yard fireworks neighbor cops)
  'psummer24': '/images/posts/madden-kid.jpg',  // something unique
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
  
  // Final verification
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
  if (remainingDupes.length > 0) {
    remainingDupes.forEach(([img, ids]) => console.log('  ', img, '→', ids.join(', ')));
  } else {
    console.log('✅ ALL DUPLICATES ELIMINATED!');
  }
  
  await db.$disconnect();
}

fix();
