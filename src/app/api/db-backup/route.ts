import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/db-backup — Backs up the SQLite database to a persistent location
 *
 * The platform container can be rebuilt at any time, which wipes the database.
 * This endpoint copies the DB file to /home/sync/ which persists across rebuilds.
 *
 * Called automatically by the startup script and by the keep-alive provider.
 */
export async function GET() {
  try {
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
      const { readdirSync, unlinkSync } = await import('fs');
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
