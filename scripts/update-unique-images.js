const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { generateImage, getCategoryForPost } = require('./image-generator');

const prisma = new PrismaClient();

async function main() {
  // Load posts needing images
  const postsData = JSON.parse(fs.readFileSync('/home/z/my-project/posts-needing-images-full.json', 'utf-8'));
  
  console.log(`Generating unique images for ${postsData.length} posts...`);
  
  const results = [];
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < postsData.length; i++) {
    const post = postsData[i];
    const category = getCategoryForPost(post.id, post.text, post.authorName);
    
    // Create a unique filename
    const safeName = post.id.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `unique-${safeName}.jpg`;
    const outputPath = `/home/z/my-project/public/images/posts/${filename}`;
    
    try {
      generateImage(post.id, post.text, post.authorName, outputPath);
      
      // Verify the file was created
      if (fs.existsSync(outputPath)) {
        const stat = fs.statSync(outputPath);
        console.log(`[${i+1}/${postsData.length}] ✓ ${post.id} (${post.authorName}) -> ${filename} (${(stat.size/1024).toFixed(1)}KB, ${category})`);
        results.push({
          id: post.id,
          newImage: `/images/posts/${filename}`,
          category
        });
        success++;
      } else {
        console.log(`[${i+1}/${postsData.length}] ✗ ${post.id} - file not created`);
        failed++;
      }
    } catch (error) {
      console.log(`[${i+1}/${postsData.length}] ✗ ${post.id} - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n=== Generation Complete ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  
  // Save results for database update
  fs.writeFileSync('/home/z/my-project/image-update-results.json', JSON.stringify(results, null, 2));
  console.log(`Results saved to image-update-results.json`);
  
  // Now update the database
  console.log(`\nUpdating database...`);
  let updated = 0;
  
  for (const result of results) {
    try {
      // Get current post
      const post = await prisma.post.findUnique({ where: { id: result.id } });
      if (!post) {
        console.log(`  Post ${result.id} not found, skipping`);
        continue;
      }
      
      // Parse current images
      let currentImages = [];
      try {
        currentImages = JSON.parse(post.images);
      } catch (e) {
        currentImages = [];
      }
      
      // Replace with new unique image
      const newImages = [result.newImage];
      
      await prisma.post.update({
        where: { id: result.id },
        data: {
          images: JSON.stringify(newImages),
          type: 'image'
        }
      });
      
      updated++;
    } catch (error) {
      console.log(`  Error updating ${result.id}: ${error.message}`);
    }
  }
  
  console.log(`\nUpdated ${updated} posts in database`);
  
  // Verify no more duplicates
  const allPosts = await prisma.post.findMany({ select: { id: true, images: true } });
  const imageUsage = {};
  allPosts.forEach(p => {
    try {
      const imgs = JSON.parse(p.images);
      if (Array.isArray(imgs)) {
        imgs.forEach(url => {
          if (!imageUsage[url]) imageUsage[url] = [];
          imageUsage[url].push(p.id);
        });
      }
    } catch (e) {}
  });
  
  const remainingDuplicates = Object.entries(imageUsage).filter(([url, ids]) => ids.length > 1);
  const postsWithImages = allPosts.filter(p => {
    try { return JSON.parse(p.images).length > 0; } catch(e) { return false; }
  });
  const postsWithoutImages = allPosts.filter(p => {
    try { return JSON.parse(p.images).length === 0; } catch(e) { return true; }
  });
  
  console.log(`\n=== Final Verification ===`);
  console.log(`Total posts: ${allPosts.length}`);
  console.log(`PostsWith images: ${postsWithImages.length}`);
  console.log(`Posts without images: ${postsWithoutImages.length}`);
  console.log(`Remaining duplicate images: ${remainingDuplicates.length}`);
  
  if (remainingDuplicates.length > 0) {
    console.log('Duplicates still present:');
    remainingDuplicates.forEach(([url, ids]) => {
      console.log(`  ${url}: ${ids.join(', ')}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
