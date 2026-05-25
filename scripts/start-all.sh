#!/usr/bin/env bash
# ORRA Full Stack Start - Starts all services
# Usage: bash scripts/start-all.sh [--stop]

set -e

PROJECT_DIR="/home/z/my-project"

if [ "$1" == "--stop" ]; then
    echo "Stopping all ORRA services..."
    python3 "$PROJECT_DIR/scripts/auto-poster-daemon.py" --stop 2>/dev/null || true
    python3 "$PROJECT_DIR/scripts/db-backup.py" --stop 2>/dev/null || true
    python3 "$PROJECT_DIR/.zscripts/aura-daemon.py" --stop 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "next start" 2>/dev/null || true
    sleep 2
    echo "All ORRA services stopped."
    exit 0
fi

echo "=== Starting ORRA Full Stack ==="

# 1. Create a database backup before starting
echo "[1/4] Creating database backup..."
python3 "$PROJECT_DIR/scripts/db-backup.py" --now 2>/dev/null || echo "  Backup failed (non-critical)"

# 2. Start the AURA daemon (Next.js server)
echo "[2/4] Starting AURA server daemon..."
python3 "$PROJECT_DIR/.zscripts/aura-daemon.py" 2>/dev/null || echo "  AURA daemon may already be running"

# Wait for server
echo "[3/4] Waiting for server to be ready..."
for i in $(seq 1 20); do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
        echo "  Server is ready!"
        break
    fi
    sleep 2
done

# 3. Start the auto-poster
echo "[4/4] Starting auto-poster daemon..."
python3 "$PROJECT_DIR/scripts/auto-poster-daemon.py" 2>/dev/null || echo "  Auto-poster may already be running"

# 4. Start the database backup daemon
echo "[5/4] Starting database backup daemon..."
python3 "$PROJECT_DIR/scripts/db-backup.py" --daemon 2>/dev/null || echo "  Backup daemon may already be running"

echo ""
echo "=== ORRA Full Stack is running ==="
echo "  Server:       http://localhost:3000"
echo "  AURA daemon:  cat /tmp/aura-daemon.log"
echo "  Auto-poster:  cat /tmp/auto-poster-daemon.log"
echo "  DB backups:   cat /tmp/orra-db-backup.log"
echo "  Backups dir:  $PROJECT_DIR/backups/auto/"
echo ""
echo "To stop all services: bash scripts/start-all.sh --stop"
