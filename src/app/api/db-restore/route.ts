import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/db-restore — Restores the SQLite database from the latest backup
 *
 * SECURITY: Requires authenticated admin user (founder role).
 * Changed from GET to POST to prevent accidental/unauthorized triggers.
 *
 * Checks /home/sync/orra-db-backup/latest.db for a backup to restore.
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

    const backupDir = '/home/sync/orra-db-backup';
    const latestPath = path.join(backupDir, 'latest.db');

    if (!existsSync(latestPath)) {
      return NextResponse.json({
        ok: false,
        error: 'No backup found',
        backupDir,
      }, { status: 404 });
    }

    const backupData = readFileSync(latestPath);
    const dbPath = path.join(process.cwd(), 'db', 'custom.db');

    // Ensure db directory exists
    const dbDir = path.dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    writeFileSync(dbPath, backupData);

    return NextResponse.json({
      ok: true,
      restoredFrom: latestPath,
      size: backupData.length,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('DB restore error:', error.message);
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 });
  }
}
