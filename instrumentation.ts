// Next.js Instrumentation — runs once when the server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run on the server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] Starting auto-poster scheduler...');

    try {
      const BASE_URL = process.env.ORRA_URL || 'http://localhost:3000';
      const API_KEY = process.env.NEXTAUTH_SECRET || 'orra-super-secret-key-2025-production';

      // Auto-seed the database if needed (ensures re-login works after container restarts)
      setTimeout(async () => {
        try {
          const seedRes = await fetch(`${BASE_URL}/api/seed-check?key=${API_KEY}`);
          const seedData = await seedRes.json();
          if (seedData.needsSeed) {
            console.log('[instrumentation] Database needs seeding — running seed...');
            const { execSync } = require('child_process');
            execSync('npx prisma db push --accept-data-loss 2>/dev/null && npx prisma db seed 2>/dev/null', {
              cwd: '/home/z/my-project',
              timeout: 60000,
              stdio: 'pipe',
            });
            console.log('[instrumentation] Database seeded successfully');
          } else {
            console.log('[instrumentation] Database already seeded — skipping');
          }
        } catch (err: any) {
          console.error(`[instrumentation] Seed check error: ${err.message}`);
        }
      }, 3000);

      // Start the scheduler by calling the API
      // Delay 10s to ensure the server is fully ready
      setTimeout(async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/auto-poster-scheduler?key=${API_KEY}&action=start`);
          const data = await res.json();
          if (data.success) {
            console.log(`[instrumentation] Auto-poster scheduler started: runs every 30 min`);
          } else {
            console.error(`[instrumentation] Failed to start scheduler:`, data);
          }
        } catch (err: any) {
          console.error(`[instrumentation] Scheduler start error: ${err.message}`);
          // Retry after 30s
          setTimeout(async () => {
            try {
              await fetch(`${BASE_URL}/api/auto-poster-scheduler?key=${API_KEY}&action=start`);
              console.log(`[instrumentation] Auto-poster scheduler started (retry)`);
            } catch {}
          }, 30000);
        }
      }, 10000);
    } catch (err) {
      console.error('[instrumentation] Error:', err);
    }
  }
}
