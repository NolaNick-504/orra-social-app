#!/bin/bash
# =============================================================================
# ORRA Auto-Deploy Setup (GitHub Actions approach)
# =============================================================================
# Run this ONCE on your EC2 instance to set up auto-deploy.
# After setup, every push to GitHub will automatically deploy to your server!
#
# Usage: bash /home/ubuntu/orra/aws/setup-autodeploy.sh
# =============================================================================

set -e

echo "========================================="
echo "  ORRA AUTO-DEPLOY SETUP"
echo "========================================="
echo ""

# 1. Generate SSH key for GitHub Actions (no passphrase)
echo "Step 1: Generating SSH key for GitHub Actions..."
SSH_KEY_PATH="/home/ubuntu/.ssh/orra-github-actions"
if [ -f "$SSH_KEY_PATH" ]; then
  echo "SSH key already exists, reusing it."
else
  ssh-keygen -t ed25519 -f "$SSH_KEY_PATH" -N "" -C "orra-github-actions"
  echo "SSH key generated."
fi

# 2. Add public key to authorized_keys
PUB_KEY=$(cat "${SSH_KEY_PATH}.pub")
if grep -qf "${SSH_KEY_PATH}.pub" /home/ubuntu/.ssh/authorized_keys 2>/dev/null; then
  echo "Public key already in authorized_keys."
else
  echo "$PUB_KEY" >> /home/ubuntu/.ssh/authorized_keys
  echo "Public key added to authorized_keys."
fi

# 3. Print the private key (user needs to add this to GitHub)
echo ""
echo "========================================="
echo "  IMPORTANT: ADD THIS TO GITHUB"
echo "========================================="
echo ""
echo "1. Go to: https://github.com/NolaNick-504/orra-social-app/settings/secrets/actions"
echo ""
echo "2. Click 'New repository secret'"
echo ""
echo "3. Name: EC2_SSH_KEY"
echo ""
echo "4. Value: Copy the ENTIRE key below (including BEGIN and END lines):"
echo ""
echo "---BEGIN KEY---"
cat "$SSH_KEY_PATH"
echo "---END KEY---"
echo ""
echo "5. Click 'Add secret'"
echo ""
echo "========================================="
echo "  DONE! After adding the secret,"
echo "  every push to GitHub will auto-deploy!"
echo "========================================="
echo ""
echo "The deploy workflow is already in the repo at:"
echo "  .github/workflows/deploy.yml"
echo ""
echo "It will activate automatically on the next push."
