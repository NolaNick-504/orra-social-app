#!/bin/bash
# ORRA HTTPS Setup Script
# Generates a self-signed SSL certificate for the server IP
# and configures Nginx to serve HTTPS on port 443
# 
# NOTE: Browsers will show a security warning for self-signed certs.
# Users must click "Advanced" -> "Proceed" to access the site.
# This is needed for camera/QR scanner to work (browsers block camera on HTTP).
#
# For production, you should use a real domain + Let's Encrypt instead.

set -e

# Get the server's public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "18.118.22.101")
echo "Detected public IP: $PUBLIC_IP"

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate with IP in SAN
echo "Generating self-signed SSL certificate for IP: $PUBLIC_IP ..."

sudo openssl req -x509 -nodes -days 3650 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/orra-selfsigned.key \
  -out /etc/nginx/ssl/orra-selfsigned.crt \
  -subj "/C=US/ST=Ohio/L=Columbus/O=ORRA/CN=$PUBLIC_IP" \
  -addext "subjectAltName=IP:$PUBLIC_IP" \
  2>/dev/null

echo "SSL certificate generated successfully."

# Configure Nginx for HTTPS
echo "Configuring Nginx for HTTPS..."

sudo tee /etc/nginx/sites-available/orra > /dev/null << NGINX_EOF
# HTTP server - normal access, no redirect
server {
    listen 80;
    server_name _;
    
    # Allow large uploads
    client_max_body_size 50M;

    # Let certbot challenges through if we add Let's Encrypt later
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}

# HTTPS server - optional, for QR scanner camera access
# Use https://IP when you need camera, http://IP for everything else
server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/orra-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/orra-selfsigned.key;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Allow large uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/orra /etc/nginx/sites-enabled/orra
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
echo "Testing Nginx configuration..."
sudo nginx -t

# Open port 443 in the firewall (if ufw is active)
if sudo ufw status | grep -q "active"; then
    echo "Opening port 443 in firewall..."
    sudo ufw allow 443/tcp
fi

# Reload Nginx
echo "Reloading Nginx..."
sudo nginx -s reload 2>/dev/null || sudo systemctl restart nginx

echo ""
echo "========================================="
echo "  HTTPS SETUP COMPLETE!"
echo "========================================="
echo ""
echo "Your site is now available at:"
echo "  https://$PUBLIC_IP"
echo ""
echo "IMPORTANT: Browsers will show a security warning"
echo "because the certificate is self-signed."
echo ""
echo "To access the site:"
echo "  1. Open https://$PUBLIC_IP in Chrome"
echo "  2. Click 'Advanced'"
echo "  3. Click 'Proceed to $PUBLIC_IP (unsafe)'"
echo ""
echo "The QR scanner camera will now work because"
echo "the connection is encrypted (HTTPS)!"
echo ""
echo "For production, get a real domain and use"
echo "Let's Encrypt for a trusted certificate."
echo "========================================="
