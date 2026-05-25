#!/bin/bash
# ORRA Container Entrypoint — just start the app, fast
set -e

PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

echo "[$(date '+%H:%M:%S')] ORRA starting..." | tee -a "$PROJECT_DIR/container-startup.log"

exec bash "$PROJECT_DIR/.zscripts/dev.sh"
