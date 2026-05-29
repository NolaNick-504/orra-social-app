#!/bin/bash
# =============================================================================
# ORRA Social App - Quick Deployment Script
# =============================================================================
# Run this script on the EC2 instance after code changes to redeploy.
#
# Usage:
#   cd /home/ubuntu/orra-social-app
#   bash aws/deploy.sh
#
# What this script does:
#   1. Pulls the latest code from GitHub (main branch)
#   2. Installs/updates dependencies
#   3. Generates Prisma client
#   4. Builds the Next.js application
#   5. Restarts the PM2 process (or starts it if not running)
#   6. Displays the current status
# =============================================================================

set -e  # Exit on any error

# ---------------------------------------------------------------------------
# Colors for output
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}     $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}   $1"; }
fail()    { echo -e "${RED}[FAIL]${NC}   $1"; exit 1; }

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
APP_DIR="/home/ubuntu/orra-social-app"
APP_BRANCH="main"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo ""
echo "============================================================"
echo "  ORRA Social App — Deployment"
echo "  Started at: $TIMESTAMP"
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Navigate to app directory
# ---------------------------------------------------------------------------
info "Navigating to app directory..."
cd "$APP_DIR" || fail "Could not find app directory: $APP_DIR"
success "Working directory: $(pwd)"

# ---------------------------------------------------------------------------
# Step 2: Pull latest code from GitHub
# ---------------------------------------------------------------------------
info "Pulling latest code from GitHub (branch: $APP_BRANCH)..."
git fetch origin "$APP_BRANCH"
git reset --hard "origin/$APP_BRANCH"
success "Code updated to latest version."

# ---------------------------------------------------------------------------
# Step 3: Install dependencies
# ---------------------------------------------------------------------------
info "Installing dependencies..."
npm ci
success "Dependencies installed."

# ---------------------------------------------------------------------------
# Step 4: Generate Prisma client
# ---------------------------------------------------------------------------
info "Generating Prisma client..."
npx prisma generate
success "Prisma client generated."

# ---------------------------------------------------------------------------
# Step 5: Build the Next.js application
# ---------------------------------------------------------------------------
info "Building the Next.js application..."
npm run build
success "Application built successfully."

# ---------------------------------------------------------------------------
# Step 6: Restart PM2 process
# ---------------------------------------------------------------------------
info "Restarting PM2 process..."

# Check if the app is already running in PM2
if pm2 describe orra > /dev/null 2>&1; then
    pm2 restart orra
    success "PM2 process 'orra' restarted."
else
    # Start the app if it's not already running
    if [[ -f "ecosystem.config.js" ]]; then
        pm2 start ecosystem.config.js --env production
    else
        pm2 start server.js --name orra --env production
    fi
    success "PM2 process 'orra' started."
fi

# Save the PM2 process list (for startup recovery)
pm2 save

# ---------------------------------------------------------------------------
# Step 7: Display status
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo -e "  ${GREEN}Deployment Complete!${NC}"
echo "  Finished at: $(date +"%Y-%m-%d %H:%M:%S")"
echo "============================================================"
echo ""

pm2 status

echo ""
info "Useful commands:"
echo "  pm2 logs orra          # View application logs"
echo "  pm2 monit              # Monitor CPU/Memory"
echo "  pm2 restart orra       # Restart the app"
echo "  pm2 stop orra          # Stop the app"
echo ""
