import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
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
 * IMPORTANT: This does NOT hot-swap the DB while the server is running.
 * Instead, it:
 * 1. Validates the backup file integrity
 * 2. WAL-checkpoints the current DB
 * 3. Copies the backup to the DB location
 * 4. Signals that a restart is needed (aura-daemon will auto-restart)
 *
 * After restore, the server may briefly restart due to Prisma's
 * connection being invalidated. The aura-daemon health check will
 * detect this and restart the server automatically.
 */
export async function POST() {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized — login required' }, { status: 401 });
    }

    // Require admin (founder) — identified by email or ID
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

    // Validate backup integrity before restoring
    const backupData = readFileSync(latestPath);
    if (backupData.length < 100) {
      return NextResponse.json({
        ok: false,
        error: 'Backup file is too small — likely corrupted',
        size: backupData.length,
      }, { status: 400 });
    }

    // Check SQLite header (first 16 bytes should be "SQLite format 3\000")
    const header = backupData.slice(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      return NextResponse.json({
        ok: false,
        error: 'Backup file is not a valid SQLite database',
        header: header.substring(0, 16),
      }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'db', 'custom.db');

    // Ensure db directory exists
    const dbDir = path.dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Step 1: WAL checkpoint the current DB before overwriting
    try {
      const Database = require('better-sqlite3');
      const db = new Database(dbPath);
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
    } catch (e: any) {
      console.warn('WAL checkpoint before restore failed (non-fatal):', e.message);
    }

    // Step 2: Keep a pre-restore backup of the current DB
    if (existsSync(dbPath)) {
      try {
        copyFileSync(dbPath, dbPath + '.pre-restore.bak');
      } catch (e: any) {
        console.warn('Pre-restore backup failed (non-fatal):', e.message);
      }
    }

    // Step 3: Write the backup data
    writeFileSync(dbPath, backupData);

    // Step 4: Verify the restored DB is valid
    try {
      const Database = require('better-sqlite3');
      const db = new Database(dbPath);
      const integrity = db.pragma('integrity_check');
      db.close();
      if (integrity[0]?.integrity_check !== 'ok') {
        // Restore failed — rollback to pre-restore backup
        if (existsSync(dbPath + '.pre-restore.bak')) {
          copyFileSync(dbPath + '.pre-restore.bak', dbPath);
        }
        return NextResponse.json({
          ok: false,
          error: 'Restored database failed integrity check — rolled back',
        }, { status: 500 });
      }
    } catch (e: any) {
      // DB open failed after restore — rollback
      if (existsSync(dbPath + '.pre-restore.bak')) {
        copyFileSync(dbPath + '.pre-restore.bak', dbPath);
      }
      return NextResponse.json({
        ok: false,
        error: 'Restored database could not be opened — rolled back: ' + e.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      restoredFrom: latestPath,
      size: backupData.length,
      warning: 'Database restored. The server may briefly restart as connections refresh.',
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
