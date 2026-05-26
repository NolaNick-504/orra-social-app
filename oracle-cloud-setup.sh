#!/bin/bash
# =============================================================================
# ORRA Social App - Oracle Cloud Deployment Setup Script
# =============================================================================
# This script automates the full deployment of ORRA on an Oracle Cloud VM.
# Run this ON the Oracle Cloud instance after SSH'ing in.
#
# Prerequisites:
#   - Oracle Cloud Always Free VM (Ubuntu 22.04 or 24.04)
#   - SSH access to the instance
#   - Port 80/443 open in Oracle Cloud Security List
#
# Usage:
#   curl -sL <raw-url> | bash
#   OR
#   bash oracle-cloud-setup.sh
# =============================================================================
set -e

# ============================================================
# CONFIGURATION - Update these for your deployment
# ============================================================
ORRA_REPO="https://github.com/NolaNick-504/orra-social-app.git"
ORRA_DIR="/opt/orra"
ORRA_USER="orra"
ORRA_PORT=3000
DOMAIN=""  # Leave empty for IP-only, or set your domain
NEXTAUTH_SECRET="orra-s3cr3t-k3y-p3rman3nt-oracle-2026"
NEXTAUTH_URL=""  # Will be auto-detected if empty

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[ORRA-SETUP]${NC} $(date '+%H:%M:%S') $1"; }
ok()   { echo -e "${GREEN}[ORRA-SETUP] ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}[ORRA-SETUP] ⚠ $1${NC}"; }
fail() { echo -e "${RED}[ORRA-SETUP] ✗ $1${NC}"; exit 1; }

# ============================================================
# STEP 1: System Updates & Dependencies
# ============================================================
log "Step 1: Updating system and installing dependencies..."

sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y \
  curl wget git build-essential python3 \
  ca-certificates gnupg \
  nginx certbot python3-certbot-nginx \
  ufw htop

ok "System updated and dependencies installed"

# ============================================================
# STEP 2: Install Node.js 20 LTS
# ============================================================
log "Step 2: Installing Node.js 20 LTS..."

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js ${NODE_VERSION} and npm ${NPM_VERSION} installed"

# Install PM2 globally for process management
sudo npm install -g pm2

# Install bun for faster package management
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

ok "Node.js, PM2, and Bun installed"

# ============================================================
# STEP 3: Create ORRA user and directories
# ============================================================
log "Step 3: Setting up ORRA application directory..."

# Create application directory
sudo mkdir -p ${ORRA_DIR}
sudo mkdir -p ${ORRA_DIR}/db
sudo mkdir -p ${ORRA_DIR}/public/uploads
sudo mkdir -p ${ORRA_DIR}/backups
sudo mkdir -p ${ORRA_DIR}/logs

# Set ownership
sudo chown -R $USER:$USER ${ORRA_DIR}

ok "Application directories created at ${ORRA_DIR}"

# ============================================================
# STEP 4: Clone and Build ORRA
# ============================================================
log "Step 4: Cloning ORRA repository..."

cd ${ORRA_DIR}

# Clone if not already cloned
if [ ! -d ".git" ]; then
  git clone ${ORRA_REPO} .
  ok "Repository cloned"
else
  git pull origin main || true
  ok "Repository updated"
fi

# Install dependencies
log "Installing dependencies..."
npm install

# Generate Prisma client
log "Generating Prisma client..."
npx prisma generate

# Build the application
log "Building ORRA (this may take a few minutes)..."
npm run build

if [ ! -d ".next" ]; then
  fail "Build failed - .next directory not found!"
fi

ok "ORRA built successfully"

# ============================================================
# STEP 5: Initialize Database with Persistent Storage
# ============================================================
log "Step 5: Setting up persistent SQLite database..."

# The database file path - this persists on the VM's disk
DB_PATH="${ORRA_DIR}/db/orra.db"
DB_URL="file:${DB_PATH}"

# Check if database already exists (don't overwrite!)
if [ -f "${DB_PATH}" ]; then
  warn "Database already exists at ${DB_PATH} - keeping existing data!"
else
  log "Creating new database..."
  
  # Set the database URL for migrations
  export DATABASE_URL="${DB_URL}"
  
  # Push the schema to create the database
  npx prisma db push
  
  # Seed the database with initial data
  log "Seeding database with initial data..."
  bun prisma/seed.ts
  
  ok "Database created and seeded"
fi

ok "Database is at ${DB_PATH} (PERSISTENT - survives restarts!)"

# ============================================================
# STEP 6: Auto-detect Public IP
# ============================================================
log "Step 6: Detecting public IP address..."

PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")

if [ -z "${PUBLIC_IP}" ]; then
  warn "Could not auto-detect public IP. You'll need to set NEXTAUTH_URL manually."
else
  ok "Public IP detected: ${PUBLIC_IP}"
fi

# Set NEXTAUTH_URL
if [ -n "${DOMAIN}" ]; then
  NEXTAUTH_URL="https://${DOMAIN}"
elif [ -n "${PUBLIC_IP}" ]; then
  NEXTAUTH_URL="http://${PUBLIC_IP}"
else
  NEXTAUTH_URL="http://localhost:3000"
fi

log "NEXTAUTH_URL set to: ${NEXTAUTH_URL}"

# ============================================================
# STEP 7: Create Environment File
# ============================================================
log "Step 7: Creating environment configuration..."

cat > ${ORRA_DIR}/.env.production << EOF
# ORRA Production Environment
# Generated: $(date)

# Database - SQLite with PERSISTENT storage
DATABASE_URL=file:${DB_PATH}

# Authentication
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL}
AUTH_TRUST_HOST=true

# Application
NODE_ENV=production
PORT=${ORRA_PORT}

# Auto-posting
AUTOPOST_KEY=orra-internal-autopost-2026

# Server URL for self-ping (keeps container alive)
ORRA_PUBLIC_URL=${NEXTAUTH_URL}
EOF

ok "Environment configuration created"

# ============================================================
# STEP 8: Configure PM2 for Process Management
# ============================================================
log "Step 8: Setting up PM2 process manager..."

cat > ${ORRA_DIR}/ecosystem.oracle.config.js << EOF
module.exports = {
  apps: [{
    name: 'orra',
    script: '${ORRA_DIR}/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: ${ORRA_PORT},
      DATABASE_URL: 'file:${DB_PATH}',
      NEXTAUTH_SECRET: '${NEXTAUTH_SECRET}',
      NEXTAUTH_URL: '${NEXTAUTH_URL}',
      AUTH_TRUST_HOST: 'true',
      AUTOPOST_KEY: 'orra-internal-autopost-2026',
      ORRA_PUBLIC_URL: '${NEXTAUTH_URL}',
    },
    // Auto-restart configuration
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    autorestart: true,
    max_memory_restart: '500M',
    // Logging
    error_file: '${ORRA_DIR}/logs/error.log',
    out_file: '${ORRA_DIR}/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }]
};
EOF

# Start the application with PM2
cd ${ORRA_DIR}
pm2 delete orra 2>/dev/null || true
pm2 start ecosystem.oracle.config.js
pm2 save
pm2 startup

ok "PM2 configured - ORRA will auto-restart on server reboot"

# ============================================================
# STEP 9: Configure Nginx Reverse Proxy
# ============================================================
log "Step 9: Configuring Nginx reverse proxy..."

if [ -n "${DOMAIN}" ]; then
  SERVER_NAME="${DOMAIN} www.${DOMAIN}"
else
  SERVER_NAME="_"
fi

cat > /tmp/orra-nginx << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:${ORRA_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }

    # Static files - long cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:${ORRA_PORT};
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Uploads - medium cache
    location /uploads/ {
        proxy_pass http://127.0.0.1:${ORRA_PORT};
        expires 7d;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:${ORRA_PORT};
        access_log off;
    }
}
EOF

sudo mv /tmp/orra-nginx /etc/nginx/sites-available/orra
sudo ln -sf /etc/nginx/sites-available/orra /etc/nginx/sites-enabled/orra
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

ok "Nginx configured and running"

# ============================================================
# STEP 10: Configure Firewall
# ============================================================
log "Step 10: Configuring firewall..."

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

ok "Firewall configured (SSH + HTTP/HTTPS open)"

# ============================================================
# STEP 11: Setup SSL with Let's Encrypt (if domain provided)
# ============================================================
if [ -n "${DOMAIN}" ]; then
  log "Step 11: Setting up SSL certificate..."
  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email nickjoseph8087@gmail.com
  ok "SSL certificate installed - HTTPS is active!"
else
  log "Step 11: Skipping SSL (no domain configured). Using HTTP."
  log "  To add SSL later, set DOMAIN in this script and re-run, or run:"
  log "  sudo certbot --nginx -d yourdomain.com"
fi

# ============================================================
# STEP 12: Create Database Backup Cron Job
# ============================================================
log "Step 12: Setting up automatic database backups..."

cat > ${ORRA_DIR}/backup-db.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/opt/orra/backups"
DB_PATH="/opt/orra/db/orra.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MAX_BACKUPS=30

# Create backup
cp "${DB_PATH}" "${BACKUP_DIR}/orra-${TIMESTAMP}.db"

# Compress old backups
gzip -f "${BACKUP_DIR}/orra-${TIMESTAMP}.db"

# Remove backups older than 30 days
find ${BACKUP_DIR} -name "orra-*.db.gz" -mtime +30 -delete

echo "[$(date)] Backup created: orra-${TIMESTAMP}.db.gz"
BACKUPEOF

chmod +x ${ORRA_DIR}/backup-db.sh

# Add cron job - backup every 6 hours
(crontab -l 2>/dev/null; echo "0 */6 * * * ${ORRA_DIR}/backup-db.sh >> ${ORRA_DIR}/logs/backup.log 2>&1") | crontab -

ok "Automatic database backups configured (every 6 hours, keeps 30 days)"

# ============================================================
# STEP 13: Create Self-Ping Keep-Alive (for preview containers)
# ============================================================
log "Step 13: Setting up self-ping keep-alive..."

cat > ${ORRA_DIR}/keep-alive.sh << 'KEEPEOF'
#!/bin/bash
# Self-ping to keep the server responsive
URL="http://localhost:3000"
while true; do
  curl -s -o /dev/null "${URL}" 2>/dev/null
  sleep 30
done
KEEPEOF

chmod +x ${ORRA_DIR}/keep-alive.sh

# Only start keep-alive if using a preview container URL
if [ -n "${ORRA_PUBLIC_URL}" ] && [[ "${ORRA_PUBLIC_URL}" == *"space.chatglm.site"* ]]; then
  nohup ${ORRA_DIR}/keep-alive.sh > ${ORRA_DIR}/logs/keep-alive.log 2>&1 &
  ok "Self-ping keep-alive started"
else
  ok "Self-ping not needed on dedicated server"
fi

# ============================================================
# STEP 14: Create Update Script
# ============================================================
log "Step 14: Creating update script..."

cat > ${ORRA_DIR}/update-orra.sh << 'UPDATEEOF'
#!/bin/bash
set -e
ORRA_DIR="/opt/orra"
cd "${ORRA_DIR}"

echo "[UPDATE] Pulling latest code..."
git pull origin main

echo "[UPDATE] Installing dependencies..."
npm install

echo "[UPDATE] Generating Prisma client..."
npx prisma generate

echo "[UPDATE] Building application..."
npm run build

echo "[UPDATE] Restarting ORRA..."
pm2 restart orra

echo "[UPDATE] Waiting for server to start..."
sleep 5

# Health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
  echo "[UPDATE] ✓ ORRA updated and running! (HTTP 200)"
else
  echo "[UPDATE] ✗ Server not responding (HTTP ${HTTP_CODE}). Check logs: pm2 logs orra"
fi
UPDATEEOF

chmod +x ${ORRA_DIR}/update-orra.sh

ok "Update script created at ${ORRA_DIR}/update-orra.sh"

# ============================================================
# DONE - Final Verification
# ============================================================
echo ""
echo "=========================================="
ok "ORRA DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Your ORRA app is now running at:"
echo "  ${NEXTAUTH_URL}"
echo ""
echo "Database (PERSISTENT - never reverts!):"
echo "  ${DB_PATH}"
echo ""
echo "Useful commands:"
echo "  Check status:    pm2 status"
echo "  View logs:       pm2 logs orra"
echo "  Restart:         pm2 restart orra"
echo "  Update app:      bash /opt/orra/update-orra.sh"
echo "  Backup DB:       bash /opt/orra/backup-db.sh"
echo "  Nginx status:    sudo systemctl status nginx"
echo ""
echo "Default login:"
echo "  Email: nickjoseph8087@gmail.com"
echo "  Password: password123"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo ""
