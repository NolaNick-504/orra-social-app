#!/bin/bash
# ============================================
# DEPRECATED — DO NOT USE THIS SCRIPT
# ============================================
# This script is outdated and has been replaced by:
#   .zscripts/dev.sh (main startup)
#   .zscripts/aura-daemon.py (server supervisor)
#
# Issues with this script:
#   - References non-existent upload/orra-backup/ paths
#   - Uses 'bun install' which may not be available
#   - Uses 'npx next build' without --webpack flag
#   - Does NOT use aura-daemon for supervision
#   - Does NOT backup DB to /home/sync/ persistent storage
#   - Does NOT use prisma migrate deploy (safe schema changes)
#
# For startup, run:
#   bash /home/z/my-project/.zscripts/dev.sh
#
# For status, run:
#   python3 /home/z/my-project/.zscripts/aura-daemon.py --status
# ============================================

echo "⚠️  DEPRECATED: This script is no longer maintained."
echo "   Please use: bash /home/z/my-project/.zscripts/dev.sh"
echo ""
echo "   Redirecting to the current startup script..."
echo ""

exec bash /home/z/my-project/.zscripts/dev.sh
