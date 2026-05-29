#!/bin/bash
# Add GitHub Actions SSH public key to authorized_keys
# This allows GitHub Actions to SSH into this server for auto-deploy

PUB_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEZzQb0ss8fN80YrukJKt/1SDHLJrI0qSJPR/Qc0uCsD orra-github-actions"

# Add to authorized_keys if not already there
if ! grep -q "orra-github-actions" /home/ubuntu/.ssh/authorized_keys 2>/dev/null; then
  echo "$PUB_KEY" >> /home/ubuntu/.ssh/authorized_keys
  echo "GitHub Actions public key added to authorized_keys"
else
  echo "Key already in authorized_keys"
fi

# Create the GitHub Actions workflow directory
mkdir -p /home/ubuntu/orra/.github/workflows

# Create the deploy workflow file
cat > /home/ubuntu/orra/.github/workflows/deploy.yml << 'WORKFLOW'
name: Auto Deploy to EC2

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
          key: ${{ secrets.EC2_SSH_KEY }}
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
WORKFLOW

echo "Workflow file created at .github/workflows/deploy.yml"
echo ""
echo "NOW DO THIS ON GITHUB:"
echo "1. Go to: https://github.com/NolaNick-504/orra-social-app/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: EC2_SSH_KEY"
echo "4. Value: The private key (already provided separately)"
echo "5. Click 'Add secret'"
echo ""
echo "Then commit the deploy.yml file to GitHub (it should be in the next push)"
