#!/bin/bash
# deploy.sh - Script de despliegue automático para proyecto Docker Compose
# Ubicación: /home/arcci/Descargas/proyecto_gps (2)/proyecto_gps/deploy.sh

set -e

# Directorio del proyecto
PROJECT_DIR="/home/arcci/Descargas/proyecto_gps (2)/proyecto_gps"
cd "$PROJECT_DIR"

echo "[deploy.sh] Pulling latest code from main..."
git pull origin main

echo "[deploy.sh] Building Docker images..."
sudo docker compose build

echo "[deploy.sh] Restarting services..."
sudo docker compose down
sudo docker compose up -d

echo "[deploy.sh] Deployment finished at $(date)"
