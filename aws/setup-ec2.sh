#!/bin/bash
# =============================================================================
# ORRA Social App - EC2 Instance Setup Script
# =============================================================================
# Run this script on a fresh Ubuntu 24.04 LTS EC2 instance.
#
# Usage:
#   chmod +x setup-ec2.sh
#   sudo ./setup-ec2.sh
#
# What this script does:
#   1. Updates system packages
#   2. Installs Node.js 20.x via NodeSource
#   3. Installs PM2 (process manager)
#   4. Installs Nginx (reverse proxy)
#   5. Installs Certbot (SSL certificates)
#   6. Clones the ORRA app from GitHub
#   7. Installs dependencies and builds the app
#   8. Seeds the database with founder account
#   9. Configures PM2 for process management
#  10. Configures Nginx as a reverse proxy
#  11. Sets up UFW firewall
#  12. Configures PM2 startup on boot
# =============================================================================

set -e  # Exit on any error

# ---------------------------------------------------------------------------
# Colors for output
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
APP_DIR="/home/ubuntu/orra-social-app"
APP_REPO="https://github.com/NolaNick-504/orra-social-app.git"
APP_BRANCH="main"
APP_PORT=3000
DOMAIN="orra.app"
NGINX_CONF_NAME="orra"

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root. Use: sudo ./setup-ec2.sh"
fi

info "Starting ORRA Social App EC2 setup..."
echo "============================================================"

# ---------------------------------------------------------------------------
# Step 1: Update system packages
# ---------------------------------------------------------------------------
info "Step 1/12: Updating system packages..."
apt-get update -y
apt-get upgrade -y
success "System packages updated."

# ---------------------------------------------------------------------------
# Step 2: Install Node.js 20.x via NodeSource
# ---------------------------------------------------------------------------
info "Step 2/12: Installing Node.js 20.x..."
# Install prerequisites
apt-get install -y curl wget gnupg ca-certificates

# Add NodeSource GPG key and repository
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
  gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | \
  tee /etc/apt/sources.list.d/nodesource.list

apt-get update -y
apt-get install -y nodejs

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
success "Node.js ${NODE_VERSION} and npm ${NPM_VERSION} installed."

# ---------------------------------------------------------------------------
# Step 3: Install PM2 globally
# ---------------------------------------------------------------------------
info "Step 3/12: Installing PM2 process manager..."
npm install -g pm2
PM2_VERSION=$(pm2 --version)
success "PM2 v${PM2_VERSION} installed."

# ---------------------------------------------------------------------------
# Step 4: Install Nginx
# ---------------------------------------------------------------------------
info "Step 4/12: Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
success "Nginx installed and started."

# ---------------------------------------------------------------------------
# Step 5: Install Certbot for SSL
# ---------------------------------------------------------------------------
info "Step 5/12: Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx
success "Certbot installed."

# ---------------------------------------------------------------------------
# Step 6: Clone the ORRA app from GitHub
# ---------------------------------------------------------------------------
info "Step 6/12: Cloning ORRA app from GitHub..."

# Install git if not present
apt-get install -y git

if [[ -d "$APP_DIR" ]]; then
    warn "Directory $APP_DIR already exists. Pulling latest changes..."
    cd "$APP_DIR"
    git pull origin "$APP_BRANCH"
else
    git clone -b "$APP_BRANCH" "$APP_REPO" "$APP_DIR"
fi

cd "$APP_DIR"
success "App cloned to $APP_DIR"

# ---------------------------------------------------------------------------
# Step 7: Install dependencies and build
# ---------------------------------------------------------------------------
info "Step 7/12: Installing dependencies..."
npm ci
success "Dependencies installed."

info "Building the Next.js application..."
npm run build
success "Application built successfully."

# ---------------------------------------------------------------------------
# Step 8: Seed the database
# ---------------------------------------------------------------------------
info "Step 8/12: Generating Prisma client and seeding database..."
npx prisma generate

# Run seed — creates founder account (nickjoseph8087@gmail.com / Weareone504)
npx prisma db seed || warn "Seed completed with warnings (database may already exist)."
success "Database ready."

# ---------------------------------------------------------------------------
# Step 9: Create .env.production if it doesn't exist
# ---------------------------------------------------------------------------
info "Step 9/12: Setting up environment configuration..."
if [[ ! -f "$APP_DIR/.env.production" ]]; then
    # Generate a random NEXTAUTH_SECRET
    GENERATED_SECRET=$(openssl rand -base64 32)
    cat > "$APP_DIR/.env.production" << ENVEOF
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=${GENERATED_SECRET}
DATABASE_URL=file:../db/production.db
NODE_ENV=production
PORT=${APP_PORT}
ENVEOF
    success "Created .env.production with generated secret."
else
    success ".env.production already exists — keeping it."
fi

# Copy .env.production to .env for Next.js
cp "$APP_DIR/.env.production" "$APP_DIR/.env"

# Ensure the database directory exists
mkdir -p "$APP_DIR/db"

# ---------------------------------------------------------------------------
# Step 10: Configure PM2 ecosystem
# ---------------------------------------------------------------------------
info "Step 10/12: Configuring PM2..."

# Copy the PM2 ecosystem config from aws/ directory
if [[ -f "$APP_DIR/aws/ecosystem.config.js" ]]; then
    cp "$APP_DIR/aws/ecosystem.config.js" "$APP_DIR/ecosystem.config.js"
fi

# Stop any existing PM2 process
pm2 delete orra 2>/dev/null || true

# Start the app with PM2
cd "$APP_DIR"
pm2 start ecosystem.config.js --env production

# Save the PM2 process list
pm2 save

success "PM2 configured and app started."

# ---------------------------------------------------------------------------
# Step 11: Configure Nginx reverse proxy
# ---------------------------------------------------------------------------
info "Step 11/12: Configuring Nginx reverse proxy..."

# Copy the Nginx config from the repo
if [[ -f "$APP_DIR/aws/nginx-orra.conf" ]]; then
    cp "$APP_DIR/aws/nginx-orra.conf" "/etc/nginx/sites-available/${NGINX_CONF_NAME}"
else
    # Fallback: write the config directly
    cat > "/etc/nginx/sites-available/${NGINX_CONF_NAME}" << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name orra.app *.orra.app;

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

    client_max_body_size 20M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header X-Frame-Options "DENY";
        add_header X-Content-Type-Options "nosniff";
    }
}
NGINXEOF
fi

# Enable the site
ln -sf "/etc/nginx/sites-available/${NGINX_CONF_NAME}" "/etc/nginx/sites-enabled/${NGINX_CONF_NAME}"

# Remove the default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx
success "Nginx configured and reloaded."

# ---------------------------------------------------------------------------
# Step 12: Configure UFW firewall
# ---------------------------------------------------------------------------
info "Step 12/12: Configuring UFW firewall..."
apt-get install -y ufw

# Allow SSH (port 22) — MUST be first to avoid lockout
ufw allow 22/tcp
# Allow HTTP (port 80)
ufw allow 80/tcp
# Allow HTTPS (port 443)
ufw allow 443/tcp

# Enable UFW (non-interactive to avoid prompt)
echo "y" | ufw enable

ufw status verbose
success "UFW firewall configured (ports 22, 80, 443 open)."

# ---------------------------------------------------------------------------
# Configure PM2 startup on boot
# ---------------------------------------------------------------------------
info "Configuring PM2 startup on boot..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
# The above command outputs a sudo command — run it
$(pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | tail -1) 2>/dev/null || true
pm2 save
success "PM2 startup configured."

# ---------------------------------------------------------------------------
# Final setup: set ownership
# ---------------------------------------------------------------------------
info "Setting file ownership..."
chown -R ubuntu:ubuntu "$APP_DIR"
success "File ownership set to ubuntu:ubuntu."

# ---------------------------------------------------------------------------
# Print success banner
# ---------------------------------------------------------------------------
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "YOUR_EC2_IP")

echo ""
echo "============================================================"
echo -e "${GREEN}"
echo "  ╔═══════════════════════════════════════════════════════╗"
echo "  ║          ORRA Social App — Setup Complete!            ║"
echo "  ╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "  App Directory : $APP_DIR"
echo "  App URL       : http://$PUBLIC_IP (or http://$DOMAIN)"
echo "  API URL       : http://$PUBLIC_IP/api"
echo "  Instance IP   : $PUBLIC_IP"
echo ""
echo "  Next Steps:"
echo "  ──────────────────────────────────────────────────────"
echo "  1. Point DNS: Set orra.app A record → $PUBLIC_IP"
echo "  2. Set up SSL: sudo certbot --nginx -d orra.app -d www.orra.app"
echo "  3. Verify:     Open https://orra.app in your browser"
echo ""
echo "  Useful Commands:"
echo "  ──────────────────────────────────────────────────────"
echo "  pm2 status            # Check app status"
echo "  pm2 logs orra         # View application logs"
echo "  pm2 restart orra      # Restart the app"
echo "  sudo nginx -t         # Test Nginx config"
echo "  sudo systemctl status nginx  # Check Nginx status"
echo ""
echo "  Deployment (after code changes):"
echo "  ──────────────────────────────────────────────────────"
echo "  cd $APP_DIR"
echo "  bash aws/deploy.sh"
echo ""
echo "============================================================"
