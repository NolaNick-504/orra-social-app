import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'unknown';
  const xForwardedHost = req.headers.get('x-forwarded-host') || '';
  const xForwardedProto = req.headers.get('x-forwarded-proto') || '';
  const xRealIp = req.headers.get('x-real-ip') || '';
  
  // Log the host for debugging (helps discover the public URL)
  console.log(`[STATUS] Host: ${host}, X-Forwarded-Host: ${xForwardedHost}, X-Forwarded-Proto: ${xForwardedProto}`);
  
  return NextResponse.json({
    ok: true,
    host,
    xForwardedHost,
    xForwardedProto,
    xRealIp: xRealIp ? 'present' : 'none',
    timestamp: Date.now(),
  });
}
