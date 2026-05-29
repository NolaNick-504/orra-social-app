#!/bin/bash
# Download the pre-built .next directory from GitHub Releases
# This avoids building on the small EC2 instance

set -e
cd ~/orra

echo "Downloading pre-built ORRA app..."
curl -L -o /tmp/orra-build.tar.gz https://github.com/NolaNick-504/orra-social-app/releases/download/v1.0-build/orra-build.tar.gz

echo "Extracting..."
tar -xzf /tmp/orra-build.tar.gz

echo "Starting ORRA..."
bash aws/start-orra.sh
