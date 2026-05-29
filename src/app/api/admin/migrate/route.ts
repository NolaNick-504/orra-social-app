import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

// Admin endpoint to run prisma db push (schema migration)
// Usage: GET /api/admin/migrate?key=orra504

const ADMIN_KEY = 'orra504';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  return new Promise((resolve) => {
    exec(
      'cd /home/ubuntu/orra && npx prisma db push --skip-generate 2>&1',
      { timeout: 60000 },
      (error, stdout, stderr) => {
        if (error) {
          resolve(NextResponse.json({ 
            success: false, 
            error: error.message,
            stdout,
            stderr 
          }, { status: 500 }));
          return;
        }
        resolve(NextResponse.json({ 
          success: true, 
          message: 'Database schema migration completed',
          output: stdout 
        }));
      }
    );
  });
}
