#!/usr/bin/env node
/**
 * ORRA Image Generator — Processes .image-queue.json and generates AI images.
 * Updates posts in the database with the image URLs.
 *
 * Usage:
 *   node scripts/generate-images.js              # Generate all queued images
 *   node scripts/generate-images.js --batch 10   # Generate only 10 images
 *   node scripts/generate-images.js --retry      # Re-generate failed images
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads');
const STANDALONE_UPLOAD_DIR = path.join(PROJECT_ROOT, '.next', 'standalone', 'public', 'uploads');
const QUEUE_PATH = path.join(PROJECT_ROOT, '.image-queue.json');
const IMAGE_SIZE = '1344x768';

const batchLimit = process.argv.includes('--batch')
  ? parseInt(process.argv[process.argv.indexOf('--batch') + 1], 10)
  : Infinity;

function generateAiImage(prompt, outputPath) {
  try {
    const cmd = `z-ai-generate -p "${prompt.replace(/"/g, '\\"')}" -o "${outputPath}" -s ${IMAGE_SIZE}`;
    execSync(cmd, { timeout: 90000, stdio: 'pipe' });
    return fs.existsSync(outputPath);
  } catch (err) {
    return false;
  }
}

function copyToBothDirs(srcFile, filename) {
  for (const dir of [UPLOAD_DIR, STANDALONE_UPLOAD_DIR]) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(srcFile, path.join(dir, filename));
    } catch (err) {}
  }
}

async function main() {
  if (!fs.existsSync(QUEUE_PATH)) {
    console.error('No image queue found. Run seed-posts.js first.');
    process.exit(1);
  }

  let queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));

  // Filter out already-completed items if retry not requested
  if (!process.argv.includes('--retry')) {
    queue = queue.filter(item => !item.completed);
  }

  const total = Math.min(queue.length, batchLimit);
  console.log(`=== ORRA Image Generator ===`);
  console.log(`Queue: ${queue.length} items | Batch: ${total}\n`);

  // Ensure dirs exist
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(STANDALONE_UPLOAD_DIR)) fs.mkdirSync(STANDALONE_UPLOAD_DIR, { recursive: true });

  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    const item = queue[i];
    const filename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    const imagePath = path.join(UPLOAD_DIR, filename);

    console.log(`[${i + 1}/${total}] Generating: "${item.prompt.substring(0, 60)}..."`);

    const success = generateAiImage(item.prompt, imagePath);
    if (success) {
      copyToBothDirs(imagePath, filename);
      const imageUrl = `/uploads/${filename}`;

      // Update post in database
      try {
        await db.post.update({
          where: { id: item.postId },
          data: {
            images: JSON.stringify([imageUrl]),
            type: 'image',
          },
        });
      } catch (err) {
        console.error(`  ✗ DB update failed for post ${item.postId}`);
      }

      item.completed = true;
      item.imageUrl = imageUrl;
      generated++;
      console.log(`  ✓ Generated: ${filename}`);
    } else {
      failed++;
      console.log(`  ✗ Failed`);
    }

    // Save progress after each image
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  }

  await db.$disconnect();

  console.log(`\n=== COMPLETE ===`);
  console.log(`Generated: ${generated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Remaining: ${queue.filter(i => !i.completed).length}`);
}

main().catch(console.error);
