#!/bin/bash
# Quick fix for ORRA on EC2
cd ~/orra
rm -f discovered-url.txt
echo 'DATABASE_URL=file:/home/ubuntu/orra/prisma/dev.db' > .env
echo 'NEXTAUTH_SECRET=orra-super-secret-key-2025-production' >> .env
echo 'NEXTAUTH_URL=http://18.225.226.92' >> .env
echo 'AUTH_TRUST_HOST=true' >> .env
pm2 restart orra-server
echo "Fixed! Wait 10 seconds then open http://18.225.226.92"
