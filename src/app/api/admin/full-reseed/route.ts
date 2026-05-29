import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Admin endpoint to FULLY reseed the database
// This wipes all data and re-runs prisma/seed.ts to restore the full app
// Usage: /api/admin/full-reseed?key=orra504&confirm=yes
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  const confirm = req.nextUrl.searchParams.get('confirm');

  if (key !== 'orra504') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (confirm !== 'yes') {
    return NextResponse.json({
      warning: 'This will DELETE ALL DATA and re-seed the database!',
      currentStats: {
        users: await db.user.count(),
        posts: await db.post.count(),
      },
      toConfirm: 'Add &confirm=yes to proceed',
    });
  }

  try {
    const results: string[] = [];

    // Step 1: Delete all data in reverse dependency order
    results.push('Deleting all data...');

    try { await db.like.deleteMany({}); results.push('Deleted likes'); } catch (e: any) { results.push(`Likes: ${e.message}`); }
    try { await db.save.deleteMany({}); results.push('Deleted saves'); } catch (e: any) { results.push(`Saves: ${e.message}`); }
    try { await db.repost.deleteMany({}); results.push('Deleted reposts'); } catch (e: any) { results.push(`Reposts: ${e.message}`); }
    try { await db.comment.deleteMany({}); results.push('Deleted comments'); } catch (e: any) { results.push(`Comments: ${e.message}`); }
    try { await db.post.deleteMany({}); results.push('Deleted posts'); } catch (e: any) { results.push(`Posts: ${e.message}`); }
    try { await db.follow.deleteMany({}); results.push('Deleted follows'); } catch (e: any) { results.push(`Follows: ${e.message}`); }
    try { await db.purchase.deleteMany({}); results.push('Deleted purchases'); } catch (e: any) { results.push(`Purchases: ${e.message}`); }
    try { await db.tokenAction.deleteMany({}); results.push('Deleted token actions'); } catch (e: any) { results.push(`TokenActions: ${e.message}`); }
    try { await db.notification.deleteMany({}); results.push('Deleted notifications'); } catch (e: any) { results.push(`Notifications: ${e.message}`); }
    try { await db.user.deleteMany({}); results.push('Deleted users'); } catch (e: any) { results.push(`Users: ${e.message}`); }

    // Step 2: Run the seed.ts script
    results.push('Running seed.ts...');

    try {
      const output = execSync('npx tsx prisma/seed.ts 2>&1', {
        cwd: process.cwd(),
        timeout: 120000,
        encoding: 'utf-8',
      });
      results.push(`Seed output (last 500 chars): ${output.slice(-500)}`);
    } catch (err: any) {
      // tsx might not be available, try with ts-node
      results.push(`tsx failed: ${err.message?.substring(0, 100)}, trying ts-node...`);
      try {
        const output = execSync('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed.ts 2>&1', {
          cwd: process.cwd(),
          timeout: 120000,
          encoding: 'utf-8',
        });
        results.push(`Seed output (last 500 chars): ${output.slice(-500)}`);
      } catch (err2: any) {
        results.push(`ts-node also failed: ${err2.message?.substring(0, 200)}`);
        results.push('Attempting manual seed via API...');

        // Fallback: Try calling the seed-check endpoint to trigger auto-seed
        // by making the DB look empty (which it is after deletion)
        // The instrumentation.ts should auto-seed on next server restart
        results.push('Database is now empty. Restart server to trigger auto-seed via instrumentation.ts');
      }
    }

    // Step 3: Verify counts
    const finalUsers = await db.user.count();
    const finalPosts = await db.post.count();

    results.push(`Final counts: ${finalUsers} users, ${finalPosts} posts`);

    // If seed didn't run (0 users), we need to restart the server
    if (finalUsers === 0) {
      results.push('NEED RESTART: Database is empty. Triggering server restart to auto-seed...');
      // Restart PM2 process to trigger instrumentation.ts auto-seed
      try {
        execSync('pm2 restart orra-server 2>&1 || true', {
          timeout: 10000,
          encoding: 'utf-8',
        });
        results.push('PM2 restart triggered. Seed should run automatically in ~15 seconds.');
      } catch (e: any) {
        results.push(`PM2 restart failed: ${e.message?.substring(0, 100)}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalUsers: finalUsers,
        totalPosts: finalPosts,
      },
    });
  } catch (error: any) {
    console.error('Full reseed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Reseed failed' },
      { status: 500 }
    );
  }
}
