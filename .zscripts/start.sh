#!/bin/bash
# ORRA Container Entrypoint — minimal wrapper
# Just runs dev.sh which handles everything including daemonization
cd /home/z/my-project
bash .zscripts/dev.sh
