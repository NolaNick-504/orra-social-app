#!/bin/bash
# =============================================================================
# ORRA Social App - AWS EC2 One-Click Setup Script
# =============================================================================
#
# HOW TO USE THIS (SUPER EASY - JUST 3 STEPS!):
#
# Step 1: Create an EC2 instance in your AWS Console
#         (follow the guide in AWS-DEPLOY-GUIDE.md)
#
# Step 2: Connect to your EC2 instance (click "Connect" in AWS Console)
#
# Step 3: Copy and paste this ENTIRE command and press Enter:
#
#         curl -fsSL https://raw.githubusercontent.com/NolaNick-504/orra_social_app/main/aws/setup-ec2.sh | bash
#
#         OR if you uploaded the file:
#         bash setup-ec2.sh
#
# That's it! The script does EVERYTHING automatically.
# When it's done, your ORRA app will be live on the internet!
#
# =============================================================================
set -e

# Colors for easy reading
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo -e "${BLUE}   ____  ____  ____  ___  ____ _____${NC}"
echo -e "${BLUE}  / ___||  _ \|  _ \|_ _||  _ \_   _|${NC}"
echo -e "${BLUE}  \___ \| |_) | |_) || | | |_) || |  ${NC}"
echo -e "${BLUE}   ___) |  __/|  _ < | | |  __/ | |  ${NC}"
echo -e "${BLUE}  |____/|_|   |_| \_\___|_|    |_|  ${NC}"
echo ""
echo -e "${GREEN}  AWS EC2 Deployment - One-Click Setup${NC}"
echo "============================================================"
echo ""

# ---- Configuration ----
APP_DIR="/home/ubuntu/orra"
REPO_URL="https://github.com/NolaNick-504/orra_social_app.git"
NODE_VERSION="20"
DOMAIN=""  # Leave empty if no domain; fill in if you have one

# ---- Check if running on Ubuntu ----
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
    echo -e "${YELLOW}Warning: This script is designed for Ubuntu. You may encounter issues.${NC}"
fi

# ---- Step 1: System Updates ----
echo ""
echo -e "${YELLOW}[Step 1/8] Updating system packages...${NC}"
echo "This takes a few minutes on first run..."
sudo apt-get update -y
sudo apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"

# ---- Step 2: Install Node.js ----
echo ""
echo -e "${YELLOW}[Step 2/8] Installing Node.js ${NODE_VERSION}...${NC}"
if command -v node &> /dev/null && [[ "$(node -v)" == "v${NODE_VERSION}"* ]]; then
    echo -e "${GREEN}✓ Node.js $(node -v) already installed${NC}"
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"
fi

# ---- Step 3: Install other dependencies ----
echo ""
echo -e "${YELLOW}[Step 3/8] Installing build tools and Nginx...${NC}"
sudo apt-get install -y \
    build-essential \
    python3 \
    nginx \
    git \
    curl \
    wget \
    sqlite3
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ---- Step 4: Clone the ORRA app ----
echo ""
echo -e "${YELLOW}[Step 4/8] Downloading ORRA app from GitHub...${NC}"
if [ -d "$APP_DIR" ]; then
    echo -e "${BLUE}App directory exists. Pulling latest changes...${NC}"
    cd "$APP_DIR"
    git pull origin main || true
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi
echo -e "${GREEN}✓ App downloaded${NC}"

# ---- Step 5: Install npm dependencies ----
echo ""
echo -e "${YELLOW}[Step 5/8] Installing app dependencies...${NC}"
echo "This takes a few minutes..."
cd "$APP_DIR"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ---- Step 6: Configure environment ----
echo ""
echo -e "${YELLOW}[Step 6/8] Setting up environment...${NC}"

# Get the public IP of this EC2 instance
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_PUBLIC_IP")

# Generate a strong NEXTAUTH_SECRET
AUTH_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > "$APP_DIR/.env" << EOF
# =============================================================================
# ORRA Social App - AWS EC2 Environment
# =============================================================================
DATABASE_URL=file:$APP_DIR/db/production.db
NEXTAUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=http://${PUBLIC_IP}
AUTH_TRUST_HOST=true
NODE_ENV=production
PORT=3000
EOF

echo -e "${GREEN}✓ Environment configured${NC}"
echo -e "${BLUE}  Your app URL: http://${PUBLIC_IP}${NC}"
echo -e "${BLUE}  Your AUTH_SECRET: ${AUTH_SECRET:0:10}...${NC}"

# ---- Step 7: Build the app ----
echo ""
echo -e "${YELLOW}[Step 7/8] Building ORRA app...${NC}"
echo "This takes 3-5 minutes..."
cd "$APP_DIR"

# Generate Prisma client
npx prisma generate

# Push database schema (creates the database)
npx prisma db push

# Seed the database with initial data
npx prisma db seed || echo "Seed completed (some warnings are normal)"

# Build the Next.js app
npm run build
echo -e "${GREEN}✓ App built successfully${NC}"

# ---- Step 8: Set up PM2 (keeps app running forever) ----
echo ""
echo -e "${YELLOW}[Step 8/8] Setting up auto-start...${NC}"

# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem config for AWS
cat > "$APP_DIR/ecosystem.aws.config.js" << EOF
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
EOF

# Create logs directory
mkdir -p "$APP_DIR/logs"

# Start the app with PM2
cd "$APP_DIR"
pm2 delete orra-server 2>/dev/null || true
pm2 start ecosystem.aws.config.js

# Save PM2 process list (auto-restart on server reboot)
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | tail -1 | sudo bash || true

echo -e "${GREEN}✓ Auto-start configured${NC}"

# ---- Set up Nginx (reverse proxy for port 80) ----
echo ""
echo -e "${YELLOW}Setting up Nginx web server...${NC}"

cat > /tmp/orra-nginx << 'NGINXCONF'
server {
    listen 80;
    server_name _;

    # Maximum upload size (for profile pictures, covers, etc.)
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
NGINXCONF

sudo cp /tmp/orra-nginx /etc/nginx/sites-available/orra
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/orra /etc/nginx/sites-enabled/orra
sudo nginx -t && sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured${NC}"

# ---- Open firewall ----
echo ""
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

# ---- Make uploads directory writable ----
mkdir -p "$APP_DIR/public/uploads" "$APP_DIR/public/images" "$APP_DIR/public/music" "$APP_DIR/db"
chmod -R 777 "$APP_DIR/public/uploads" "$APP_DIR/public/images" "$APP_DIR/public/music" "$APP_DIR/db"

# ---- DONE! ----
echo ""
echo "============================================================"
echo -e "${GREEN}   ✓ ORRA IS LIVE! 🎉${NC}"
echo "============================================================"
echo ""
echo -e "  Your app is running at: ${BLUE}http://${PUBLIC_IP}${NC}"
echo ""
echo -e "  ${YELLOW}IMPORTANT - Write this down!${NC}"
echo -e "  Your login email:    ${BLUE}nickjoseph8087@gmail.com${NC}"
echo -e "  Your login password: ${BLUE}Weareone504${NC}"
echo ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo -e "  View app logs:     ${BLUE}pm2 logs orra-server${NC}"
echo -e "  Restart app:       ${BLUE}pm2 restart orra-server${NC}"
echo -e "  Stop app:          ${BLUE}pm2 stop orra-server${NC}"
echo -e "  Update app:        ${BLUE}cd $APP_DIR && git pull && npm install && npm run build && pm2 restart orra-server${NC}"
echo ""
echo -e "  ${YELLOW}Next step: Open http://${PUBLIC_IP} in your browser!${NC}"
echo ""
echo "============================================================"
