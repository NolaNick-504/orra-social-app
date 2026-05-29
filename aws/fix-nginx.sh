#!/bin/bash
# Fix Nginx + Clean up disk space
set -e

echo "=== FIXING NGINX ==="

# Install nginx if not installed
sudo apt-get install -y nginx

# Create nginx config
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

echo "Nginx fixed!"

echo ""
echo "=== CLEANING UP DISK SPACE ==="

# Clean npm cache
npm cache clean --force 2>/dev/null || true

# Clean up old npm installs
rm -rf /home/ubuntu/.npm/_cacache 2>/dev/null || true

# Clean up tmp files
rm -rf /tmp/orra-nginx 2>/dev/null || true

# Remove old prisma versions
rm -rf /home/ubuntu/.cache/prisma 2>/dev/null || true

# Remove bun cache
rm -rf /home/ubuntu/.bun 2>/dev/null || true

# Clean apt cache
sudo apt-get clean
sudo apt-get autoremove -y

# Show disk usage
echo ""
echo "Disk usage after cleanup:"
df -h / | tail -1

echo ""
echo "============================================"
echo "  DONE! Try http://18.217.40.32 (no :3000)"
echo "============================================"
