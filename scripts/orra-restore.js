#!/usr/bin/env node
/**
 * ORRA State Restore — Brings the app back to the known-good state.
 *
 * What it does:
 * 1. Checks if the database has the expected minimum data
 * 2. If data is missing/corrupt, restores from the latest backup
 * 3. If no backup exists, runs full re-seed
 * 4. Verifies AI images exist in public/uploads
 * 5. Restores missing images from backup
 * 6. Returns exit code 0 if healthy, 1 if restored, 2 if could not restore
 *
 * Usage:
 *   node scripts/orra-restore.js              # Check and restore if needed
 *   node scripts/orra-restore.js --force      # Force full restore from backup
 *   node scripts/orra-restore.js --stats      # Just print current stats
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'dev.db');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups', 'db');
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads');
const UPLOAD_BACKUP_DIR = path.join(PROJECT_ROOT, 'backups', 'uploads');
const STANDALONE_UPLOAD_DIR = path.join(PROJECT_ROOT, '.next', 'standalone', 'public', 'uploads');

// ─── Expected minimum counts (the "known good" state) ──────────────
// These are conservative minimums — as long as these are met, the feed looks healthy
const EXPECTED = {
  users: 16,
  posts: 50,
  comments: 200,
  likes: 300,
  imagePosts: 10,
};

function getLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('orra-snapshot-') && f.endsWith('.db'))
    .sort();
  return files.length > 0 ? path.join(BACKUP_DIR, files[files.length - 1]) : null;
}

async function getStats() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  try {
    const [users, posts, comments, likes, imagePosts, textPosts] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.comment.count(),
      db.like.count(),
      db.post.count({ where: { type: 'image' } }),
      db.post.count({ where: { type: 'text' } }),
    ]);
    return { users, posts, comments, likes, imagePosts, textPosts };
  } finally {
    await db.$disconnect();
  }
}

function isHealthy(stats) {
  return (
    stats.users >= EXPECTED.users &&
    stats.posts >= EXPECTED.posts &&
    stats.comments >= EXPECTED.comments &&
    stats.likes >= EXPECTED.likes &&
    stats.imagePosts >= EXPECTED.imagePosts
  );
}

function restoreFromBackup() {
  const backup = getLatestBackup();
  if (!backup) {
    console.error('[restore] No database backup found!');
    return false;
  }

  console.log(`[restore] Restoring database from: ${backup}`);
  try {
    // Create a backup of current (corrupt) DB just in case
    if (fs.existsSync(DB_PATH)) {
      const corruptBackup = path.join(BACKUP_DIR, `corrupt-${Date.now()}.db`);
      fs.copyFileSync(DB_PATH, corruptBackup);
      console.log(`[restore] Saved corrupt DB to: ${corruptBackup}`);
    }

    fs.copyFileSync(backup, DB_PATH);
    console.log('[restore] Database restored successfully');
    return true;
  } catch (err) {
    console.error(`[restore] Failed to restore database: ${err.message}`);
    return false;
  }
}

function restoreImages() {
  let restored = 0;

  // Ensure upload dirs exist
  for (const dir of [UPLOAD_DIR, STANDALONE_UPLOAD_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Restore AI images from backup
  if (fs.existsSync(UPLOAD_BACKUP_DIR)) {
    const backupImages = fs.readdirSync(UPLOAD_BACKUP_DIR).filter(f => f.startsWith('ai-'));
    for (const img of backupImages) {
      const src = path.join(UPLOAD_BACKUP_DIR, img);
      const dest = path.join(UPLOAD_DIR, img);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        // Also copy to standalone dir
        try {
          fs.copyFileSync(src, path.join(STANDALONE_UPLOAD_DIR, img));
        } catch {}
        restored++;
      }
    }
  }

  return restored;
}

async function fullReseed() {
  console.log('[restore] Running full re-seed...');
  try {
    // Step 1: Create posts without images (fast)
    console.log('[restore] Step 1: Seeding posts (skip images)...');
    execSync('node scripts/bulk-seed.js --count 100 --skip-images', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      timeout: 120000,
    });

    // Step 2: Generate a few matching images (the auto-poster will generate more over time)
    console.log('[restore] Step 2: Generating initial matched images (15 posts)...');
    execSync('node scripts/generate-matched-images.js --batch-size 2 --max-posts 15', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      timeout: 300000,
    });

    // Step 3: Take a new backup
    console.log('[restore] Step 3: Saving new backup...');
    takeBackup();

    return true;
  } catch (err) {
    console.error(`[restore] Full re-seed failed: ${err.message}`);
    return false;
  }
}

function takeBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_BACKUP_DIR)) {
    fs.mkdirSync(UPLOAD_BACKUP_DIR, { recursive: true });
  }

  // Backup database
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const dbBackup = path.join(BACKUP_DIR, `orra-snapshot-${timestamp}.db`);
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, dbBackup);
    console.log(`[backup] Database backed up: ${dbBackup}`);
  }

  // Backup AI images
  let imgCount = 0;
  if (fs.existsSync(UPLOAD_DIR)) {
    const images = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith('ai-'));
    for (const img of images) {
      const src = path.join(UPLOAD_DIR, img);
      const dest = path.join(UPLOAD_BACKUP_DIR, img);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        imgCount++;
      }
    }
  }
  console.log(`[backup] ${imgCount} new AI images backed up`);

  // Clean old backups (keep only last 5)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('orra-snapshot-') && f.endsWith('.db'))
    .sort();
  for (let i = 0; i < backups.length - 5; i++) {
    const oldFile = path.join(BACKUP_DIR, backups[i]);
    try { fs.unlinkSync(oldFile); } catch {}
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const statsOnly = args.includes('--stats');

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║          ORRA State Restore v1.0             ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  // Get current stats
  let stats;
  try {
    stats = await getStats();
  } catch (err) {
    console.error(`[restore] Cannot read database: ${err.message}`);
    console.log('[restore] Attempting to restore from backup...');
    if (restoreFromBackup()) {
      stats = await getStats();
    } else {
      console.error('[restore] FATAL: Cannot restore database');
      process.exit(2);
    }
  }

  console.log('Current state:');
  console.log(`  Users:       ${stats.users}  (min expected: ${EXPECTED.users})`);
  console.log(`  Posts:       ${stats.posts}  (min expected: ${EXPECTED.posts})`);
  console.log(`  Image Posts: ${stats.imagePosts}  (min expected: ${EXPECTED.imagePosts})`);
  console.log(`  Text Posts:  ${stats.textPosts}`);
  console.log(`  Comments:    ${stats.comments}  (min expected: ${EXPECTED.comments})`);
  console.log(`  Likes:       ${stats.likes}  (min expected: ${EXPECTED.likes})`);
  console.log();

  if (statsOnly) {
    process.exit(0);
  }

  const healthy = isHealthy(stats);

  if (healthy && !force) {
    console.log('✅ State is HEALTHY — no action needed');

    // Still check images
    const restoredImages = restoreImages();
    if (restoredImages > 0) {
      console.log(`📸 Restored ${restoredImages} missing images`);
    }

    process.exit(0);
  }

  if (force) {
    console.log('🔄 Force restore requested...');
  } else {
    console.log('⚠️  State is UNHEALTHY — data appears missing or corrupt');
  }

  // Try backup restore first
  console.log();
  console.log('[restore] Attempting backup restore...');
  if (restoreFromBackup()) {
    const newStats = await getStats();
    if (isHealthy(newStats)) {
      console.log();
      console.log('✅ State RESTORED from backup');
      console.log(`  Users: ${newStats.users}, Posts: ${newStats.posts}, Comments: ${newStats.comments}, Likes: ${newStats.likes}`);

      // Restore missing images
      const restoredImages = restoreImages();
      if (restoredImages > 0) {
        console.log(`📸 Restored ${restoredImages} missing images`);
      }

      process.exit(1); // Exit 1 = was restored
    }
  }

  // Backup restore didn't work — full re-seed
  console.log();
  console.log('[restore] Backup restore insufficient. Running full re-seed...');
  if (await fullReseed()) {
    const finalStats = await getStats();
    console.log();
    console.log('✅ State RE-SEEDED from scratch');
    console.log(`  Users: ${finalStats.users}, Posts: ${finalStats.posts}, Comments: ${finalStats.comments}, Likes: ${finalStats.likes}`);
    process.exit(1);
  }

  console.error();
  console.error('❌ FATAL: Could not restore ORRA state');
  process.exit(2);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
