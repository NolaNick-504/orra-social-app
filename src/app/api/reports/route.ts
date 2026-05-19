import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/reports - List reports (admin only)
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    // For now, return empty for non-admin users
    // In production, you'd check an admin role
    return NextResponse.json({
      success: true,
      data: {
        reports: [],
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a report
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { targetId, targetType, reason, description } = body;

    if (!targetId || !targetType || !reason) {
      return NextResponse.json(
        { success: false, error: 'targetId, targetType, and reason are required' },
        { status: 400 }
      );
    }

    const validTargetTypes = ['post', 'comment', 'user', 'hub_post'];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { success: false, error: `targetType must be one of: ${validTargetTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validReasons = ['spam', 'harassment', 'inappropriate', 'fake_account', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, error: `reason must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      );
    }

    const report = await db.report.create({
      data: {
        reporterId: auth.userId!,
        targetId,
        targetType,
        reason,
        description: description || '',
        status: 'pending',
      },
    });

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
