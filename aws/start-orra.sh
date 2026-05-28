#!/bin/bash
# =============================================================================
# ORRA - Start the app on EC2 without building (uses pre-built .next)
# Run this AFTER npm install, prisma generate, prisma db push, prisma db seed
# =============================================================================

set -e

APP_DIR="$HOME/orra"
cd "$APP_DIR"

# Get the public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "localhost")

echo ""
echo "Starting ORRA..."
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "DATABASE_URL=file:./dev.db" > .env
  echo "NEXTAUTH_SECRET=orra-super-secret-key-2025-production" >> .env
  echo "NEXTAUTH_URL=http://${PUBLIC_IP}" >> .env
  echo "AUTH_TRUST_HOST=true" >> .env
  echo "Created .env file"
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
  echo "Installing Nginx..."
  sudo apt-get update -y
  sudo apt-get install -y nginx
fi

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/orra > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/orra /etc/nginx/sites-enabled/orra
sudo nginx -t && sudo systemctl restart nginx

# Make directories writable
mkdir -p public/uploads public/images public/music db logs
chmod -R 777 public/uploads public/images public/music db 2>/dev/null || true

# Create PM2 config
cat > ecosystem.aws.config.js << EOF2
module.exports = {
  apps: [{
    name: 'orra-server',
    script: 'server.js',
    cwd: '$APP_DIR',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'file:$APP_DIR/prisma/dev.db',
      NEXTAUTH_SECRET: 'orra-super-secret-key-2025-production',
      NEXTAUTH_URL: 'http://$PUBLIC_IP',
      AUTH_TRUST_HOST: 'true',
    },
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    max_memory_restart: '512M',
    error_file: '$APP_DIR/logs/pm2-error.log',
    out_file: '$APP_DIR/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    kill_timeout: 10000,
    listen_timeout: 30000,
  }]
};
EOF2

# Start with PM2
pm2 delete orra-server 2>/dev/null || true
pm2 start ecosystem.aws.config.js
pm2 save

# Set up auto-start on reboot
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null | tail -1 | sudo bash 2>/dev/null || true

# Open firewall
sudo ufw allow OpenSSH 2>/dev/null || true
sudo ufw allow 'Nginx Full' 2>/dev/null || true
sudo ufw --force enable 2>/dev/null || true

echo ""
echo "============================================================"
echo "   ORRA IS LIVE!"
echo "============================================================"
echo ""
echo "  Your app: http://${PUBLIC_IP}"
echo ""
echo "  Login: nickjoseph8087@gmail.com / Weareone504"
echo ""
echo "  Commands:"
echo "  View logs:   pm2 logs orra-server"
echo "  Restart:     pm2 restart orra-server"
echo "  Update:      bash ~/orra/aws/update-orra.sh"
echo ""
echo "============================================================"
