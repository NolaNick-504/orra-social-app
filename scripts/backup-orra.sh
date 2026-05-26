#!/bin/bash
# ORRA Project Backup Script
# Creates a full backup of the project including database, code, and uploads
# Usage: bash scripts/backup-orra.sh

set -e

PROJECT_DIR="/home/z/my-project"
BACKUP_BASE="/home/z/orra-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE}/orra-backup-${TIMESTAMP}"

echo "=========================================="
echo "  ORRA Project Backup"
echo "  Timestamp: ${TIMESTAMP}"
echo "=========================================="

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# 1. Backup the SQLite database
echo "[1/5] Backing up database..."
mkdir -p "${BACKUP_DIR}/db"
cp "${PROJECT_DIR}/db/custom.db" "${BACKUP_DIR}/db/custom.db"
echo "  -> Database backed up ($(du -sh ${BACKUP_DIR}/db/custom.db | cut -f1))"

# 2. Backup source code (excluding node_modules, .next, uploads)
echo "[2/5] Backing up source code..."
mkdir -p "${BACKUP_DIR}/src"
rsync -a --exclude='node_modules' --exclude='.next' --exclude='uploads' --exclude='.git' \
  "${PROJECT_DIR}/src/" "${BACKUP_DIR}/src/"
echo "  -> Source code backed up"

# 3. Backup scripts
echo "[3/5] Backing up scripts..."
if [ -d "${PROJECT_DIR}/scripts" ]; then
  cp -r "${PROJECT_DIR}/scripts" "${BACKUP_DIR}/scripts"
  echo "  -> Scripts backed up"
fi

# 4. Backup public assets (avatars, images, music)
echo "[4/5] Backing up public assets..."
mkdir -p "${BACKUP_DIR}/public"
rsync -a --exclude='uploads' \
  "${PROJECT_DIR}/public/" "${BACKUP_DIR}/public/"
echo "  -> Public assets backed up"

# 5. Backup config files
echo "[5/5] Backing up config files..."
for f in package.json next.config.ts tsconfig.json tailwind.config.ts .env .env.example prisma/schema.prisma; do
  if [ -f "${PROJECT_DIR}/${f}" ]; then
    mkdir -p "$(dirname ${BACKUP_DIR}/${f})"
    cp "${PROJECT_DIR}/${f}" "${BACKUP_DIR}/${f}"
  fi
done
echo "  -> Config files backed up"

# Create a manifest
cat > "${BACKUP_DIR}/MANIFEST.txt" << EOF
ORRA Backup - ${TIMESTAMP}
========================
Date: $(date)
Total Users: $(sqlite3 "${BACKUP_DIR}/db/custom.db" "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "N/A")
Bot Accounts: $(sqlite3 "${BACKUP_DIR}/db/custom.db" "SELECT COUNT(*) FROM User WHERE id LIKE 'u%';" 2>/dev/null || echo "N/A")
Total Posts: $(sqlite3 "${BACKUP_DIR}/db/custom.db" "SELECT COUNT(*) FROM Post;" 2>/dev/null || echo "N/A")
Git Commit: $(cd ${PROJECT_DIR} && git rev-parse HEAD 2>/dev/null || echo "N/A")
EOF

echo ""
echo "=========================================="
echo "  Backup Complete!"
echo "  Location: ${BACKUP_DIR}"
echo "  Size: $(du -sh ${BACKUP_DIR} | cut -f1)"
echo "=========================================="

# Keep only last 10 backups
echo ""
echo "Cleaning old backups (keeping last 10)..."
ls -dt ${BACKUP_BASE}/orra-backup-* | tail -n +11 | xargs rm -rf 2>/dev/null || true
echo "Done!"
