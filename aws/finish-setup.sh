#!/bin/bash
# =============================================================================
# ORRA - Finish Setup Script (run after npm install + build)
# Does: .env setup, prisma db, PM2, Nginx, startup
# =============================================================================
set -e

APP_DIR="/home/ubuntu/orra"
cd "$APP_DIR"

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_PUBLIC_IP")

# Generate auth secret
AUTH_SECRET=$(openssl rand -base64 32)

echo "Setting up environment..."

# Create .env file
cat > "$APP_DIR/.env" << ENVEOF
DATABASE_URL=file:$APP_DIR/db/production.db
NEXTAUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=http://${PUBLIC_IP}
AUTH_TRUST_HOST=true
NODE_ENV=production
PORT=3000
ENVEOF

echo ".env created with IP: $PUBLIC_IP"

# Create directories
mkdir -p "$APP_DIR/db" "$APP_DIR/logs" "$APP_DIR/public/uploads" "$APP_DIR/public/images" "$APP_DIR/public/music"

# Run prisma
echo "Setting up database..."
cd "$APP_DIR"
npx prisma generate
npx prisma db push
npx prisma db seed || echo "Seed done (some warnings are OK)"

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Create PM2 config
cat > "$APP_DIR/ecosystem.aws.config.js" << PM2EOF
module.exports = {
  apps: [{
    name: 'orra-server',
    script: 'server.js',
    cwd: '$APP_DIR',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'file:$APP_DIR/db/production.db',
      NEXTAUTH_SECRET: '$AUTH_SECRET',
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
PM2EOF

# Start with PM2
echo "Starting ORRA with PM2..."
pm2 delete orra-server 2>/dev/null || true
pm2 start ecosystem.aws.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | tail -1 | sudo bash || true

# Set up Nginx
echo "Setting up Nginx..."
cat > /tmp/orra-nginx << 'NGINX'
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;
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
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX

sudo cp /tmp/orra-nginx /etc/nginx/sites-available/orra
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/orra /etc/nginx/sites-enabled/orra
sudo nginx -t && sudo systemctl restart nginx

# Set permissions
chmod -R 777 "$APP_DIR/public/uploads" "$APP_DIR/public/images" "$APP_DIR/public/music" "$APP_DIR/db"

# Done!
echo ""
echo "============================================"
echo "  ORRA IS LIVE!"
echo "============================================"
echo ""
echo "  Open this in your browser:"
echo "  http://${PUBLIC_IP}"
echo ""
echo "  Login: nickjoseph8087@gmail.com"
echo "  Password: Weareone504"
echo ""
echo "============================================"
