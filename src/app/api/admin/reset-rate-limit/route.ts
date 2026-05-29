import { NextRequest, NextResponse } from 'next/server';
import { clearAllRateLimits } from '@/lib/rate-limit';

// Admin endpoint to clear all rate limits
// Access via: /api/admin/reset-rate-limit?key=orra504
const ADMIN_KEY = 'orra504';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }
  clearAllRateLimits();
  return NextResponse.json({ success: true, message: 'All rate limits cleared' });
}

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }
  clearAllRateLimits();
  return NextResponse.json({ success: true, message: 'All rate limits cleared' });
}
