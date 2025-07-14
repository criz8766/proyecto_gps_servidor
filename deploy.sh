#!/bin/bash

# Este script automatiza el despliegue del proyecto GPS

echo "--- Iniciando despliegue automático ---"

# Termina el script si algún comando falla
set -e

# 1. Navega al directorio del proyecto
# Asegúrate de que esta ruta sea la correcta para tu servidor
cd /home/arcci/Descargas/proyecto_gps_servidor/proyecto_gps || { echo "Error: No se pudo encontrar el directorio del proyecto."; exit 1; }

# 2. Trae los últimos cambios de la rama main desde GitHub
echo "Actualizando el repositorio desde GitHub..."
git pull origin main

# 3. Inicia sesión en GitHub Container Registry (GHCR)
# IMPORTANTE: La variable $GHCR_PAT debe estar definida en tu servidor.
# Es tu Personal Access Token de GitHub.
echo "Iniciando sesión en el registro de contenedores de GitHub..."
echo $GHCR_PAT | docker login ghcr.io -u criz8766 --password-stdin

# 4. Descarga las imágenes más recientes definidas en docker-compose.yml
echo "Descargando las nuevas imágenes de Docker..."
docker-compose pull

# 5. Reinicia los servicios usando el archivo docker-compose.yml
# 'up -d' actualiza los contenedores en segundo plano.
# '--remove-orphans' limpia contenedores de servicios que ya no existen.
echo "Reiniciando los servicios con las nuevas imágenes..."
docker-compose up -d --force-recreate --remove-orphans

# 6. Opcional: Limpia imágenes de Docker que ya no están en uso
echo "Limpiando imágenes antiguas sin usar..."
docker image prune -af

echo "--- ¡Despliegue completado con éxito! ---"