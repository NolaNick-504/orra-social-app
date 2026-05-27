import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/seed-check — Check if the database needs seeding
 *
 * Used by instrumentation.ts to auto-seed the database on server startup.
 * This ensures that user accounts exist for auto-re-login after container restarts.
 */
export async function GET(request: NextRequest) {
  const apiKey = request.nextUrl.searchParams.get('key');
  const secret = process.env.NEXTAUTH_SECRET || 'orra-super-secret-key-2025-production';

  if (apiKey !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if any users exist in the database
    const userCount = await db.user.count();

    if (userCount === 0) {
      return NextResponse.json({ needsSeed: true, userCount: 0 });
    }

    return NextResponse.json({ needsSeed: false, userCount });
  } catch (error) {
    // If we can't count users, the DB might not exist yet
    return NextResponse.json({ needsSeed: true, error: 'DB check failed' });
  }
}
