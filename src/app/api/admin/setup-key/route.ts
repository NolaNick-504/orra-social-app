import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

// Setup GitHub Actions SSH key on this server
// GET /api/admin/setup-key?key=orra504

const ADMIN_KEY = 'orra504';

const PUBLIC_KEY = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEZzQb0ss8fN80YrukJKt/1SDHLJrI0qSJPR/Qc0uCsD orra-github-actions';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  try {
    // Remove any old broken versions of this key
    const { stdout } = await execAsync('cat /home/ubuntu/.ssh/authorized_keys');
    const lines = stdout.split('\n').filter(line => 
      !line.includes('orra-github-actions')
    );
    
    // Add the correct key
    lines.push(PUBLIC_KEY);
    
    // Write back
    fs.writeFileSync('/home/ubuntu/.ssh/authorized_keys', lines.join('\n') + '\n');
    
    // Also create the workflow directory
    await execAsync('mkdir -p /home/ubuntu/orra/.github/workflows');
    
    return NextResponse.json({ 
      success: true, 
      message: 'GitHub Actions SSH key installed correctly!' 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
