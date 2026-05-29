#!/bin/bash
# ORRA All-In-One Setup for EC2 (8GB RAM)
# Just run: bash <(curl -sL https://raw.githubusercontent.com/NolaNick-504/orra-social-app/main/aws/full-setup.sh)
set -e

echo "=== ORRA Full Setup ==="

# 1. System packages
echo "[1/7] Installing system packages..."
sudo apt update -y
sudo apt install -y git curl

# 2. Node.js
echo "[2/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. PM2
echo "[3/7] Installing PM2..."
sudo npm install -g pm2

# 4. Clone and install
echo "[4/7] Downloading ORRA..."
rm -rf ~/orra
git clone https://github.com/NolaNick-504/orra-social-app.git ~/orra
cd ~/orra
npm install

# 5. Database
echo "[5/7] Setting up database..."
npx prisma generate
npx prisma db push
npx prisma db seed || true

# 6. Build
echo "[6/7] Building ORRA (3-5 minutes)..."
npm run build

# 7. Start
echo "[7/7] Starting ORRA..."
rm -f discovered-url.txt
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

cat > .env << EOF
DATABASE_URL=file:/home/ubuntu/orra/prisma/dev.db
NEXTAUTH_SECRET=orra-super-secret-key-2025-production
NEXTAUTH_URL=http://${PUBLIC_IP}
AUTH_TRUST_HOST=true
NODE_ENV=production
PORT=3000
EOF

sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/orra > /dev/null << 'NGINX'
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
NGINX
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/orra /etc/nginx/sites-enabled/orra
sudo nginx -t && sudo systemctl restart nginx

mkdir -p logs public/uploads public/images public/music

pm2 delete orra-server 2>/dev/null || true
pm2 start server.js --name orra-server
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | tail -1 | sudo bash 2>/dev/null || true

sudo ufw allow OpenSSH 2>/dev/null || true
sudo ufw allow 'Nginx Full' 2>/dev/null || true
sudo ufw --force enable 2>/dev/null || true

echo ""
echo "============================================"
echo "  ORRA IS LIVE!"
echo "============================================"
echo ""
echo "  http://${PUBLIC_IP}"
echo ""
echo "  Login: nickjoseph8087@gmail.com"
echo "  Password: Weareone504"
echo ""
echo "============================================"
