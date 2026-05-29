#!/bin/bash
# Full fix for ORRA on EC2 - stops app, fixes everything, restarts
cd ~/orra

# Stop the app first
pm2 stop orra-server 2>/dev/null
pm2 delete orra-server 2>/dev/null

# Delete old platform files
rm -f discovered-url.txt

# Fix .env with correct paths
cat > .env << 'ENVEOF'
DATABASE_URL=file:/home/ubuntu/orra/prisma/dev.db
NEXTAUTH_SECRET=orra-super-secret-key-2025-production
NEXTAUTH_URL=http://18.225.226.92
AUTH_TRUST_HOST=true
NODE_ENV=production
PORT=3000
ENVEOF

# Create fresh PM2 config
cat > ecosystem.aws.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'orra-server',
    script: 'server.js',
    cwd: '/home/ubuntu/orra',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'file:/home/ubuntu/orra/prisma/dev.db',
      NEXTAUTH_SECRET: 'orra-super-secret-key-2025-production',
      NEXTAUTH_URL: 'http://18.225.226.92',
      AUTH_TRUST_HOST: 'true',
      PROJECT_ROOT: '/home/ubuntu/orra',
    },
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    max_memory_restart: '512M',
    error_file: '/home/ubuntu/orra/logs/pm2-error.log',
    out_file: '/home/ubuntu/orra/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    kill_timeout: 10000,
    listen_timeout: 30000,
  }]
};
PM2EOF

# Make sure logs dir exists
mkdir -p logs

# Start the app
pm2 start ecosystem.aws.config.js
pm2 save

# Wait and test
echo "Waiting 15 seconds for app to start..."
sleep 15
echo ""
echo "Testing port 3000..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost:3000/ 2>/dev/null || echo "NOT RESPONDING"
echo ""
echo ""
echo "If it says 200, open http://18.225.226.92"
echo "If still not responding, run: pm2 logs orra-server"
