#!/bin/bash
cd /home/z/my-project

# Parse .env file manually (handles special characters in values)
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  # Trim whitespace and quotes from value
  value=$(echo "$value" | sed 's/^["'\''"]//;s/["'\''"]$//')
  export "$key=$value"
done < .env

export NODE_ENV=production
export PORT=3000

# Debug: verify secret
echo "NEXTAUTH_SECRET length: ${#NEXTAUTH_SECRET}" >> /tmp/orra-start.log

exec node node_modules/next/dist/bin/next start -p 3000
