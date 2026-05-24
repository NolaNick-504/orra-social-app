#!/bin/bash
# ORRA GitHub Push Script
# 
# BEFORE RUNNING:
# 1. Go to https://github.com/settings/tokens/new
# 2. Create a token with "repo" scope (full control of private repositories)
# 3. Run: export GITHUB_TOKEN=your_token_here
# 4. Then run: bash push-to-github.sh

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: Set your GitHub token first:"
  echo "  export GITHUB_TOKEN=ghp_your_token_here"
  echo ""
  echo "Create one at: https://github.com/settings/tokens/new"
  echo "Select scope: repo (full control of private repositories)"
  exit 1
fi

# Your GitHub username (update if different)
GITHUB_USER="nickjoseph8087"
REPO_NAME="orra-social-app"

echo "Creating GitHub repository: $GITHUB_USER/$REPO_NAME"

# Create the repo on GitHub
RESPONSE=$(curl -sS -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"ORRA - The Social Media Super App\",\"private\":true}")

CLONE_URL=$(echo "$RESPONSE" | grep -o '"clone_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLONE_URL" ]; then
  echo "Repo may already exist, trying to add remote..."
  CLONE_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

echo "Repo URL: $CLONE_URL"

# Set remote with token auth
AUTH_URL="https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git"

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$AUTH_URL"
  echo "Updated remote origin"
else
  git remote add origin "$AUTH_URL"
  echo "Added remote origin"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main 2>&1 || git push -u origin master 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================="
  echo "SUCCESS! ORRA is now backed up to GitHub!"
  echo "=========================================="
  echo "Repo: https://github.com/$GITHUB_USER/$REPO_NAME"
  echo ""
  echo "To clone on a new machine:"
  echo "  git clone https://github.com/$GITHUB_USER/$REPO_NAME.git"
  echo "  cd orra-social-app"
  echo "  npm install"
  echo "  npx prisma generate"
  echo "  npx prisma db push"
  echo "  node backup/restore-from-export.js"
  echo "  npx next build --webpack"
  echo "  npx next start -p 3000"
else
  echo ""
  echo "Push failed. Check your token and username."
  echo "Make sure the token has 'repo' scope."
fi
