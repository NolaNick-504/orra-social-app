import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/db-restore — Restores the SQLite database from the latest backup
 *
 * Called by the startup script when the database is empty (fresh container).
 * Checks /home/sync/orra-db-backup/latest.db for a backup to restore.
 */
export async function GET() {
  try {
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
      const { mkdirSync } = await import('fs');
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
