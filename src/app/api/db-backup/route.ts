import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/db-backup — Backs up the SQLite database to a persistent location
 *
 * SECURITY: Requires authenticated admin user (founder role).
 * Changed from GET to POST to prevent automated/unauthorized triggers.
 * Server-side daemons (aura-daemon.py, dev.sh) handle backup without this API.
 *
 * The platform container can be rebuilt at any time, which wipes the database.
 * This endpoint copies the DB file to /home/sync/ which persists across rebuilds.
 */
export async function POST() {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized — login required' }, { status: 401 });
    }

    // Require admin (founder) — identified by email or ID
    // The founder account is the one created by the seed script
    const FOUNDER_EMAIL = 'nickjoseph8087@gmail.com';
    if (session.user.email !== FOUNDER_EMAIL && session.user.id !== 'founder') {
      return NextResponse.json({ ok: false, error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const dbPath = path.join(process.cwd(), 'db', 'custom.db');

    if (!existsSync(dbPath)) {
      return NextResponse.json({ ok: false, error: 'Database file not found' }, { status: 404 });
    }

    const dbData = readFileSync(dbPath);

    // Backup to /home/sync/ — this persists across container rebuilds
    const syncDir = '/home/sync';
    const backupDir = path.join(syncDir, 'orra-db-backup');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // Save with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupPath = path.join(backupDir, `orra-${timestamp}.db`);

    writeFileSync(backupPath, dbData);

    // Also save as "latest" — always overwrite
    const latestPath = path.join(backupDir, 'latest.db');
    writeFileSync(latestPath, dbData);

    // Clean up old backups (keep last 5)
    try {
      const files = readdirSync(backupDir)
        .filter(f => f.startsWith('orra-') && f.endsWith('.db'))
        .sort()
        .reverse(); // newest first

      // Keep latest.db + 5 timestamped backups
      const toDelete = files.slice(6);
      for (const f of toDelete) {
        try { unlinkSync(path.join(backupDir, f)); } catch {}
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      backupPath,
      size: dbData.length,
      timestamp,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-ORRA-Health': 'alive',
      },
    });
  } catch (error: any) {
    console.error('DB backup error:', error.message);
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 });
  }
}
