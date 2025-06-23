from fastapi import FastAPI, Request, HTTPException, status
from dotenv import load_dotenv
import os
import subprocess
import hmac
import hashlib

# Carga las variables de entorno del archivo .env (si existe)
load_dotenv()

app = FastAPI(title="Webhook Listener SGA Farmacias")

# Obtén el secreto del webhook de las variables de entorno
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")

# Ruta absoluta al script deploy.sh
# ¡¡¡IMPORTANTE!!! ASEGÚRATE QUE ESTA RUTA ES CORRECTA PARA TU SERVIDOR
# Modifica esta ruta si tu deploy.sh está en otro lugar
# Por ejemplo: /home/arcci/Descargas/proyecto_gps (2)/proyecto_gps/deploy.sh

deploy_script_path = "/home/arcci/Descargas/proyecto_gps (2)/proyecto_gps/deploy.sh"

@app.post("/webhook")
async def handle_webhook(request: Request):
    if not WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="WEBHOOK_SECRET no configurado en el entorno."
        )

    github_signature = request.headers.get("X-Hub-Signature-256")
    if github_signature:
        body = await request.body()
        secret_bytes = WEBHOOK_SECRET.encode('utf-8')
        signature_expected = "sha256=" + hmac.new(secret_bytes, body, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(signature_expected, github_signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firma del webhook inválida."
            )
    else:
        print("Advertencia: No se proporcionó la firma del webhook. ¡No recomendado para producción!")

    try:
        subprocess.Popen(["/bin/bash", deploy_script_path])
        print(f"[{os.getenv('HOSTNAME')}] Webhook recibido. Ejecutando deploy.sh en segundo plano.")
        return {"message": "Despliegue activado. Verifique los logs del servidor para el progreso."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar el script de despliegue: {e}"
        )

@app.get("/")
async def root():
    return {"message": "Webhook Listener en funcionamiento."}
