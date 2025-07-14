#!/bin/bash

# --- Mensajes de Inicio ---
echo "🚀 Iniciando todos los servicios del proyecto SGA..."
echo "----------------------------------------------------"

# --- Paso 1: Levantar los servicios de Docker ---
echo "Levantando contenedores de Docker en segundo plano..."
docker compose up -d
echo "✅ Contenedores iniciados."
echo "----------------------------------------------------"

# --- Paso 2: Iniciar el Túnel de Cloudflare en segundo plano ---
echo "Iniciando Cloudflare Tunnel (mi-farmacia-tunnel)..."
cloudflared tunnel run mi-farmacia-tunnel &
okay
# Guardamos el ID del proceso del túnel para poder detenerlo después
CLOUDFLARE_PID=$!
echo "✅ Túnel iniciado en segundo plano (PID: $CLOUDFLARE_PID)."
# Damos un par de segundos para que el túnel se estabilice
sleep 2 
echo "----------------------------------------------------"

# --- Paso 3: levantar Portainer ---
echo "Levantando Portainer..."
docker start portainer
echo "✅ Portainer iniciado."

# --- Paso 4: Configurar el Entorno de Python y Secretos ---
echo "Activando el entorno virtual de Python..."
source venv/bin/activate
echo "✅ Entorno activado."

echo "Exportando secretos (¡No subir este archivo a Git!)..."
export GHCR_PAT='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'
export WEBHOOK_SECRET='123456789987654321'
echo "✅ Secretos exportados para esta sesión."
echo "----------------------------------------------------"

# --- Paso 4: Iniciar el Webhook Listener ---
echo "Iniciando el Webhook Listener de Python..."
# Este comando se quedará corriendo en primer plano.
# Para detener todo, presiona Ctrl+C en esta ventana.
python3 webhook_listener.py

# --- Mensajes de Cierre ---
echo "----------------------------------------------------"
echo "Script finalizado. Para detener los servicios de Docker, ejecuta: docker-compose down"
echo "Para detener el túnel de Cloudflare, usa: kill $CLOUDFLARE_PID"
echo "Para detener Portainer, usa: docker stop portainer"
echo "Para desactivar el entorno virtual de Python, usa: deactivate"
echo "¡Gracias por usar el script de inicio de SGA!"
echo "----------------------------------------------------"
# Fin del script