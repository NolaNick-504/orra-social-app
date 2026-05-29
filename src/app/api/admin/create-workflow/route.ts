import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

// Create the GitHub Actions workflow file on this server and push it
// GET /api/admin/create-workflow?key=orra504

const ADMIN_KEY = 'orra504';

const WORKFLOW_CONTENT = `name: Auto Deploy to EC2

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 18.118.22.101
          username: ubuntu
          key: \${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/orra
            pm2 stop orra-server 2>/dev/null || true
            git fetch origin
            git reset --hard origin/main
            npm install --production=false 2>&1 | tail -1
            npx prisma generate 2>&1 | tail -1
            rm -rf .next
            NODE_OPTIONS="--max-old-space-size=1536" npm run build 2>&1 | tail -10
            pm2 delete orra-server 2>/dev/null || true
            pm2 start server.js --name orra-server
            pm2 save
          script_stop: false
          command_timeout: 10m
`;

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  try {
    const dir = '/home/ubuntu/orra/.github/workflows';
    await execAsync(`mkdir -p ${dir}`);
    fs.writeFileSync(`${dir}/deploy.yml`, WORKFLOW_CONTENT);

    const { stdout } = await execAsync('cd /home/ubuntu/orra && git add -f .github/workflows/deploy.yml && git commit -m "Add GitHub Actions auto-deploy workflow" && git push origin main 2>&1');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Workflow file created and pushed to GitHub!',
      output: stdout.slice(-200)
    });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      hint: 'The GitHub token may need workflow scope. Create a new token at https://github.com/settings/tokens with workflow scope checked.'
    }, { status: 500 });
  }
}
